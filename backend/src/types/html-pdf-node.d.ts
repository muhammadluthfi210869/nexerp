declare module 'html-pdf-node' {
  interface PdfFile {
    content?: string;
    url?: string;
  }

  interface PdfOptions {
    format?: string;
    width?: string;
    height?: string;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    printBackground?: boolean;
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    preferCSSPageSize?: boolean;
    quality?: number;
  }

  function generatePdf(file: PdfFile, options?: PdfOptions): Promise<Buffer>;

  export default { generatePdf };
}
