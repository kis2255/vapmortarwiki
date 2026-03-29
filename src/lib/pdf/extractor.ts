/**
 * PDF 텍스트 추출
 */

export interface ExtractedPdf {
  text: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}

export async function extractTextFromPdf(
  buffer: Buffer
): Promise<ExtractedPdf> {
  // pdf-parse v2 requires data passed in constructor
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PDFParse } = require("pdf-parse") as {
    PDFParse: new (opts: { data: Uint8Array }) => {
      loadPDF: (buf: Buffer) => Promise<{
        text: string;
        numpages: number;
        info?: { Title?: string; Author?: string; CreationDate?: string };
      }>;
    };
  };

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const data = await parser.loadPDF(buffer);

  return {
    text: data.text,
    pageCount: data.numpages,
    metadata: {
      title: data.info?.Title || undefined,
      author: data.info?.Author || undefined,
      creationDate: data.info?.CreationDate || undefined,
    },
  };
}
