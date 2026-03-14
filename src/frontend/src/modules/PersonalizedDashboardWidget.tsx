import {
  AlertTriangle,
  CheckSquare,
  Clock,
  FileText,
  History,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface Props {
  companyId: string;
  userName: string;
  onNavigate?: (module: string) => void;
}

const RECENT_KEY = (cid: string) => `erpverse_recent_modules_${cid}`;

export function trackModuleAccess(companyId: string, moduleKey: string) {
  try {
    const key = RECENT_KEY(companyId);
    const existing: string[] = JSON.parse(localStorage.getItem(key) || "[]");
    const updated = [
      moduleKey,
      ...existing.filter((m) => m !== moduleKey),
    ].slice(0, 5);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

const MODULE_LABELS: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  hr: { label: "İK", color: "text-blue-400", bg: "bg-blue-500/20" },
  accounting: {
    label: "Muhasebe",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
  crm: { label: "CRM", color: "text-orange-400", bg: "bg-orange-500/20" },
  inventory: {
    label: "Envanter",
    color: "text-amber-400",
    bg: "bg-amber-500/20",
  },
  projects: {
    label: "Projeler",
    color: "text-violet-400",
    bg: "bg-violet-500/20",
  },
  purchasing: {
    label: "Satın Alma",
    color: "text-rose-400",
    bg: "bg-rose-500/20",
  },
  production: { label: "Üretim", color: "text-cyan-400", bg: "bg-cyan-500/20" },
  sales: { label: "Satış", color: "text-green-400", bg: "bg-green-500/20" },
  tasks: {
    label: "Görevler",
    color: "text-violet-400",
    bg: "bg-violet-500/20",
  },
  budget: { label: "Bütçe", color: "text-pink-400", bg: "bg-pink-500/20" },
  contracts: {
    label: "Sözleşmeler",
    color: "text-teal-400",
    bg: "bg-teal-500/20",
  },
  maintenance: {
    label: "Bakım",
    color: "text-orange-400",
    bg: "bg-orange-500/20",
  },
  quality: {
    label: "Kalite",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
  },
  warehouse: { label: "Depo", color: "text-sky-400", bg: "bg-sky-500/20" },
  payroll: {
    label: "Bordro",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
  },
  bi: { label: "İş Zekası", color: "text-indigo-400", bg: "bg-indigo-500/20" },
  risk: { label: "Risk", color: "text-red-400", bg: "bg-red-500/20" },
  documents: {
    label: "Dokümanlar",
    color: "text-slate-400",
    bg: "bg-slate-500/20",
  },
  calendar: { label: "Takvim", color: "text-sky-400", bg: "bg-sky-500/20" },
  training: {
    label: "Eğitim",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
  },
  reporting: {
    label: "Raporlama",
    color: "text-purple-400",
    bg: "bg-purple-500/20",
  },
  trade: {
    label: "İhracat/İthalat",
    color: "text-indigo-400",
    bg: "bg-indigo-500/20",
  },
  supplychain: {
    label: "Tedarik Zinciri",
    color: "text-teal-400",
    bg: "bg-teal-500/20",
  },
  customerservice: {
    label: "Müşteri Hizmetleri",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
  assets: {
    label: "Varlık Yönetimi",
    color: "text-slate-300",
    bg: "bg-slate-500/20",
  },
  workflow: { label: "İş Akışı", color: "text-rose-400", bg: "bg-rose-500/20" },
  productcatalog: {
    label: "Ürün Kataloğu",
    color: "text-pink-400",
    bg: "bg-pink-500/20",
  },
  companyprofile: {
    label: "Şirket Profili",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
};

export default function PersonalizedDashboardWidget({
  companyId,
  userName,
  onNavigate,
}: Props) {
  const { t } = useLanguage();
  const [recentModules, setRecentModules] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY(companyId));
      if (stored) setRecentModules(JSON.parse(stored));
    } catch {}
  }, [companyId]);

  const kpis = useMemo(() => {
    const today = new Date();
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);

    // Overdue tasks
    let overdueTasks = 0;
    try {
      const tasks = JSON.parse(
        localStorage.getItem(`erpverse_tasks_${companyId}`) || "[]",
      );
      overdueTasks = tasks.filter(
        (t: { status: string; dueDate: string }) =>
          t.status !== "Tamamlandı" &&
          t.status !== "completed" &&
          t.dueDate &&
          new Date(t.dueDate) < today,
      ).length;
    } catch {}

    // Expiring contracts (within 30 days)
    let expiringContracts = 0;
    try {
      const contracts = JSON.parse(
        localStorage.getItem(`contracts_${companyId}`) || "[]",
      );
      expiringContracts = contracts.filter(
        (c: { endDate: string; status: string }) =>
          c.status === "Aktif" &&
          c.endDate &&
          new Date(c.endDate) <= in30 &&
          new Date(c.endDate) >= today,
      ).length;
    } catch {}

    // Overdue invoices
    let overdueInvoices = 0;
    try {
      const invoices = JSON.parse(
        localStorage.getItem(`erp_invoices_${companyId}`) || "[]",
      );
      overdueInvoices = invoices.filter(
        (i: { status: string }) =>
          i.status === "Gecikmiş" || i.status === "overdue",
      ).length;
    } catch {}

    // Pending workflow approvals
    let pendingApprovals = 0;
    try {
      const workflows = JSON.parse(
        localStorage.getItem(`erpverse_workflow_${companyId}`) || "[]",
      );
      pendingApprovals = workflows.filter(
        (w: { status: string }) =>
          w.status === "Bekliyor" || w.status === "pending",
      ).length;
    } catch {}

    return {
      overdueTasks,
      expiringContracts,
      overdueInvoices,
      pendingApprovals,
    };
  }, [companyId]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greeting.morning");
    if (hour < 18) return t("greeting.afternoon");
    return t("greeting.evening");
  };

  return (
    <div className="space-y-6" data-ocid="personalized_dashboard.panel">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          {greeting()}, {userName}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t("dashboard.personalizedSubtitle")}
        </p>
      </div>

      {/* KPI Alert Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          className={`rounded-xl p-4 border ${
            kpis.overdueTasks > 0
              ? "bg-red-500/10 border-red-500/30"
              : "bg-slate-800 border-white/5"
          }`}
          data-ocid="personalized_dashboard.overdue_tasks.card"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare
              className={`w-4 h-4 ${kpis.overdueTasks > 0 ? "text-red-400" : "text-slate-400"}`}
            />
            <span className="text-xs text-slate-400">
              {t("dashboard.overdueTasks")}
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${kpis.overdueTasks > 0 ? "text-red-400" : "text-white"}`}
          >
            {kpis.overdueTasks}
          </p>
        </div>

        <div
          className={`rounded-xl p-4 border ${
            kpis.expiringContracts > 0
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-slate-800 border-white/5"
          }`}
          data-ocid="personalized_dashboard.expiring_contracts.card"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText
              className={`w-4 h-4 ${kpis.expiringContracts > 0 ? "text-amber-400" : "text-slate-400"}`}
            />
            <span className="text-xs text-slate-400">
              {t("dashboard.expiringContracts")}
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${kpis.expiringContracts > 0 ? "text-amber-400" : "text-white"}`}
          >
            {kpis.expiringContracts}
          </p>
        </div>

        <div
          className={`rounded-xl p-4 border ${
            kpis.overdueInvoices > 0
              ? "bg-orange-500/10 border-orange-500/30"
              : "bg-slate-800 border-white/5"
          }`}
          data-ocid="personalized_dashboard.overdue_invoices.card"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle
              className={`w-4 h-4 ${kpis.overdueInvoices > 0 ? "text-orange-400" : "text-slate-400"}`}
            />
            <span className="text-xs text-slate-400">
              {t("dashboard.overdueInvoices")}
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${kpis.overdueInvoices > 0 ? "text-orange-400" : "text-white"}`}
          >
            {kpis.overdueInvoices}
          </p>
        </div>

        <div
          className={`rounded-xl p-4 border ${
            kpis.pendingApprovals > 0
              ? "bg-violet-500/10 border-violet-500/30"
              : "bg-slate-800 border-white/5"
          }`}
          data-ocid="personalized_dashboard.pending_approvals.card"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock
              className={`w-4 h-4 ${kpis.pendingApprovals > 0 ? "text-violet-400" : "text-slate-400"}`}
            />
            <span className="text-xs text-slate-400">
              {t("dashboard.pendingApprovals")}
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${kpis.pendingApprovals > 0 ? "text-violet-400" : "text-white"}`}
          >
            {kpis.pendingApprovals}
          </p>
        </div>
      </div>

      {/* Recently Accessed Modules */}
      {recentModules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-slate-300 text-sm font-semibold">
              {t("dashboard.recentModules")}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentModules.map((mod) => {
              const cfg = MODULE_LABELS[mod] || {
                label: mod,
                color: "text-slate-300",
                bg: "bg-slate-700",
              };
              return (
                <button
                  key={mod}
                  type="button"
                  onClick={() => onNavigate?.(mod)}
                  className={`${cfg.bg} ${cfg.color} px-3 py-1.5 rounded-lg text-sm font-medium border border-white/5 hover:scale-105 transition-transform`}
                  data-ocid={`personalized_dashboard.recent.${mod}_button`}
                >
                  {t(
                    `modules.${mod.charAt(0).toUpperCase() + mod.slice(1)}`,
                  ).includes("modules.")
                    ? cfg.label
                    : t(
                        `modules.${mod.charAt(0).toUpperCase() + mod.slice(1)}`,
                      )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h3 className="text-slate-300 text-sm font-semibold">
            {t("dashboard.quickActions")}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {["tasks", "bi", "calendar", "reporting"].map((mod) => {
            const cfg = MODULE_LABELS[mod] || {
              label: mod,
              color: "text-slate-300",
              bg: "bg-slate-700",
            };
            return (
              <button
                key={mod}
                type="button"
                onClick={() => onNavigate?.(mod)}
                className={`${cfg.bg} ${cfg.color} px-3 py-1.5 rounded-lg text-sm font-medium border border-white/5 hover:scale-105 transition-transform`}
                data-ocid={`personalized_dashboard.quick.${mod}_button`}
              >
                {t(
                  `modules.${mod.charAt(0).toUpperCase() + mod.slice(1)}`,
                ).includes("modules.")
                  ? cfg.label
                  : t(`modules.${mod.charAt(0).toUpperCase() + mod.slice(1)}`)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
