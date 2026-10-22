// ============================================================
// DuitKostIqbal – pencatat keuangan mahasiswa
// Login hanya dengan nama. Data tersimpan per nama di localStorage.
// ============================================================

// ===== DATA & HELPER (tanpa DOM) =====
const pad = (n) => String(n).padStart(2, "0");
const rp = (n) => (n < 0 ? "-" : "") + "Rp " + Math.abs(Math.round(n)).toLocaleString("id-ID");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const PAL = ["#22c55e", "#22b8cf", "#8b5cf6", "#f59e0b", "#fb4b6b", "#ec4899", "#84cc16", "#64748b"];
const ICONS = ["🍽️","🚌","🛍️","🧾","❤️","🎮","🎓","💸","💻","🎁","🏠","📱","☕","📚","⚽","➕"];

const today = new Date();
const thisMonth = iso(today).slice(0, 7);
const prevMonthKey = (back) => { const d = new Date(today.getFullYear(), today.getMonth() - back, 1); return iso(d).slice(0, 7); };

function defaultCats() {
  const mk = (arr) => arr.map(([name, icon, limit]) => ({ name, icon, def: true, limit: limit || 0 }));
  return {
    out: mk([["Makan","🍽️",1200000],["Transport","🚌",400000],["Belanja","🛍️"],["Tagihan","🧾"],["Kesehatan","❤️"],["Hiburan","🎮"],["Pendidikan","🎓",600000],["Lainnya","➕"]]),
    in: mk([["Uang Kiriman","💸"],["Beasiswa","🎓"],["Freelance","💻"],["Hadiah","🎁"],["Lainnya","➕"]]),
  };
}
const newState = () => ({ tx: [], cats: defaultCats(), nextId: 1 });

const user = "tamu";   // satu pengguna per browser, tanpa login
let state = newState();

const keyOf = (name) => "dki:u:" + name.trim().toLowerCase();
function loadUser(name) {
  try {
    const raw = JSON.parse(localStorage.getItem(keyOf(name)));
    if (raw && Array.isArray(raw.tx) && raw.cats) return raw;
  } catch {}
  return newState();
}
function save() { try { localStorage.setItem(keyOf(user), JSON.stringify(state)); } catch {} }

const monthTx = (key) => state.tx.filter((t) => t.date.startsWith(key));
const total = (list, type, cat) => list.filter((t) => t.type === type && (!cat || t.cat === cat)).reduce((a, t) => a + t.amount, 0);
const catInfo = (type, name) => state.cats[type].find((c) => c.name === name) || { name, icon: "📌", limit: 0 };

function usage(cat) {
  const spent = total(monthTx(thisMonth), "out", cat.name);
  return { spent, limit: cat.limit, pct: cat.limit > 0 ? (spent / cat.limit) * 100 : 0 };
}
const lvl = (pct) => (pct >= 100 ? "over" : pct >= 80 ? "warn" : "");

function budgetAlerts() {
  const out = [];
  state.cats.out.forEach((c) => {
    if (c.limit <= 0) return;
    const u = usage(c);
    if (u.pct >= 100) out.push({ cls: "over", text: `Anggaran ${c.name} terlampaui ${rp(u.spent - u.limit)}. Tahan dulu pengeluaran di kategori ini.` });
    else if (u.pct >= 80) out.push({ cls: "warn", text: `Anggaran ${c.name} hampir habis. Sisa ${rp(u.limit - u.spent)} (terpakai ${Math.round(u.pct)}%).` });
  });
  return out;
}

function series12() {
  const arr = [];
  for (let back = 11; back >= 0; back--) {
    const key = prevMonthKey(back), list = monthTx(key);
    arr.push({ label: BULAN[+key.slice(5) - 1].slice(0, 3), full: `${BULAN[+key.slice(5) - 1]} ${key.slice(0, 4)}`, inc: total(list, "in"), out: total(list, "out") });
  }
  return arr;
}

