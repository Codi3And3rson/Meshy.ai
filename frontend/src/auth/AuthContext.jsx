import { createContext, useContext, useMemo, useState } from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [apiKey, setApiKeyState] = useState("");

  function setApiKey(key) {
    const k = (key || "").trim();
    setApiKeyState(k);
  }

  function logout() {
    setApiKey("");
  }

  const value = useMemo(() => ({ apiKey, setApiKey, logout, isAuthed: !!apiKey }), [apiKey]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
