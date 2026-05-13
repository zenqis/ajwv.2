import dotenv from "dotenv";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { AJW_NEON_POST_SCHEMA_SQL, AJW_NEON_TABLES } from "./ajw-neon-tables.mjs";

dotenv.config();
dotenv.config({ path: ".env.neon-migration", override: true });
dns.setDefaultResultOrder(process.env.PG_DNS_ORDER || "ipv4first");

const defaultBackup = "C:/Users/datah/Downloads/Downlaod/AJW_Backup_Internal_2026-05-12_2308.json";
const backupPath = path.resolve(process.env.AJW_BACKUP_PATH || defaultBackup);
const databaseUrl = String(process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || "").trim();
const batchSize = Math.max(50, Math.min(Number(process.env.MIGRATE_BATCH_SIZE || 500), 1000));

if (!databaseUrl) {
  console.error("Missing DATABASE_URL in .env.neon-migration.");
  process.exit(1);
}
if (!fs.existsSync(backupPath)) {
  console.error(`Backup not found: ${backupPath}`);
  process.exit(1);
}

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

function unwrap(box, fallback) {
  if (box == null) return fallback;
  if (typeof box === "object" && !Array.isArray(box) && "value" in box) return box.value;
  return box;
}

function n(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function safeId(prefix, raw, idx = 0) {
  const base = String(raw || "").trim() || `${prefix}_${idx + 1}_${Date.now()}`;
  return base.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 120);
}

function rowsFrom(value) {
  return Array.isArray(value) ? value : [];
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

async function upsertRows(client, tableName, pk, rows) {
  rows = rows.filter(Boolean);
  if (!rows.length) return 0;
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (!columns.includes(pk)) columns.unshift(pk);
  await ensureColumns(client, tableName, columns, rows);
  const updateColumns = columns.filter((col) => col !== pk);
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
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
      `insert into ${quoteIdent(tableName)} (${columns.map(quoteIdent).join(",")}) values ${placeholders.join(",")} on conflict (${quoteIdent(pk)}) do ${assignments ? `update set ${assignments}` : "nothing"}`,
      values
    );
  }
  return rows.length;
}

async function createSchema(client) {
  for (const table of AJW_NEON_TABLES.filter((t) => !t.name.startsWith("shopee_chat_"))) await client.query(table.sql);
  for (const statement of AJW_NEON_POST_SCHEMA_SQL.split(";").map((s) => s.trim()).filter(Boolean)) {
    try {
      await client.query(statement);
    } catch (err) {
      if (err.code !== "42P01") throw err;
    }
  }
}

function incomeRecord(r, idx) {
  return {
    id: safeId("fininc", r.id || r.ts || [r.tanggal, r.marketplace, r.toko, idx].join("_"), idx),
    tanggal: r.tanggal || null,
    periode_dari: r.periodeDari || r.tanggal || null,
    periode_sampai: r.periodeSampai || r.tanggal || null,
    marketplace: r.marketplace || r.sumber || "",
    toko: r.toko || "",
    nominal: n(r.pemasukanToko != null ? r.pemasukanToko : r.nominal),
    data: r,
    updated_at: new Date().toISOString()
  };
}

function expenseRecord(r, idx) {
  return { id: safeId("finexp", r.id || r.ts || [r.tanggal, r.kategori, r.namaPengeluaran, idx].join("_"), idx), tanggal: r.tanggal || null, kategori: r.kategori || "", nominal: n(r.nominal), source_type: r.sourceType || "manual", data: r, updated_at: new Date().toISOString() };
}

function assetRecord(r, idx) {
  return { id: safeId("finasset", r.id || r.ts || [r.tanggal, r.type, r.nama, idx].join("_"), idx), tanggal: r.tanggal || null, type: r.type || "", nama: r.nama || "", nominal: n(r.nominal), data: r, updated_at: new Date().toISOString() };
}

function subscriptionRecord(r, idx) {
  return { id: safeId("finsub", r.id || r.ts || [r.nama, r.provider, idx].join("_"), idx), nama: r.nama || "", provider: r.provider || "", status: r.status || "", nominal: n(r.nominal), next_payment: r.nextPayment || null, billing_cycle: r.siklus || "", data: r, updated_at: new Date().toISOString() };
}

