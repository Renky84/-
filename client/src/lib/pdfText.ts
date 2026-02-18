// client/src/lib/pdfText.ts
// ✅ Vercel + Vite 安定版（pdfjs legacy + worker?url）

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker?url";

// Vite用：workerのURLをバンドラに解決させる
// @ts-expect-error pdfjsLib型の差異吸収
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export type PdfExtractMethod = "pdfjs" | "ocr" | "mixed";

export type PdfExtractPageInfo = {
  page: number;
  textLen: number;
  usedOcr: boolean;
  ocrConfidence?: number;
};

export type PdfExtractResult = {
  text: string;
  method: PdfExtractMethod;
  pageCount: number;
  debugPreview: string; // 先頭2000文字
  pages: PdfExtractPageInfo[];
};

type ExtractOptions = {
  // ✅ ページごとにOCRするか（mixed対応）
  ocrPerPage?: boolean;

  // ✅ OCRに回す判定（ページ単位）
  minCharsPerPage?: number;

  // ✅ 全体OCR判定（ocrPerPage=false のときに使う）
  minTotalChars?: number;

  // ✅ OCR設定
  ocrLang?: string; // "jpn"
  tessdataPath?: string; // "/tessdata"
  ocrScale?: number; // 2.0〜3.0

  // ✅ 進捗表示
  onProgress?: (msg: string) => void;
};

const defaultOpts: Required<
  Pick<
    ExtractOptions,
    | "ocrPerPage"
    | "minCharsPerPage"
    | "minTotalChars"
    | "ocrLang"
    | "tessdataPath"
    | "ocrScale"
  >
> = {
  ocrPerPage: true,
  minCharsPerPage: 20,
  minTotalChars: 80,
  ocrLang: "jpn",
  tessdataPath: "/tessdata",
  ocrScale: 2.5,
};

function preview2000(text: string) {
  return (text ?? "").slice(0, 2000);
}

function isMostlyEmptyText(s: string) {
  const t = (s ?? "").replace(/\s+/g, "");
  return t.length === 0;
}

async function extractPdfjsTextPerPage(
  pdf: any,
  onProgress?: (m: string) => void
) {
  const pages: { page: number; text: string }[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    onProgress?.(`pdfjs: extracting text page ${p}/${pdf.numPages}`);
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const strings = (content.items ?? [])
      .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
      .filter(Boolean);

    // join(" ") でOK（表の崩れは nameExtract 側で吸収）
    const text = strings.join(" ").trim();
    pages.push({ page: p, text });
  }
  return pages;
}

async function renderPageToImageDataUrl(
  pdf: any,
  pageNum: number,
  scale: number,
  onProgress?: (m: string) => void
) {
  onProgress?.(`pdfjs: rendering page ${pageNum} to image (scale=${scale})`);
  const page = await pdf.getPage(pageNum);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: false });

  if (!ctx) throw new Error("Failed to get 2D context for canvas.");

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  // tesseract.js は dataURL でも動く
  const dataUrl = canvas.toDataURL("image/png");
  return dataUrl;
}

let _tessWorkerPromise: Promise<any> | null = null;

// ✅ v6系API想定：createWorker(lang, { logger, langPath })
async function getTesseractWorker(
  opts: { ocrLang: string; tessdataPath: string },
  onProgress?: (m: string) => void
) {
  if (_tessWorkerPromise) return _tessWorkerPromise;

  _tessWorkerPromise = (async () => {
    const mod: any = await import("tesseract.js");

    // createWorker が default/名前付きどっちでも取れるようにする（環境差吸収）
    const createWorker =
      mod.createWorker ?? mod.default?.createWorker ?? mod.default ?? mod;

    if (typeof createWorker !== "function") {
      throw new Error("tesseract.js createWorker が見つかりません");
    }

    // v6: createWorker(lang, options)
    const worker = await createWorker(opts.ocrLang, {
      logger: (m: any) => {
        if (m?.status) {
          const pct =
            typeof m.progress === "number"
              ? ` ${(m.progress * 100).toFixed(0)}%`
              : "";
          onProgress?.(`ocr: ${m.status}${pct}`);
        }
      },
      // ✅ 言語データの配置場所（client/public/tessdata）
      // 例: /tessdata/jpn.traineddata(.gz)
      langPath: opts.tessdataPath,
    });

    // ✅ もし setParameters があるなら設定（無ければスキップ）
    if (worker?.setParameters) {
      await worker.setParameters({
        preserve_interword_spaces: "1",
      });
    }

    return worker;
  })();

  return _tessWorkerPromise;
}

