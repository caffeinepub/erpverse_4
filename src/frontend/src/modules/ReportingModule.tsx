import {
  BarChart3,
  Briefcase,
  Factory,
  GitBranch,
  Handshake,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface ModuleStat {
  key: string;
  labelKey: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  barColor: string;
}

export default function ReportingModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";

  const readLS = (key: string): unknown[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
    } catch {
      return [];
    }
  };

  const employees = readLS(`erpverse_hr_${cid}`) as Array<{ status?: string }>;
  const transactions = readLS(`erpverse_accounting_${cid}`);
  const customers = readLS(`erpverse_crm_${cid}`);
  const products = readLS(`erpverse_inventory_${cid}`);
  const projects = readLS(`erpverse_projects_${cid}`);
  const purchaseOrders = readLS(`erpverse_purchasing_orders_${cid}`) as Array<{
    status?: string;
  }>;
  const productionOrders = readLS(`erpverse_production_${cid}`);
  const workflowTasks = readLS(`erpverse_workflow_${cid}`);

  const activeEmployees = employees.filter((e) => e.status === "active").length;
  const openOrders = purchaseOrders.filter(
    (o) => o.status !== "delivered" && o.status !== "completed",
  ).length;

  const modules: ModuleStat[] = [
    {
      key: "hr",
      labelKey: "modules.HR",
      count: employees.length,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-400",
      barColor: "bg-blue-500",
    },
    {
      key: "accounting",
      labelKey: "modules.Accounting",
      count: transactions.length,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-emerald-400",
      barColor: "bg-emerald-500",
    },
    {
      key: "crm",
      labelKey: "modules.CRM",
      count: customers.length,
      icon: <Handshake className="w-5 h-5" />,
      color: "text-orange-400",
      barColor: "bg-orange-500",
    },
    {
      key: "inventory",
      labelKey: "modules.Inventory",
      count: products.length,
      icon: <Package className="w-5 h-5" />,
      color: "text-amber-400",
      barColor: "bg-amber-500",
    },
    {
      key: "projects",
      labelKey: "modules.Projects",
      count: projects.length,
      icon: <Briefcase className="w-5 h-5" />,
      color: "text-purple-400",
      barColor: "bg-purple-500",
    },
    {
      key: "purchasing",
      labelKey: "modules.Purchasing",
      count: purchaseOrders.length,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "text-red-400",
      barColor: "bg-red-500",
    },
    {
      key: "production",
      labelKey: "modules.Production",
      count: productionOrders.length,
      icon: <Factory className="w-5 h-5" />,
      color: "text-slate-400",
      barColor: "bg-slate-400",
    },
    {
      key: "workflow",
      labelKey: "modules.Workflow",
      count: workflowTasks.length,
      icon: <GitBranch className="w-5 h-5" />,
      color: "text-teal-400",
      barColor: "bg-teal-500",
    },
  ];

  const totalRecords = modules.reduce((sum, m) => sum + m.count, 0);
  const maxCount = Math.max(...modules.map((m) => m.count), 1);

  const kpiCards = [
    {
      label: t("reporting.totalEmployees"),
      value: employees.length,
      sub: `${activeEmployees} ${t("reporting.active")}`,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: t("reporting.totalTransactions"),
      value: transactions.length,
      sub: t("modules.Accounting"),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: t("reporting.totalCustomers"),
      value: customers.length,
      sub: t("modules.CRM"),
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: t("reporting.totalProducts"),
      value: products.length,
      sub: t("modules.Inventory"),
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: t("reporting.totalProjects"),
      value: projects.length,
      sub: t("modules.Projects"),
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: t("reporting.openOrders"),
      value: openOrders,
      sub: t("modules.Purchasing"),
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: t("reporting.productionOrders"),
      value: productionOrders.length,
      sub: t("modules.Production"),
      color: "text-slate-400",
      bg: "bg-slate-500/10",
    },
    {
      label: t("reporting.workflowTasks"),
      value: workflowTasks.length,
      sub: t("modules.Workflow"),
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("reporting.title")}
          </h2>
          <p className="text-slate-400 text-sm">
            {t("reporting.totalRecords")}: {totalRecords}
          </p>
        </div>
      </div>

      {totalRecords === 0 ? (
        <div
          data-ocid="reporting.empty_state"
          className="bg-slate-800 rounded-xl p-12 border border-white/5 text-center"
        >
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">{t("reporting.noData")}</p>
          <p className="text-slate-600 text-sm mt-2">
            {t("reporting.noDataSub")}
          </p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpiCards.map((card) => (
              <div
                key={card.label}
                className={`${card.bg} rounded-xl p-5 border border-white/5`}
              >
                <p className="text-slate-400 text-xs mb-2">{card.label}</p>
                <p className={`text-3xl font-bold ${card.color}`}>
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Module Bar Chart */}
          <div className="bg-slate-800 rounded-xl p-6 border border-white/5">
            <h3 className="text-white font-semibold mb-5">
              {t("reporting.dataSummary")}
            </h3>
            <div className="space-y-4">
              {modules.map((mod) => (
                <div key={mod.key} className="flex items-center gap-4">
                  <div
                    className={`flex items-center gap-2 w-36 flex-shrink-0 ${mod.color}`}
                  >
                    {mod.icon}
                    <span className="text-sm text-slate-300">
                      {t(mod.labelKey)}
                    </span>
                  </div>
                  <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${mod.barColor} rounded-full transition-all`}
                      style={{
                        width: `${(mod.count / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-slate-400 text-sm w-8 text-right font-mono">
                    {mod.count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