function toolRows(list, prefix, mapper) {
  return rowsFrom(list).map((r, idx) => mapper(r || {}, idx, prefix));
}

const data = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const storage = data.storage || {};
const runtime = data.runtime || {};
const finance = runtime.finance || {};
const hr = runtime.hr || {};
const supplier = runtime.supplier || {};
const tools = runtime.tools || {};
const store = (key, fallback) => unwrap(storage[key], fallback);

const tableRows = new Map();
function setRows(table, pk, rows) {
  tableRows.set(table, { pk, rows });
}

setRows("ajw_fin_income", "id", rowsFrom(finance.income).map(incomeRecord));
setRows("ajw_fin_expense", "id", rowsFrom(finance.expense).map(expenseRecord));
setRows("ajw_fin_assets", "id", rowsFrom(finance.assets).map(assetRecord));
setRows("ajw_fin_subscriptions", "id", rowsFrom(finance.subscriptions).map(subscriptionRecord));
setRows("ajw_fin_monthly", "key", Object.entries(finance.monthlySettings || {}).map(([key, value]) => ({ key, year: Number(key.slice(0, 4)) || null, month: Number(key.slice(5, 7)) || null, data: value, updated_at: new Date().toISOString() })));
setRows("ajw_fin_meta", "key", [
  { key: "expense_categories", value: { data: finance.expenseCategories || [] }, updated_at: new Date().toISOString() },
  { key: "expense_targets", value: { data: finance.expenseTargets || {} }, updated_at: new Date().toISOString() }
]);

setRows("ajw_employees", "id", rowsFrom(hr.employees).map((r, idx) => ({ id: safeId("emp", r.id || idx, idx), data: r, nama: r.nama || r.name || "", jabatan: r.jabatan || "", updated_at: new Date().toISOString() })));
setRows("ajw_eval", "id", rowsFrom(hr.evalHistory).map((r, idx) => ({ id: safeId("eval", r.id || idx, idx), data: r, nama: r.info?.nama || r.nama || "", grade: r.grade || "", nilai: n(r.fs || r.nilai), updated_at: new Date().toISOString() })));
setRows("ajw_payroll", "id", rowsFrom(hr.payHistory).map((r, idx) => ({ id: safeId("pay", r.id || idx, idx), data: r, nama: r.info?.nama || r.nama || "", gaji_bersih: n(r.bersih || r.gajiBersih), updated_at: new Date().toISOString() })));
setRows("ajw_hr_sops", "id", rowsFrom(hr.sops).map((r, idx) => ({ id: safeId("hrsop", r.id || idx, idx), title: r.title || "", department: r.department || "", stage: r.stage || "Draft", doc_type: r.docType || "", file_name: r.fileName || "", file_type: r.fileType || "", file_size: n(r.fileSize), data: r, updated_at: r.updatedAt || new Date().toISOString() })));
setRows("ajw_hr_control", "id", hr.control ? [{ id: "hr_control_main", status: hr.control.systemStatus || "active", data: hr.control, updated_at: new Date().toISOString() }] : []);
setRows("ajw_supplier", "id", rowsFrom(supplier.hutang).map((r, idx) => ({ id: safeId("supplier", r.id || idx, idx), data: r, nama_supplier: r.namaSupplier || "", bulan: r.bulan || "", tahun: n(r.tahun), updated_at: new Date().toISOString() })));

const analytics = store("ajw_analytics_data", {});
setRows("ajw_analytics_data", "id", ["sales", "service", "promo", "customers"].map((scope) => ({ id: `analytics_${scope}`, scope, rows_count: rowsFrom(analytics?.[scope]).length, data: rowsFrom(analytics?.[scope]), updated_at: new Date().toISOString() })));

