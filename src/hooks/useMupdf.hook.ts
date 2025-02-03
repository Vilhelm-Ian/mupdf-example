// useMupdf.ts
import { MUPDF_LOADED, type MupdfWorker } from "@/workers/mupdf.worker";
import * as Comlink from "comlink";
import { Remote } from "comlink";
import { useCallback, useEffect, useRef, useState } from "react";

export function useMupdf() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isWorkerInitialized, setIsWorkerInitialized] = useState(false);
  const document = useRef<ArrayBuffer | null>(null);
  const mupdfWorker = useRef<Remote<MupdfWorker>>();
  const numPages = useRef<number>(0);

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/mupdf.worker", import.meta.url),
      {
        type: "module",
      }
    );
    mupdfWorker.current = Comlink.wrap<MupdfWorker>(worker);

    worker.addEventListener("message", (event) => {
      if (event.data === MUPDF_LOADED) {
        setIsWorkerInitialized(true);
      }
    });

    return () => {
      worker.terminate();
    };
  }, []);

  const loadDocument = useCallback(async (arrayBuffer: ArrayBuffer) => {
    document.current = arrayBuffer;
    setCurrentPage(0);
    const pages = await mupdfWorker.current!.loadDocument(arrayBuffer);
    numPages.current = pages
  }, []);

  // ===> Here you can create hooks <===
  // ===> that use the methods of the worker. <===
  // ===> You can use useCallback to avoid unnecessary rerenders <===

  const renderPage = useCallback(async (pageIndex: number, canvasContext: CanvasRenderingContext2D) => {
    if (!document.current) {
      throw new Error("Document not loaded");
    }

    setCurrentPage(pageIndex);

    const pngData = await mupdfWorker.current!.renderPageAsImage(
      pageIndex,
      (window.devicePixelRatio * 96) / 72
    );

    const blob = new Blob([pngData], { type: 'image/png' });
    const url = URL.createObjectURL(blob);

    const imageBitmap = await createImageBitmap(blob);

    canvasContext.canvas.width = imageBitmap.width;
    canvasContext.canvas.height = imageBitmap.height;
    canvasContext.drawImage(imageBitmap, 0, 0);
    URL.revokeObjectURL(url);

  }, []);

  return {
    isWorkerInitialized,
    loadDocument,
    renderPage,
    currentPage,
    numPages: numPages.current,
  };
}
