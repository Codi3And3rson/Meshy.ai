import { createContext, useContext, useMemo, useState } from "react";
import { apiFetch } from "../api/client";

const AuthCtx = createContext(null);
const LS_AUTH_FLAG = "meshy_is_authed";

export function AuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(() => localStorage.getItem(LS_AUTH_FLAG) === "true");

  async function setApiKey(key) {
    const k = (key || "").trim();
    if (k) {
        await apiFetch("/api/auth/login", { method: "POST", body: { api_key: k } });
        localStorage.setItem(LS_AUTH_FLAG, "true");
        setIsAuthed(true);
    } else {
        await apiFetch("/api/auth/logout", { method: "POST" });
        localStorage.removeItem(LS_AUTH_FLAG);
        setIsAuthed(false);
    }
  }

  async function logout() {
    await setApiKey("");
  }

  // We set apiKey: undefined to fall back to cookies in apiFetch requests
  const value = useMemo(() => ({ apiKey: undefined, setApiKey, logout, isAuthed }), [isAuthed]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