async function ocrImageToText(
  imageDataUrl: string,
  opts: { ocrLang: string; tessdataPath: string },
  onProgress?: (m: string) => void
) {
  const worker = await getTesseractWorker(opts, onProgress);

  const res = await worker.recognize(imageDataUrl);

  const text = (res?.data?.text ?? "").trim();
  const conf =
    typeof res?.data?.confidence === "number" ? res.data.confidence : undefined;

  return { text, confidence: conf };
}

/**
 * 新：デバッグとOCR分岐込み
 */
export async function extractPdfTextDetailed(
  file: File,
  options: ExtractOptions = {}
): Promise<PdfExtractResult> {
  const opts = { ...defaultOpts, ...options };
  const onProgress = opts.onProgress;

  onProgress?.("loading pdf…");
  const buf = await file.arrayBuffer();

  // ✅ getDocument は legacy pdfjsLib から呼ぶ
  const loadingTask = (pdfjsLib as any).getDocument({ data: buf });
  const pdf = await loadingTask.promise;

  const pageCount = pdf.numPages;

  // まずpdfjsでページごとに文字抽出
  const pdfjsPages = await extractPdfjsTextPerPage(pdf, onProgress);

  const pageInfos: PdfExtractPageInfo[] = [];
  const finalTexts: string[] = [];

  const totalPdfjsChars = pdfjsPages.reduce(
    (sum, p) => sum + ((p.text ?? "").replace(/\s+/g, "").length ?? 0),
    0
  );

  // 分岐：
  // - ocrPerPage=true: ページごとに「少ないページだけ」OCR
  // - ocrPerPage=false: 全体が少ないなら全部OCR
  if (!opts.ocrPerPage) {
    const useOcrAll = totalPdfjsChars < opts.minTotalChars;

    if (!useOcrAll) {
      // 全部pdfjs
      for (const p of pdfjsPages) {
        finalTexts.push(p.text);
        pageInfos.push({ page: p.page, textLen: p.text.length, usedOcr: false });
      }
      const text = finalTexts.join("\n");
      return {
        text,
        method: "pdfjs",
        pageCount,
        debugPreview: preview2000(text),
        pages: pageInfos,
      };
    }

    // 全部OCR
    for (let p = 1; p <= pageCount; p++) {
      const img = await renderPageToImageDataUrl(
        pdf,
        p,
        opts.ocrScale,
        onProgress
      );
      const { text: ocrText, confidence } = await ocrImageToText(
        img,
        { ocrLang: opts.ocrLang, tessdataPath: opts.tessdataPath },
        onProgress
      );
      finalTexts.push(ocrText);
      pageInfos.push({
        page: p,
        textLen: ocrText.length,
        usedOcr: true,
        ocrConfidence: confidence,
      });
    }
    const text = finalTexts.join("\n");
    return {
      text,
      method: "ocr",
      pageCount,
      debugPreview: preview2000(text),
      pages: pageInfos,
    };
  }

  // ページ単位OCR（mixed対応）
  let usedOcrAny = false;
  let usedPdfjsAny = false;

  for (const p of pdfjsPages) {
    const compactLen = (p.text ?? "").replace(/\s+/g, "").length;
    const shouldOcr = compactLen < opts.minCharsPerPage;

    if (!shouldOcr && !isMostlyEmptyText(p.text)) {
      finalTexts.push(p.text);
      pageInfos.push({ page: p.page, textLen: p.text.length, usedOcr: false });
      usedPdfjsAny = true;
      continue;
    }

    // OCRへ
    usedOcrAny = true;
    onProgress?.(`fallback to OCR: page ${p.page}/${pageCount}`);
    const img = await renderPageToImageDataUrl(
      pdf,
      p.page,
      opts.ocrScale,
      onProgress
    );
    const { text: ocrText, confidence } = await ocrImageToText(
      img,
      { ocrLang: opts.ocrLang, tessdataPath: opts.tessdataPath },
      onProgress
    );

    finalTexts.push(ocrText);
    pageInfos.push({
      page: p.page,
      textLen: ocrText.length,
      usedOcr: true,
      ocrConfidence: confidence,
    });
  }

  const text = finalTexts.join("\n");
  const method: PdfExtractMethod =
    usedOcrAny && usedPdfjsAny ? "mixed" : usedOcrAny ? "ocr" : "pdfjs";

  return {
    text,
    method,
    pageCount,
    debugPreview: preview2000(text),
    pages: pageInfos,
  };
}

/**
 * 互換：旧インターフェイス（string）
 */
export async function extractPdfText(file: File): Promise<string> {
  const res = await extractPdfTextDetailed(file);
  return res.text;
}
