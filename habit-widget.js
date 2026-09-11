// 習慣ウィジェット（Scriptable用）
// ─ 使い方 ─
// 1. App Store で Scriptable を入れる
// 2. Scriptable で新規スクリプトを作り、このファイルの中身を貼り付けて「習慣ウィジェット」という名前で保存
// 3. 習慣アプリの設定 →「ファイルに保存」で habits.json を書き出し、
//    保存先に「Scriptable」フォルダ（iCloud Drive）を選ぶ
// 4. ホーム画面を長押し → ＋ → Scriptable → 中サイズ → ウィジェットを長押しして
//    Script に「習慣ウィジェット」を指定
// ※ データは自動同期されません。記録を反映したいときは 3 をやり直してください。
//    URL 方式にする場合は下の DATA_URL に JSON の公開URLを入れてください（そちらが優先されます）。

const DATA_URL = "";               // 例: "https://your-name.github.io/habit/habits.json"
const FILE_NAME = "habits.json";
const ACCENT = new Color("#27548A");
const INK = new Color("#19222E");
const MUTE = new Color("#8B95A3");
const LINE = new Color("#E3E7EC");

async function loadData() {
  if (DATA_URL) {
    const r = new Request(DATA_URL);
    return await r.loadJSON();
  }
  const fm = FileManager.iCloud();
  const path = fm.joinPath(fm.documentsDirectory(), FILE_NAME);
  if (!fm.fileExists(path)) throw new Error("habits.json が見つかりません");
  await fm.downloadFileFromiCloud(path);
  return JSON.parse(fm.readString(path));
}

const pad = n => String(n).padStart(2, "0");
const key = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function isTargetDay(h, d) {
  if (key(d) < h.start) return false;
  if (h.freq === "weekdays") return (h.dows || []).includes(d.getDay());
  return true;
}
function goal(h) { return h.goalType === "count" ? Math.max(1, h.target || 1) : 1; }
function done(logs, h, d) { return ((logs[h.id] || {})[key(d)] || 0) >= goal(h); }

function streak(logs, h) {
  let d = new Date(); d.setHours(0, 0, 0, 0);
  let n = 0;
  if (!done(logs, h, d)) d = addDays(d, -1);
  for (let i = 0; i < 400; i++) {
    if (key(d) < h.start) break;
    if (!isTargetDay(h, d)) { d = addDays(d, -1); continue; }
    if (done(logs, h, d)) { n++; d = addDays(d, -1); } else break;
  }
  return n;
}

const w = new ListWidget();
w.backgroundColor = new Color("#FAFAF7");
w.setPadding(14, 14, 14, 14);

try {
  const data = await loadData();
  const logs = data.logs || {};
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const habits = (data.habits || []).filter(h => !h.archived && isTargetDay(h, today));
  const fin = habits.filter(h => done(logs, h, today)).length;

  const head = w.addStack();
  const title = head.addText("今日 " + fin + " / " + habits.length);
  title.font = Font.semiboldSystemFont(15);
  title.textColor = INK;
  head.addSpacer();
  const dt = head.addText(pad(today.getMonth() + 1) + "/" + pad(today.getDate()));
  dt.font = Font.systemFont(12);
  dt.textColor = MUTE;
  w.addSpacer(8);

  // 直近7日 × 上位3習慣のマス目
  for (const h of habits.slice(0, 3)) {
    const row = w.addStack();
    row.centerAlignContent();
    const nm = row.addText((h.emoji || "") + " " + h.name);
    nm.font = Font.systemFont(12);
    nm.textColor = INK;
    nm.lineLimit = 1;
    row.addSpacer();
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i);
      const cell = row.addStack();
      cell.size = new Size(12, 12);
      cell.cornerRadius = 3;
      cell.backgroundColor = done(logs, h, d)
        ? new Color(h.color || "#27548A")
        : (isTargetDay(h, d) ? LINE : new Color("#F0F2F5"));
      if (i > 0) row.addSpacer(3);
    }
    const st = streak(logs, h);
    row.addSpacer(8);
    const s = row.addText(st + "日");
    s.font = Font.systemFont(11);
    s.textColor = st > 0 ? ACCENT : MUTE;
    w.addSpacer(6);
  }

  if (habits.length === 0) {
    const t = w.addText("今日の対象はありません");
    t.font = Font.systemFont(12);
    t.textColor = MUTE;
  }
} catch (e) {
  const t = w.addText("データを読めませんでした");
  t.font = Font.semiboldSystemFont(13);
  t.textColor = INK;
  w.addSpacer(4);
  const s = w.addText(String(e.message || e));
  s.font = Font.systemFont(10);
  s.textColor = MUTE;
}

if (DATA_URL) w.url = DATA_URL;

if (config.runsInWidget) Script.setWidget(w);
else w.presentMedium();
Script.complete();
