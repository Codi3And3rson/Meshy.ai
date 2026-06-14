import { useState, useMemo, useEffect } from "react";
import { meshy } from "../api/meshy";

export function useMeshyTasks(apiKey) {
    const [tasks, setTasks] = useState([]);
    const [activeId, setActiveId] = useState("");
    const [lastPreviewId, setLastPreviewId] = useState("");
    const [pollOn, setPollOn] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

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

    function clearAll() {
        setTasks([]);
        setActiveId("");
        setError("");
        setLastPreviewId("");
    }

    useEffect(() => {
        if (!pollOn || !activeTask) return;
        const status = (activeTask.status || "").toUpperCase();
        if (status.includes("SUCC") || status.includes("FAIL")) return;
        const timer = setInterval(() => { refreshActive(); }, 2500);
        return () => clearInterval(timer);
    }, [pollOn, activeId, activeTask]);

    return {
        tasks,
        activeId,
        setActiveId,
        activeTask,
        lastPreviewId,
        pollOn,
        setPollOn,
        busy,
        setBusy,
        error,
        setError,
        submitTextPreview,
        submitTextRefine,
        submitImage,
        refreshActive,
        clearAll,
    };
}