function expenseByCat(key = thisMonth) {
  const list = monthTx(key);
  const map = {};
  list.filter((t) => t.type === "out").forEach((t) => (map[t.cat] = (map[t.cat] || 0) + t.amount));
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function seedSample() {
  const mk = (type, cat, amount, key, day, note) => state.tx.push({ id: state.nextId++, type, cat, amount, date: `${key}-${pad(day)}`, note });
  for (let back = 5; back >= 0; back--) {
    const key = prevMonthKey(back), cur = back === 0, last = cur ? today.getDate() : 28;
    const k = cur ? 1 : 0.8 + ((back * 7) % 5) / 10;
    const d = (n) => Math.min(n, last);
    const r = (v) => Math.round(v / 1000) * 1000;
    mk("in", "Uang Kiriman", 2500000, key, 1, "Kiriman orang tua");
    if (back % 2 === 0) mk("in", "Freelance", 300000 + back * 40000, key, d(10), "Desain poster");
    for (let i = 0; i < 6; i++) mk("out", "Makan", r((cur ? 1030000 : 900000 * k) / 6), key, d(3 + i * 4), i % 2 ? "Makan malam" : "Makan siang");
    mk("out", "Transport", r(cur ? 170000 : 300000 * k), key, d(6), "Bensin / ojek");
    mk("out", "Pendidikan", r(cur ? 370000 : 450000 * k), key, d(8), "Fotokopi & buku");
    mk("out", "Hiburan", r(cur ? 90000 : 120000 * k), key, d(14), "Nonton");
    mk("out", "Lainnya", r(cur ? 60000 : 100000 * k), key, d(16), "Pulsa");
  }
}

function toCSV() {
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [["Tanggal", "Jenis", "Kategori", "Jumlah", "Catatan"]];
  [...state.tx].sort((a, b) => a.date.localeCompare(b.date)).forEach((t) =>
    rows.push([t.date, t.type === "in" ? "Pemasukan" : "Pengeluaran", t.cat, t.amount, t.note || ""]));
  return "\uFEFF" + rows.map((r) => r.map(q).join(",")).join("\n");
}

const compact = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1).replace(".0", "").replace(".", ",") + "jt" : n >= 1e3 ? Math.round(n / 1e3) + "rb" : String(Math.round(n)));
function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return ([1, 2, 4, 8, 10].map((m) => m * p).find((m) => m >= v)) || 10 * p;
}
const fmtDate = (s) => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

// ===== UI =====
if (typeof document !== "undefined") {

const $ = (s, r = document) => r.querySelector(s);
const P = {
  chart: "M3 3v18h18M7 14l4-4 3 3 5-6", grid: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
  swap: "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7", pie: "M21 12A9 9 0 1 1 12 3v9zM15 3.5A9 9 0 0 1 20.5 9H15z",
  tag: "M20 12 12 20 4 12V4h8zM8 8h.01", logout: "M9 21H5V3h4M16 17l5-5-5-5M21 12H9", plus: "M12 5v14M5 12h14",
  x: "M18 6 6 18M6 6l12 12", up: "M12 19V5M5 12l7-7 7 7", down: "M12 5v14M19 12l-7 7-7-7",
  dl: "M12 3v12M7 10l5 5 5-5M4 21h16", bot: "M12 3v3M5 8h14v10H5zM9 13h.01M15 13h.01M9 21h6M3 12v2M21 12v2",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3", edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  wallet: "M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12M16 14h.01", send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};
const I = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
const paintIcons = (root = document) => root.querySelectorAll("[data-ic]").forEach((el) => { if (!el.firstChild) el.innerHTML = I(el.dataset.ic); });

const NAV = [["overview", "Ringkasan", "grid"], ["transactions", "Transaksi", "swap"], ["analytics", "Analitik", "pie"], ["categories", "Kategori", "tag"]];
const ui = { q: "", type: "all", cat: "all" };

// ----- Toast -----
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2800);
}

// ----- Komponen tampilan -----
const stat = (cls, label, val, ic) => `<article class="stat ${cls}"><div><small>${label}</small><b>${val}</b></div><span class="si">${I(ic)}</span></article>`;

function txItem(t, withDel) {
  const c = catInfo(t.type, t.cat);
  return `<div class="tx"><span class="ci ${t.type}">${c.icon}</span>
    <div class="tm"><b>${esc(t.cat)}</b><small>${fmtDate(t.date)}${t.note ? " · " + esc(t.note) : ""}</small></div>
    <div class="tr"><b class="${t.type}">${t.type === "in" ? "+" : "-"}${rp(t.amount)}</b><em class="badge ${t.type}">${t.type === "in" ? "pemasukan" : "pengeluaran"}</em></div>
    ${withDel ? `<button class="del" data-act="del-tx" data-id="${t.id}" aria-label="Hapus transaksi">${I("trash")}</button>` : "<span></span>"}</div>`;
}
const emptyBox = (msg) => `<div class="empty"><p>${msg}</p><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center"><button class="btn green" data-act="add-tx">${I("plus")}Tambah transaksi</button><button class="btn dark" data-act="seed">Isi data contoh</button></div></div>`;
const sortTx = (l) => l.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

