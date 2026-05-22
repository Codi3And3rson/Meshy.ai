import Tip from "./Tooltip";
import { Download, FileBox } from "lucide-react";
import { motion } from "framer-motion";

export default function Downloads({ modelUrls, detectedModelUrl, downloadFile, downloadActivePreferred, busy }) {
    const hasDownloads = Object.keys(modelUrls).length > 0;

    return (
        <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
                <p className="title" style={{ fontSize: '1.2rem' }}>Downloads</p>
                <p className="subtitle">
                    Available formats for this task.
                </p>
            </div>

            <div className="glass-panel" style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', marginBottom: '16px' }}>
                <div className="subtitle" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Detected Source URL</div>
                <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent)', overflowWrap: 'anywhere' }}>
                    {detectedModelUrl || "Waiting for task completion..."}
                </div>
            </div>

            {!hasDownloads ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                    <FileBox size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div>No formats ready yet.</div>
                    <div style={{ fontSize: '0.8rem' }}>Wait for SUCCESS status and refresh.</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {Object.entries(modelUrls).map(([k, url]) => (
                        <Tip key={k} content={`Download ${k.toUpperCase()} file`}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => downloadFile(url, k)}
                                disabled={busy || !url}
                                className={k === "glb" ? "btn-primary" : "btn-secondary"}
                            >
                                <Download size={16} /> {k.toUpperCase()}
                            </motion.button>
                        </Tip>
                    ))}

                    <Tip content="Download the preferred file (GLB when available).">
                        <button
                            className="btn-primary"
                            onClick={downloadActivePreferred}
                            disabled={busy || !(modelUrls?.glb || detectedModelUrl)}
                            style={{ marginLeft: 'auto' }}
                        >
                            Auto-Download
                        </button>
                    </Tip>
                </div>
            )}
        </div>
    );
}
