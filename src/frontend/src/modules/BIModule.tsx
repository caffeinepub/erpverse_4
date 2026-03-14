import {
  BarChart3,
  Briefcase,
  Clock,
  Package,
  Percent,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const MONTH_NAMES = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

export default function BIModule() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const companyId = company?.id ?? "";

  const data = useMemo(() => {
    const accounting = JSON.parse(
      localStorage.getItem(`erp_accounting_${companyId}`) ?? "[]",
    );
    const crm = JSON.parse(
      localStorage.getItem(`erp_crm_${companyId}`) ?? "[]",
    );
    const projects = JSON.parse(
      localStorage.getItem(`erp_projects_${companyId}`) ?? "[]",
    );
    const hr = JSON.parse(localStorage.getItem(`erp_hr_${companyId}`) ?? "[]");
    const inventory = JSON.parse(
      localStorage.getItem(`erp_inventory_${companyId}`) ?? "[]",
    );
    const purchasing = JSON.parse(
      localStorage.getItem(`erp_purchasing_${companyId}`) ?? "[]",
    );
    const sales = JSON.parse(
      localStorage.getItem(`erp_sales_${companyId}`) ?? "[]",
    );
    const maintenance = JSON.parse(
      localStorage.getItem(`erp_maintenance_${companyId}`) ?? "[]",
    );

    const incomeEntries = accounting.filter((e: any) => e.type === "income");
    const expenseEntries = accounting.filter((e: any) => e.type === "expense");
    const totalRevenue = incomeEntries.reduce(
      (s: number, e: any) => s + (Number(e.amount) || 0),
      0,
    );
    const totalExpense = expenseEntries.reduce(
      (s: number, e: any) => s + (Number(e.amount) || 0),
      0,
    );
    const netProfit = totalRevenue - totalExpense;
    const profitMargin =
      totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0.0";

    const activeCustomers = crm.filter(
      (c: any) => c.status === "active",
    ).length;
    const openProjects = projects.filter(
      (p: any) => p.status !== "completed",
    ).length;
    const inventoryItems = inventory.length;
    const pendingApprovals = purchasing.filter(
      (p: any) => p.status === "pending" || p.status === "awaiting_approval",
    ).length;
    const activeEmployees = hr.filter((e: any) => e.status === "active").length;

    // Last 6 months chart
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthLabel = MONTH_NAMES[d.getMonth()];
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const income = incomeEntries
        .filter((e: any) => (e.date ?? "").startsWith(monthKey))
        .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
      const expense = expenseEntries
        .filter((e: any) => (e.date ?? "").startsWith(monthKey))
        .reduce((s: number, e: any) => s + (Number(e.amount) || 0), 0);
      return { month: monthLabel, income, expense };
    });

    // Module usage
    const moduleUsage = [
      { name: "HR", count: hr.length },
      { name: "CRM", count: crm.length },
      { name: t("modules.Inventory"), count: inventory.length },
      { name: t("modules.Projects"), count: projects.length },
      { name: t("modules.Purchasing"), count: purchasing.length },
      { name: t("modules.SalesManagement"), count: sales.length },
      { name: t("modules.Maintenance"), count: maintenance.length },
      { name: t("modules.Accounting"), count: accounting.length },
    ].filter((m) => m.count > 0);

    // Top 3 customers
    const topCustomers = [...crm]
      .sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0))
      .slice(0, 3);

    // Top 3 projects by completion
    const topProjects = [...projects]
      .sort(
        (a: any, b: any) =>
          (b.completion ?? b.progress ?? 0) - (a.completion ?? a.progress ?? 0),
      )
      .slice(0, 3);

    return {
      totalRevenue,
      totalExpense,
      netProfit,
      profitMargin,
      activeCustomers,
      openProjects,
      inventoryItems,
      pendingApprovals,
      activeEmployees,
      monthlyData,
      moduleUsage,
      topCustomers,
      topProjects,
    };
  }, [companyId, t]);

  const kpiCards = [
    {
      label: t("bi.totalRevenue"),
      value: `₺${data.totalRevenue.toLocaleString()}`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: t("bi.totalExpense"),
      value: `₺${data.totalExpense.toLocaleString()}`,
      icon: <TrendingDown className="w-5 h-5" />,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: t("bi.netProfit"),
      value: `₺${data.netProfit.toLocaleString()}`,
      icon: <BarChart3 className="w-5 h-5" />,
      color: data.netProfit >= 0 ? "text-indigo-400" : "text-red-400",
      bg: data.netProfit >= 0 ? "bg-indigo-500/10" : "bg-red-500/10",
    },
    {
      label: t("bi.profitMargin"),
      value: `${data.profitMargin}%`,
      icon: <Percent className="w-5 h-5" />,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: t("bi.activeCustomers"),
      value: data.activeCustomers,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: t("bi.openProjects"),
      value: data.openProjects,
      icon: <Briefcase className="w-5 h-5" />,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: t("bi.inventoryItems"),
      value: data.inventoryItems,
      icon: <Package className="w-5 h-5" />,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: t("bi.pendingApprovals"),
      value: data.pendingApprovals,
      icon: <Clock className="w-5 h-5" />,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: t("bi.activeEmployees"),
      value: data.activeEmployees,
      icon: <UserCheck className="w-5 h-5" />,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
  ];

  return (
    <div className="p-6 space-y-6 overflow-auto" data-ocid="bi.panel">
      <div>
        <h2 className="text-2xl font-bold text-white">{t("modules.BI")}</h2>
        <p className="text-slate-400 text-sm mt-1">{t("bi.subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="bg-slate-800/60 border-slate-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <span className={kpi.color}>{kpi.icon}</span>
              </div>
              <div>
                <p className="text-xs text-slate-400">{kpi.label}</p>
                <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue vs Expense */}
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              {t("bi.monthlyChart")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.monthlyData.every(
              (m) => m.income === 0 && m.expense === 0,
            ) ? (
              <div
                className="flex items-center justify-center h-40 text-slate-500 text-sm"
                data-ocid="bi.chart.empty_state"
              >
                {t("bi.noData")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Bar
                    dataKey="income"
                    name={t("bi.income")}
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name={t("bi.expense")}
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Module Usage */}
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              {t("bi.moduleUsage")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.moduleUsage.length === 0 ? (
              <div
                className="flex items-center justify-center h-40 text-slate-500 text-sm"
                data-ocid="bi.module.empty_state"
              >
                {t("bi.noData")}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.moduleUsage}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#64748b" }}
                  >
                    {data.moduleUsage.map((entry, idx) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Top Customers + Top Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Customers */}
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              {t("bi.topCustomers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCustomers.length === 0 ? (
              <p
                className="text-slate-500 text-sm py-6 text-center"
                data-ocid="bi.customers.empty_state"
              >
                {t("bi.noCustomers")}
              </p>
            ) : (
              <div className="space-y-2">
                {data.topCustomers.map((c: any, i) => (
                  <div
                    key={c.id ?? i}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                    data-ocid={`bi.customers.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="text-white text-sm font-medium">
                        {c.name ?? c.company ?? "—"}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-emerald-400 border-emerald-500/40 text-xs"
                    >
                      {c.status ?? "active"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Projects */}
        <Card className="bg-slate-800/60 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              {t("bi.topProjects")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProjects.length === 0 ? (
              <p
                className="text-slate-500 text-sm py-6 text-center"
                data-ocid="bi.projects.empty_state"
              >
                {t("bi.noProjects")}
              </p>
            ) : (
              <div className="space-y-3">
                {data.topProjects.map((p: any, i) => {
                  const pct = p.completion ?? p.progress ?? 0;
                  return (
                    <div
                      key={p.id ?? i}
                      data-ocid={`bi.projects.item.${i + 1}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white text-sm font-medium truncate">
                          {p.name}
                        </span>
                        <span className="text-indigo-400 text-xs font-bold ml-2">
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
