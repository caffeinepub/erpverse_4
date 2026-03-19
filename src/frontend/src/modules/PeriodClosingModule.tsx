import { useState } from "react";

interface Period {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "open" | "closed";
  closedAt?: string;
  closingNote?: string;
  totalIncome: number;
  totalExpense: number;
}

interface Props {
  companyId: string;
  t: (key: string) => string;
}

const STORAGE_KEY = (companyId: string) => `erp_periods_${companyId}`;

function loadPeriods(companyId: string): Period[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(companyId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePeriods(companyId: string, periods: Period[]) {
  localStorage.setItem(STORAGE_KEY(companyId), JSON.stringify(periods));
}

function loadAccountingEntries(
  companyId: string,
): { type: string; amount: number; category: string }[] {
  try {
    const raw = localStorage.getItem(`erp_accounting_${companyId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function PeriodClosingModule({ companyId, t }: Props) {
  const [periods, setPeriods] = useState<Period[]>(() =>
    loadPeriods(companyId),
  );
  const [showNewForm, setShowNewForm] = useState(false);
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);
  const [closingNote, setClosingNote] = useState("");
  const [newPeriod, setNewPeriod] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [activeTab, setActiveTab] = useState<"periods" | "summary">("periods");

  const update = (updated: Period[]) => {
    setPeriods(updated);
    savePeriods(companyId, updated);
  };

  const handleCreate = () => {
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) return;
    const period: Period = {
      id: Date.now().toString(),
      name: newPeriod.name,
      startDate: newPeriod.startDate,
      endDate: newPeriod.endDate,
      status: "open",
      totalIncome: 0,
      totalExpense: 0,
    };
    update([...periods, period]);
    setNewPeriod({ name: "", startDate: "", endDate: "" });
    setShowNewForm(false);
  };

  const handleClose = (periodId: string) => {
    const entries = loadAccountingEntries(companyId);
    const totalIncome = entries
      .filter((e) => e.type === "income")
      .reduce((s, e) => s + (e.amount || 0), 0);
    const totalExpense = entries
      .filter((e) => e.type === "expense")
      .reduce((s, e) => s + (e.amount || 0), 0);

    const updated = periods.map((p) =>
      p.id === periodId
        ? {
            ...p,
            status: "closed" as const,
            closedAt: new Date().toISOString(),
            closingNote,
            totalIncome,
            totalExpense,
          }
        : p,
    );

    // Create closing accounting entry
    try {
      const acctRaw = localStorage.getItem(`erp_accounting_${companyId}`);
      const acctEntries = acctRaw ? JSON.parse(acctRaw) : [];
      const period = periods.find((p) => p.id === periodId);
      const netResult = totalIncome - totalExpense;
      acctEntries.push({
        id: `closing_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        type: netResult >= 0 ? "income" : "expense",
        category: t("periodclosing.closingEntry"),
        description: `${t("periodclosing.closingEntry")} - ${period?.name || ""}`,
        amount: Math.abs(netResult),
        currency: "TRY",
        status: "completed",
      });
      localStorage.setItem(
        `erp_accounting_${companyId}`,
        JSON.stringify(acctEntries),
      );
    } catch {}

    update(updated);
    setConfirmCloseId(null);
    setClosingNote("");
  };

  const handleReopen = (periodId: string) => {
    const updated = periods.map((p) =>
      p.id === periodId
        ? { ...p, status: "open" as const, closedAt: undefined }
        : p,
    );
    update(updated);
  };

  const handleDelete = (periodId: string) => {
    update(periods.filter((p) => p.id !== periodId));
  };

  const openPeriods = periods.filter((p) => p.status === "open");
  const closedPeriods = periods.filter((p) => p.status === "closed");
  const totalClosedIncome = closedPeriods.reduce(
    (s, p) => s + p.totalIncome,
    0,
  );
  const totalClosedExpense = closedPeriods.reduce(
    (s, p) => s + p.totalExpense,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {t("periodclosing.title")}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {t("periodclosing.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + {t("periodclosing.newPeriod")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["periods", "summary"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t(`periodclosing.tab.${tab}`)}
          </button>
        ))}
      </div>

      {/* New Period Form */}
      {showNewForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">
            {t("periodclosing.newPeriod")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="period-name"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                {t("periodclosing.periodName")}
              </label>
              <input
                id="period-name"
                type="text"
                value={newPeriod.name}
                onChange={(e) =>
                  setNewPeriod({ ...newPeriod, name: e.target.value })
                }
                placeholder={t("periodclosing.periodNamePlaceholder")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="period-start"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                {t("periodclosing.startDate")}
              </label>
              <input
                id="period-start"
                type="date"
                value={newPeriod.startDate}
                onChange={(e) =>
                  setNewPeriod({ ...newPeriod, startDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="period-end"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                {t("periodclosing.endDate")}
              </label>
              <input
                id="period-end"
                type="date"
                value={newPeriod.endDate}
                onChange={(e) =>
                  setNewPeriod({ ...newPeriod, endDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={handleCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {t("common.save")}
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {activeTab === "periods" && (
        <div className="space-y-4">
          {/* Open Periods */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t("periodclosing.openPeriods")} ({openPeriods.length})
            </h3>
            {openPeriods.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
                {t("periodclosing.noOpenPeriods")}
              </div>
            ) : (
              <div className="space-y-3">
                {openPeriods.map((period) => (
                  <div
                    key={period.id}
                    className="bg-white rounded-xl border border-green-200 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                        <div>
                          <p className="font-semibold text-gray-800">
                            {period.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {period.startDate} → {period.endDate}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                          {t("periodclosing.status.open")}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmCloseId(period.id);
                            setClosingNote("");
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                        >
                          {t("periodclosing.closePeriod")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(period.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Close */}
                    {confirmCloseId === period.id && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-amber-800 mb-3">
                          {t("periodclosing.confirmClose")}
                        </p>
                        <textarea
                          value={closingNote}
                          onChange={(e) => setClosingNote(e.target.value)}
                          placeholder={t(
                            "periodclosing.closingNotePlaceholder",
                          )}
                          rows={2}
                          className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 mb-3"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleClose(period.id)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
                          >
                            {t("periodclosing.confirmCloseBtn")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmCloseId(null)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg"
                          >
                            {t("common.cancel")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Closed Periods */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t("periodclosing.closedPeriods")} ({closedPeriods.length})
            </h3>
            {closedPeriods.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 text-sm">
                {t("periodclosing.noClosedPeriods")}
              </div>
            ) : (
              <div className="space-y-3">
                {closedPeriods.map((period) => (
                  <div
                    key={period.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm opacity-90"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-gray-400 inline-block" />
                        <div>
                          <p className="font-semibold text-gray-700">
                            {period.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {period.startDate} → {period.endDate}
                          </p>
                          {period.closingNote && (
                            <p className="text-xs text-gray-400 mt-1 italic">
                              "{period.closingNote}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-green-600 font-medium">
                            +{period.totalIncome.toLocaleString("tr-TR")} TL{" "}
                            {t("periodclosing.income")}
                          </p>
                          <p className="text-xs text-red-500 font-medium">
                            -{period.totalExpense.toLocaleString("tr-TR")} TL{" "}
                            {t("periodclosing.expense")}
                          </p>
                          <p
                            className={`text-xs font-bold ${
                              period.totalIncome - period.totalExpense >= 0
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            Net:{" "}
                            {(
                              period.totalIncome - period.totalExpense
                            ).toLocaleString("tr-TR")}{" "}
                            TL
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                            {t("periodclosing.status.closed")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleReopen(period.id)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs font-medium px-3 py-1 rounded-lg transition-colors"
                          >
                            {t("periodclosing.reopen")}
                          </button>
                        </div>
                      </div>
                    </div>
                    {period.closedAt && (
                      <p className="text-xs text-gray-400 mt-2">
                        {t("periodclosing.closedAt")}:{" "}
                        {new Date(period.closedAt).toLocaleString("tr-TR")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "summary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {t("periodclosing.totalPeriods")}
              </p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {periods.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {openPeriods.length} {t("periodclosing.status.open")} /{" "}
                {closedPeriods.length} {t("periodclosing.status.closed")}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {t("periodclosing.totalClosedIncome")}
              </p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {totalClosedIncome.toLocaleString("tr-TR")} TL
              </p>
            </div>
            <div className="bg-white rounded-xl border border-red-200 p-5 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {t("periodclosing.totalClosedExpense")}
              </p>
              <p className="text-3xl font-bold text-red-500 mt-1">
                {totalClosedExpense.toLocaleString("tr-TR")} TL
              </p>
              <p
                className={`text-xs font-semibold mt-1 ${
                  totalClosedIncome - totalClosedExpense >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                Net:{" "}
                {(totalClosedIncome - totalClosedExpense).toLocaleString(
                  "tr-TR",
                )}{" "}
                TL
              </p>
            </div>
          </div>

          {closedPeriods.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">
                {t("periodclosing.periodHistory")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">
                        {t("periodclosing.periodName")}
                      </th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">
                        {t("periodclosing.startDate")}
                      </th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">
                        {t("periodclosing.endDate")}
                      </th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">
                        {t("periodclosing.income")}
                      </th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">
                        {t("periodclosing.expense")}
                      </th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">
                        Net
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedPeriods.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="py-2 px-3 font-medium text-gray-800">
                          {p.name}
                        </td>
                        <td className="py-2 px-3 text-gray-600">
                          {p.startDate}
                        </td>
                        <td className="py-2 px-3 text-gray-600">{p.endDate}</td>
                        <td className="py-2 px-3 text-right text-green-600 font-medium">
                          {p.totalIncome.toLocaleString("tr-TR")} TL
                        </td>
                        <td className="py-2 px-3 text-right text-red-500 font-medium">
                          {p.totalExpense.toLocaleString("tr-TR")} TL
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            p.totalIncome - p.totalExpense >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {(p.totalIncome - p.totalExpense).toLocaleString(
                            "tr-TR",
                          )}{" "}
                          TL
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
