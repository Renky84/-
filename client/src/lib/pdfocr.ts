import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import Tesseract from "tesseract.js";

GlobalWorkerOptions.workerSrc = workerSrc;

type OcrOptions = {
  maxPages?: number;     // 先頭何ページ読むか
  scale?: number;        // 画像化の解像度倍率（2〜3推奨）
  lang?: "jpn" | "eng";  // 日本語なら jpn
};

export async function ocrPdfToText(file: File, opts: OcrOptions = {}) {
  const { maxPages = 2, scale = 2.5, lang = "jpn" } = opts;

  const buf = await file.arrayBuffer();
  const pdf = await getDocument({ data: buf }).promise;

  const pages = Math.min(pdf.numPages, maxPages);
  let out = "";

  for (let p = 1; p <= pages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas context が取得できません");

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await (page.render as any)({ canvasContext: ctx, viewport }).promise;

    // OCR（画像→文字）
    const { data } = await Tesseract.recognize(canvas, lang, {
      // 進捗ログ欲しければここで拾える
      // logger: (m) => console.log(m),
    });

    out += data.text + "\n";
  }

  return out;
}