// ----- Halaman -----
function vOverview() {
  const list = monthTx(thisMonth), inc = total(list, "in"), out = total(list, "out");
  const bal = total(state.tx, "in") - total(state.tx, "out");
  const recent = sortTx([...state.tx]).slice(0, 5);
  const dateLong = today.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return `<div class="vh"><div><h1>Ringkasan</h1><p class="sub">${dateLong}</p></div><button class="btn green" data-act="add-tx">${I("plus")}Tambah transaksi</button></div>
  <div class="stats">${stat("g", "Total Saldo", rp(bal), "wallet")}${stat("n", "Pemasukan Bulan Ini", rp(inc), "down")}${stat("r", "Pengeluaran Bulan Ini", rp(out), "up")}</div>
  <div class="alerts" aria-live="polite">${budgetAlerts().map((a) => `<div class="alert ${a.cls}">⚠ ${esc(a.text)}</div>`).join("")}</div>
  <section class="panel"><div class="ph"><h2>Transaksi Terbaru</h2><a data-act="go" data-v="transactions">Lihat semua →</a></div>
  ${recent.length ? `<div class="list">${recent.map((t) => txItem(t, false)).join("")}</div>` : emptyBox("Belum ada transaksi. Catat yang pertama, atau coba dulu dengan data contoh.")}</section>`;
}

function vTransactions() {
  const allCats = [...new Set([...state.cats.out, ...state.cats.in].map((c) => c.name))];
  return `<div class="vh"><div><h1>Transaksi</h1><p class="sub">Semua pemasukan dan pengeluaranmu</p></div><button class="btn green" data-act="add-tx">${I("plus")}Tambah transaksi</button></div>
  <section class="panel"><div class="filters">
    <label class="inp"><input id="fq" placeholder="Cari kategori atau catatan..." value="${esc(ui.q)}" aria-label="Cari transaksi"></label>
    <select id="ftype" aria-label="Filter jenis"><option value="all">Semua jenis</option><option value="out">Pengeluaran</option><option value="in">Pemasukan</option></select>
    <select id="fcat" aria-label="Filter kategori"><option value="all">Semua kategori</option>${allCats.map((c) => `<option>${esc(c)}</option>`).join("")}</select>
  </div><div id="txList" class="list"></div></section>`;
}
function fillTxList() {
  const q = ui.q.trim().toLowerCase();
  const list = sortTx(state.tx.filter((t) =>
    (ui.type === "all" || t.type === ui.type) && (ui.cat === "all" || t.cat === ui.cat) &&
    (!q || t.cat.toLowerCase().includes(q) || (t.note || "").toLowerCase().includes(q))));
  $("#txList").innerHTML = list.length ? list.map((t) => txItem(t, true)).join("") : (state.tx.length ? `<div class="empty"><p>Tidak ada transaksi yang cocok dengan filter.</p></div>` : emptyBox("Belum ada transaksi."));
}

