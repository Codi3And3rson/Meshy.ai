import React from "react";
import { LogOut, Moon, TimerReset, Sparkles, Image as ImageIcon, Type, Box } from "lucide-react";
import Tip from "./Tooltip";
import { motion } from "framer-motion";

export default function Sidebar({ mode, setMode, pollOn, setPollOn, lastPreviewId, error, logout, busy }) {
  return (
    <aside className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '20px', gap: '16px', height: '100%' }}>
      
      {/* Brand */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Box className="text-primary" size={24} color="#6366f1" />
          <p className="title" style={{ fontSize: '1.25rem' }}>Meshy Studio</p>
        </div>
        <p className="subtitle" style={{ marginTop: '4px' }}>AI 3D Generation</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
        
        {/* Mode Switcher */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)' }}>
          <div className="subtitle" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create</div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <Tip content="Generate a model from text prompt.">
              <button 
                className={mode === "text" ? "btn-primary" : "btn-secondary"} 
                onClick={() => setMode("text")}
                style={{ flex: 1 }}
              >
                <Type size={16} /> Text
              </button>
            </Tip>
            <Tip content="Generate a model from an image.">
              <button 
                className={mode === "image" ? "btn-primary" : "btn-secondary"} 
                onClick={() => setMode("image")}
                style={{ flex: 1 }}
              >
                <ImageIcon size={16} /> Image
              </button>
            </Tip>
          </div>
        </div>

        {/* Status / Tools */}
        <div style={{ display: 'grid', gap: '12px' }}>
          <Tip content="Auto-refresh status while a task is running.">
            <button
              onClick={() => setPollOn((v) => !v)}
              className={pollOn ? "btn-secondary" : "btn-secondary"}
              style={{ 
                justifyContent: 'space-between', 
                borderColor: pollOn ? 'var(--success)' : 'transparent',
                color: pollOn ? 'var(--success)' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TimerReset size={16} /> Auto-Poll
              </div>
              <span className={pollOn ? "badge badge-success" : "badge badge-def"}>
                {pollOn ? "ON" : "OFF"}
              </span>
            </button>
          </Tip>

          {mode === "text" && (
            <div className="glass-panel" style={{ padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
              <div className="subtitle" style={{ fontSize: '0.75rem' }}>Active Preview ID</div>
              <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lastPreviewId || "—"}
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{ 
              padding: '12px', 
              borderColor: 'var(--danger)', 
              background: 'rgba(239, 68, 68, 0.05)'
            }}
          >
             <div style={{ fontWeight: 600, color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '4px' }}>Error</div>
             <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{error}</div>
          </motion.div>
        )}
      </div>

      {/* Footer Actions */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
        <button className="btn-secondary" style={{ flex: 1 }} disabled>
          <Moon size={16} /> Theme
        </button>
        <button className="btn-danger" onClick={logout} style={{ flex: 1 }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

    </aside>
  );
}
