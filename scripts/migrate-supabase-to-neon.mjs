import dotenv from "dotenv";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { AJW_NEON_POST_SCHEMA_SQL, AJW_NEON_TABLES } from "./ajw-neon-tables.mjs";

dotenv.config();
dotenv.config({ path: ".env.neon-migration", override: true });
dns.setDefaultResultOrder(process.env.PG_DNS_ORDER || "ipv4first");

const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
const supabaseKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
const databaseUrl = String(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "").trim();
const batchSize = Math.max(50, Math.min(Number(process.env.MIGRATE_BATCH_SIZE || 500), 1000));
const includeShopee = process.env.MIGRATE_INCLUDE_SHOPEE !== "false";
const only = String(process.env.MIGRATE_ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const dumpDir = path.resolve(process.cwd(), "backups", "supabase-to-neon-" + new Date().toISOString().replace(/[:.]/g, "-"));

if (!supabaseUrl || !supabaseKey || !databaseUrl) {
  console.error("Missing env. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL.");
  process.exit(1);
}

try {
  const parsedDbUrl = new URL(databaseUrl);
  if (parsedDbUrl.username === "authenticator") {
    console.error("DATABASE_URL uses user 'authenticator'. This role cannot create tables in Neon.");
    console.error("Use Neon PostgreSQL connection string with owner role, usually 'neondb_owner'.");
    console.error("Neon path: Dashboard > Connect > PostgreSQL > Pooled connection.");
    process.exit(1);
  }
} catch {
  console.error("DATABASE_URL must be a PostgreSQL URL, for example postgresql://neondb_owner:...@.../neondb?sslmode=require");
  process.exit(1);
}

const tables = AJW_NEON_TABLES.filter((t) => {
  if (!includeShopee && t.name.startsWith("shopee_chat_")) return false;
  if (only.length && !only.includes(t.name)) return false;
  return true;
});

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

function jsonValue(value) {
  if (value == null) return null;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

const jsonbColumns = new Set(["data", "value", "detail", "metadata", "payload", "setting_value"]);

function valueForColumn(col, value) {
  if (value == null) return null;
  if (jsonbColumns.has(col)) return typeof value === "object" ? JSON.stringify(value) : value;
  return value;
}

function inferColumnType(values) {
  const sample = values.find((value) => value != null);
  if (sample == null) return "text";
  if (typeof sample === "boolean") return "boolean";
  if (typeof sample === "number") return "numeric";
  if (Array.isArray(sample) || typeof sample === "object") return "jsonb";
  return "text";
}

async function sbFetchPage(table, from, to) {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  const res = await fetch(url, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Range: `${from}-${to}`,
      Prefer: "count=exact"
    }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || `${table} fetch failed`);
  return text ? JSON.parse(text) : [];
}

async function fetchAll(table) {
  const rows = [];
  for (let offset = 0; ; offset += batchSize) {
    const page = await sbFetchPage(table, offset, offset + batchSize - 1);
    rows.push(...page);
    if (page.length < batchSize) break;
  }
  return rows;
}

async function createSchema(client) {
  for (const table of tables) await client.query(table.sql);
  for (const statement of AJW_NEON_POST_SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
    try {
      await client.query(statement);
    } catch (err) {
      if (err.code === "42P01") {
        console.warn(`Skipping optional schema statement: ${err.message}`);
        continue;
      }
      throw err;
    }
  }
}

async function upsertRows(client, table, rows) {
  if (!rows.length) return;
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const pk = table.pk;
  if (!columns.includes(pk)) columns.unshift(pk);
  await ensureColumns(client, table.name, columns, rows);
  const updateColumns = columns.filter((col) => col !== pk);
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const placeholders = batch.map((row, rowIdx) => {
      const cells = columns.map((col, colIdx) => {
        values.push(valueForColumn(col, row[col]));
        const cast = jsonbColumns.has(col) ? "::jsonb" : "";
        return `$${rowIdx * columns.length + colIdx + 1}${cast}`;
      });
      return `(${cells.join(",")})`;
    });
    const assignments = updateColumns.map((col) => `${quoteIdent(col)} = excluded.${quoteIdent(col)}`).join(",");
    const sql = `
      insert into ${quoteIdent(table.name)} (${columns.map(quoteIdent).join(",")})
      values ${placeholders.join(",")}
      on conflict (${quoteIdent(pk)}) do ${assignments ? `update set ${assignments}` : "nothing"}
    `;
    await client.query(sql, values);
  }
}

async function ensureColumns(client, tableName, columns, rows) {
  const res = await client.query(
    "select column_name from information_schema.columns where table_schema = 'public' and table_name = $1",
    [tableName]
  );
  const existing = new Set(res.rows.map((row) => row.column_name));
  for (const col of columns) {
    if (existing.has(col)) continue;
    const values = rows.map((row) => row[col]);
    await client.query(`alter table ${quoteIdent(tableName)} add column ${quoteIdent(col)} ${inferColumnType(values)}`);
  }
}

async function countRows(client, table) {
  const res = await client.query(`select count(*)::bigint as count from ${quoteIdent(table)}`);
  return Number(res.rows[0]?.count || 0);
}

fs.mkdirSync(dumpDir, { recursive: true });
const client = new Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 20000),
  ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false }
});
try {
  await client.connect();
} catch (err) {
  console.error("Neon connection failed.");
  console.error("Check DATABASE_URL, Neon project status, internet/firewall, and use pooled connection if direct port 5432 times out.");
  console.error("Hint: Neon pooled host usually contains '-pooler', for example ep-xxx-pooler.region.aws.neon.tech.");
  throw err;
}

const summary = [];
try {
  console.log(`Creating Neon schema for ${tables.length} tables...`);
  await createSchema(client);

  for (const table of tables) {
    process.stdout.write(`${table.name}: fetching... `);
    try {
      const rows = await fetchAll(table.name);
      fs.writeFileSync(path.join(dumpDir, `${table.name}.json`), JSON.stringify(rows, null, 2));
      process.stdout.write(`${rows.length} rows, importing... `);
      await upsertRows(client, table, rows);
      const neonCount = await countRows(client, table.name);
      summary.push({ table: table.name, source: rows.length, neon: neonCount, ok: true });
      console.log(`done (${neonCount})`);
    } catch (err) {
      summary.push({ table: table.name, source: null, neon: null, ok: false, error: err.message });
      console.log(`skip: ${err.message}`);
    }
  }

  fs.writeFileSync(path.join(dumpDir, "_summary.json"), JSON.stringify(summary, null, 2));
  console.log(`Backup JSON: ${dumpDir}`);
  console.table(summary);
} finally {
  await client.end();
}
