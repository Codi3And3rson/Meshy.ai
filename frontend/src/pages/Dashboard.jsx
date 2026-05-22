// Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import TextPanel from "../components/TextPanel";
import ImagePanel from "../components/ImagePanel";
import TasksPanel from "../components/TasksPanel";
import { meshy } from "../api/meshy";
import { apiDownload } from "../api/client";

// New Components
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Downloads from "../components/Downloads";

// Helpers
function detectModelUrl(taskRaw) {
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

function extractModelUrls(taskRaw) {
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

function filenameFromUrl(url, fallbackName = "model.bin") {
    try {
        const u = new URL(url);
        const path = u.pathname || "";
        const last = path.split("/").filter(Boolean).pop();
        return last || fallbackName;
    } catch {
        return fallbackName;
    }
}

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

export default function Dashboard() {
    const { apiKey, logout } = useAuth();

    const [mode, setMode] = useState("text"); // "text" | "image"
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const [tasks, setTasks] = useState([]);
    const [activeId, setActiveId] = useState("");
    const [pollOn, setPollOn] = useState(true);
    const [lastPreviewId, setLastPreviewId] = useState("");

    function upsertTask(partial) {
        setTasks((prev) => {
            const idx = prev.findIndex((t) => t.id === partial.id);
            if (idx === -1) return [...prev, partial];
            const copy = prev.slice();
            copy[idx] = { ...copy[idx], ...partial };
            return copy;
        });
    }

    async function submitTextPreview(payload) {
        setBusy(true);
        setError("");
        try {
            const data = await meshy.createTextTo3D(apiKey, payload);
            const id = data?.result || data?.taskId || data?.id;
            if (!id) throw new Error("Backend did not return a task id.");
            setLastPreviewId(id);
            upsertTask({ id, type: "text", status: "CREATED", raw: { created: true, ...data }, meta: { mode: "preview" } });
            setActiveId(id);
        } catch (e) { setError(String(e?.message || e)); } finally { setBusy(false); }
    }

    async function submitTextRefine(payload) {
        if (!lastPreviewId) return setError("No preview task to refine yet.");
        setBusy(true);
        setError("");
        try {
            const data = await meshy.createTextTo3D(apiKey, { ...payload, mode: "refine", preview_task_id: lastPreviewId });
            const id = data?.result || data?.taskId || data?.id;
            if (!id) throw new Error("Backend did not return a task id.");
            upsertTask({ id, type: "text", status: "CREATED", raw: { created: true, ...data }, meta: { mode: "refine", preview_task_id: lastPreviewId } });
            setActiveId(id);
        } catch (e) { setError(String(e?.message || e)); } finally { setBusy(false); }
    }

    async function submitImage(payload) {
        setBusy(true);
        setError("");
        try {
            const data = await meshy.createImageTo3D(apiKey, payload);
            const id = data?.result || data?.taskId || data?.id;
            if (!id) throw new Error("Backend did not return a task id.");
            upsertTask({ id, type: "image", status: "CREATED", raw: { created: true, ...data } });
            setActiveId(id);
        } catch (e) { setError(String(e?.message || e)); } finally { setBusy(false); }
    }

    const activeTask = useMemo(() => tasks.find((t) => t.id === activeId), [tasks, activeId]);
    const detectedModelUrl = useMemo(() => detectModelUrl(activeTask?.raw), [activeTask]);
    const modelUrls = useMemo(() => extractModelUrls(activeTask?.raw), [activeTask]);

    async function refreshActive() {
        if (!activeTask) return;
        setBusy(true);
        setError("");
        try {
            const raw = activeTask.type === "text"
                ? await meshy.getTextTask(apiKey, activeTask.id)
                : await meshy.getImageTask(apiKey, activeTask.id);

            if (!raw) throw new Error("Backend returned an empty response.");
            const status = raw?.status || raw?.result?.status || raw?.state || "UNKNOWN";
            upsertTask({ id: activeTask.id, status, raw });

            if (activeTask?.meta?.mode === "preview" && String(status).toUpperCase().includes("SUCC")) {
                setLastPreviewId(activeTask.id);
            }
        } catch (e) { setError(String(e?.message || e)); } finally { setBusy(false); }
    }

    async function downloadFile(url, keyHint) {
        if (!url) return;
        setBusy(true);
        setError("");
        try {
            const blob = await apiDownload(url);
            const extMap = { glb: "model.glb", fbx: "model.fbx", obj: "model.obj", usdz: "model.usdz", mtl: "model.mtl", pre_remeshed_glb: "pre_remeshed_model.glb" };
            const name = filenameFromUrl(url, extMap[keyHint] || "model.bin");
            await triggerBrowserDownload(blob, name);
        } catch (e) {
            setError(`${e?.message}\nFalling back to direct download.`);
            triggerDirectDownload(url);
        } finally { setBusy(false); }
    }

    function downloadActivePreferred() {
        const url = modelUrls?.glb || detectedModelUrl;
        if (!url) return setError("No model URL available yet.");
        downloadFile(url, modelUrls?.glb ? "glb" : undefined);
    }

    useEffect(() => {
        if (!pollOn || !activeTask) return;
        const status = (activeTask.status || "").toUpperCase();
        if (status.includes("SUCC") || status.includes("FAIL")) return;
        const timer = setInterval(() => { refreshActive(); }, 2500);
        return () => clearInterval(timer);
    }, [pollOn, activeId, activeTask]);

    return (
        <div className="layout-grid">
            <Sidebar
                mode={mode}
                setMode={setMode}
                pollOn={pollOn}
                setPollOn={setPollOn}
                lastPreviewId={lastPreviewId}
                error={error}
                logout={logout}
                busy={busy}
            />

            <section className="scroll-area">
                <Header
                    activeId={activeId}
                    activeTask={activeTask}
                    refreshActive={refreshActive}
                    busy={busy}
                />

                <main style={{ padding: '0 24px 24px 24px', display: 'grid', gap: '24px', gridTemplateColumns: 'minmax(0, 1fr)' }}>
                    {/* Input Panel */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        {mode === "text" ? (
                            <TextPanel onPreview={submitTextPreview} onRefine={submitTextRefine} busy={busy} hasPreview={!!lastPreviewId} />
                        ) : (
                            <ImagePanel onSubmit={submitImage} busy={busy} />
                        )}
                    </div>

                    {/* Tasks List */}
                    <div className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <p className="title" style={{ fontSize: '1.2rem' }}>History</p>
                        </div>
                        <TasksPanel
                            tasks={tasks}
                            activeId={activeId}
                            activeTask={activeTask}
                            onSelect={setActiveId}
                            onRefreshActive={refreshActive}
                            onDownloadActive={downloadActivePreferred}
                            onClearAll={() => { setTasks([]); setActiveId(""); setError(""); setLastPreviewId(""); }}
                            busy={busy}
                        />
                    </div>

                    {/* Downloads */}
                    <Downloads
                        modelUrls={modelUrls}
                        detectedModelUrl={detectedModelUrl}
                        downloadFile={downloadFile}
                        downloadActivePreferred={downloadActivePreferred}
                        busy={busy}
                    />
                </main>
            </section>
        </div>
    );
}