function vAnalytics() {
  const s = series12(), ex = expenseByCat(), totalEx = ex.reduce((a, b) => a + b.value, 0);
  const inc = total(monthTx(thisMonth), "in");
  const prevOut = total(monthTx(prevMonthKey(1)), "out");
  // Wawasan otomatis
  const ins = [];
  if (ex.length) ins.push(`Pengeluaran terbesar bulan ini: ${ex[0].name} (${Math.round((ex[0].value / totalEx) * 100)}% dari total).`);
  if (inc > 0) { const r = Math.round(((inc - totalEx) / inc) * 100); ins.push(r >= 0 ? `Kamu menabung ${r}% dari pemasukan bulan ini.` : `Pengeluaran melebihi pemasukan sebesar ${rp(totalEx - inc)}.`); }
  if (prevOut > 0 && totalEx > 0) { const d = Math.round(((totalEx - prevOut) / prevOut) * 100); ins.push(d > 0 ? `Pengeluaran naik ${d}% dibanding bulan lalu.` : d < 0 ? `Pengeluaran turun ${-d}% dibanding bulan lalu. Bagus!` : "Pengeluaran sama dengan bulan lalu."); }
  budgetAlerts().forEach((a) => ins.push(a.text));
  if (!ins.length) ins.push("Belum cukup data. Catat beberapa transaksi untuk melihat wawasan.");

  const top = ex.slice(0, 5).map((e) => {
    const c = catInfo("out", e.name), u = c.limit > 0 ? e.value / c.limit * 100 : 0;
    const pct = Math.round((e.value / totalEx) * 100), col = u >= 100 ? "var(--red)" : u >= 80 ? "#f59e0b" : "var(--green)";
    return `<div><div class="bar-top"><span>${c.icon} ${esc(e.name)}</span><span>${rp(e.value)} · ${pct}%${c.limit ? ` · batas ${compact(c.limit)}` : ""}</span></div><div class="track"><i style="width:${c.limit ? Math.min(100, u) : pct}%;background:${col}"></i></div></div>`;
  }).join("");

  return `<div class="vh"><div><h1>Analitik</h1><p class="sub">Gambaran keuanganmu</p></div><button class="btn dark" data-act="export">${I("dl")}Ekspor CSV</button></div>
  <div class="two">
    <section class="panel"><div class="ph"><h2>Pemasukan vs Pengeluaran<small>12 bulan terakhir</small></h2></div><div class="chart" id="lineChart"></div>
      <div class="lg"><span><i class="dot" style="background:var(--green)"></i>Pemasukan</span><span><i class="dot" style="background:var(--red)"></i>Pengeluaran</span></div></section>
    <section class="panel"><div class="ph"><h2>Pengeluaran per Kategori<small>Bulan ini</small></h2></div>${donut(ex, totalEx)}</section>
  </div>
  <div class="two eq">
    <section class="panel"><div class="ph"><h2>Kategori Terboros</h2></div>${top ? `<div class="bars">${top}</div>` : `<p class="sub">Belum ada pengeluaran bulan ini.</p>`}</section>
    <section class="panel"><div class="ph"><h2>Wawasan</h2></div><ul class="ins">${ins.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>
  </div>`;
}

function donut(ex, tot) {
  if (!tot) return `<p class="sub" style="text-align:center;padding:60px 0">Belum ada pengeluaran bulan ini.</p>`;
  const r = 70, c = 2 * Math.PI * r; let acc = 0;
  const segs = ex.map((e, i) => {
    const len = (e.value / tot) * c, s = `<circle r="${r}" cx="100" cy="100" fill="none" stroke="${PAL[i % PAL.length]}" stroke-width="28" stroke-dasharray="${Math.max(0, len - (ex.length > 1 ? 2 : 0))} ${c}" stroke-dashoffset="${-acc}" transform="rotate(-90 100 100)"/>`;
    acc += len; return s;
  }).join("");
  const legend = ex.map((e, i) => `<span><i class="dot" style="background:${PAL[i % PAL.length]}"></i>${catInfo("out", e.name).icon} ${esc(e.name)}</span>`).join("");
  return `<svg class="donut" viewBox="0 0 200 200" role="img" aria-label="Diagram donat pengeluaran per kategori">${segs}<text x="100" y="97" text-anchor="middle" font-size="11" style="fill:#7c889b">Total</text><text x="100" y="116" text-anchor="middle" font-size="14" font-weight="700">${compact(tot)}</text></svg><div class="lg">${legend}</div>`;
}

