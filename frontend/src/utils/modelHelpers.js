export function detectModelUrl(taskRaw) {
    if (!taskRaw) return "";
    const t = taskRaw;
    const candidates = [];
    const push = (v) => (v && typeof v === "string" ? candidates.push(v.trim()) : null);

    const mu = t?.model_urls || t?.result?.model_urls || t?.output?.model_urls || t?.modelUrls || {};
    push(mu?.glb);
    push(mu?.pre_remeshed_glb);
    push(mu?.fbx);
    push(mu?.obj);
    push(mu?.usdz);

    push(t?.model?.download_url);
    push(t?.model_url);
    push(t?.result?.model_url);
    push(t?.result?.glb);
    push(t?.output?.glb);
    push(t?.output?.model_url);

    return candidates[0] || "";
}

export function extractModelUrls(taskRaw) {
    if (!taskRaw) return {};
    const t = taskRaw;
    const mu = t?.model_urls || t?.result?.model_urls || t?.output?.model_urls || t?.modelUrls || {};
    const keys = ["glb", "fbx", "obj", "usdz", "mtl", "pre_remeshed_glb"];
    const out = {};
    for (const k of keys) {
        const v = mu?.[k];
        if (typeof v === "string" && v.trim()) out[k] = v.trim();
    }
    return out;
}

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
