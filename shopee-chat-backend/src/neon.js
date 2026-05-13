import dotenv from "dotenv";
import { Pool } from "pg";
import { AJW_NEON_POST_SCHEMA_SQL, AJW_NEON_TABLES } from "../../scripts/ajw-neon-tables.mjs";

dotenv.config();
dotenv.config({ path: ".env.neon-migration", override: false });

const databaseUrl = String(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "").trim();
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.NEON_POOL_MAX || 5),
      connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 20000),
      ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false }
    })
  : null;

const tables = new Map(AJW_NEON_TABLES.map((table) => [table.name, table]));
const jsonbColumns = new Set(["data", "value", "detail", "metadata", "payload", "setting_value"]);

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

function assertReady() {
  if (!pool) throw new Error("DATABASE_URL / NEON_DATABASE_URL belum dikonfigurasi.");
}

function tableDef(name) {
  const def = tables.get(String(name || ""));
  if (!def) throw new Error(`Table tidak diizinkan: ${name}`);
  return def;
}

function inferColumnType(values) {
  const sample = values.find((value) => value != null);
  if (sample == null) return "text";
  if (typeof sample === "boolean") return "boolean";
  if (typeof sample === "number") return "numeric";
  if (Array.isArray(sample) || typeof sample === "object") return "jsonb";
  return "text";
}

function valueForColumn(col, value) {
  if (value == null) return null;
  if (jsonbColumns.has(col)) return typeof value === "object" ? JSON.stringify(value) : value;
  return value;
}

async function ensureColumns(client, tableName, columns, rows) {
  const res = await client.query(
    "select column_name from information_schema.columns where table_schema = 'public' and table_name = $1",
    [tableName]
  );
  const existing = new Set(res.rows.map((row) => row.column_name));
  for (const col of columns) {
    if (existing.has(col)) continue;
    await client.query(`alter table ${quoteIdent(tableName)} add column ${quoteIdent(col)} ${inferColumnType(rows.map((row) => row[col]))}`);
  }
}

function orderSql(raw) {
  const val = String(raw || "").trim();
  if (!val) return "";
  const [colRaw, dirRaw] = val.split(".");
  if (!/^[a-zA-Z0-9_]+$/.test(colRaw || "")) return "";
  const dir = String(dirRaw || "asc").toLowerCase() === "desc" ? "desc" : "asc";
  return ` order by ${quoteIdent(colRaw)} ${dir}`;
}

async function createSchema() {
  assertReady();
  const client = await pool.connect();
  try {
    for (const table of AJW_NEON_TABLES) await client.query(table.sql);
    for (const statement of AJW_NEON_POST_SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
      try {
        await client.query(statement);
      } catch (err) {
        if (err.code !== "42P01") throw err;
      }
    }
  } finally {
    client.release();
  }
}

async function upsertMany(tableName, records = []) {
  assertReady();
  const def = tableDef(tableName);
  if (!Array.isArray(records) || !records.length) return { ok: true, count: 0 };
  const client = await pool.connect();
  try {
    await client.query(def.sql);
    const columns = [...new Set(records.flatMap((row) => Object.keys(row || {})))];
    if (!columns.includes(def.pk)) columns.unshift(def.pk);
    await ensureColumns(client, def.name, columns, records);
    const updateColumns = columns.filter((col) => col !== def.pk);
    const batchSize = Math.max(50, Math.min(Number(process.env.NEON_BATCH_SIZE || 500), 1000));
    let count = 0;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const values = [];
      const placeholders = batch.map((row, rowIdx) => {
        const cells = columns.map((col, colIdx) => {
          values.push(valueForColumn(col, row[col]));
          return `$${rowIdx * columns.length + colIdx + 1}${jsonbColumns.has(col) ? "::jsonb" : ""}`;
        });
        return `(${cells.join(",")})`;
      });
      const assignments = updateColumns.map((col) => `${quoteIdent(col)} = excluded.${quoteIdent(col)}`).join(",");
      await client.query(
        `insert into ${quoteIdent(def.name)} (${columns.map(quoteIdent).join(",")}) values ${placeholders.join(",")} on conflict (${quoteIdent(def.pk)}) do ${assignments ? `update set ${assignments}` : "nothing"}`,
        values
      );
      count += batch.length;
    }
    return { ok: true, count };
  } finally {
    client.release();
  }
}

async function replaceTable(tableName, keyField, records = []) {
  assertReady();
  const def = tableDef(tableName);
  const key = keyField && /^[a-zA-Z0-9_]+$/.test(keyField) ? keyField : def.pk;
  const client = await pool.connect();
  try {
    await client.query(def.sql);
    await client.query(`delete from ${quoteIdent(def.name)} where ${quoteIdent(key)} is not null`);
  } finally {
    client.release();
  }
  return upsertMany(tableName, records);
}

async function fetchAll(tableName, { order = "", limit = 1000 } = {}) {
  assertReady();
  const def = tableDef(tableName);
  const cappedLimit = Math.max(1, Math.min(Number(limit || 1000), Number(process.env.NEON_MAX_SELECT_LIMIT || 5000)));
  const res = await pool.query(`select * from ${quoteIdent(def.name)}${orderSql(order)} limit $1`, [cappedLimit]);
  return res.rows;
}

async function probe(tableName) {
  assertReady();
  const def = tableDef(tableName);
  try {
    await pool.query(`select 1 from ${quoteIdent(def.name)} limit 1`);
    return { table: def.name, ok: true, exists: true, status: 200, message: "" };
  } catch (err) {
    return { table: def.name, ok: false, exists: false, status: 404, reason: "missing_table", message: err.message };
  }
}

async function status() {
  assertReady();
  const rows = [];
  for (const def of AJW_NEON_TABLES) {
    try {
      const res = await pool.query(`select count(*)::bigint as count from ${quoteIdent(def.name)}`);
      rows.push({ table: def.name, count: Number(res.rows[0].count || 0), ok: true });
    } catch (err) {
      rows.push({ table: def.name, count: 0, ok: false, error: err.message });
    }
  }
  return { ok: true, database: "neon", tables: rows };
}

export function registerNeonRoutes(app) {
  app.get("/api/neon/status", async (_req, res) => {
    try {
      res.json(await status());
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/neon/schema", async (_req, res) => {
    try {
      await createSchema();
      res.json(await status());
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/neon/table/:table", async (req, res) => {
    try {
      res.json(await fetchAll(req.params.table, req.query || {}));
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/neon/upsert/:table", async (req, res) => {
    try {
      res.json(await upsertMany(req.params.table, Array.isArray(req.body) ? req.body : req.body?.records || []));
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/neon/replace/:table", async (req, res) => {
    try {
      res.json(await replaceTable(req.params.table, req.body?.keyField, req.body?.records || []));
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/neon/probe/:table", async (req, res) => {
    try {
      res.json(await probe(req.params.table));
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });
}
