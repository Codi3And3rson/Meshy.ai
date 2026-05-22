import Tip from "./Tooltip";
import { Trash2, Box, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

function statusBadge(status) {
    const s = (status || "").toUpperCase();
    if (s.includes("SUCC")) return <span className="badge badge-success">SUCCEEDED</span>;
    if (s.includes("FAIL")) return <span className="badge badge-danger">FAILED</span>;
    if (s.includes("RUN") || s.includes("PROC")) return <span className="badge badge-warn">RUNNING</span>;
    return <span className="badge badge-def">{status || "UNKNOWN"}</span>;
}

export default function TasksPanel({
    tasks,
    activeId,
    onSelect,
    onRefreshActive,
    onDownloadActive,
    onClearAll,
    busy,
}) {
    const active = tasks.find((t) => t.id === activeId);

    const canDownload =
        active &&
        active.status &&
        active.status.toLowerCase().includes("succ") &&
        (active.modelUrl || active.downloadUrl);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                    <p className="title">Request History</p>
                    <p className="subtitle">Previous generations in this session</p>
                </div>

                <Tip content="Clear the local task list (does not cancel remote tasks).">
                    <button className="btn-danger" onClick={onClearAll} disabled={busy || tasks.length === 0} style={{ padding: '8px 12px' }}>
                        <Trash2 size={16} />
                    </button>
                </Tip>
            </div>

            {tasks.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)', background: 'rgba(0,0,0,0.1)', borderRadius: 12 }}>
                    <Box size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div style={{ fontSize: '0.9rem' }}>No active tasks</div>
                </div>
            ) : (
                <div className="scroll-area" style={{ maxHeight: 300, display: "grid", gap: 8, paddingRight: 4 }}>
                    {tasks.slice().reverse().map((t) => (
                        <motion.button
                            key={t.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => onSelect(t.id)}
                            className="glass-panel"
                            style={{
                                textAlign: "left",
                                padding: "12px",
                                border: t.id === activeId ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
                                background: t.id === activeId ? "rgba(99, 102, 241, 0.1)" : "rgba(255,255,255,0.02)",
                                display: 'block',
                                width: '100%',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: 'center' }}>
                                <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ padding: 8, borderRadius: 8, background: 'rgba(255,255,255,0.05)' }}>
                                        {t.type === "text" ? <Box size={16} /> : <ImageIcon size={16} />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {t.type === "text" ? "Text to 3D" : "Image to 3D"}
                                        </div>
                                        <div className="mono" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: 2 }}>
                                            {t.id.slice(0, 18)}...
                                        </div>
                                    </div>
                                </div>
                                <div>{statusBadge(t.status)}</div>
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    );
}
