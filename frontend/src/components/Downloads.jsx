import React from "react";
import Tip from "./Tooltip";
import { Download, FileBox } from "lucide-react";
import { motion } from "framer-motion";

export default function Downloads({ modelUrls, detectedModelUrl, downloadFile, downloadActivePreferred, busy }) {
    const hasDownloads = Object.keys(modelUrls).length > 0;

    return (
        <section aria-labelledby="downloads-title" className="glass-panel" style={{ padding: '24px' }}>
            <header style={{ marginBottom: '16px' }}>
                <h3 id="downloads-title" className="title" style={{ fontSize: '1.2rem' }}>Downloads</h3>
                <p className="subtitle">
                    Available formats for this task.
                </p>
            </header>

            <div className="glass-panel" style={{ padding: '12px', background: 'rgba(0,0,0,0.3)', marginBottom: '16px' }}>
                <div className="subtitle" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Detected Source URL</div>
                <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent)', overflowWrap: 'anywhere' }} aria-live="polite">
                    {detectedModelUrl || "Waiting for task completion..."}
                </div>
            </div>

            {!hasDownloads ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-md)' }}>
                    <FileBox aria-hidden="true" size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                    <div style={{ fontWeight: 500 }}>No formats ready yet.</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Wait for SUCCESS status and refresh the task.</div>
                </div>
            ) : (
                <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', padding: 0, margin: 0, listStyle: 'none' }} aria-label="Available download formats">
                    {Object.entries(modelUrls).map(([k, url]) => (
                        <li key={k}>
                            <Tip content={`Download ${k.toUpperCase()} file`}>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => downloadFile(url, k)}
                                    disabled={busy || !url}
                                    className={k === "glb" ? "btn-primary" : "btn-secondary"}
                                    aria-busy={busy}
                                >
                                    <Download aria-hidden="true" size={16} /> {k.toUpperCase()}
                                </motion.button>
                            </Tip>
                        </li>
                    ))}

                    <li style={{ marginLeft: 'auto' }}>
                        <Tip content="Download the preferred file (GLB when available).">
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={downloadActivePreferred}
                                disabled={busy || !(modelUrls?.glb || detectedModelUrl)}
                                aria-busy={busy}
                            >
                                Auto-Download
                            </button>
                        </Tip>
                    </li>
                </ul>
            )}
        </section>
    );
}
