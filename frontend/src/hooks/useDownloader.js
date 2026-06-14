
/* eslint-disable no-unused-vars */
import { apiDownload } from "../api/client";
import { filenameFromUrl } from "../utils/modelUtils";

export function useDownloader(setBusy, setError) {
    async function triggerBrowserDownload(blob, filename) {
        const a = document.createElement("a");
        const href = URL.createObjectURL(blob);
        a.href = href;
        a.download = filename || "download";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(href), 1500);
    }

    function triggerDirectDownload(url) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    async function downloadFile(url, keyHint) {
        if (!url) return;
        setBusy(true);
        setError("");
        try {
            const blob = await apiDownload(url);
            const extMap = {
                glb: "model.glb",
                fbx: "model.fbx",
                obj: "model.obj",
                usdz: "model.usdz",
                mtl: "model.mtl",
                pre_remeshed_glb: "pre_remeshed_model.glb",
            };
            const name = filenameFromUrl(url, extMap[keyHint] || "model.bin");
            await triggerBrowserDownload(blob, name);
        } catch (e) {
            setError(`${e?.message}\nFalling back to direct download.`);
            triggerDirectDownload(url);
        } finally {
            setBusy(false);
        }
    }

    function downloadActivePreferred(modelUrls, detectedModelUrl) {
        const url = modelUrls?.glb || detectedModelUrl;
        if (!url) {
            setError("No model URL available yet.");
            return;
        }
        downloadFile(url, modelUrls?.glb ? "glb" : undefined);
    }

    return { downloadFile, downloadActivePreferred };
}
