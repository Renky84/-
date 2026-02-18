// client/src/lib/nameExtract.ts
/**
 * 周船寺会衆「グループ編成」PDF向け：姓名抽出（精度優先）
 * - pdfjsで「姓 空白 名」が取れている前提で、そこだけを狙う
 * - 役職語や見出し語を除外
 * - 地名っぽい誤爆を除外
 * - 日本語順（あいうえお順）にソートして返す
 */

const KANJI = `[一-龯々〆ヵヶ]`;
const KANA = `[ぁ-んァ-ンー]`;

// 文字クラスの「中身」だけ（重要：二重[]事故を防ぐ）
const JA_BODY = `一-龯々〆ヵヶぁ-んァ-ンー`;

// 役職・担当など（名前として拾わない）
const ROLE_WORDS = ["長", "開", "監", "補", "援", "学", "伝"];

// 見出し/集計（名前として拾わない）
const HEADER_WORDS = [
  "奉仕年度",
  "会衆",
  "グループ",
  "編成",
  "掲示用",
  "活発な伝道者数",
  "正規開拓者",
  "開拓",
  "伝道者",
  "バプテスマ",
  "含む",
  "うち",
  "名",
];

// 地名っぽい誤爆（必要に応じて増やしてOK）
const PLACE_WORDS = ["福岡", "福岡市", "周船寺", "横浜", "富士見", "高田", "今津"];

// NG判定用
const STOP_RE = new RegExp(`(?:${[...ROLE_WORDS, ...HEADER_WORDS].join("|")})`);

// テキスト正規化：まずノイズを減らす
function normalizeAll(s: string) {
  return (s ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/\u3000/g, " ")
    .replace(/[･・]/g, " ")
    .replace(/[‐-‒–—―]/g, "-")
    .replace(/[|｜]/g, " ")
    .replace(/[()（）［］【】]/g, " ")
    .replace(/[0-9０-９]/g, " ")
    .replace(/[A-Za-z]/g, " ")
    .replace(/[.,:;'"“”‘’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 名（えり子/まき子/レイ/けい子/慈温などもOK）
const GIVEN =
  `(?:` +
  `${KANJI}{1,6}` +
  `|${KANA}{1,10}` +
  `|${KANJI}{1,4}${KANA}{1,8}` +
  `|${KANA}{1,8}${KANJI}{1,4}` +
  `)`;

// 姓（漢字2-4を基本。1文字姓もあるが誤爆増えるので一旦2から）
const FAMILY = `${KANJI}{2,4}`;

/**
 * ★本命：全文から「姓 + 空白 + 名」だけを拾う
 * 境界は「日本語以外」で区切る（JA_BODYを使うのが重要）
 */
const NAME_GLOBAL = new RegExp(
  `(?:^|[^${JA_BODY}])` +
    `(${FAMILY})` +
    `\\s+` +
    `(${GIVEN})` +
  `(?=[^${JA_BODY}]|$)`,
  "g"
);

function looksBad(full: string) {
  if (!full) return true;

  // 長さ制限（地名や文章の誤爆を抑える）
  if (full.length < 3 || full.length > 8) return true;

  // 見出し/役職混入を除外
  if (STOP_RE.test(full)) return true;

  // 地名系を除外
  if (PLACE_WORDS.some((w) => full.includes(w))) return true;

  // 日本語以外が混ざるものは除外
  if (/[^一-龯々〆ヵヶぁ-んァ-ンー]/.test(full)) return true;

  return false;
}

export function extractNamesFromText(text: string): string[] {
  const norm = normalizeAll(text);

  const out: string[] = [];
  const seen = new Set<string>();

  NAME_GLOBAL.lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = NAME_GLOBAL.exec(norm)) !== null) {
    const sei = (m[1] ?? "").trim();
    const mei = (m[2] ?? "").trim();

    if (!sei || !mei) continue;
    if (STOP_RE.test(sei) || STOP_RE.test(mei)) continue;

    const full = `${sei}${mei}`;
    if (looksBad(full)) continue;

    if (!seen.has(full)) {
      seen.add(full);
      out.push(full);
    }
  }


  return out;
}
