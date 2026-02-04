declare module "pdf-parse" {
  interface PDFParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: {
      PDFFormatVersion?: string;
      IsAcroFormPresent?: boolean;
      IsXFAPresent?: boolean;
      Title?: string;
      Author?: string;
      Subject?: string;
      Keywords?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: string;
      ModDate?: string;
      [key: string]: any;
    };
    metadata: any;
    version: string;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: {
      pagerender?: (pageData: any) => string;
      max?: number;
      version?: string;
    }
  ): Promise<PDFParseResult>;

  export = pdfParse;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export = pdfParse;
}
