import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import TextPanel from "../components/TextPanel";
import ImagePanel from "../components/ImagePanel";
import TasksPanel from "../components/TasksPanel";

// New Components
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Downloads from "../components/Downloads";

// Hooks
import { useMeshyTasks } from "../hooks/useMeshyTasks";
import { useDownloader } from "../hooks/useDownloader";

// Utils
import { detectModelUrl, extractModelUrls } from "../utils/modelUtils";

export default function Dashboard() {
    const { apiKey, logout } = useAuth();

    const [mode, setMode] = useState("text"); // "text" | "image"

    const {
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
    } = useMeshyTasks(apiKey);

    const { downloadFile, downloadActivePreferred } = useDownloader(setBusy, setError);

    const detectedModelUrl = useMemo(() => detectModelUrl(activeTask?.raw), [activeTask]);
    const modelUrls = useMemo(() => extractModelUrls(activeTask?.raw), [activeTask]);

    const handleDownloadActivePreferred = () => downloadActivePreferred(modelUrls, detectedModelUrl);

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
                            onSelect={setActiveId}
                            onRefreshActive={refreshActive}
                            onDownloadActive={handleDownloadActivePreferred}
                            onClearAll={clearAll}
                            busy={busy}
                        />
                    </div>

                    {/* Downloads */}
                    <Downloads
                        modelUrls={modelUrls}
                        detectedModelUrl={detectedModelUrl}
                        downloadFile={downloadFile}
                        downloadActivePreferred={handleDownloadActivePreferred}
                        busy={busy}
                    />
                </main>
            </section>
        </div>
    );
}
