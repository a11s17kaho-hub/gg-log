// ランク画面の写真を読み取る小さなサーバー(Cloudflare Workers の無料プランで動かす)
// サイトから縮めた写真(JPEG の base64)を受け取り、Gemini に読ませて結果の JSON だけを返す。写真は保存しない
// 設定(Cloudflare の画面で入れる):
//   GEMINI_KEY      … Google AI Studio で作ったキー(シークレットとして登録)
//   ALLOWED_ORIGINS … 使ってよいサイト。カンマ区切り(省略時は gglog と owliker)
//   MODEL           … 省略時は gemini-3.5-flash-lite
const PROMPT = `これはゲーム「オーバーウォッチ」のランク戦(ライバル・プレイ)の試合後に出る結果画面を、スマホでモニターごと撮った写真です。
画面から次の項目を読み取り、JSON だけを返してください。読めない項目は null にして、推測で埋めないでください。
{
  "screen": "rank" か "other"(ランクと「ランク進行度」が出ている結果画面なら "rank"),
  "result": "win"(勝利/VICTORY) | "loss"(敗北/DEFEAT) | "draw"(引き分け/DRAW) | null,
  "role": "tank"(タンク) | "damage"(ダメージ) | "support"(サポート) | null  ※ランクのマークの上に出るロール名,
  "tier": "ブロンズ" | "シルバー" | "ゴールド" | "プラチナ" | "エメラルド" | "ダイヤモンド" | "マスター" | "グランドマスター" | "チャンピオン" | null,
  "div": 1〜5 の整数 | null  ※ランク名の後ろの数字,
  "delta": 「ランク進行度」の % を整数で(例: "-2%" なら -2、"+25%" なら 25) | null,
  "heroes": 画面右側の「〇〇SR」に出ているヒーロー名をカタカナで、上から順に(例: ["バスティオン", "ゲンジ"])
}`;

export default {
  async fetch(req, env) {
    const allowed = (env.ALLOWED_ORIGINS || "https://gglog.web.app,https://owliker.web.app").split(",").map(s => s.trim());
    const origin = req.headers.get("Origin") || "";
    const cors = { "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" };
    const json = (v, status = 200) => new Response(JSON.stringify(v), { status, headers: { ...cors, "Content-Type": "application/json" } });
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    if (req.method !== "POST" || !allowed.includes(origin)) return json({ error: "forbidden" }, 403);
    let image = "";
    try { image = (await req.json()).image; } catch (e) {}
    if (typeof image !== "string" || !image || image.length > 2_000_000) return json({ error: "bad image" }, 400);
    const model = env.MODEL || "gemini-3.5-flash-lite";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: "image/jpeg", data: image } }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    });
    if (!r.ok) return json({ error: "ai " + r.status }, 502);
    const out = await r.json();
    const text = out?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    try { return json(JSON.parse(text.replace(/^```(json)?|```$/g, "").trim())); }
    catch (e) { return json({ error: "parse" }, 502); }
  },
};
