import { CheckCircle, Clock, Plus, Receipt, XCircle } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useLanguage } from "../contexts/LanguageContext";

interface Expense {
  id: string;
  companyId: string;
  userId: string;
  userName: string;
  category: string;
  amount: number;
  currency: "TRY" | "USD" | "EUR";
  date: string;
  description: string;
  receiptNote: string;
  status: "pending" | "approved" | "rejected";
  rejectionNote: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseModuleProps {
  mode: "manager" | "employee";
}

const CATEGORIES = [
  "Seyahat",
  "Yemek",
  "Yakıt",
  "Konaklama",
  "Kırtasiye",
  "Diğer",
];

export default function ExpenseModule({ mode }: ExpenseModuleProps) {
  const { t } = useLanguage();

  const companyRaw = localStorage.getItem("erp_currentCompany") || "{}";
  const companyId = (() => {
    try {
      return JSON.parse(companyRaw).id || "";
    } catch {
      return "";
    }
  })();

  const userRaw = localStorage.getItem("erp_currentUser") || "{}";
  const currentUser = (() => {
    try {
      return JSON.parse(userRaw);
    } catch {
      return { id: "", displayName: "" };
    }
  })();

  const STORAGE_KEY = "erp_expenses";

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const all: Expense[] = saved ? JSON.parse(saved) : [];
      return all.filter((e) => e.companyId === companyId);
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<"list" | "new">("list");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [rejectNoteId, setRejectNoteId] = useState<string | null>(null);
  const [rejectNoteText, setRejectNoteText] = useState("");

  // Form state
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"TRY" | "USD" | "EUR">("TRY");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [receiptNote, setReceiptNote] = useState("");
  const [formError, setFormError] = useState("");

  const saveAll = (updated: Expense[]) => {
    // Merge with expenses from other companies
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const all: Expense[] = saved ? JSON.parse(saved) : [];
      const others = all.filter((e) => e.companyId !== companyId);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([...others, ...updated]),
      );
    } catch {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    setExpenses(updated);
  };

