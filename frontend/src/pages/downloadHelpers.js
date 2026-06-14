export function filenameFromUrl(url, fallbackName = "model.bin") {
    try {
        const u = new URL(url);
        const path = u.pathname || "";
        const last = path.split("/").filter(Boolean).pop();
        return last || fallbackName;
    } catch {
        return fallbackName;
    }
}

export async function triggerBrowserDownload(blob, filename) {
    const a = document.createElement("a");
    const href = URL.createObjectURL(blob);
    a.href = href;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1500);
}

export function triggerDirectDownload(url) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
}

export async function handleFileDownload(url, keyHint, apiDownloadFn, setBusy, setError) {
    if (!url) return;
    setBusy(true);
    setError("");
    try {
        const blob = await apiDownloadFn(url);
        const extMap = { glb: "model.glb", fbx: "model.fbx", obj: "model.obj", usdz: "model.usdz", mtl: "model.mtl", pre_remeshed_glb: "pre_remeshed_model.glb" };
        const name = filenameFromUrl(url, extMap[keyHint] || "model.bin");
        await triggerBrowserDownload(blob, name);
    } catch (e) {
        setError(`${e?.message}\nFalling back to direct download.`);
        triggerDirectDownload(url);
    } finally {
        setBusy(false);
    }
}