function drawLine(s) {
  const box = $("#lineChart");
  const W = 640, H = 270, pl = 46, pr = 14, pt = 14, pb = 30;
  const max = niceMax(Math.max(1, ...s.flatMap((x) => [x.inc, x.out])));
  const X = (i) => pl + ((W - pl - pr) * i) / (s.length - 1), Y = (v) => pt + (H - pt - pb) * (1 - v / max);
  let g = "";
  for (let k = 0; k <= 4; k++) { const v = (max / 4) * k, y = Y(v); g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="#212a3a" stroke-dasharray="3 4"/><text x="${pl - 8}" y="${y + 4}" text-anchor="end">${compact(v)}</text>`; }
  const xl = s.map((p, i) => `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${p.label}</text>`).join("");
  const line = (key, col) => `<polyline fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" points="${s.map((p, i) => `${X(i)},${Y(p[key])}`).join(" ")}"/>` + s.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p[key])}" r="3.5" fill="${col}"/>`).join("");
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafik pemasukan dan pengeluaran 12 bulan">${g}${xl}${line("inc", "#22c55e")}${line("out", "#fb4b6b")}<line id="cl" y1="${pt}" y2="${H - pb}" stroke="#4b586c" opacity="0"/></svg><div class="tip" id="tip" hidden></div>`;
  const svg = $("svg", box), cl = $("#cl", box), tip = $("#tip", box);
  const move = (e) => {
    const rect = svg.getBoundingClientRect(), px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.max(0, Math.min(s.length - 1, Math.round(((px - pl) / (W - pl - pr)) * (s.length - 1))));
    cl.setAttribute("x1", X(i)); cl.setAttribute("x2", X(i)); cl.setAttribute("opacity", 1);
    tip.hidden = false;
    tip.innerHTML = `<b>${s[i].full}</b><span style="color:#22c55e">Pemasukan: ${rp(s[i].inc)}</span><br><span style="color:#fb4b6b">Pengeluaran: ${rp(s[i].out)}</span>`;
    const left = (X(i) / W) * rect.width;
    tip.style.left = (left > rect.width * 0.6 ? left - tip.offsetWidth - 24 : left) + "px";
  };
  svg.addEventListener("pointermove", move);
  svg.addEventListener("pointerleave", () => { cl.setAttribute("opacity", 0); tip.hidden = true; });
}

function vCategories() {
  const col = (type, title, ic, color) => `<section class="panel"><div class="ch"><span class="si" style="color:${color}">${I(ic)}</span>${title}<small>${state.cats[type].length} kategori</small></div>
    ${state.cats[type].map((c) => `<div class="cat"><span class="ci ${type}">${c.icon}</span><div><b>${esc(c.name)}</b>${type === "out" && c.limit ? `<small>Batas ${rp(c.limit)} / bulan</small>` : ""}</div>
      ${c.def ? `<span class="tag">bawaan</span>` : ""}
      <button class="icon-btn" data-act="edit-cat" data-t="${type}" data-n="${esc(c.name)}" aria-label="Ubah ${esc(c.name)}">${I("edit")}</button>
      ${c.def ? "" : `<button class="icon-btn" data-act="del-cat" data-t="${type}" data-n="${esc(c.name)}" aria-label="Hapus ${esc(c.name)}">${I("trash")}</button>`}</div>`).join("")}</section>`;
  return `<div class="vh"><div><h1>Kategori</h1><p class="sub">Atur kategori dan batas anggaran bulanan</p></div><button class="btn green" data-act="add-cat">${I("plus")}Tambah kategori</button></div>
  <div class="cats">${col("in", "Pemasukan", "down", "var(--green)")}${col("out", "Pengeluaran", "up", "var(--red)")}</div>`;
}

// ----- Render & navigasi -----
const VIEWS = { overview: vOverview, transactions: vTransactions, analytics: vAnalytics, categories: vCategories };
const current = () => { const v = location.hash.slice(1); return VIEWS[v] ? v : "overview"; };

function render() {
  if (!user) return;
  const v = current();
  $("#view").innerHTML = VIEWS[v]();
  $("#nav").innerHTML = NAV.map(([id, label, ic]) => `<button data-act="go" data-v="${id}" class="${id === v ? "on" : ""}" ${id === v ? 'aria-current="page"' : ""}>${I(ic)}${label}</button>`).join("");
  if (v === "transactions") { $("#ftype").value = ui.type; $("#fcat").value = ui.cat; fillTxList(); }
  if (v === "analytics") drawLine(series12());
}
const go = (v) => { if (location.hash.slice(1) === v) render(); else location.hash = v; scrollTo(0, 0); };
addEventListener("hashchange", render);

// ----- Modal transaksi -----
const txDlg = $("#txDlg");
let txType = "out";
function setTxType(t) {
  txType = t;
  txDlg.querySelectorAll(".seg button").forEach((b) => { const on = b.dataset.type === t; b.classList.toggle("on", on); b.classList.toggle("out", on && t === "out"); b.classList.toggle("in", on && t === "in"); });
  $("#txCat").innerHTML = state.cats[t].map((c) => `<option value="${esc(c.name)}">${c.icon} ${esc(c.name)}</option>`).join("");
}
function openTx() { setTxType("out"); $("#txAmount").value = ""; $("#txNote").value = ""; $("#txDate").value = iso(new Date()); $("#txErr").hidden = true; txDlg.showModal(); $("#txAmount").focus(); }
txDlg.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => setTxType(b.dataset.type)));
const moneyInput = (el) => el.addEventListener("input", () => { const v = parseInt(el.value.replace(/\D/g, ""), 10); el.value = v ? v.toLocaleString("id-ID") : ""; });
moneyInput($("#txAmount")); moneyInput($("#catLimit"));
const num = (el) => parseInt(el.value.replace(/\D/g, ""), 10) || 0;