  const handleCreate = () => {
    setFormError("");
    if (!amount || Number(amount) <= 0) {
      setFormError(t("expense.invalidAmount") || "Geçerli bir tutar girin");
      return;
    }
    if (!description.trim()) {
      setFormError(t("expense.descriptionRequired") || "Açıklama gereklidir");
      return;
    }

    const newExpense: Expense = {
      id: `exp_${Date.now()}`,
      companyId,
      userId: currentUser.id,
      userName: currentUser.displayName || currentUser.id,
      category,
      amount: Number(amount),
      currency,
      date,
      description: description.trim(),
      receiptNote: receiptNote.trim(),
      status: "pending",
      rejectionNote: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveAll([newExpense, ...expenses]);
    setAmount("");
    setDescription("");
    setReceiptNote("");
    setCategory(CATEGORIES[0]);
    setCurrency("TRY");
    setDate(new Date().toISOString().split("T")[0]);
    setActiveTab("list");
  };

  const handleApprove = (id: string) => {
    const updated = expenses.map((e) =>
      e.id === id
        ? {
            ...e,
            status: "approved" as const,
            updatedAt: new Date().toISOString(),
          }
        : e,
    );
    saveAll(updated);

    // Accounting integration
    const exp = expenses.find((e) => e.id === id);
    if (exp) {
      try {
        const acKey = "erp_accounting_entries";
        const acSaved = localStorage.getItem(acKey);
        const entries = acSaved ? JSON.parse(acSaved) : [];
        entries.push({
          id: `acc_exp_${Date.now()}`,
          date: exp.date,
          type: "expense",
          category: "Masraf",
          description: `${exp.category} - ${exp.description} (${exp.userName})`,
          amount: exp.amount,
          currency: exp.currency,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(acKey, JSON.stringify(entries));
      } catch {
        // ignore
      }
    }
  };

  const handleReject = (id: string) => {
    const updated = expenses.map((e) =>
      e.id === id
        ? {
            ...e,
            status: "rejected" as const,
            rejectionNote: rejectNoteText,
            updatedAt: new Date().toISOString(),
          }
        : e,
    );
    saveAll(updated);
    setRejectNoteId(null);
    setRejectNoteText("");
  };

  const displayedExpenses = expenses.filter((e) => {
    if (mode === "employee" && e.userId !== currentUser.id) return false;
    if (filterStatus === "all") return true;
    return e.status === filterStatus;
  });

  const pendingTotal = expenses
    .filter(
      (e) =>
        e.status === "pending" &&
        (mode === "manager" || e.userId === currentUser.id),
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const approvedTotal = expenses
    .filter(
      (e) =>
        e.status === "approved" &&
        (mode === "manager" || e.userId === currentUser.id),
    )
    .reduce((sum, e) => sum + e.amount, 0);

  const rejectedCount = expenses.filter(
    (e) =>
      e.status === "rejected" &&
      (mode === "manager" || e.userId === currentUser.id),
  ).length;

  const getStatusBadge = (status: Expense["status"]) => {
    const map: Record<Expense["status"], { label: string; className: string }> =
      {
        pending: {
          label: t("expense.pending") || "Bekliyor",
          className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        },
        approved: {
          label: t("expense.approved") || "Onaylandı",
          className: "bg-green-500/20 text-green-400 border-green-500/30",
        },
        rejected: {
          label: t("expense.rejected") || "Reddedildi",
          className: "bg-red-500/20 text-red-400 border-red-500/30",
        },
      };
    return map[status];
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="w-6 h-6 text-orange-400" />
          <h2 className="text-xl font-bold text-white">
            {t("expense.title") || "Masraf & Harcama Yönetimi"}
          </h2>
        </div>
        {mode === "employee" && (
          <Button
            onClick={() => setActiveTab(activeTab === "new" ? "list" : "new")}
            className="bg-orange-500 hover:bg-orange-600 text-white"
            data-ocid="expense.open_modal_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("expense.newExpense") || "Yeni Masraf"}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">
              {t("expense.pendingTotal") || "Bekleyen Toplam"}
            </span>
          </div>
          <p className="text-2xl font-bold text-white">
            {pendingTotal.toLocaleString("tr-TR")} ₺
          </p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">
              {t("expense.approvedTotal") || "Onaylanan Toplam"}
            </span>
          </div>
          <p className="text-2xl font-bold text-white">
            {approvedTotal.toLocaleString("tr-TR")} ₺
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">
              {t("expense.rejectedCount") || "Reddedilen"}
            </span>
          </div>
          <p className="text-2xl font-bold text-white">{rejectedCount}</p>
        </div>
      </div>

      {/* New Expense Form */}
      {mode === "employee" && activeTab === "new" && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 space-y-4">
          <h3 className="text-white font-semibold text-lg">
            {t("expense.newExpense") || "Yeni Masraf Talebi"}
          </h3>
          {formError && (
            <p className="text-red-400 text-sm" data-ocid="expense.error_state">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-slate-300">
                {t("expense.category") || "Kategori"}
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm"
                data-ocid="expense.select"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">
                {t("expense.currency") || "Para Birimi"}
              </Label>
              <select
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value as "TRY" | "USD" | "EUR")
                }
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm"
                data-ocid="expense.select"
              >
                <option value="TRY">TRY ₺</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">
                {t("expense.amount") || "Tutar"}
              </Label>
              <Input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="bg-slate-700 border-slate-600 text-white"
                data-ocid="expense.input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">
                {t("expense.date") || "Tarih"}
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                data-ocid="expense.input"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">
              {t("expense.description") || "Açıklama"}
            </Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                t("expense.descriptionPlaceholder") || "Masraf açıklaması..."
              }
              className="bg-slate-700 border-slate-600 text-white"
              data-ocid="expense.input"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300">
              {t("expense.receiptNote") || "Fiş/Makbuz Notu"}
            </Label>
            <Textarea
              value={receiptNote}
              onChange={(e) => setReceiptNote(e.target.value)}
              placeholder={
                t("expense.receiptNotePlaceholder") ||
                "Fiş numarası veya not..."
              }
              className="bg-slate-700 border-slate-600 text-white resize-none"
              rows={2}
              data-ocid="expense.textarea"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setActiveTab("list")}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              data-ocid="expense.cancel_button"
            >
              {t("common.cancel") || "İptal"}
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              data-ocid="expense.submit_button"
            >
              {t("expense.submit") || "Gönder"}
            </Button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s
                ? "bg-orange-500 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
            data-ocid="expense.tab"
          >
            {s === "all" && (t("expense.all") || "Tümü")}
            {s === "pending" && (t("expense.pending") || "Bekliyor")}
            {s === "approved" && (t("expense.approved") || "Onaylandı")}
            {s === "rejected" && (t("expense.rejected") || "Reddedildi")}
          </button>
        ))}
      </div>

      {/* Expense List */}
      {displayedExpenses.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="expense.empty_state"
        >
          <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("expense.noExpenses") || "Kayıt bulunamadı"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedExpenses.map((expense, idx) => {
            const badge = getStatusBadge(expense.status);
            return (
              <div
                key={expense.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4"
                data-ocid={`expense.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-medium">
                        {expense.category}
                      </span>
                      <Badge className={badge.className}>{badge.label}</Badge>
                      {mode === "manager" && (
                        <span className="text-slate-400 text-xs">
                          {expense.userName}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm truncate">
                      {expense.description}
                    </p>
                    {expense.receiptNote && (
                      <p className="text-slate-500 text-xs mt-1">
                        {expense.receiptNote}
                      </p>
                    )}
                    {expense.status === "rejected" && expense.rejectionNote && (
                      <p className="text-red-400 text-xs mt-1">
                        {t("expense.rejectionNote") || "Red sebebi"}:{" "}
                        {expense.rejectionNote}
                      </p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      {expense.date}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold">
                      {expense.amount.toLocaleString("tr-TR")}{" "}
                      {expense.currency}
                    </p>
                    {mode === "manager" && expense.status === "pending" && (
                      <div className="flex gap-2 mt-2 justify-end">
                        {rejectNoteId === expense.id ? (
                          <div className="flex flex-col gap-2 items-end">
                            <Input
                              value={rejectNoteText}
                              onChange={(e) =>
                                setRejectNoteText(e.target.value)
                              }
                              placeholder={
                                t("expense.rejectReason") ||
                                "Red sebebi (opsiyonel)"
                              }
                              className="bg-slate-700 border-slate-600 text-white text-xs w-48"
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRejectNoteId(null);
                                  setRejectNoteText("");
                                }}
                                className="border-slate-600 text-slate-300 text-xs"
                                data-ocid={`expense.cancel_button.${idx + 1}`}
                              >
                                {t("common.cancel") || "İptal"}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleReject(expense.id)}
                                className="bg-red-500 hover:bg-red-600 text-white text-xs"
                                data-ocid={`expense.delete_button.${idx + 1}`}
                              >
                                {t("expense.confirmReject") || "Reddet"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(expense.id)}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs"
                              data-ocid={`expense.confirm_button.${idx + 1}`}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {t("expense.approve") || "Onayla"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectNoteId(expense.id)}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-xs"
                              data-ocid={`expense.delete_button.${idx + 1}`}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              {t("expense.reject") || "Reddet"}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
