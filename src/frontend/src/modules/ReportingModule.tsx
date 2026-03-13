import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart3,
  Briefcase,
  Factory,
  FileDown,
  FileSpreadsheet,
  GitBranch,
  Handshake,
  HardDrive,
  Headphones,
  Package,
  PiggyBank,
  ShieldAlert,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";
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
import * as XLSX from "xlsx";
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
  ];

  const totalRecords = modules.reduce((sum, m) => sum + m.count, 0);
  const maxCount = Math.max(...modules.map((m) => m.count), 1);

  // Monthly financials chart data (last 6 months)
  const monthlyData = (() => {
    const now = new Date();
    const result: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  ];

  const tooltipStyle = {
    backgroundColor: "#1e293b",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#fff",
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = new Date().toISOString().slice(0, 10);
    const title = `${company?.name || "ERPVerse"} ERP Raporu - ${dateStr}`;
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text(title, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Modül", "Kayıt Sayısı"]],
      body: modules.map((s) => [t(s.labelKey), s.count]),
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [15, 23, 42] },
      styles: { textColor: [30, 41, 59] },
    });

    const finalY = (doc as any).lastAutoTable?.finalY || 80;
    doc.setFontSize(13);
    doc.text("Muhasebe Özeti", 14, finalY + 14);
    autoTable(doc, {
      startY: finalY + 20,
      head: [["Tür", "Tutar"]],
      body: [
        [
          "Toplam Gelir",
          `${transactions
            .filter((tx) => tx.type === "income")
            .reduce((s, tx) => s + (tx.amount || 0), 0)
            .toLocaleString("tr-TR")} ₺`,
        ],
        [
          "Toplam Gider",
          `${transactions
            .filter((tx) => tx.type === "expense")
            .reduce((s, tx) => s + (tx.amount || 0), 0)
            .toLocaleString("tr-TR")} ₺`,
        ],
        [
          "Bakiye",
          `${(transactions.filter((tx) => tx.type === "income").reduce((s, tx) => s + (tx.amount || 0), 0) - transactions.filter((tx) => tx.type === "expense").reduce((s, tx) => s + (tx.amount || 0), 0)).toLocaleString("tr-TR")} ₺`,
        ],
      ],
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [15, 23, 42] },
      styles: { textColor: [30, 41, 59] },
    });

    doc.save(`erpverse-rapor-${dateStr}.pdf`);
  };

  const exportToExcel = () => {
    const dateStr = new Date().toISOString().slice(0, 10);
    const wb = XLSX.utils.book_new();

    const hrData = readLS(`erpverse_hr_${cid}`) as any[];
    const hrSheet = XLSX.utils.json_to_sheet(
      hrData.map((e) => ({
        id: e.id,
        Ad: e.name,
        Pozisyon: e.position,
        Departman: e.department,
        Durum: e.status,
        Maaş: e.salary,
      })),
    );
    XLSX.utils.book_append_sheet(wb, hrSheet, "HR");

    const muhasebe = readLS(`erpverse_accounting_${cid}`) as any[];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        muhasebe.map((e) => ({
          id: e.id,
          Tür: e.type,
          Açıklama: e.description,
          Tutar: e.amount,
          Tarih: e.date,
          Kategori: e.category,
        })),
      ),
      "Muhasebe",
    );

    const crm = readLS(`erpverse_crm_${cid}`) as any[];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        crm.map((e) => ({
          id: e.id,
          Ad: e.name,
          Şirket: e.company,
          Email: e.email,
          Telefon: e.phone,
          Durum: e.status,
        })),
      ),
      "CRM",
    );

    const envanter = readLS(`erpverse_inventory_${cid}`) as any[];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        envanter.map((e) => ({
          id: e.id,
          Ad: e.name,
          Kategori: e.category,
          Miktar: e.quantity,
          Fiyat: e.price,
          Durum: e.status,
        })),
      ),
      "Envanter",
    );

    const projeler = readLS(`erpverse_projects_${cid}`) as any[];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        projeler.map((e) => ({
          id: e.id,
          Ad: e.name,
          Durum: e.status,
          Başlangıç: e.startDate,
          Bitiş: e.endDate,
        })),
      ),
      "Projeler",
    );

    const satinAlma = readLS(`erpverse_purchasing_orders_${cid}`) as any[];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        satinAlma.map((e) => ({
          id: e.id,
          Başlık: e.title,
          Tedarikçi: e.supplier,
          Miktar: e.quantity,
          Durum: e.status,
          Toplam: e.totalAmount,
        })),
      ),
      "Satın Alma",
    );

    const uretim = readLS(`erpverse_production_${cid}`) as any[];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        uretim.map((e) => ({
          id: e.id,
          Ürün: e.productName,
          Miktar: e.quantity,
          Durum: e.status,
        })),
      ),
      "Üretim",
    );

    const workflow = readLS(`erpverse_workflow_${cid}`) as any[];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        workflow.map((e) => ({
          id: e.id,
          Başlık: e.title,
          Atanan: e.assignee,
          Durum: e.status,
          Öncelik: e.priority,
        })),
      ),
      "İş Akışı",
    );

    XLSX.writeFile(wb, `erpverse-veriler-${dateStr}.xlsx`);
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
            {/* Monthly Income vs Expense */}
            <div className="bg-slate-800 rounded-xl p-6 border border-white/5">
              <h3 className="text-white font-semibold mb-5">
                {t("reporting.monthlyFinancials")}
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} barCategoryGap="30%">
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
