/**
 * PDF 텍스트 추출 (pdf-parse v2)
 */

export interface ExtractedPdf {
  text: string;
  pageCount: number;
}

export async function extractTextFromPdf(
  buffer: Buffer
): Promise<ExtractedPdf> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require("pdf-parse") as {
    PDFParse: new (opts: { data: Uint8Array }) => {
      load: () => Promise<void>;
      getInfo: () => Promise<{ total: number }>;
      getText: () => Promise<{ text: string }>;
    };
  };

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  await parser.load();

  const info = await parser.getInfo();
  const textResult = await parser.getText();

  return {
    text: textResult.text || "",
    pageCount: info.total || 0,
  };
}
