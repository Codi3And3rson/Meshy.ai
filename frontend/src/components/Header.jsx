import React from "react";
import Tip from "./Tooltip";
import { RefreshCw } from "lucide-react";

export default function Header({ activeId, activeTask, refreshActive, busy }) {
    return (
        <header className="glass-panel topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
            <div>
                <div className="title" style={{ fontSize: '1.5rem', fontWeight: 800 }}>Dashboard</div>
                <div className="subtitle" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span>Active Task:</span>
                    {activeId ? (
                        <>
                            <span className="mono" style={{ color: 'var(--text-primary)' }}>{activeId}</span>
                            {activeTask?.status && (
                                <span className={`badge ${activeTask.status === 'SUCCEEDED' ? 'badge-success' :
                                        activeTask.status === 'FAILED' ? 'badge-danger' : 'badge-warn'
                                    }`}>
                                    {activeTask.status}
                                </span>
                            )}
                        </>
                    ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>No active selection</span>
                    )}
                </div>
            </div>

            <div>
                <Tip content="Refresh the selected task now.">
                    <button
                        className="btn-primary"
                        onClick={refreshActive}
                        disabled={busy || !activeId}
                        style={{ width: 'auto' }}
                    >
                        <RefreshCw size={18} className={busy ? "spin" : ""} style={{ animation: busy ? 'spin 1s linear infinite' : 'none' }} />
                        Refresh
                    </button>
                </Tip>
            </div>
            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
        </header>
    );
}
