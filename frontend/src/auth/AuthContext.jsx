import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AuthCtx = createContext(null);
const LS_KEY = "meshy_user_key_v1";

export function AuthProvider({ children }) {
  const [apiKey, setApiKeyState] = useState(() => localStorage.getItem(LS_KEY) || "");

  const setApiKey = useCallback((key) => {
    const k = (key || "").trim();
    setApiKeyState(k);
    if (k) localStorage.setItem(LS_KEY, k);
    else localStorage.removeItem(LS_KEY);
  }, []);

  const logout = useCallback(() => {
    setApiKey("");
  }, [setApiKey]);

  const value = useMemo(
    () => ({ apiKey, setApiKey, logout, isAuthed: !!apiKey }),
    [apiKey, setApiKey, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}
