import {
  BarChart3,
  Briefcase,
  DollarSign,
  Factory,
  FileDown,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Globe,
  Handshake,
  HardDrive,
  Headphones,
  Link2,
  Package,
  PiggyBank,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface ModuleStat {
  key: string;
  labelKey: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  barColor: string;
  fill: string;
}

interface Transaction {
  type: "income" | "expense";
  amount: number;
  date: string;
}

interface Customer {
  status: "lead" | "active" | "closed";
}

export default function ReportingModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";
  // Date range filter state
  const getDefaultStart = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().slice(0, 10);
  };
  const getToday = () => new Date().toISOString().slice(0, 10);

  const [filterStart, setFilterStart] = useState<string>(getDefaultStart);
  const [filterEnd, setFilterEnd] = useState<string>(getToday);

  const setPreset = (preset: "thisMonth" | "last3" | "last6" | "thisYear") => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (preset === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      setFilterStart(start);
      setFilterEnd(today);
    } else if (preset === "last3") {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        .toISOString()
        .slice(0, 10);
      setFilterStart(start);
      setFilterEnd(today);
    } else if (preset === "last6") {
      const start = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        .toISOString()
        .slice(0, 10);
      setFilterStart(start);
      setFilterEnd(today);
    } else if (preset === "thisYear") {
      const start = new Date(now.getFullYear(), 0, 1)
        .toISOString()
        .slice(0, 10);
      setFilterStart(start);
      setFilterEnd(today);
    }
  };

  const readLS = (key: string): unknown[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
    } catch {
      return [];
    }
  };

  const employees = readLS(`erpverse_hr_${cid}`) as Array<{ status?: string }>;
  const transactions = readLS(`erpverse_accounting_${cid}`) as Transaction[];
  const customers = readLS(`erpverse_crm_${cid}`) as Customer[];
  const products = readLS(`erpverse_inventory_${cid}`);
  const projects = readLS(`erpverse_projects_${cid}`);
  const purchaseOrders = readLS(`erpverse_purchasing_orders_${cid}`) as Array<{
    status?: string;
  }>;
  const productionOrders = readLS(`erpverse_production_${cid}`);
  const workflowTasks = readLS(`erpverse_workflow_${cid}`);
  const qualityChecks = readLS(`erp_quality_${cid}`);
  const _qualityReports = readLS(`erp_quality_reports_${cid}`) as Array<{
    status?: string;
  }>;
  const warehouseLocations = readLS(`erp_warehouse_${cid}`);
  const budgetItems = readLS(`erp_budget_${cid}`);
  const assets = readLS(`erpverse_assets_${cid}`) as Array<{
    currentValue?: number;
  }>;
  const csTickets = readLS(`erpverse_cs_${cid}`) as Array<{ status?: string }>;
  const salesQuotes = readLS(`erpverse_sales_quotes_${cid}`) as unknown[];
  const salesOrders = readLS(`erpverse_sales_orders_${cid}`) as unknown[];
  const salesOpps = readLS(`erpverse_sales_opps_${cid}`) as unknown[];
  const scPerf = readLS(`erpverse_sc_perf_${cid}`) as unknown[];
  const scShipments = readLS(`erpverse_sc_ship_${cid}`) as unknown[];
  const scRotations = readLS(`erpverse_sc_rot_${cid}`) as unknown[];
  const maintenanceEquipment = readLS(`erp_maintenance_eq_${cid}`) as unknown[];
  const maintenanceFaults = readLS(
    `erp_maintenance_faults_${cid}`,
  ) as unknown[];
  const payrollRuns = readLS(`erp_payroll_${cid}`) as Array<{
    totalNet?: number;
    entries?: unknown[];
  }>;
  const tradeDeclarations = readLS(`erp_trade_declarations_${cid}`) as Array<{
    type?: string;
    value?: number;
  }>;
  const tradeShipments = readLS(`erp_trade_shipments_${cid}`) as unknown[];
  const contracts = readLS(`contracts_${cid}`) as Array<{ status?: string }>;
  const invoices = readLS(`erp_invoices_${cid}`) as Array<{
    status?: string;
    amount?: number;
  }>;
  const _paidInvoiceAmount = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + (i.amount || 0), 0);
  const _overdueInvoiceCount = invoices.filter(
    (i) => i.status === "overdue",
  ).length;

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
      fill: "#3b82f6",
    },
    {
      key: "accounting",
      labelKey: "modules.Accounting",
      count: transactions.length,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-emerald-400",
      barColor: "bg-emerald-500",
      fill: "#10b981",
    },
    {
      key: "crm",
      labelKey: "modules.CRM",
      count: customers.length,
      icon: <Handshake className="w-5 h-5" />,
      color: "text-orange-400",
      barColor: "bg-orange-500",
      fill: "#f97316",
    },
    {
      key: "inventory",
      labelKey: "modules.Inventory",
      count: products.length,
      icon: <Package className="w-5 h-5" />,
      color: "text-amber-400",
      barColor: "bg-amber-500",
      fill: "#f59e0b",
    },
    {
      key: "projects",
      labelKey: "modules.Projects",
      count: projects.length,
      icon: <Briefcase className="w-5 h-5" />,
      color: "text-purple-400",
      barColor: "bg-purple-500",
      fill: "#8b5cf6",
    },
    {
      key: "purchasing",
      labelKey: "modules.Purchasing",
      count: purchaseOrders.length,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "text-red-400",
      barColor: "bg-red-500",
      fill: "#ef4444",
    },
    {
      key: "production",
      labelKey: "modules.Production",
      count: productionOrders.length,
      icon: <Factory className="w-5 h-5" />,
      color: "text-slate-400",
      barColor: "bg-slate-400",
      fill: "#94a3b8",
    },
    {
      key: "workflow",
      labelKey: "modules.Workflow",
      count: workflowTasks.length,
      icon: <GitBranch className="w-5 h-5" />,
      color: "text-teal-400",
      barColor: "bg-teal-500",
      fill: "#14b8a6",
    },
    {
      key: "quality",
      labelKey: "modules.Quality",
      count: qualityChecks.length,
      icon: <ShieldAlert className="w-5 h-5" />,
      color: "text-rose-400",
      barColor: "bg-rose-500",
      fill: "#f43f5e",
    },
    {
      key: "warehouse",
      labelKey: "modules.Warehouse",
      count: warehouseLocations.length,
      icon: <Warehouse className="w-5 h-5" />,
      color: "text-cyan-400",
      barColor: "bg-cyan-500",
      fill: "#06b6d4",
    },
    {
      key: "budget",
      labelKey: "modules.Budget",
      count: budgetItems.length,
      icon: <PiggyBank className="w-5 h-5" />,
      color: "text-violet-400",
      barColor: "bg-violet-500",
      fill: "#7c3aed",
    },
    {
      key: "assets",
      labelKey: "modules.Assets",
      count: assets.length,
      icon: <HardDrive className="w-5 h-5" />,
      color: "text-orange-400",
      barColor: "bg-orange-500",
      fill: "#f97316",
    },
    {
      key: "customerservice",
      labelKey: "modules.CustomerService",
      count: csTickets.length,
      icon: <Headphones className="w-5 h-5" />,
      color: "text-sky-400",
      barColor: "bg-sky-500",
      fill: "#0ea5e9",
    },
    {
      key: "sales",
      labelKey: "modules.SalesManagement",
      count: salesQuotes.length + salesOrders.length + salesOpps.length,
      icon: <ShoppingBag className="w-5 h-5" />,
      color: "text-green-400",
      barColor: "bg-green-500",
      fill: "#22c55e",
    },
    {
      key: "supplychain",
      labelKey: "modules.SupplyChain",
      count: scPerf.length + scShipments.length + scRotations.length,
      icon: <Link2 className="w-5 h-5" />,
      color: "text-teal-400",
      barColor: "bg-teal-500",
      fill: "#14b8a6",
    },
    {
      key: "maintenance",
      labelKey: "modules.Maintenance",
      count: maintenanceEquipment.length + maintenanceFaults.length,
      icon: <Wrench className="w-5 h-5" />,
      color: "text-orange-400",
      barColor: "bg-orange-500",
      fill: "#f97316",
    },
    {
      key: "payroll",
      labelKey: "modules.Payroll",
      count: payrollRuns.length,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-emerald-400",
      barColor: "bg-emerald-500",
      fill: "#10b981",
    },
    {
      key: "trade",
      labelKey: "modules.Trade",
      count: tradeDeclarations.length + tradeShipments.length,
      icon: <Globe className="w-5 h-5" />,
      color: "text-indigo-400",
      barColor: "bg-indigo-500",
      fill: "#6366f1",
    },
    {
      key: "invoices",
      labelKey: "invoice.invoices",
      count: invoices.length,
      icon: <FileText className="w-5 h-5" />,
      color: "text-yellow-400",
      barColor: "bg-yellow-500",
      fill: "#eab308",
    },
    {
      key: "contracts",
      labelKey: "contractManagement",
      count: contracts.length,
      icon: <FileText className="w-5 h-5" />,
      color: "text-teal-400",
      barColor: "bg-teal-500",
      fill: "#14b8a6",
    },
  ];

  const totalRecords = modules.reduce((sum, m) => sum + m.count, 0);
  const maxCount = Math.max(...modules.map((m) => m.count), 1);

  // Monthly financials chart data (filtered by date range)
  const filteredMonthlyData = (() => {
    const start = new Date(filterStart);
    const end = new Date(filterEnd);
    const result: { month: string; income: number; expense: number }[] = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      const label = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
      const income = transactions
        .filter((tx) => tx.type === "income" && tx.date?.startsWith(label))
        .reduce((s, tx) => s + (tx.amount || 0), 0);
      const expense = transactions
        .filter((tx) => tx.type === "expense" && tx.date?.startsWith(label))
        .reduce((s, tx) => s + (tx.amount || 0), 0);
      result.push({
        month: `${label.slice(5)}/${label.slice(0, 4)}`,
        income,
        expense,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return result;
  })();

  // Module counts chart data
  const moduleChartData = modules.map((m) => ({
    name: t(m.labelKey),
    count: m.count,
    fill: m.fill,
  }));

  // CRM pie data
  const crmPieData = [
    {
      name: t("crm.lead_status"),
      value: customers.filter((c) => c.status === "lead").length,
      fill: "#f59e0b",
    },
    {
      name: t("crm.active_status"),
      value: customers.filter((c) => c.status === "active").length,
      fill: "#10b981",
    },
    {
      name: t("crm.closed_status"),
      value: customers.filter((c) => c.status === "closed").length,
      fill: "#94a3b8",
    },
  ].filter((d) => d.value > 0);

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
    {
      label: t("reporting.qualityChecks"),
      value: qualityChecks.length,
      sub: t("modules.Quality"),
      color: "text-rose-400",
      bg: "bg-rose-500/10",
    },
    {
      label: t("reporting.warehouseLocations"),
      value: warehouseLocations.length,
      sub: t("modules.Warehouse"),
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: t("reporting.budgetItems"),
      value: budgetItems.length,
      sub: t("modules.Budget"),
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: t("reporting.totalAssets"),
      value: assets.length,
      sub: t("modules.Assets"),
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      label: t("reporting.openTickets"),
      value: csTickets.filter(
        (tk) => tk.status === "Açık" || tk.status === "İşlemde",
      ).length,
      sub: t("modules.CustomerService"),
      color: "text-sky-400",
      bg: "bg-sky-500/10",
    },
    {
      label: t("contractManagement"),
      value: contracts.filter((c) => c.status === "Aktif").length,
      sub: t("contracts"),
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
  ];

  const tooltipStyle = {
    backgroundColor: "#1e293b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#fff",
  };

  const exportToPDF = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const title = `${company?.name || "ERPVerse"} ERP Raporu - ${dateStr}`;
    const totalIncome = transactions
      .filter((tx) => tx.type === "income")
      .reduce((s, tx) => s + (tx.amount || 0), 0);
    const totalExpense = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((s, tx) => s + (tx.amount || 0), 0);
    const rows = modules
      .map(
        (m) =>
          `<tr><td style="padding:6px 12px;border:1px solid #e2e8f0">${t(m.labelKey)}</td><td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${m.count}</td></tr>`,
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:sans-serif;padding:24px;color:#1e293b}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin-top:12px}th{background:#1e293b;color:#fff;padding:8px 12px;text-align:left}</style></head><body><h1>${title}</h1><table><thead><tr><th>Modül</th><th>Kayıt Sayısı</th></tr></thead><tbody>${rows}</tbody></table><h2 style="margin-top:24px">Muhasebe Özeti</h2><table><thead><tr><th>Tür</th><th>Tutar</th></tr></thead><tbody><tr><td style="padding:6px 12px;border:1px solid #e2e8f0">Toplam Gelir</td><td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${totalIncome.toLocaleString("tr-TR")} ₺</td></tr><tr><td style="padding:6px 12px;border:1px solid #e2e8f0">Toplam Gider</td><td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${totalExpense.toLocaleString("tr-TR")} ₺</td></tr><tr><td style="padding:6px 12px;border:1px solid #e2e8f0">Bakiye</td><td style="padding:6px 12px;border:1px solid #e2e8f0;text-align:right">${(totalIncome - totalExpense).toLocaleString("tr-TR")} ₺</td></tr></tbody></table></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `erpverse-rapor-${dateStr}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const readLSRaw = (key: string): Record<string, unknown>[] => {
      try {
        return JSON.parse(localStorage.getItem(key) || "[]") as Record<
          string,
          unknown
        >[];
      } catch {
        return [];
      }
    };
    const allData: Record<string, Record<string, unknown>[]> = {
      HR: readLSRaw(`erpverse_hr_${cid}`),
      Muhasebe: readLSRaw(`erpverse_accounting_${cid}`),
      CRM: readLSRaw(`erpverse_crm_${cid}`),
      Envanter: readLSRaw(`erpverse_inventory_${cid}`),
      Projeler: readLSRaw(`erpverse_projects_${cid}`),
    };
    const csvParts: string[] = [];
    for (const [sheetName, rows] of Object.entries(allData)) {
      if (rows.length === 0) continue;
      const headers = Object.keys(rows[0]);
      csvParts.push(`=== ${sheetName} ===`);
      csvParts.push(headers.join(","));
      for (const row of rows) {
        csvParts.push(
          headers.map((h) => JSON.stringify(row[h] ?? "")).join(","),
        );
      }
      csvParts.push("");
    }
    const blob = new Blob([csvParts.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `erpverse-veriler-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-2">
          <button
            data-ocid="reporting.pdf_export_button"
            type="button"
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <FileDown className="w-4 h-4" />
            {t("reporting.exportPDF")}
          </button>
          <button
            data-ocid="reporting.excel_export_button"
            type="button"
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t("reporting.exportExcel")}
          </button>
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
        <Tabs defaultValue="summary" data-ocid="reporting.tab">
          <TabsList className="bg-slate-800 border border-white/5 mb-6">
            <TabsTrigger
              value="summary"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
              data-ocid="reporting.summary_tab"
            >
              {t("reporting.summary")}
            </TabsTrigger>
            <TabsTrigger
              value="charts"
              className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
              data-ocid="reporting.charts_tab"
            >
              {t("reporting.charts")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
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
                        style={{ width: `${(mod.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <p className="text-slate-400 text-sm w-8 text-right font-mono">
                      {mod.count}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            {/* Date Range Filter Bar */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex flex-wrap items-center gap-3">
              <span className="text-slate-400 text-sm font-medium shrink-0">
                {t("reporting.dateRange")}:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  data-ocid="reporting.this_month_button"
                  onClick={() => setPreset("thisMonth")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  {t("reporting.thisMonth")}
                </button>
                <button
                  type="button"
                  data-ocid="reporting.last3_months_button"
                  onClick={() => setPreset("last3")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  {t("reporting.last3Months")}
                </button>
                <button
                  type="button"
                  data-ocid="reporting.last6_months_button"
                  onClick={() => setPreset("last6")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  {t("reporting.last6Months")}
                </button>
                <button
                  type="button"
                  data-ocid="reporting.this_year_button"
                  onClick={() => setPreset("thisYear")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  {t("reporting.thisYear")}
                </button>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <input
                  data-ocid="reporting.filter_start_input"
                  type="date"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="bg-slate-700 border border-white/10 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-500 text-xs">–</span>
                <input
                  data-ocid="reporting.filter_end_input"
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="bg-slate-700 border border-white/10 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                />
                <span className="text-slate-400 text-xs">
                  {t("reporting.filterResults")}: {filteredMonthlyData.length}
                </span>
              </div>
            </div>

            {/* Monthly Income vs Expense */}
            <div className="bg-slate-800 rounded-xl p-6 border border-white/5">
              <h3 className="text-white font-semibold mb-5">
                {t("reporting.monthlyFinancials")}
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={filteredMonthlyData} barCategoryGap="30%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                  <Bar
                    dataKey="income"
                    name={t("accounting.income")}
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name={t("accounting.expense")}
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Module record counts */}
            <div className="bg-slate-800 rounded-xl p-6 border border-white/5">
              <h3 className="text-white font-semibold mb-5">
                {t("reporting.dataSummary")}
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={moduleChartData} barCategoryGap="20%">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name={t("reporting.totalRecords")}
                    radius={[4, 4, 0, 0]}
                  >
                    {moduleChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* CRM Pie */}
            {crmPieData.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-6 border border-white/5">
                <h3 className="text-white font-semibold mb-5">
                  {t("reporting.crmDistribution")}
                </h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={crmPieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={{ stroke: "#94a3b8" }}
                    >
                      {crmPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
