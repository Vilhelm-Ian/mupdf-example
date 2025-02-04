// App.tsx
import "@/App.css";
import { useMupdf } from "@/hooks/useMupdf.hook";
import { useRef, useState, useCallback, useEffect } from "react";

function App() {
    const {
        isWorkerInitialized,
        renderPage,
        loadDocument,
        currentPage,
        numPages,
    } = useMupdf();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }
        setLoading(true);

        try {
             const file = event.target.files[0];
            const arrayBuffer = await file.arrayBuffer();
            await loadDocument(arrayBuffer);
        } finally {
            setLoading(false);
        }

    }, [loadDocument]);

    const handleNextPage = useCallback(() => {
         if(numPages > currentPage + 1){
                renderPage(currentPage + 1, canvasRef.current!.getContext("2d")!);
        }
    }, [currentPage, renderPage, numPages]);


    useEffect(() => {
        if (!isWorkerInitialized) {
            return;
        }
            const canvasContext = canvasRef.current?.getContext("2d");
            if(canvasContext){
                renderPage(currentPage, canvasContext);
            }
    }, [loading]);



  return (
    <>
      <input type="file" accept=".pdf" onChange={handleFileChange} disabled={loading} />
        {loading && <p>Loading...</p>}
        <canvas ref={canvasRef} />
          { isWorkerInitialized && !loading && numPages > 0 &&
                <button onClick={handleNextPage}>Next Page</button>
          }
    </>
  );
}

export default App;
