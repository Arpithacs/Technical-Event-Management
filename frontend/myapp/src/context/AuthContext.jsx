import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, fullname, email, ... }
  const [role, setRole] = useState(null);        // "participant" | "organizer"
  const [loading, setLoading] = useState(true);  // true until first session check completes

  // On mount, check server session for both roles
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        // Check participant session
        const pRes = await fetch("http://localhost:5000/api/participant/me", {
          credentials: "include",
        });
        if (!cancelled && pRes.ok) {
          const pData = await pRes.json();
          if (pData.loggedIn) {
            setUser(pData.user);
            setRole("participant");
            setLoading(false);
            return;
          }
        }
      } catch (_) { /* ignore */ }

      try {
        // Check organizer session
        const oRes = await fetch("http://localhost:5000/api/organizer/me", {
          credentials: "include",
        });
        if (!cancelled && oRes.ok) {
          const oData = await oRes.json();
          if (oData.loggedIn) {
            setUser(oData.organizer);
            setRole("organizer");
            setLoading(false);
            return;
          }
        }
      } catch (_) { /* ignore */ }

      if (!cancelled) {
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    };

    checkSession();
    return () => { cancelled = true; };
  }, []);

  const login = (userData, userRole) => {
    setUser(userData);
    setRole(userRole);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("role", userRole);
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (_) { /* ignore */ }
    setUser(null);
    setRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
