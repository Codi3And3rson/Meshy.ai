import { createContext, useContext, useMemo, useState } from "react";

const AuthCtx = createContext(null);
const LS_KEY = "meshy_user_key_v1";

export function AuthProvider({ children }) {
  const [apiKey, setApiKeyState] = useState(() => sessionStorage.getItem(LS_KEY) || "");

  function setApiKey(key) {
    const k = (key || "").trim();
    setApiKeyState(k);
    if (k) sessionStorage.setItem(LS_KEY, k);
    else sessionStorage.removeItem(LS_KEY);
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
