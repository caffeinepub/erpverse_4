import {
  ChevronDown,
  ChevronUp,
  Plus,
  Scale,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
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
import { useLanguage } from "../contexts/LanguageContext";

interface CariTransaction {
  id: string;
  accountId: string;
  accountType: "customer" | "supplier";
  type: "Fatura" | "Ödeme" | "İade" | "Virman";
  direction: "borc" | "alacak";
  amount: number;
  description: string;
  date: string;
}

interface CariAccount {
  id: string;
  name: string;
  type: "customer" | "supplier";
}

interface Props {
  companyId: string;
  userId: string;
  userRole: string;
}

const translations: Record<string, Record<string, string>> = {
  "cari.title": { TR: "Cari Hesap Yönetimi", EN: "Account Balances" },
  "cari.totalReceivable": { TR: "Toplam Alacak", EN: "Total Receivables" },
  "cari.totalPayable": { TR: "Toplam Borç", EN: "Total Payables" },
  "cari.netPosition": { TR: "Net Pozisyon", EN: "Net Position" },
  "cari.customers": { TR: "Müşteri Cari", EN: "Customer Accounts" },
  "cari.suppliers": { TR: "Tedarikçi Cari", EN: "Supplier Accounts" },
  "cari.debit": { TR: "Borç", EN: "Debit" },
  "cari.credit": { TR: "Alacak", EN: "Credit" },
  "cari.balance": { TR: "Net Bakiye", EN: "Net Balance" },
  "cari.addTransaction": { TR: "İşlem Ekle", EN: "Add Transaction" },
  "cari.date": { TR: "Tarih", EN: "Date" },
  "cari.type": { TR: "Tür", EN: "Type" },
  "cari.description": { TR: "Açıklama", EN: "Description" },
  "cari.amount": { TR: "Tutar", EN: "Amount" },
  "cari.direction": { TR: "Yön", EN: "Direction" },
  "cari.directionDebit": { TR: "Borç", EN: "Debit" },
  "cari.directionCredit": { TR: "Alacak", EN: "Credit" },
  "cari.noAccounts": {
    TR: "Henüz hesap bulunamadı. CRM ve Satın Alma modüllerinden müşteri/tedarikçi ekleyin.",
    EN: "No accounts found. Add customers/suppliers via CRM and Purchasing modules.",
  },
  "cari.noTransactions": {
    TR: "İşlem bulunamadı",
    EN: "No transactions found",
  },
  "cari.runningBalance": { TR: "Bakiye", EN: "Balance" },
  "cari.creditStatus": { TR: "Alacaklı", EN: "Credit" },
  "cari.debitStatus": { TR: "Borçlu", EN: "Debit" },
  "cari.zeroStatus": { TR: "Sıfır", EN: "Zero" },
};

export default function CariHesapModule({ companyId }: Props) {
  const { language } = useLanguage();
  const lang = language === "tr" ? "TR" : "EN";

  const t = (key: string) => translations[key]?.[lang] ?? key;

  const storageKey = `cari_hesap_${companyId}`;

  const [transactions, setTransactions] = useState<CariTransaction[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  });

  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CariAccount | null>(
    null,
  );

  const [form, setForm] = useState({
    type: "Fatura" as CariTransaction["type"],
    amount: "",
    direction: "borc" as "borc" | "alacak",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const accounts = useMemo<CariAccount[]>(() => {
    const result: CariAccount[] = [];
    try {
      const customers = JSON.parse(
        localStorage.getItem("crm_customers") || "[]",
      );
      for (const c of customers) {
        result.push({ id: c.id, name: c.company || c.name, type: "customer" });
      }
    } catch {}
    try {
      const suppliers = JSON.parse(
        localStorage.getItem("purchasing_suppliers") || "[]",
      );
      for (const s of suppliers) {
        result.push({ id: s.id, name: s.name, type: "supplier" });
      }
    } catch {}
    return result;
  }, []);

  const customerAccounts = accounts.filter((a) => a.type === "customer");
  const supplierAccounts = accounts.filter((a) => a.type === "supplier");

  function getAccountBalance(accountId: string) {
    const txs = transactions.filter((t) => t.accountId === accountId);
    let borc = 0;
    let alacak = 0;
    for (const tx of txs) {
      if (tx.direction === "borc") borc += tx.amount;
      else alacak += tx.amount;
    }
    return { borc, alacak, net: alacak - borc };
  }

  const totals = useMemo(() => {
    function calcNet(accountId: string) {
      let b = 0;
      let a = 0;
      for (const tx of transactions) {
        if (tx.accountId !== accountId) continue;
        if (tx.direction === "borc") b += tx.amount;
        else a += tx.amount;
      }
      return a - b;
    }
    let totalReceivable = 0;
    let totalPayable = 0;
    for (const acc of customerAccounts) {
      const net = calcNet(acc.id);
      if (net > 0) totalReceivable += net;
      else totalPayable += Math.abs(net);
    }
    for (const acc of supplierAccounts) {
      const net = calcNet(acc.id);
      if (net < 0) totalPayable += Math.abs(net);
      else totalReceivable += net;
    }
    return {
      totalReceivable,
      totalPayable,
      net: totalReceivable - totalPayable,
    };
  }, [transactions, customerAccounts, supplierAccounts]);

  function saveTransactions(txs: CariTransaction[]) {
    setTransactions(txs);
    localStorage.setItem(storageKey, JSON.stringify(txs));
  }

  function handleAddTransaction() {
    if (!selectedAccount || !form.amount || !form.date) return;
    const tx: CariTransaction = {
      id: Date.now().toString(),
      accountId: selectedAccount.id,
      accountType: selectedAccount.type,
      type: form.type,
      direction: form.direction,
      amount: Number.parseFloat(form.amount),
      description: form.description,
      date: form.date,
    };
    saveTransactions([...transactions, tx]);
    setShowAddModal(false);
    setForm({
      type: "Fatura",
      amount: "",
      direction: "borc",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  }

  function openAddModal(account: CariAccount) {
    setSelectedAccount(account);
    setShowAddModal(true);
  }

  function getRunningBalance(accountId: string) {
    const txs = transactions
      .filter((t) => t.accountId === accountId)
      .sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    return txs.map((tx) => {
      if (tx.direction === "alacak") running += tx.amount;
      else running -= tx.amount;
      return { ...tx, running };
    });
  }

  function formatCurrency(n: number) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(n);
  }

  function AccountList({ accs }: { accs: CariAccount[] }) {
    if (accs.length === 0) {
      return (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="cari.empty_state"
        >
          <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("cari.noAccounts")}</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {accs.map((acc, i) => {
          const { borc, alacak, net } = getAccountBalance(acc.id);
          const isExpanded = expandedAccount === acc.id;
          const txsWithBalance = getRunningBalance(acc.id);

          let badgeClass = "bg-slate-600/30 text-slate-400 border-slate-600/40";
          let statusText = t("cari.zeroStatus");
          if (net > 0) {
            badgeClass =
              "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
            statusText = t("cari.creditStatus");
          } else if (net < 0) {
            badgeClass = "bg-red-500/20 text-red-300 border-red-500/30";
            statusText = t("cari.debitStatus");
          }

          return (
            <div
              key={acc.id}
              className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
              data-ocid={`cari.item.${i + 1}`}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors text-left"
                onClick={() => setExpandedAccount(isExpanded ? null : acc.id)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-slate-400"
                    data-ocid={`cari.toggle.${i + 1}`}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-white font-medium">{acc.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500">{t("cari.debit")}</p>
                    <p className="text-red-300 font-mono text-sm">
                      {formatCurrency(borc)}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500">{t("cari.credit")}</p>
                    <p className="text-emerald-300 font-mono text-sm">
                      {formatCurrency(alacak)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {t("cari.balance")}
                    </p>
                    <p
                      className={`font-mono text-sm font-semibold ${
                        net > 0
                          ? "text-emerald-300"
                          : net < 0
                            ? "text-red-300"
                            : "text-slate-400"
                      }`}
                    >
                      {formatCurrency(net)}
                    </p>
                  </div>
                  <Badge className={`text-xs border ${badgeClass}`}>
                    {statusText}
                  </Badge>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-white/5 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-300">
                      {t("cari.date")} / {t("cari.type")} /{" "}
                      {t("cari.description")}
                    </h4>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      onClick={() => openAddModal(acc)}
                      data-ocid={`cari.add_transaction.${i + 1}`}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {t("cari.addTransaction")}
                    </Button>
                  </div>

                  {txsWithBalance.length === 0 ? (
                    <p
                      className="text-slate-500 text-sm text-center py-4"
                      data-ocid={`cari.no_transactions.${i + 1}`}
                    >
                      {t("cari.noTransactions")}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="text-left text-slate-500 text-xs font-medium py-2 pr-4">
                              {t("cari.date")}
                            </th>
                            <th className="text-left text-slate-500 text-xs font-medium py-2 pr-4">
                              {t("cari.type")}
                            </th>
                            <th className="text-left text-slate-500 text-xs font-medium py-2 pr-4">
                              {t("cari.description")}
                            </th>
                            <th className="text-right text-slate-500 text-xs font-medium py-2 pr-4">
                              {t("cari.debit")}
                            </th>
                            <th className="text-right text-slate-500 text-xs font-medium py-2 pr-4">
                              {t("cari.credit")}
                            </th>
                            <th className="text-right text-slate-500 text-xs font-medium py-2">
                              {t("cari.runningBalance")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {txsWithBalance.map((tx, ti) => (
                            <tr
                              key={tx.id}
                              className="border-b border-white/5 last:border-0"
                              data-ocid={`cari.transaction.${ti + 1}`}
                            >
                              <td className="py-2 pr-4 text-slate-400">
                                {tx.date}
                              </td>
                              <td className="py-2 pr-4">
                                <Badge
                                  variant="outline"
                                  className="text-xs border-slate-600 text-slate-300"
                                >
                                  {tx.type}
                                </Badge>
                              </td>
                              <td className="py-2 pr-4 text-slate-300">
                                {tx.description || "-"}
                              </td>
                              <td className="py-2 pr-4 text-right font-mono">
                                {tx.direction === "borc" ? (
                                  <span className="text-red-300">
                                    {formatCurrency(tx.amount)}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="py-2 pr-4 text-right font-mono">
                                {tx.direction === "alacak" ? (
                                  <span className="text-emerald-300">
                                    {formatCurrency(tx.amount)}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td
                                className={`py-2 text-right font-mono font-medium ${
                                  tx.running > 0
                                    ? "text-emerald-300"
                                    : tx.running < 0
                                      ? "text-red-300"
                                      : "text-slate-400"
                                }`}
                              >
                                {formatCurrency(tx.running)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Scale className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">{t("cari.title")}</h2>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 rounded-xl p-5 border border-emerald-500/20"
          data-ocid="cari.receivable_card"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-emerald-300 text-sm font-medium">
              {t("cari.totalReceivable")}
            </p>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {formatCurrency(totals.totalReceivable)}
          </p>
        </div>

        <div
          className="bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-xl p-5 border border-red-500/20"
          data-ocid="cari.payable_card"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-300 text-sm font-medium">
              {t("cari.totalPayable")}
            </p>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {formatCurrency(totals.totalPayable)}
          </p>
        </div>

        <div
          className={`rounded-xl p-5 border ${
            totals.net >= 0
              ? "bg-gradient-to-br from-indigo-900/40 to-indigo-800/20 border-indigo-500/20"
              : "bg-gradient-to-br from-orange-900/40 to-orange-800/20 border-orange-500/20"
          }`}
          data-ocid="cari.net_card"
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className={`text-sm font-medium ${
                totals.net >= 0 ? "text-indigo-300" : "text-orange-300"
              }`}
            >
              {t("cari.netPosition")}
            </p>
            <Scale
              className={`w-5 h-5 ${
                totals.net >= 0 ? "text-indigo-400" : "text-orange-400"
              }`}
            />
          </div>
          <p
            className={`text-2xl font-bold font-mono ${
              totals.net >= 0 ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {formatCurrency(totals.net)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="customers" data-ocid="cari.tabs">
        <TabsList className="bg-slate-800 border border-white/10 mb-6">
          <TabsTrigger
            value="customers"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
            data-ocid="cari.customers_tab"
          >
            {t("cari.customers")} ({customerAccounts.length})
          </TabsTrigger>
          <TabsTrigger
            value="suppliers"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400"
            data-ocid="cari.suppliers_tab"
          >
            {t("cari.suppliers")} ({supplierAccounts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <AccountList accs={customerAccounts} />
        </TabsContent>
        <TabsContent value="suppliers">
          <AccountList accs={supplierAccounts} />
        </TabsContent>
      </Tabs>

      {/* Add Transaction Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="cari.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("cari.addTransaction")} — {selectedAccount?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cari.date")}
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="cari.date_input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cari.type")}
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as CariTransaction["type"] }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="cari.type_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {(["Fatura", "Ödeme", "İade", "Virman"] as const).map(
                    (tp) => (
                      <SelectItem
                        key={tp}
                        value={tp}
                        className="text-white hover:bg-white/10"
                      >
                        {tp}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cari.direction")}
              </Label>
              <Select
                value={form.direction}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, direction: v as "borc" | "alacak" }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="cari.direction_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem
                    value="borc"
                    className="text-white hover:bg-white/10"
                  >
                    {t("cari.directionDebit")}
                  </SelectItem>
                  <SelectItem
                    value="alacak"
                    className="text-white hover:bg-white/10"
                  >
                    {t("cari.directionCredit")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cari.amount")}
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="0.00"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                data-ocid="cari.amount_input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cari.description")}
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="..."
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                data-ocid="cari.description_input"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowAddModal(false)}
                data-ocid="cari.cancel_button"
              >
                İptal
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAddTransaction}
                disabled={!form.amount || !form.date}
                data-ocid="cari.submit_button"
              >
                {t("cari.addTransaction")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
