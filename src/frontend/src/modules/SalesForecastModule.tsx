import { Minus, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useLanguage } from "../contexts/LanguageContext";

interface ForecastEntry {
  id: string;
  month: string; // YYYY-MM
  target: number;
  notes: string;
}

function getCompanyId() {
  return localStorage.getItem("erpverse_selected_company") || "";
}

function loadForecasts(companyId: string): ForecastEntry[] {
  try {
    const raw = localStorage.getItem(`erpverse_salesforecast_${companyId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveForecasts(companyId: string, data: ForecastEntry[]) {
  localStorage.setItem(
    `erpverse_salesforecast_${companyId}`,
    JSON.stringify(data),
  );
}

function getActualForMonth(companyId: string, month: string): number {
  let total = 0;
  // Try sales module
  try {
    const raw = localStorage.getItem(`erpverse_sales_${companyId}`);
    if (raw) {
      const sales = JSON.parse(raw);
      const invoices = sales.invoices || sales.quotes || [];
      for (const inv of invoices) {
        const dateStr = inv.date || inv.invoiceDate || inv.createdAt || "";
        if (
          dateStr.startsWith(month) &&
          inv.status !== "cancelled" &&
          inv.status !== "İptal"
        ) {
          total += Number(inv.amount || inv.total || inv.totalAmount || 0);
        }
      }
    }
  } catch {}
  // Try CRM deals
  try {
    const raw = localStorage.getItem(`erpverse_crm_${companyId}`);
    if (raw) {
      const crm = JSON.parse(raw);
      const deals = crm.deals || crm.opportunities || [];
      for (const deal of deals) {
        const dateStr = deal.closeDate || deal.date || deal.createdAt || "";
        if (
          dateStr.startsWith(month) &&
          (deal.stage === "Kazanıldı" ||
            deal.stage === "Won" ||
            deal.status === "won")
        ) {
          total += Number(deal.value || deal.amount || 0);
        }
      }
    }
  } catch {}
  return total;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return months;
}

export default function SalesForecastModule() {
  const { t } = useLanguage();
  const companyId = getCompanyId();
  const [forecasts, setForecasts] = useState<ForecastEntry[]>(() =>
    loadForecasts(companyId),
  );
  const [month, setMonth] = useState("");
  const [target, setTarget] = useState("");
  const [notes, setNotes] = useState("");

  const forecastsWithActual = useMemo(() => {
    return forecasts.map((f) => {
      const actual = getActualForMonth(companyId, f.month);
      const rate = f.target > 0 ? (actual / f.target) * 100 : 0;
      const status =
        actual > f.target ? "achieved" : rate >= 80 ? "onTarget" : "behind";
      return { ...f, actual, rate, status };
    });
  }, [forecasts, companyId]);

  const last6Months = getLast6Months();
  const chartData = useMemo(() => {
    return last6Months.map((m) => {
      const fc = forecasts.find((f) => f.month === m);
      const actual = getActualForMonth(companyId, m);
      return { month: m, target: fc?.target || 0, actual };
    });
  }, [forecasts, companyId, last6Months]);

  const maxChartVal = useMemo(() => {
    const vals = chartData.flatMap((d) => [d.target, d.actual]);
    return Math.max(...vals, 1);
  }, [chartData]);

  const summaryStats = useMemo(() => {
    const totalTarget = chartData.reduce((s, d) => s + d.target, 0);
    const totalActual = chartData.reduce((s, d) => s + d.actual, 0);
    const rate =
      totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const best = chartData.reduce((b, d) => {
      if (!b || d.actual > b.actual) return d;
      return b;
    }, chartData[0]);
    return { totalTarget, totalActual, rate, bestMonth: best?.month || "-" };
  }, [chartData]);

  const trendData = useMemo(() => {
    return last6Months.map((m, i) => {
      const actual = getActualForMonth(companyId, m);
      const prevActual =
        i > 0 ? getActualForMonth(companyId, last6Months[i - 1]) : null;
      const growth =
        prevActual !== null && prevActual > 0
          ? ((actual - prevActual) / prevActual) * 100
          : null;
      // 3-month moving average
      let movingAvg: number | null = null;
      if (i >= 2) {
        const vals = [last6Months[i - 2], last6Months[i - 1], m].map((mm) =>
          getActualForMonth(companyId, mm),
        );
        movingAvg = vals.reduce((s, v) => s + v, 0) / 3;
      }
      return { month: m, actual, growth, movingAvg };
    });
  }, [companyId, last6Months]);

  const handleAdd = () => {
    if (!month || !target) return;
    const entry: ForecastEntry = {
      id: Date.now().toString(),
      month,
      target: Number(target),
      notes,
    };
    const updated = [...forecasts.filter((f) => f.month !== month), entry].sort(
      (a, b) => a.month.localeCompare(b.month),
    );
    setForecasts(updated);
    saveForecasts(companyId, updated);
    setMonth("");
    setTarget("");
    setNotes("");
  };

  const handleDelete = (id: string) => {
    const updated = forecasts.filter((f) => f.id !== id);
    setForecasts(updated);
    saveForecasts(companyId, updated);
  };

  const statusColor = (s: string) => {
    if (s === "achieved")
      return "bg-green-500/20 text-green-300 border-green-500/30";
    if (s === "onTarget")
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    return "bg-red-500/20 text-red-300 border-red-500/30";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-400" />
          {t("salesforecast.title")}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {t("salesforecast.subtitle")}
        </p>
      </div>

      <Tabs defaultValue="forecasts">
        <TabsList className="bg-slate-800 border border-white/10 mb-6">
          <TabsTrigger
            value="forecasts"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400"
          >
            {t("salesforecast.forecasts")}
          </TabsTrigger>
          <TabsTrigger
            value="comparison"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400"
          >
            {t("salesforecast.comparison")}
          </TabsTrigger>
          <TabsTrigger
            value="trend"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-slate-400"
          >
            {t("salesforecast.trend")}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Forecasts */}
        <TabsContent value="forecasts">
          {/* Add form */}
          <div className="bg-slate-800 rounded-xl border border-white/10 p-5 mb-6">
            <h2 className="text-white font-semibold mb-4">
              {t("salesforecast.addForecast")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-slate-300 text-sm mb-1 block">
                  {t("salesforecast.month")}
                </Label>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="salesforecast.month_input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1 block">
                  {t("salesforecast.target")}
                </Label>
                <Input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="0"
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="salesforecast.target_input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1 block">
                  {t("salesforecast.notes")}
                </Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="salesforecast.notes_input"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAdd}
                  disabled={!month || !target}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  data-ocid="salesforecast.add_button"
                >
                  {t("salesforecast.addForecast")}
                </Button>
              </div>
            </div>
          </div>

          {/* List */}
          {forecastsWithActual.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="salesforecast.empty_state"
            >
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("salesforecast.noData")}</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full" data-ocid="salesforecast.table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("salesforecast.month")}
                    </th>
                    <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">
                      {t("salesforecast.target")}
                    </th>
                    <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">
                      {t("salesforecast.actual")}
                    </th>
                    <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">
                      {t("salesforecast.variance")}
                    </th>
                    <th className="text-center text-slate-400 text-sm font-medium px-5 py-3">
                      Durum
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {forecastsWithActual.map((f, i) => (
                    <tr
                      key={f.id}
                      className="border-b border-white/5 last:border-0"
                      data-ocid={`salesforecast.item.${i + 1}`}
                    >
                      <td className="px-5 py-3">
                        <p className="text-white font-medium">{f.month}</p>
                        {f.notes && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {f.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-white">
                        {formatCurrency(f.target)}
                      </td>
                      <td className="px-5 py-3 text-right text-green-400">
                        {formatCurrency(f.actual)}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-medium ${f.actual >= f.target ? "text-green-400" : "text-red-400"}`}
                      >
                        {f.actual >= f.target ? "+" : ""}
                        {formatCurrency(f.actual - f.target)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor(f.status)}`}
                        >
                          {t(`salesforecast.${f.status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(f.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          data-ocid={`salesforecast.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Comparison Chart */}
        <TabsContent value="comparison">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: t("salesforecast.totalTarget"),
                value: formatCurrency(summaryStats.totalTarget),
                color: "text-blue-400",
              },
              {
                label: t("salesforecast.totalActual"),
                value: formatCurrency(summaryStats.totalActual),
                color: "text-green-400",
              },
              {
                label: t("salesforecast.achievementRate"),
                value: `%${summaryStats.rate}`,
                color:
                  summaryStats.rate >= 100
                    ? "text-green-400"
                    : summaryStats.rate >= 80
                      ? "text-blue-400"
                      : "text-red-400",
              },
              {
                label: t("salesforecast.bestMonth"),
                value: summaryStats.bestMonth,
                color: "text-yellow-400",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-slate-800 rounded-xl border border-white/10 p-4"
              >
                <p className="text-slate-400 text-xs mb-1">{card.label}</p>
                <p className={`text-lg font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="bg-slate-800 rounded-xl border border-white/10 p-5">
            <h2 className="text-white font-semibold mb-6">
              {t("salesforecast.comparison")}
            </h2>
            <div className="flex items-end gap-3 h-48">
              {chartData.map((d) => (
                <div
                  key={d.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-40">
                    {/* Target bar */}
                    <div className="flex-1 flex items-end">
                      <div
                        className="w-full bg-blue-500/60 rounded-t transition-all hover:bg-blue-500"
                        style={{
                          height: `${Math.round((d.target / maxChartVal) * 100)}%`,
                          minHeight: d.target > 0 ? "4px" : "0",
                        }}
                        title={`${t("salesforecast.target")}: ${formatCurrency(d.target)}`}
                      />
                    </div>
                    {/* Actual bar */}
                    <div className="flex-1 flex items-end">
                      <div
                        className="w-full bg-green-500/60 rounded-t transition-all hover:bg-green-500"
                        style={{
                          height: `${Math.round((d.actual / maxChartVal) * 100)}%`,
                          minHeight: d.actual > 0 ? "4px" : "0",
                        }}
                        title={`${t("salesforecast.actual")}: ${formatCurrency(d.actual)}`}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    {d.month.slice(5)}/{d.month.slice(2, 4)}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500/60 rounded" />
                <span className="text-xs text-slate-400">
                  {t("salesforecast.target")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500/60 rounded" />
                <span className="text-xs text-slate-400">
                  {t("salesforecast.actual")}
                </span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Trend Analysis */}
        <TabsContent value="trend">
          <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                    {t("salesforecast.month")}
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">
                    {t("salesforecast.actual")}
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">
                    {t("salesforecast.growth")}
                  </th>
                  <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">
                    {t("salesforecast.movingAvg")}
                  </th>
                  <th className="text-center text-slate-400 text-sm font-medium px-5 py-3">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((d, i) => {
                  const growthSign =
                    d.growth === null
                      ? null
                      : d.growth > 2
                        ? "up"
                        : d.growth < -2
                          ? "down"
                          : "neutral";
                  return (
                    <tr
                      key={d.month}
                      className="border-b border-white/5 last:border-0"
                      data-ocid={`trend.item.${i + 1}`}
                    >
                      <td className="px-5 py-3 text-white">{d.month}</td>
                      <td className="px-5 py-3 text-right text-green-400">
                        {formatCurrency(d.actual)}
                      </td>
                      <td
                        className={`px-5 py-3 text-right font-medium ${
                          d.growth === null
                            ? "text-slate-500"
                            : d.growth > 0
                              ? "text-green-400"
                              : d.growth < 0
                                ? "text-red-400"
                                : "text-slate-400"
                        }`}
                      >
                        {d.growth === null
                          ? "-"
                          : `${d.growth > 0 ? "+" : ""}${d.growth.toFixed(1)}%`}
                      </td>
                      <td className="px-5 py-3 text-right text-blue-300">
                        {d.movingAvg !== null
                          ? formatCurrency(d.movingAvg)
                          : "-"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {growthSign === "up" && (
                          <TrendingUp className="w-4 h-4 text-green-400 mx-auto" />
                        )}
                        {growthSign === "down" && (
                          <TrendingDown className="w-4 h-4 text-red-400 mx-auto" />
                        )}
                        {growthSign === "neutral" && (
                          <Minus className="w-4 h-4 text-slate-400 mx-auto" />
                        )}
                        {growthSign === null && (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