$("#txForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = num($("#txAmount")), date = $("#txDate").value, err = $("#txErr");
  if (amount <= 0) { err.textContent = "Isi jumlah lebih dari 0."; err.hidden = false; return; }
  if (!date) { err.textContent = "Pilih tanggal dulu."; err.hidden = false; return; }
  const cat = $("#txCat").value, c = catInfo("out", cat);
  const before = txType === "out" && c.limit ? usage(c).pct : 0;
  state.tx.push({ id: state.nextId++, type: txType, cat, amount, date, note: $("#txNote").value.trim() });
  save(); txDlg.close(); render();
  const after = txType === "out" && c.limit ? usage(c).pct : 0;
  toast(lvl(after) && lvl(after) !== lvl(before) ? (after >= 100 ? `Anggaran ${cat} terlampaui!` : `Anggaran ${cat} hampir habis (${Math.round(after)}%)`) : "Transaksi ditambahkan");
});

// ----- Modal kategori -----
const catDlg = $("#catDlg");
let editing = null;
$("#catIcon").innerHTML = ICONS.map((i) => `<option>${i}</option>`).join("");
const syncLimitRow = () => ($("#limitRow").hidden = $("#catType").value !== "out");
$("#catType").addEventListener("change", syncLimitRow);
function openCat(type, name) {
  editing = name ? { type, name } : null;
  const c = name ? state.cats[type].find((x) => x.name === name) : null;
  $("#catTitle").textContent = c ? "Ubah Kategori" : "Tambah Kategori";
  $("#catType").value = type || "out"; $("#catType").disabled = !!c;
  $("#catName").value = c ? c.name : ""; $("#catName").disabled = !!(c && c.def);
  $("#catIcon").value = c ? c.icon : ICONS[0]; $("#catIcon").disabled = !!(c && c.def);
  $("#catLimit").value = c && c.limit ? c.limit.toLocaleString("id-ID") : "";
  $("#catErr").hidden = true; syncLimitRow(); catDlg.showModal();
}
$("#catForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const type = $("#catType").value, name = $("#catName").value.trim(), err = $("#catErr");
  if (!name) { err.textContent = "Nama kategori wajib diisi."; err.hidden = false; return; }
  const dup = state.cats[type].some((c) => c.name.toLowerCase() === name.toLowerCase() && (!editing || c.name !== editing.name));
  if (dup) { err.textContent = "Nama kategori sudah ada."; err.hidden = false; return; }
  const limit = type === "out" ? num($("#catLimit")) : 0;
  if (editing) {
    const c = state.cats[editing.type].find((x) => x.name === editing.name);
    if (!c.def) { state.tx.forEach((t) => { if (t.type === type && t.cat === c.name) t.cat = name; }); c.name = name; c.icon = $("#catIcon").value; }
    c.limit = limit;
  } else state.cats[type].push({ name, icon: $("#catIcon").value, def: false, limit });
  save(); catDlg.close(); render(); toast("Kategori disimpan");
});

document.querySelectorAll("dialog").forEach((d) => {
  d.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => d.close()));
  d.addEventListener("click", (e) => { if (e.target === d) d.close(); }); // klik di luar menutup
});

