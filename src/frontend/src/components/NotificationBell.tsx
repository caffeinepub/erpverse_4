import { Bell, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString();
  } catch {
    return "";
  }
}

const TYPE_COLORS: Record<string, string> = {
  approval_required: "text-amber-400",
  leave_request: "text-blue-400",
  stock_alert: "text-red-400",
  info: "text-slate-400",
};

export default function NotificationBell() {
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
        data-ocid="notifications.bell_button"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-10 z-50 w-80 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            data-ocid="notifications.dropdown_menu"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <span className="text-white font-semibold text-sm">
                {t("notifications.title")}
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  data-ocid="notifications.confirm_button"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {t("notifications.markAllRead")}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div
                  className="py-10 text-center text-slate-500 text-sm"
                  data-ocid="notifications.empty_state"
                >
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  {t("notifications.empty")}
                </div>
              ) : (
                notifications.map((n, i) => (
                  <button
                    type="button"
                    key={n.id}
                    onClick={() => {
                      markAsRead(n.id);
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      n.read ? "opacity-60" : ""
                    }`}
                    data-ocid={`notifications.item.${i + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                          )}
                          <p
                            className={`text-xs font-semibold ${TYPE_COLORS[n.type] ?? "text-slate-400"}`}
                          >
                            {t(`notifications.${n.type}`)}
                          </p>
                        </div>
                        <p className="text-white text-sm font-medium truncate">
                          {n.title}
                        </p>
                        <p className="text-slate-400 text-xs truncate">
                          {n.message}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 flex-shrink-0 mt-0.5">
                        {formatTime(n.createdAt)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
