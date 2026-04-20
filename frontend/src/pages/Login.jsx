import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Tip from "../components/Tooltip";
import { KeyRound, ShieldCheck, ArrowRight, Box } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { apiKey, setApiKey } = useAuth();
  const [key, setKey] = useState(apiKey || "");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  function submit() {
    const k = key.trim();
    if (k.length < 10) {
      setErr("Invalid API key format");
      return;
    }
    setApiKey(k);
    nav("/");
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-panel"
        style={{ width: "100%", maxWidth: 440, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ margin: "0 auto 16px auto", width: 48, height: 48, borderRadius: 12, background: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <Box size={24} color="#6366f1" />
          </div>
          <h1 className="title" style={{ fontSize: "1.5rem" }}>Welcome Back</h1>
          <p className="subtitle" style={{ marginTop: 8 }}>Enter your API credentials to continue</p>
          <p style={{ marginTop: 4, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Don't have an API key? <a href="https://www.meshy.ai?via=Codie" target="_blank" rel="noopener noreferrer" style={{ color: "#6366f1", textDecoration: "underline" }}>Get one here</a>.
          </p>
        </div>

        <div>
          <label className="subtitle" style={{ fontSize: "0.85rem", display: "block", marginBottom: 8 }}>API Key</label>
          <Tip content="Your raw Meshy API key">
            <input
              autoFocus
              value={key}
              onChange={(e) => { setKey(e.target.value); setErr(""); }}
              placeholder="msy_..."
              type="password"
              style={{ fontSize: "1rem", letterSpacing: "0.1em", fontFamily: "monospace" }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </Tip>
        </div>

        {err && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            style={{
              padding: 12,
              borderRadius: 8,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--danger)",
              fontSize: "0.85rem",
              textAlign: "center"
            }}
          >
            {err}
          </motion.div>
        )}

        <button className="btn-primary" onClick={submit} style={{ width: "100%", padding: 12, fontSize: "1rem" }}>
          Continue <ArrowRight size={18} />
        </button>

        <div style={{ textAlign: "center", borderTop: "1px solid var(--glass-border)", paddingTop: 20 }}>
          <div className="badge badge-success" style={{ gap: 6 }}>
            <ShieldCheck size={12} /> Secure Storage
          </div>
          <p className="mono" style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: 12 }}>
            Keys are stored locally and never sent to our servers.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
