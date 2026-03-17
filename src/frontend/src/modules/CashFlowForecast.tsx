import { TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useLanguage } from "../contexts/LanguageContext";

interface ForecastEntry {
  month: string; // YYYY-MM
  forecastIncome: number;
  forecastExpense: number;
}

interface AccountingEntry {
  type: "gelir" | "gider";
  amount: number;
  currency: string;
  date: string;
  [key: string]: unknown;
}

function getMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${yyyy}-${mm}`);
  }
  return months;
}

function formatMonthLabel(month: string, t: (k: string) => string): string {
  const [year, mon] = month.split("-");
  const monthNames = [
    t("month.jan"),
    t("month.feb"),
    t("month.mar"),
    t("month.apr"),
    t("month.may"),
    t("month.jun"),
    t("month.jul"),
    t("month.aug"),
    t("month.sep"),
    t("month.oct"),
    t("month.nov"),
    t("month.dec"),
  ];
  return `${monthNames[Number.parseInt(mon) - 1]} ${year}`;
}

function loadForecasts(): ForecastEntry[] {
  try {
    const raw = localStorage.getItem("erpCashFlowForecasts");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveForecasts(data: ForecastEntry[]) {
  localStorage.setItem("erpCashFlowForecasts", JSON.stringify(data));
}

function loadActuals(): Record<string, { income: number; expense: number }> {
  const result: Record<string, { income: number; expense: number }> = {};
  try {
    const raw = localStorage.getItem("erpAccountingEntries");
    if (!raw) return result;
    const entries: AccountingEntry[] = JSON.parse(raw);
    for (const e of entries) {
      if (!e.date) continue;
      const month = e.date.substring(0, 7);
      if (!result[month]) result[month] = { income: 0, expense: 0 };
      const amount = Number(e.amount) || 0;
      if (e.type === "gelir") result[month].income += amount;
      else if (e.type === "gider") result[month].expense += amount;
    }
  } catch {}
  return result;
}

export default function CashFlowForecast() {
  const { t } = useLanguage();
  const months = getMonths(6);
  const [forecasts, setForecasts] = useState<ForecastEntry[]>(loadForecasts);
  const [actuals] =
    useState<Record<string, { income: number; expense: number }>>(loadActuals);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    saveForecasts(forecasts);
  }, [forecasts]);

  function getForecast(month: string): ForecastEntry {
    return (
      forecasts.find((f) => f.month === month) || {
        month,
        forecastIncome: 0,
        forecastExpense: 0,
      }
    );
  }

  function updateForecast(
    month: string,
    field: "forecastIncome" | "forecastExpense",
    value: string,
  ) {
    const num = Number.parseFloat(value) || 0;
    setForecasts((prev) => {
      const existing = prev.find((f) => f.month === month);
      if (existing) {
        return prev.map((f) =>
          f.month === month ? { ...f, [field]: num } : f,
        );
      }
      return [
        ...prev,
        { month, forecastIncome: 0, forecastExpense: 0, [field]: num },
      ];
    });
  }

  function handleSave() {
    saveForecasts(forecasts);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const maxAbsNet = Math.max(
    1,
    ...months.map((m) => {
      const f = getForecast(m);
      const a = actuals[m] || { income: 0, expense: 0 };
      return Math.max(
        Math.abs(f.forecastIncome - f.forecastExpense),
        Math.abs(a.income - a.expense),
      );
    }),
  );

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("cashflow.title")}
          </h2>
          <p className="text-slate-400 text-sm">{t("cashflow.subtitle")}</p>
        </div>
      </div>

      {/* Forecast Table */}
      <div className="mt-6 bg-slate-800 rounded-xl border border-white/5 overflow-x-auto">
        <table className="w-full min-w-max" data-ocid="cashflow.table">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-slate-400 text-sm font-medium px-5 py-3 sticky left-0 bg-slate-800 min-w-[140px]">
                {t("cashflow.month")}
              </th>
              <th className="text-right text-slate-400 text-sm font-medium px-4 py-3 min-w-[160px]">
                {t("cashflow.forecastIncome")}
              </th>
              <th className="text-right text-slate-400 text-sm font-medium px-4 py-3 min-w-[160px]">
                {t("cashflow.forecastExpense")}
              </th>
              <th className="text-right text-slate-400 text-sm font-medium px-4 py-3 min-w-[130px]">
                {t("cashflow.forecastNet")}
              </th>
              <th className="text-right text-slate-400 text-sm font-medium px-4 py-3 min-w-[130px]">
                {t("cashflow.actualIncome")}
              </th>
              <th className="text-right text-slate-400 text-sm font-medium px-4 py-3 min-w-[130px]">
                {t("cashflow.actualExpense")}
              </th>
              <th className="text-right text-slate-400 text-sm font-medium px-4 py-3 min-w-[130px]">
                {t("cashflow.actualNet")}
              </th>
            </tr>
          </thead>
          <tbody>
            {months.map((month, i) => {
              const f = getForecast(month);
              const a = actuals[month] || { income: 0, expense: 0 };
              const fNet = f.forecastIncome - f.forecastExpense;
              const aNet = a.income - a.expense;
              return (
                <tr
                  key={month}
                  className="border-b border-white/5 last:border-0 hover:bg-white/2"
                  data-ocid={`cashflow.row.${i + 1}`}
                >
                  <td className="px-5 py-3 sticky left-0 bg-slate-800">
                    <span className="text-white text-sm font-medium">
                      {formatMonthLabel(month, t)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      value={f.forecastIncome || ""}
                      onChange={(e) =>
                        updateForecast(month, "forecastIncome", e.target.value)
                      }
                      className="bg-white/5 border-white/10 text-white text-right h-8 text-sm"
                      placeholder="0"
                      data-ocid={`cashflow.income_input.${i + 1}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      value={f.forecastExpense || ""}
                      onChange={(e) =>
                        updateForecast(month, "forecastExpense", e.target.value)
                      }
                      className="bg-white/5 border-white/10 text-white text-right h-8 text-sm"
                      placeholder="0"
                      data-ocid={`cashflow.expense_input.${i + 1}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-semibold ${
                        fNet >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {fNet >= 0 ? "+" : ""}
                      {fNet.toLocaleString("tr-TR")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-300 text-sm">
                      {a.income.toLocaleString("tr-TR")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-slate-300 text-sm">
                      {a.expense.toLocaleString("tr-TR")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-semibold ${
                        aNet >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {aNet >= 0 ? "+" : ""}
                      {aNet.toLocaleString("tr-TR")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Button
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          data-ocid="cashflow.save_button"
        >
          {t("common.save")}
        </Button>
        {saved && (
          <span
            className="text-emerald-400 text-sm"
            data-ocid="cashflow.success_state"
          >
            ✓ {t("common.saved")}
          </span>
        )}
      </div>

      {/* Bar Chart */}
      <div className="mt-8">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-slate-400" />
          {t("cashflow.chartTitle")}
        </h3>
        <div className="bg-slate-800 rounded-xl border border-white/5 p-6">
          <div className="flex items-end gap-4 h-40">
            {months.map((month, i) => {
              const f = getForecast(month);
              const a = actuals[month] || { income: 0, expense: 0 };
              const fNet = f.forecastIncome - f.forecastExpense;
              const aNet = a.income - a.expense;
              const fHeight = Math.abs(fNet / maxAbsNet) * 100;
              const aHeight = Math.abs(aNet / maxAbsNet) * 100;
              return (
                <div
                  key={month}
                  className="flex-1 flex flex-col items-center gap-1"
                  data-ocid={`cashflow.chart_point.${i + 1}`}
                >
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    {/* Forecast bar */}
                    <div className="flex flex-col items-center w-5">
                      <div
                        style={{ height: `${fHeight}%` }}
                        className={`w-full rounded-t transition-all ${
                          fNet >= 0 ? "bg-emerald-500" : "bg-red-500"
                        }`}
                        title={`${t("cashflow.forecast")}: ${fNet.toLocaleString("tr-TR")}`}
                      />
                    </div>
                    {/* Actual bar */}
                    <div className="flex flex-col items-center w-5">
                      <div
                        style={{ height: `${aHeight}%` }}
                        className={`w-full rounded-t transition-all ${
                          aNet >= 0 ? "bg-blue-500" : "bg-orange-500"
                        }`}
                        title={`${t("cashflow.actual")}: ${aNet.toLocaleString("tr-TR")}`}
                      />
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs text-center leading-tight">
                    {month.split("-")[1]}/{month.split("-")[0].slice(2)}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5 mt-4 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-400 text-xs">
                {t("cashflow.forecastPositive")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-slate-400 text-xs">
                {t("cashflow.forecastNegative")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-slate-400 text-xs">
                {t("cashflow.actualPositive")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-slate-400 text-xs">
                {t("cashflow.actualNegative")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
