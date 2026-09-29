import { THEMES } from "./schema.js";

const STORAGE_KEY = "catalogue-innovation-upsaclay-v1";

export function loadCatalog(seed) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw);
    if (!parsed?.collections) return structuredClone(seed);
    return parsed;
  } catch {
    return structuredClone(seed);
  }
}

export function saveCatalog(catalog) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
}

export function resetCatalog() {
  localStorage.removeItem(STORAGE_KEY);
}

export function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isUrl(value) {
  if (!value || typeof value !== "string") return false;
  const text = value.trim();
  return /^https?:\/\//i.test(text) || /^www\./i.test(text);
}

export function toHref(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  if (/^www\./i.test(text)) return `https://${text}`;
  return text;
}

export function prettyUrl(value) {
  const href = toHref(value);
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, "");
    const path = decodeURIComponent(url.pathname + url.search).replace(/\/$/, "");
    const shown = path && path !== "" ? `${host}${path}` : host;
    return shown.length > 52 ? `${shown.slice(0, 49)}…` : shown;
  } catch {
    return String(value).trim();
  }
}

export function itemLinks(item) {
  const seen = new Set();
  const links = [];
  for (const key of ["web", "lien"]) {
    const raw = item?.[key];
    if (raw == null) continue;
    const text = String(raw).trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    links.push(text);
  }
  return links;
}

export function isEmail(value) {
  if (!value || typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function uniqueValues(items, key) {
  const set = new Set();
  for (const item of items) {
    const v = item[key];
    if (v != null && String(v).trim()) set.add(String(v).trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b, "fr"));
}

export function matchesQuery(item, query, fields) {
  if (!query) return true;
  const q = normalize(query);
  return fields.some((f) => normalize(item[f]).includes(q));
}

export function nextId(items) {
  const nums = items
    .map((i) => parseInt(String(i.id).replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1).padStart(3, "0");
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateFr(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(items, fields) {
  const headers = fields.map((f) => f.label);
  const escape = (v) => {
    const s = v == null ? "" : String(v);
    if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(";")];
  for (const item of items) {
    lines.push(fields.map((f) => escape(item[f.key])).join(";"));
  }
  return "\uFEFF" + lines.join("\n");
}

export function totalCount(catalog) {
  return Object.values(catalog.collections).reduce(
    (sum, items) => sum + items.length,
    0
  );
}

export function itemText(item) {
  return Object.values(item || {})
    .filter((v) => v != null && typeof v !== "object")
    .join(" ");
}

export function itemThemes(item) {
  const blob = normalize(itemText(item));
  return THEMES.filter((theme) => theme.keys.some((key) => blob.includes(normalize(key)))).map(
    (theme) => theme.id
  );
}