setRows("ajw_tool_refunds", "id", toolRows(tools.refunds || store("ajw_tools_refunds", []), "toolrefund", (r, idx) => ({ id: safeId("toolrefund", r.id || r.ts || [r.inputDate, r.orderNo, idx].join("_"), idx), input_date: r.inputDate || null, order_no: r.orderNo || "", marketplace: r.marketplace || "", item_name: r.itemName || "", nominal: n(r.nominal), group_id: r.groupId || "refund", image_name: r.imageName || "", image_data: r.imageData || "", data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_complaints", "id", toolRows(tools.complaints || store("ajw_tools_complaints", []), "toolcomplaint", (r, idx) => ({ id: safeId("toolcomplaint", r.id || r.ts || [r.inputDate, r.orderNo, idx].join("_"), idx), input_date: r.inputDate || null, order_no: r.orderNo || "", marketplace: r.marketplace || "", issue_type: r.issueType || "", nominal: n(r.nominal), group_id: r.groupId || "complaint", image_name: r.imageName || "", image_data: r.imageData || "", data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_requests", "id", toolRows(tools.requests || store("ajw_tools_requests", []), "toolrequest", (r, idx) => ({ id: safeId("toolrequest", r.id || r.ts || [r.inputDate, r.title, idx].join("_"), idx), input_date: r.inputDate || null, title: r.title || "", division: r.division || "", priority: r.priority || "", status: r.status || "", group_id: r.groupId || "request", image_name: r.imageName || "", image_data: r.imageData || "", data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_material_stock", "id", toolRows(tools.materialStock || store("ajw_tools_material_stock", []), "toolmat", (r, idx) => ({ id: safeId("toolmat", r.id || [r.nama, r.kategori, idx].join("_"), idx), nama: r.nama || "", kategori: r.kategori || "", satuan: r.satuan || "", stok_akhir: n(r.stokAkhir), status: r.status || "", data: r, updated_at: r.updatedAt || new Date().toISOString() })));
setRows("ajw_tool_material_orders", "id", toolRows(store("ajw_tools_material_orders", []), "toolmatord", (r, idx) => ({ id: safeId("toolmatord", r.id || [r.sessionId, r.materialId, idx].join("_"), idx), session_id: r.sessionId || "", material_id: r.materialId || "", nama: r.nama || "", qty: n(r.qty), subtotal: n(r.subtotal), ordered: !!r.ordered, data: r, updated_at: r.updatedAt || new Date().toISOString() })));
setRows("ajw_tool_material_order_history", "id", toolRows(store("ajw_tools_material_order_history", []), "toolmathist", (r, idx) => ({ id: safeId("toolmathist", r.id || [r.sessionId, r.materialId, idx].join("_"), idx), session_id: r.sessionId || "", material_id: r.materialId || "", nama: r.nama || "", qty: n(r.qty), subtotal: n(r.subtotal), ordered: !!r.ordered, data: r, updated_at: r.updatedAt || new Date().toISOString() })));
setRows("ajw_tool_material_sessions", "id", toolRows(store("ajw_tools_material_sessions", []), "toolmatses", (r, idx) => ({ id: safeId("toolmatses", r.id || [r.name, idx].join("_"), idx), nama: r.name || r.nama || "", created_at: r.createdAt || new Date().toISOString(), data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_products", "id", toolRows(store("ajw_tools_product_rows", []), "toolprod", (r, idx) => ({ id: safeId("toolprod", r.id || [r.sku, r.title, idx].join("_"), idx), sku: r.sku || "", judul: r.title || "", kategori_pertama: r.category1 || "", kategori_kedua: r.category2 || "", total_stok: n(r.totalStock), penjualan_harian: n(r.dailySales), modal_bobot: n(r.avgCost), data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_desc_revision", "id", toolRows(store("ajw_tools_desc_revision_rows", []), "tooldesc", (r, idx) => ({ id: safeId("tooldesc", r.id || [r.kodeProduk, r.namaProduk, idx].join("_"), idx), kode_produk: r.kodeProduk || "", nama_produk: r.namaProduk || "", status: r.status || "", data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_blast_rows", "id", toolRows(store("ajw_tools_blast_rows", []), "toolblast", (r, idx) => ({ id: safeId("toolblast", r.id || [r.nomorPesanan, r.nomorTelepon, idx].join("_"), idx), order_number: r.nomorPesanan || "", phone: r.nomorTelepon || "", marketplace: r.marketplace || "", status: r.status || "", data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_blast_history", "id", toolRows(store("ajw_tools_blast_history", []), "toolblasth", (r, idx) => ({ id: safeId("toolblasth", r.id || [r.nomorPesanan, r.nomorTelepon, idx].join("_"), idx), order_number: r.nomorPesanan || "", phone: r.nomorTelepon || "", marketplace: r.marketplace || "", status: r.status || "", data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_blast_phone_db", "id", toolRows(store("ajw_tools_blast_phone_db", []), "toolblastphone", (r, idx) => ({ id: safeId("toolblastphone", r.id || r.phone || r.nomorTelepon || idx, idx), phone: r.phone || r.nomorTelepon || "", nama: r.nama || r.namaPembeli || "", marketplace: r.marketplace || "", total_blast_count: n(r.totalBlastCount), data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_blast_marketing", "id", toolRows(store("ajw_tools_blast_marketing_schedules", []), "toolblastmkt", (r, idx) => ({ id: safeId("toolblastmkt", r.id || r.nama || idx, idx), nama: r.nama || r.name || "", schedule_type: r.scheduleType || "", active: !!r.active, next_run: r.nextRun || "", data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_picking_rows", "id", toolRows(store("ajw_tools_picking_rows", []), "toolpickrow", (r, idx) => ({ id: safeId("toolpickrow", r.id || [r.orderNumber || r.nomorPesanan, r.skuGudang || r.sku, idx].join("_"), idx), order_number: r.orderNumber || r.nomorPesanan || "", marketplace: r.marketplace || "", sku_gudang: r.skuGudang || r.sku || "", quantity: n(r.quantity != null ? r.quantity : r.jumlah), data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_picking_history", "id", toolRows(store("ajw_tools_picking_history", []), "toolpickhist", (r, idx) => ({ id: safeId("toolpickhist", r.id || [r.fileName, r.ts, idx].join("_"), idx), source_file: r.fileName || r.sourceFile || "", total_rows: n(r.totalRows), status: r.status || "", data: r, updated_at: r.ts || new Date().toISOString() })));
setRows("ajw_tool_automation_jobs", "id", toolRows(store("ajw_tools_automation_jobs", []), "toolauto", (r, idx) => ({ id: safeId("toolauto", r.id || [r.name, r.channel, idx].join("_"), idx), nama: r.name || "", channel: r.channel || "", active: !!r.active, next_run: r.nextRun || "", data: r, updated_at: new Date().toISOString() })));
setRows("ajw_tool_automation_logs", "id", toolRows(store("ajw_tools_automation_logs", []), "toolautolog", (r, idx) => ({ id: safeId("toolautolog", r.id || [r.title, r.ts, idx].join("_"), idx), level: r.level || "info", title: r.title || "", data: r, created_at: r.ts || new Date().toISOString() })));
setRows("ajw_tool_webhooks", "id", toolRows(store("ajw_tools_webhooks", []), "toolwebhook", (r, idx) => ({ id: safeId("toolwebhook", r.id || [r.name, r.url, idx].join("_"), idx), nama: r.name || "", method: r.method || "POST", url: r.url || "", active: r.active !== false, data: r, updated_at: new Date().toISOString() })));

setRows("ajw_tool_meta", "key", [
  ["desc_prompt", store("ajw_tools_desc_revision_prompt", "")],
  ["blast_template", store("ajw_tools_blast_template", "")],
  ["blast_delay_ms", store("ajw_tools_blast_delay_ms", 2500)],
  ["blast_marketing_template", store("ajw_tools_blast_marketing_template", "")],
  ["material_active_session", store("ajw_tools_material_active_session", "")],
  ["agent_bridge", store("ajw_tools_agent_bridge", {})],
  ["picking_config", store("ajw_tools_picking_config", {})],
  ["picking_processed", store("ajw_tools_picking_processed", {})],
  ["picking_watch", store("ajw_tools_picking_watch", {})]
].map(([key, value]) => ({ key, value: { data: value }, updated_at: new Date().toISOString() })));

setRows("ajw_config", "key", Object.entries(storage).map(([key, box]) => ({ key, value: { data: unwrap(box, null) }, updated_at: new Date().toISOString() })));

const client = new Client({
  connectionString: databaseUrl,
  connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 20000),
  ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false }
});

await client.connect();
const summary = [];
try {
  await createSchema(client);
  for (const [table, spec] of tableRows.entries()) {
    const imported = await upsertRows(client, table, spec.pk, spec.rows);
    const count = await client.query(`select count(*)::bigint as count from ${quoteIdent(table)}`);
    summary.push({ table, imported, neon: Number(count.rows[0].count || 0) });
    console.log(`${table}: imported ${imported}, neon ${count.rows[0].count}`);
  }
  console.table(summary);
} finally {
  await client.end();
}
