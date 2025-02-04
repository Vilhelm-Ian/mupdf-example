// worker.ts
/// <reference lib="webworker" />
import * as Comlink from "comlink";
import * as mupdfjs from "mupdf/mupdfjs";
import { PDFDocument } from "mupdf/mupdfjs";

export const MUPDF_LOADED = "MUPDF_LOADED";

export class MupdfWorker {
  private document?: PDFDocument;

  constructor() {
    this.initializeMupdf();
  }

  private initializeMupdf() {
    try {
      postMessage(MUPDF_LOADED);
    } catch (error) {
      console.error("Failed to initialize MuPDF:", error);
    }
  }

  // ===> Here you can create methods <===
  // ===> that call statics and methods <===
  // ===> from mupdfjs which wraps ./node_modules/mupdf/dist/mupdf.js <===

  loadDocument(document: ArrayBuffer): number {
    this.document = mupdfjs.PDFDocument.openDocument(
      document,
      "application/pdf"
    );

    return this.document.countPages();
  }

  renderPageAsImage(pageIndex = 0, scale = 1): ImageData {
    if (!this.document) throw new Error("Document not loaded");
    const doc_to_screen = mupdfjs.Matrix.scale(scale, scale)

    let doc = this.document
    let page = doc.loadPage(pageIndex)
    let bbox = mupdfjs.Rect.transform(page.getBounds(), doc_to_screen)

    let pixmap = new mupdfjs.Pixmap(mupdfjs.ColorSpace.DeviceRGB, bbox, true)
    pixmap.clear(255)

    let device = new mupdfjs.DrawDevice(doc_to_screen, pixmap)
    page.run(device, mupdfjs.Matrix.identity)
    device.close()

    // TODO: do we need to make a copy with slice() ?
    let imageData = new ImageData(pixmap.getPixels().slice(), pixmap.getWidth(), pixmap.getHeight())

    pixmap.destroy()

    // TODO: do we need to pass image data as transferable to avoid copying?
    return imageData
  }
}

Comlink.expose(new MupdfWorker());
