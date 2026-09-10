import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  api,
  getAuthToken,
  setAuthToken,
  setUnauthorizedHandler,
} from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // "loading" until the initial /auth/me settles, then "ready".
  const [status, setStatus] = useState(getAuthToken() ? "loading" : "ready");

  const clearSession = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setStatus("ready");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("ready");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    if (!getAuthToken()) return;
    let cancelled = false;
    api
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        /* 401 already cleared the token in the client */
      })
      .finally(() => {
        if (!cancelled) setStatus("ready");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.register(payload);
    setAuthToken(res.token);
    setUser(res.user);
    setStatus("ready");
    return res.user;
  }, []);

  const login = useCallback(async (payload) => {
    const res = await api.login(payload);
    setAuthToken(res.token);
    setUser(res.user);
    setStatus("ready");
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const refreshMe = useCallback(async () => {
    const me = await api.me();
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading: status === "loading",
      register,
      login,
      logout,
      refreshMe,
    }),
    [user, status, register, login, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