// ----- Aksi (delegasi klik) -----
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-act]");
  if (!el) return;
  const { act, id, v, t, n } = el.dataset;
  if (act === "go") go(v);
  else if (act === "add-tx") openTx();
  else if (act === "reset") { if (confirm("Hapus semua data dan mulai dari nol?")) { state = newState(); save(); render(); botReset(); toast("Semua data dihapus"); } }
  else if (act === "seed") { seedSample(); save(); render(); toast("Data contoh ditambahkan"); }
  else if (act === "del-tx") { state.tx = state.tx.filter((x) => x.id !== +id); save(); render(); toast("Transaksi dihapus"); }
  else if (act === "export") { download(); }
  else if (act === "add-cat") openCat("out");
  else if (act === "edit-cat") openCat(t, n);
  else if (act === "del-cat") { if (confirm(`Hapus kategori "${n}"? Transaksi lama tetap tersimpan.`)) { state.cats[t] = state.cats[t].filter((c) => c.name !== n); save(); render(); toast("Kategori dihapus"); } }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "fq") { ui.q = e.target.value; fillTxList(); }
});
document.addEventListener("change", (e) => {
  if (e.target.id === "ftype") { ui.type = e.target.value; fillTxList(); }
  if (e.target.id === "fcat") { ui.cat = e.target.value; fillTxList(); }
});
function download() {
  if (!state.tx.length) return toast("Belum ada data untuk diekspor");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([toCSV()], { type: "text/csv;charset=utf-8" }));
  a.download = `duitkostiqbal-${iso(new Date())}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); toast("File CSV diunduh");
}

// ----- Asisten (berbasis aturan, tanpa internet) -----
const log = $("#botLog");
const say = (text, who) => { const m = document.createElement("div"); m.className = "msg " + who; m.textContent = text; log.appendChild(m); log.scrollTop = log.scrollHeight; };
function answer(q) {
  q = q.toLowerCase();
  const list = monthTx(thisMonth), inc = total(list, "in"), out = total(list, "out");
  if (/halo|hai|hi\b|pagi|siang|malam/.test(q)) return `Halo! Aku bisa bantu cek saldo, pengeluaran terbesar, anggaran, dan tips hemat.`;
  if (/saldo|sisa|uang/.test(q)) return `Total saldomu ${rp(total(state.tx, "in") - total(state.tx, "out"))}.\nBulan ini masuk ${rp(inc)} dan keluar ${rp(out)}.`;
  if (/besar|boros|paling|terbanyak/.test(q)) { const ex = expenseByCat(); return ex.length ? `Pengeluaran terbesar bulan ini: ${ex[0].name} sebesar ${rp(ex[0].value)}.` : "Belum ada pengeluaran bulan ini."; }
  if (/anggaran|batas|budget/.test(q)) {
    const rows = state.cats.out.filter((c) => c.limit > 0).map((c) => { const u = usage(c); return `${c.icon} ${c.name}: ${Math.round(u.pct)}% (${rp(u.spent)} / ${rp(u.limit)})`; });
    return rows.length ? rows.join("\n") : "Belum ada batas anggaran. Atur di menu Kategori.";
  }
  if (/tips|hemat|saran|boros/.test(q)) {
    const bad = state.cats.out.filter((c) => c.limit > 0 && usage(c).pct >= 80)[0];
    if (bad) return `Anggaran ${bad.name} hampir/sudah habis. Coba tunda pembelian yang bukan kebutuhan dan masak sendiri bila itu kategori makan.`;
    return "Tips: catat setiap pengeluaran di hari yang sama, sisihkan tabungan di awal bulan, dan beri batas untuk kategori makan.";
  }
  return "Coba tanya: \"sisa saldo\", \"pengeluaran terbesar\", \"status anggaran\", atau \"tips hemat\".";
}
function ask(q) { if (!q.trim()) return; say(q, "me"); setTimeout(() => say(answer(q), "ai"), 250); }
function botReset() {
  log.innerHTML = ""; say(`Halo! Aku asisten keuanganmu. Mau tanya apa?`, "ai");
}
$("#chips").innerHTML = ["Sisa saldo", "Pengeluaran terbesar", "Status anggaran", "Tips hemat"].map((c) => `<button type="button">${c}</button>`).join("");
$("#chips").addEventListener("click", (e) => { if (e.target.tagName === "BUTTON") ask(e.target.textContent); });
$("#botForm").addEventListener("submit", (e) => { e.preventDefault(); ask($("#botIn").value); $("#botIn").value = ""; });
$("#botBtn").addEventListener("click", () => { $("#bot").hidden = !$("#bot").hidden; if (!$("#bot").hidden) $("#botIn").focus(); });
$("#botClose").addEventListener("click", () => ($("#bot").hidden = true));

// ----- Mulai -----
state = loadUser(user);
paintIcons();
botReset();
render();

} // akhir UI
