import type React from "react";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAuth } from "./AuthContext";

export interface Notification {
  id: string;
  type: "approval_required" | "stock_alert" | "leave_request" | "info";
  title: string;
  message: string;
  companyId: string;
  createdAt: string;
  read: boolean;
  targetRole?: "owner" | "manager" | "all";
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({
  children,
}: { children: React.ReactNode }) {
  const { company } = useAuth();
  const companyId = company?.id || "default";

  const [notifications, setNotifications] = useLocalStorage<Notification[]>(
    `erpverse_notifications_${companyId}`,
    [],
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const addNotification = useCallback(
    (n: Omit<Notification, "id" | "createdAt" | "read">) => {
      const entry: Notification = {
        ...n,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [entry, ...prev].slice(0, 100));
    },
    [setNotifications],
  );

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
    [setNotifications],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [setNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be inside NotificationProvider");
  return ctx;
}
