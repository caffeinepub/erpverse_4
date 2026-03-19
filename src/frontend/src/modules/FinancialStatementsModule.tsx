import { BarChart2, FileText, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

interface Props {
  companyId: string;
  t: (key: string) => string;
}

interface AccountingEntry {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency?: string;
  date: string;
  description: string;
  category?: string;
}

interface Asset {
  id: string;
  name: string;
  value?: number;
  purchasePrice?: number;
}

function fmt(n: number): string {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function FinancialStatementsModule({ companyId, t }: Props) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  const years = useMemo(() => {
    const arr: string[] = ["all"];
    for (let y = currentYear; y >= currentYear - 5; y--) arr.push(String(y));
    return arr;
  }, [currentYear]);

  const accountingEntries = useMemo((): AccountingEntry[] => {
    try {
      const raw = localStorage.getItem(`erpverse_accounting_${companyId}`);
      if (!raw) return [];
      return JSON.parse(raw) as AccountingEntry[];
    } catch {
      return [];
    }
  }, [companyId]);

  const assets = useMemo((): Asset[] => {
    try {
      const raw = localStorage.getItem(`erpverse_assets_${companyId}`);
      if (!raw) return [];
      return JSON.parse(raw) as Asset[];
    } catch {
      return [];
    }
  }, [companyId]);

  const filteredEntries = useMemo(() => {
    if (selectedYear === "all") return accountingEntries;
    return accountingEntries.filter((e) => {
      const year = new Date(e.date).getFullYear();
      return String(year) === selectedYear;
    });
  }, [accountingEntries, selectedYear]);

  // Income Statement calculations
  const incomeEntries = filteredEntries.filter((e) => e.type === "income");
  const expenseEntries = filteredEntries.filter((e) => e.type === "expense");

  const totalIncome = incomeEntries.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0,
  );
  const totalExpense = expenseEntries.reduce(
    (sum, e) => sum + (Number(e.amount) || 0),
    0,
  );
  const netProfitLoss = totalIncome - totalExpense;

  // Group by category
  const incomeByCategory = incomeEntries.reduce<Record<string, number>>(
    (acc, e) => {
      const cat = e.category || e.description || t("income");
      acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
      return acc;
    },
    {},
  );

  const expenseByCategory = expenseEntries.reduce<Record<string, number>>(
    (acc, e) => {
      const cat = e.category || e.description || t("expense");
      acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
      return acc;
    },
    {},
  );

  // Balance Sheet calculations
  const totalAssetValue = assets.reduce((sum, a) => {
    return sum + (Number(a.purchasePrice ?? a.value) || 0);
  }, 0);

  const totalCurrentAssets = totalIncome; // Nakit ve Nakit Benzerleri = income
  const totalFixedAssets = totalAssetValue;
  const totalAssets = totalCurrentAssets + totalFixedAssets;

  const shortTermLiabilities = totalExpense;
  const equity = totalAssets - shortTermLiabilities;
  const totalLiabilities = shortTermLiabilities + equity;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 print:p-4" data-ocid="financial.panel">
      <style>{`
        @media print {
          aside, nav, .no-print { display: none !important; }
          body { background: white; color: black; }
          .print\\:text-black { color: black; }
        }
      `}</style>

      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t("financialStatements")}
            </h2>
            <p className="text-slate-400 text-sm">
              {t("incomeStatement")} &amp; {t("balanceSheet")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger
              className="w-40 bg-slate-800 border-white/10 text-white"
              data-ocid="financial.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              {years.map((y) => (
                <SelectItem
                  key={y}
                  value={y}
                  className="text-white hover:bg-white/10"
                >
                  {y === "all" ? t("allPeriods") : y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handlePrint}
            className="bg-slate-700 hover:bg-slate-600 text-white gap-2"
            data-ocid="financial.print_button"
          >
            <Printer className="w-4 h-4" />
            {t("printReport")}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="income">
        <TabsList className="bg-slate-800 border border-white/10 mb-6 no-print">
          <TabsTrigger
            value="income"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            data-ocid="financial.income_tab"
          >
            <FileText className="w-4 h-4 mr-2" />
            {t("incomeStatement")}
          </TabsTrigger>
          <TabsTrigger
            value="balance"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
            data-ocid="financial.balance_tab"
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            {t("balanceSheet")}
          </TabsTrigger>
        </TabsList>

        {/* ===== GELİR TABLOSU ===== */}
        <TabsContent value="income">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-xl p-5">
              <p className="text-emerald-300 text-sm font-medium mb-1">
                {t("totalIncome")}
              </p>
              <p className="text-3xl font-bold text-emerald-400">
                {fmt(totalIncome)} ₺
              </p>
              <p className="text-emerald-500 text-xs mt-1">
                {incomeEntries.length} kayıt
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-5">
              <p className="text-red-300 text-sm font-medium mb-1">
                {t("totalExpense")}
              </p>
              <p className="text-3xl font-bold text-red-400">
                {fmt(totalExpense)} ₺
              </p>
              <p className="text-red-500 text-xs mt-1">
                {expenseEntries.length} kayıt
              </p>
            </div>
            <div
              className={`bg-gradient-to-br rounded-xl p-5 border ${
                netProfitLoss >= 0
                  ? "from-blue-500/20 to-blue-600/10 border-blue-500/30"
                  : "from-orange-500/20 to-orange-600/10 border-orange-500/30"
              }`}
            >
              <p
                className={`text-sm font-medium mb-1 ${
                  netProfitLoss >= 0 ? "text-blue-300" : "text-orange-300"
                }`}
              >
                {t("netProfitLoss")}
              </p>
              <p
                className={`text-3xl font-bold ${
                  netProfitLoss >= 0 ? "text-blue-400" : "text-orange-400"
                }`}
              >
                {netProfitLoss >= 0 ? "+" : ""}
                {fmt(netProfitLoss)} ₺
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gelirler tablosu */}
            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="text-white font-semibold">{t("income")}</h3>
                <span className="ml-auto text-emerald-400 font-bold text-sm">
                  {fmt(totalIncome)} ₺
                </span>
              </div>
              {Object.keys(incomeByCategory).length === 0 ? (
                <div
                  className="px-5 py-8 text-center text-slate-500 text-sm"
                  data-ocid="financial.income_empty_state"
                >
                  —
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-slate-400 text-xs font-medium px-5 py-2">
                        Kategori
                      </th>
                      <th className="text-right text-slate-400 text-xs font-medium px-5 py-2">
                        Tutar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(incomeByCategory).map(
                      ([cat, amount], i) => (
                        <tr
                          key={cat}
                          className="border-b border-white/5 last:border-0"
                          data-ocid={`financial.income.item.${i + 1}`}
                        >
                          <td className="px-5 py-2.5 text-sm text-slate-300">
                            {cat}
                          </td>
                          <td className="px-5 py-2.5 text-sm text-emerald-400 text-right font-medium">
                            {fmt(amount)} ₺
                          </td>
                        </tr>
                      ),
                    )}
                    <tr className="bg-white/5">
                      <td className="px-5 py-3 text-sm font-bold text-white">
                        {t("totalIncome")}
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-emerald-400 text-right">
                        {fmt(totalIncome)} ₺
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Giderler tablosu */}
            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <h3 className="text-white font-semibold">{t("expense")}</h3>
                <span className="ml-auto text-red-400 font-bold text-sm">
                  {fmt(totalExpense)} ₺
                </span>
              </div>
              {Object.keys(expenseByCategory).length === 0 ? (
                <div
                  className="px-5 py-8 text-center text-slate-500 text-sm"
                  data-ocid="financial.expense_empty_state"
                >
                  —
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-slate-400 text-xs font-medium px-5 py-2">
                        Kategori
                      </th>
                      <th className="text-right text-slate-400 text-xs font-medium px-5 py-2">
                        Tutar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(expenseByCategory).map(
                      ([cat, amount], i) => (
                        <tr
                          key={cat}
                          className="border-b border-white/5 last:border-0"
                          data-ocid={`financial.expense.item.${i + 1}`}
                        >
                          <td className="px-5 py-2.5 text-sm text-slate-300">
                            {cat}
                          </td>
                          <td className="px-5 py-2.5 text-sm text-red-400 text-right font-medium">
                            {fmt(amount)} ₺
                          </td>
                        </tr>
                      ),
                    )}
                    <tr className="bg-white/5">
                      <td className="px-5 py-3 text-sm font-bold text-white">
                        {t("totalExpense")}
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-red-400 text-right">
                        {fmt(totalExpense)} ₺
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Net Kar/Zarar satırı */}
          <div
            className={`mt-4 rounded-xl border p-5 flex justify-between items-center ${
              netProfitLoss >= 0
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <span className="text-white font-bold text-lg">
              {t("netProfitLoss")}
            </span>
            <span
              className={`text-2xl font-bold ${
                netProfitLoss >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {netProfitLoss >= 0 ? "+" : ""}
              {fmt(netProfitLoss)} ₺
            </span>
          </div>
        </TabsContent>

        {/* ===== BİLANÇO ===== */}
        <TabsContent value="balance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AKTİFLER */}
            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-blue-500/20 to-transparent">
                <h3 className="text-white font-bold text-base">
                  {t("assets")}
                </h3>
              </div>

              {/* Dönen Varlıklar */}
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  {t("currentAssets")}
                </p>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-300 text-sm">
                    {t("cashAndEquivalents")}
                  </span>
                  <span className="text-white font-medium text-sm">
                    {fmt(totalCurrentAssets)} ₺
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-t border-white/5 mt-1">
                  <span className="text-slate-400 text-xs font-semibold">
                    Toplam Dönen Varlıklar
                  </span>
                  <span className="text-blue-400 text-sm font-bold">
                    {fmt(totalCurrentAssets)} ₺
                  </span>
                </div>
              </div>

              {/* Duran Varlıklar */}
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  {t("fixedAssets")}
                </p>
                {assets.length === 0 ? (
                  <p className="text-slate-500 text-sm py-1">—</p>
                ) : (
                  assets.slice(0, 5).map((a, i) => (
                    <div
                      key={a.id}
                      className="flex justify-between items-center py-1.5"
                      data-ocid={`financial.asset.item.${i + 1}`}
                    >
                      <span className="text-slate-300 text-sm truncate max-w-[180px]">
                        {a.name}
                      </span>
                      <span className="text-white text-sm font-medium">
                        {fmt(Number(a.purchasePrice ?? a.value) || 0)} ₺
                      </span>
                    </div>
                  ))
                )}
                <div className="flex justify-between items-center py-1.5 border-t border-white/5 mt-1">
                  <span className="text-slate-400 text-xs font-semibold">
                    {t("tangibleAssets")}
                  </span>
                  <span className="text-blue-400 text-sm font-bold">
                    {fmt(totalFixedAssets)} ₺
                  </span>
                </div>
              </div>

              {/* Toplam Aktif */}
              <div className="px-5 py-4 bg-blue-500/10">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">
                    {t("totalAssets")}
                  </span>
                  <span className="text-blue-400 font-bold text-lg">
                    {fmt(totalAssets)} ₺
                  </span>
                </div>
              </div>
            </div>

            {/* PASİFLER */}
            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-500/20 to-transparent">
                <h3 className="text-white font-bold text-base">
                  {t("liabilities")}
                </h3>
              </div>

              {/* Borçlar */}
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Borçlar
                </p>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-300 text-sm">
                    {t("shortTermLiabilities")}
                  </span>
                  <span className="text-white font-medium text-sm">
                    {fmt(shortTermLiabilities)} ₺
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-t border-white/5 mt-1">
                  <span className="text-slate-400 text-xs font-semibold">
                    Toplam Borçlar
                  </span>
                  <span className="text-red-400 text-sm font-bold">
                    {fmt(shortTermLiabilities)} ₺
                  </span>
                </div>
              </div>

              {/* Öz Kaynaklar */}
              <div className="px-5 py-3 border-b border-white/5">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  {t("equity")}
                </p>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-300 text-sm">{t("equity")}</span>
                  <span
                    className={`font-medium text-sm ${
                      equity >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {fmt(equity)} ₺
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-t border-white/5 mt-1">
                  <span className="text-slate-400 text-xs font-semibold">
                    Toplam Öz Kaynaklar
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      equity >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {fmt(equity)} ₺
                  </span>
                </div>
              </div>

              {/* Toplam Pasif */}
              <div className="px-5 py-4 bg-violet-500/10">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">
                    {t("totalLiabilities")}
                  </span>
                  <span className="text-violet-400 font-bold text-lg">
                    {fmt(totalLiabilities)} ₺
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Denge kontrolü */}
          <div className="mt-4 rounded-xl border border-white/10 bg-slate-800 px-5 py-4 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              <span className="text-slate-300 font-semibold">
                {t("totalAssets")}:
              </span>{" "}
              <span className="text-blue-400 font-bold">
                {fmt(totalAssets)} ₺
              </span>
              <span className="mx-3 text-slate-600">=</span>
              <span className="text-slate-300 font-semibold">
                {t("totalLiabilities")}:
              </span>{" "}
              <span className="text-violet-400 font-bold">
                {fmt(totalLiabilities)} ₺
              </span>
            </div>
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                Math.abs(totalAssets - totalLiabilities) < 0.01
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-orange-500/20 text-orange-400"
              }`}
            >
              {Math.abs(totalAssets - totalLiabilities) < 0.01
                ? "✓ Dengede"
                : "⚠ Dengesiz"}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
