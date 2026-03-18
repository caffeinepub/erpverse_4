import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface BankStatement {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  matched: boolean;
  matchedEntryId?: string;
}

interface AccountingEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  matched: boolean;
  matchedStatementId?: string;
}

const STORAGE_KEY_STATEMENTS = "erpverse_bank_statements";

export default function BankReconciliationModule() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<
    "statements" | "reconcile" | "summary"
  >("statements");
  const [statements, setStatements] = useState<BankStatement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STATEMENTS);
    return saved ? JSON.parse(saved) : [];
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: "",
    description: "",
    amount: "",
    type: "credit" as "credit" | "debit",
  });
  const [selectedStatement, setSelectedStatement] = useState<string | null>(
    null,
  );
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  const accountingEntries: AccountingEntry[] = (() => {
    const companyId = localStorage.getItem("erpverse_selected_company");
    const entries = JSON.parse(
      localStorage.getItem(`erpverse_accounting_${companyId}`) || "[]",
    );
    return entries.map((e: any) => ({
      id: e.id,
      date: e.date,
      description: e.description,
      amount: Number.parseFloat(e.amount) || 0,
      type: e.type === "income" ? "income" : "expense",
      matched: statements.some((s) => s.matchedEntryId === e.id),
      matchedStatementId: statements.find((s) => s.matchedEntryId === e.id)?.id,
    }));
  })();

  const saveStatements = (data: BankStatement[]) => {
    setStatements(data);
    localStorage.setItem(STORAGE_KEY_STATEMENTS, JSON.stringify(data));
  };

  const addStatement = () => {
    if (!form.date || !form.description || !form.amount) return;
    const newStatement: BankStatement = {
      id: Date.now().toString(),
      date: form.date,
      description: form.description,
      amount: Number.parseFloat(form.amount),
      type: form.type,
      matched: false,
    };
    saveStatements([...statements, newStatement]);
    setForm({ date: "", description: "", amount: "", type: "credit" });
    setShowForm(false);
  };

  const deleteStatement = (id: string) => {
    saveStatements(statements.filter((s) => s.id !== id));
  };

  const matchEntries = () => {
    if (!selectedStatement || !selectedEntry) return;
    const updated = statements.map((s) =>
      s.id === selectedStatement
        ? { ...s, matched: true, matchedEntryId: selectedEntry }
        : s,
    );
    saveStatements(updated);
    setSelectedStatement(null);
    setSelectedEntry(null);
  };

  const unmatch = (statementId: string) => {
    const updated = statements.map((s) =>
      s.id === statementId
        ? { ...s, matched: false, matchedEntryId: undefined }
        : s,
    );
    saveStatements(updated);
  };

  const totalBank = statements.reduce(
    (sum, s) => (s.type === "credit" ? sum + s.amount : sum - s.amount),
    0,
  );
  const totalAccounting = accountingEntries.reduce(
    (sum, e) => (e.type === "income" ? sum + e.amount : sum - e.amount),
    0,
  );
  const difference = totalBank - totalAccounting;
  const matchedCount = statements.filter((s) => s.matched).length;
  const unmatchedCount = statements.filter((s) => !s.matched).length;

  const tabs = [
    { id: "statements" as const, label: t("bank.statements") },
    { id: "reconcile" as const, label: t("bank.reconcile") },
    { id: "summary" as const, label: t("bank.summary") },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("bank.title")}</h1>
        <p className="text-slate-400 text-sm mt-1">{t("bank.subtitle")}</p>
      </div>

      <div className="flex gap-2 border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "statements" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 text-sm">
              {statements.length} {t("bank.records")}
            </span>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              + {t("bank.addStatement")}
            </button>
          </div>

          {showForm && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bank-date" className="text-slate-400 text-xs">
                    {t("bank.date")}
                  </label>
                  <input
                    id="bank-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="bank-type" className="text-slate-400 text-xs">
                    {t("bank.type")}
                  </label>
                  <select
                    id="bank-type"
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as "credit" | "debit",
                      })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
                  >
                    <option value="credit">{t("bank.credit")}</option>
                    <option value="debit">{t("bank.debit")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="bank-desc" className="text-slate-400 text-xs">
                  {t("bank.description")}
                </label>
                <input
                  id="bank-desc"
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
                />
              </div>
              <div>
                <label htmlFor="bank-amount" className="text-slate-400 text-xs">
                  {t("bank.amount")}
                </label>
                <input
                  id="bank-amount"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm mt-1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addStatement}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm"
                >
                  {t("bank.save")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm"
                >
                  {t("bank.cancel")}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {statements.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                {t("bank.noData")}
              </div>
            ) : (
              statements.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${s.matched ? "bg-green-400" : "bg-yellow-400"}`}
                    />
                    <div>
                      <p className="text-white text-sm font-medium">
                        {s.description}
                      </p>
                      <p className="text-slate-400 text-xs">{s.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-bold ${s.type === "credit" ? "text-green-400" : "text-red-400"}`}
                    >
                      {s.type === "credit" ? "+" : "-"}
                      {s.amount.toLocaleString()} ₺
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${s.matched ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}
                    >
                      {s.matched ? t("bank.matched") : t("bank.unmatched")}
                    </span>
                    {s.matched && (
                      <button
                        type="button"
                        onClick={() => unmatch(s.id)}
                        className="text-slate-400 hover:text-white text-xs"
                      >
                        {t("bank.unmatch")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteStatement(s.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "reconcile" && (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">{t("bank.reconcileHint")}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-white font-semibold mb-2">
                {t("bank.bankStatements")}
              </h3>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {statements
                  .filter((s) => !s.matched)
                  .map((s) => (
                    <div
                      key={s.id}
                      onKeyDown={(e) => e.key === "Enter" && void 0}
                      onClick={() =>
                        setSelectedStatement(
                          s.id === selectedStatement ? null : s.id,
                        )
                      }
                      className={`p-2 rounded cursor-pointer border text-sm ${
                        selectedStatement === s.id
                          ? "border-blue-500 bg-blue-900/30 text-white"
                          : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>{s.description}</span>
                        <span
                          className={
                            s.type === "credit"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {s.type === "credit" ? "+" : "-"}
                          {s.amount.toLocaleString()} ₺
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{s.date}</div>
                    </div>
                  ))}
                {statements.filter((s) => !s.matched).length === 0 && (
                  <div className="text-slate-500 text-sm text-center py-4">
                    {t("bank.allMatched")}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">
                {t("bank.accountingEntries")}
              </h3>
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {accountingEntries
                  .filter((e) => !e.matched)
                  .map((e) => (
                    <div
                      key={e.id}
                      onKeyDown={(e) => e.key === "Enter" && void 0}
                      onClick={() =>
                        setSelectedEntry(e.id === selectedEntry ? null : e.id)
                      }
                      className={`p-2 rounded cursor-pointer border text-sm ${
                        selectedEntry === e.id
                          ? "border-blue-500 bg-blue-900/30 text-white"
                          : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex justify-between">
                        <span>{e.description}</span>
                        <span
                          className={
                            e.type === "income"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {e.type === "income" ? "+" : "-"}
                          {e.amount.toLocaleString()} ₺
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{e.date}</div>
                    </div>
                  ))}
                {accountingEntries.filter((e) => !e.matched).length === 0 && (
                  <div className="text-slate-500 text-sm text-center py-4">
                    {t("bank.noEntries")}
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={matchEntries}
            disabled={!selectedStatement || !selectedEntry}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg text-sm font-medium"
          >
            {t("bank.matchSelected")}
          </button>
        </div>
      )}

      {activeTab === "summary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm">{t("bank.bankBalance")}</p>
              <p
                className={`text-2xl font-bold mt-1 ${totalBank >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {totalBank.toLocaleString()} ₺
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm">
                {t("bank.accountingBalance")}
              </p>
              <p
                className={`text-2xl font-bold mt-1 ${totalAccounting >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                {totalAccounting.toLocaleString()} ₺
              </p>
            </div>
          </div>
          <div
            className={`border rounded-xl p-4 ${
              Math.abs(difference) < 0.01
                ? "bg-green-900/20 border-green-700"
                : "bg-yellow-900/20 border-yellow-700"
            }`}
          >
            <p className="text-slate-300 text-sm">{t("bank.difference")}</p>
            <p
              className={`text-3xl font-bold mt-1 ${Math.abs(difference) < 0.01 ? "text-green-400" : "text-yellow-400"}`}
            >
              {difference.toLocaleString()} ₺
            </p>
            <p className="text-slate-400 text-xs mt-2">
              {Math.abs(difference) < 0.01
                ? t("bank.balanced")
                : t("bank.notBalanced")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-green-400 text-2xl font-bold">
                {matchedCount}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {t("bank.matchedCount")}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-yellow-400 text-2xl font-bold">
                {unmatchedCount}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                {t("bank.unmatchedCount")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
