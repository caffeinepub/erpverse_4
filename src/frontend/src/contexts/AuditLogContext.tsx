import type React from "react";
import { createContext, useCallback, useContext } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "./AuthContext";

export interface AuditEntry {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  detail: string;
  timestamp: string;
}

interface AuditLogContextValue {
  logs: AuditEntry[];
  addLog: (
    entry: Omit<
      AuditEntry,
      "id" | "timestamp" | "companyId" | "userId" | "userName"
    >,
  ) => void;
}

const AuditLogContext = createContext<AuditLogContextValue | null>(null);

export function AuditLogProvider({ children }: { children: React.ReactNode }) {
  const { company, user } = useAuth();
  const companyId = company?.id || "default";

  const [logs, setLogs] = useLocalStorage<AuditEntry[]>(
    `erpverse_audit_log_${companyId}`,
    [],
  );

  const addLog = useCallback(
    (
      entry: Omit<
        AuditEntry,
        "id" | "timestamp" | "companyId" | "userId" | "userName"
      >,
    ) => {
      const newEntry: AuditEntry = {
        ...entry,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        companyId,
        userId: user?.id || "unknown",
        userName: user?.displayName || "Unknown",
        timestamp: new Date().toISOString(),
      };
      setLogs((prev) => [newEntry, ...prev].slice(0, 500));
    },
    [companyId, user, setLogs],
  );

  return (
    <AuditLogContext.Provider value={{ logs, addLog }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error("useAuditLog must be inside AuditLogProvider");
  return ctx;
}
