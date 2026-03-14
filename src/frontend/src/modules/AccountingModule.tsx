import { DollarSign, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import InvoiceTab from "./InvoiceTab";

type TxType = "income" | "expense";

interface Transaction {
  id: string;
  type: TxType;
  description: string;
  amount: number;
  date: string;
  category: string;
}

type BSCategory =
  | "dönen_varlık"
  | "duran_varlık"
  | "kısa_borç"
  | "uzun_borç"
  | "özkaynak";

interface BSItem {
  id: string;
  name: string;
  amount: number;
  category: BSCategory;
}

interface TaxEntry {
  id: string;
  grossAmount: number;
  rate: number;
  taxAmount: number;
  netAmount: number;
  date: string;
}

// ---- Bank Accounts Sub-Component ----
interface BankAccount {
  id: string;
  bankName: string;
  accountNo: string;
  currency: string;
  balance: number;
}

function BankAccountsTab({
  cid,
  t,
}: { cid: string; t: (k: string) => string }) {
  const [accounts, setAccounts] = useLocalStorage<BankAccount[]>(
    `accounting_bank_accounts_${cid}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    bankName: "",
    accountNo: "",
    currency: "TRY",
    balance: "",
  });

  const addAccount = () => {
    if (!form.bankName.trim() || !form.accountNo.trim()) return;
    setAccounts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        bankName: form.bankName,
        accountNo: form.accountNo,
        currency: form.currency,
        balance: Number(form.balance) || 0,
      },
    ]);
    setForm({ bankName: "", accountNo: "", currency: "TRY", balance: "" });
    setShowDialog(false);
  };

  const fmt = (n: number, currency: string) =>
    n.toLocaleString("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    });

  const totalTRY = accounts
    .filter((a) => a.currency === "TRY")
    .reduce((s, a) => s + a.balance, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
          <p className="text-slate-400 text-xs">
            {t("accounting.currentBalance")} (TRY)
          </p>
          <p className="text-xl font-bold text-blue-400">
            {totalTRY.toLocaleString("tr-TR", {
              style: "currency",
              currency: "TRY",
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setShowDialog(true)}
          data-ocid="accounting.bank.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("accounting.addAccount")}
        </Button>
      </div>
      {accounts.length === 0 ? (
        <div
          className="text-center py-12 text-slate-500"
          data-ocid="accounting.bank.empty_state"
        >
          {t("accounting.bankEmpty")}
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="accounting.bank.list"
        >
          {accounts.map((acc, i) => (
            <div
              key={acc.id}
              className="bg-slate-800 rounded-xl border border-white/5 p-4"
              data-ocid={`accounting.bank.card.${i + 1}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-semibold">{acc.bankName}</p>
                <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                  {acc.currency}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-mono mb-3">
                {acc.accountNo}
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                {fmt(acc.balance, acc.currency)}
              </p>
            </div>
          ))}
        </div>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-900 border-slate-700 text-white max-w-md"
          data-ocid="accounting.bank.dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("accounting.addAccount")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.bankName")}
              </Label>
              <Input
                value={form.bankName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bankName: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="accounting.bank.name.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.accountNo")}
              </Label>
              <Input
                value={form.accountNo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, accountNo: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white font-mono"
                data-ocid="accounting.bank.accountno.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("accounting.currency")}
                </Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
                >
                  <SelectTrigger
                    className="bg-white/10 border-white/20 text-white"
                    data-ocid="accounting.bank.currency.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="TRY" className="text-white">
                      TRY ₺
                    </SelectItem>
                    <SelectItem value="USD" className="text-white">
                      USD $
                    </SelectItem>
                    <SelectItem value="EUR" className="text-white">
                      EUR €
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("accounting.openingBalance")}
                </Label>
                <Input
                  type="number"
                  value={form.balance}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, balance: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="accounting.bank.balance.input"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="accounting.bank.cancel_button"
              >
                İptal
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={addAccount}
                data-ocid="accounting.bank.save_button"
              >
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Kasa (Cash Register) Sub-Component ----
interface KasaEntry {
  id: string;
  date: string;
  description: string;
  type: "Giriş" | "Çıkış";
  amount: number;
  balance: number;
}

function KasaTab({ cid, t }: { cid: string; t: (k: string) => string }) {
  const [entries, setEntries] = useLocalStorage<KasaEntry[]>(
    `accounting_kasa_${cid}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    date: "",
    description: "",
    type: "Giriş" as "Giriş" | "Çıkış",
    amount: "",
  });

  const totalBalance = entries.reduce(
    (bal, e) => (e.type === "Giriş" ? bal + e.amount : bal - e.amount),
    0,
  );

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    });

  const addEntry = () => {
    if (!form.description.trim() || !form.amount) return;
    const prevBal =
      entries.length > 0 ? entries[entries.length - 1].balance : 0;
    const amount = Number(form.amount);
    const newBal = form.type === "Giriş" ? prevBal + amount : prevBal - amount;
    setEntries((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        date: form.date || new Date().toISOString().slice(0, 10),
        description: form.description,
        type: form.type,
        amount,
        balance: newBal,
      },
    ]);
    setForm({ date: "", description: "", type: "Giriş", amount: "" });
    setShowDialog(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div
          className={`rounded-xl px-4 py-2 border ${totalBalance >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}
        >
          <p className="text-slate-400 text-xs">
            {t("accounting.cashBalance")}
          </p>
          <p
            className={`text-xl font-bold ${totalBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}
          >
            {fmt(totalBalance)}
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setShowDialog(true)}
          data-ocid="accounting.kasa.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("accounting.cashEntry")}
        </Button>
      </div>
      {entries.length === 0 ? (
        <div
          className="text-center py-12 text-slate-500"
          data-ocid="accounting.kasa.empty_state"
        >
          {t("accounting.kasaEmpty")}
        </div>
      ) : (
        <div
          className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
          data-ocid="accounting.kasa.table"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.date")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.description")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.type")}
                </th>
                <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.amount")}
                </th>
                <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.cashBalance")}
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr
                  key={e.id}
                  className="border-b border-white/5 last:border-0"
                  data-ocid={`accounting.kasa.row.${i + 1}`}
                >
                  <td className="px-4 py-3 text-slate-400 text-sm">{e.date}</td>
                  <td className="px-4 py-3 text-white text-sm">
                    {e.description}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${e.type === "Giriş" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}
                    >
                      {e.type}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-sm font-semibold ${e.type === "Giriş" ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {e.type === "Giriş" ? "+" : "-"}
                    {fmt(e.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 text-sm font-medium">
                    {fmt(e.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-900 border-slate-700 text-white max-w-md"
          data-ocid="accounting.kasa.dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("accounting.cashEntry")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.date")}
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="accounting.kasa.date.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.description")}
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="accounting.kasa.desc.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("accounting.type")}
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, type: v as "Giriş" | "Çıkış" }))
                  }
                >
                  <SelectTrigger
                    className="bg-white/10 border-white/20 text-white"
                    data-ocid="accounting.kasa.type.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="Giriş" className="text-white">
                      {t("accounting.cashIn")}
                    </SelectItem>
                    <SelectItem value="Çıkış" className="text-white">
                      {t("accounting.cashOut")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("accounting.amount")}
                </Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, amount: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="accounting.kasa.amount.input"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="accounting.kasa.cancel_button"
              >
                İptal
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={addEntry}
                data-ocid="accounting.kasa.save_button"
              >
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Bank Reconciliation Sub-Component ----
function ReconciliationTab({
  cid,
  t,
  transactions,
}: {
  cid: string;
  t: (k: string) => string;
  transactions: {
    id: string;
    type: string;
    description: string;
    amount: number;
    date: string;
  }[];
}) {
  const storageKey = `accounting_reconciliation_${cid}`;
  const getReconciled = (): Record<string, boolean> => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  };
  const [reconciled, setReconciledState] = useState<Record<string, boolean>>(
    getReconciled(),
  );

  const toggleReconcile = (id: string) => {
    setReconciledState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    });

  const reconciledAmt = transactions
    .filter((tx) => reconciled[tx.id])
    .reduce((s, tx) => s + tx.amount, 0);
  const unreconciledAmt = transactions
    .filter((tx) => !reconciled[tx.id])
    .reduce((s, tx) => s + tx.amount, 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-xs">
            {t("accounting.reconciledTotal")}
          </p>
          <p className="text-xl font-bold text-emerald-400">
            {fmt(reconciledAmt)}
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-xs">
            {t("accounting.unreconciledTotal")}
          </p>
          <p className="text-xl font-bold text-amber-400">
            {fmt(unreconciledAmt)}
          </p>
        </div>
      </div>
      {transactions.length === 0 ? (
        <div
          className="text-center py-12 text-slate-500"
          data-ocid="accounting.recon.empty_state"
        >
          {t("accounting.reconEmpty")}
        </div>
      ) : (
        <div
          className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
          data-ocid="accounting.recon.table"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.date")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.description")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.type")}
                </th>
                <th className="text-right text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.amount")}
                </th>
                <th className="text-center text-slate-400 text-xs font-medium px-4 py-3">
                  {t("accounting.reconciledLabel")}
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr
                  key={tx.id}
                  className={`border-b border-white/5 last:border-0 ${reconciled[tx.id] ? "opacity-60" : ""}`}
                  data-ocid={`accounting.recon.row.${i + 1}`}
                >
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {tx.date}
                  </td>
                  <td className="px-4 py-3 text-white text-sm">
                    {tx.description}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${tx.type === "income" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}
                    >
                      {tx.type === "income"
                        ? t("accounting.income")
                        : t("accounting.expense")}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right text-sm font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {fmt(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!reconciled[tx.id]}
                      onChange={() => toggleReconcile(tx.id)}
                      className="w-4 h-4 accent-emerald-500 cursor-pointer"
                      data-ocid={`accounting.recon.checkbox.${i + 1}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AccountingModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";

  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    `erpverse_accounting_${cid}`,
    [],
  );
  const [bsItems, setBsItems] = useLocalStorage<BSItem[]>(
    `erpverse_bs_${cid}`,
    [],
  );
  const [taxEntries, setTaxEntries] = useLocalStorage<TaxEntry[]>(
    `erpverse_tax_${cid}`,
    [],
  );

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    type: "income" as TxType,
    description: "",
    amount: "",
    date: "",
    category: "",
  });

  const [showBSDialog, setShowBSDialog] = useState(false);
  const [bsForm, setBsForm] = useState({
    name: "",
    amount: "",
    category: "dönen_varlık" as BSCategory,
  });

  const [taxForm, setTaxForm] = useState({ grossAmount: "", rate: "18" });
  const [taxCalc, setTaxCalc] = useState<{ tax: number; net: number } | null>(
    null,
  );

  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((s, tx) => s + tx.amount, 0);
  const balance = totalIncome - totalExpense;

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    });

  const handleSave = () => {
    if (!form.description.trim() || !form.amount) return;
    setTransactions((prev) => [
      {
        id: Date.now().toString(),
        type: form.type,
        description: form.description,
        amount: Number(form.amount),
        date: form.date || new Date().toISOString().slice(0, 10),
        category: form.category || "Genel",
      },
      ...prev,
    ]);
    setForm({
      type: "income",
      description: "",
      amount: "",
      date: "",
      category: "",
    });
    setShowDialog(false);
  };

  const saveBSItem = () => {
    if (!bsForm.name.trim() || !bsForm.amount) return;
    setBsItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: bsForm.name,
        amount: Number(bsForm.amount),
        category: bsForm.category,
      },
    ]);
    setBsForm({ name: "", amount: "", category: "dönen_varlık" });
    setShowBSDialog(false);
  };

  const deleteBSItem = (id: string) =>
    setBsItems((prev) => prev.filter((i) => i.id !== id));

  const calculateTax = () => {
    const gross = Number(taxForm.grossAmount);
    const rate = Number(taxForm.rate);
    if (!gross) return;
    const tax = (gross * rate) / 100;
    const net = gross + tax;
    setTaxCalc({ tax, net });
    setTaxEntries((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        grossAmount: gross,
        rate,
        taxAmount: tax,
        netAmount: net,
        date: new Date().toISOString().slice(0, 10),
      },
    ]);
  };

  // Balance sheet totals
  const totalAssets = bsItems
    .filter(
      (i) => i.category === "dönen_varlık" || i.category === "duran_varlık",
    )
    .reduce((s, i) => s + i.amount, 0);
  const totalLiabilities = bsItems
    .filter(
      (i) =>
        i.category === "kısa_borç" ||
        i.category === "uzun_borç" ||
        i.category === "özkaynak",
    )
    .reduce((s, i) => s + i.amount, 0);

  // Income statement grouped
  const incomeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === "income")
      incomeByCategory[tx.category] =
        (incomeByCategory[tx.category] || 0) + tx.amount;
    else
      expenseByCategory[tx.category] =
        (expenseByCategory[tx.category] || 0) + tx.amount;
  }
  const grossProfit = totalIncome - totalExpense;
  const netProfit = grossProfit; // simplified

  const bsCategoryLabel: Record<BSCategory, string> = {
    dönen_varlık: "Dönen Varlık",
    duran_varlık: "Duran Varlık",
    kısa_borç: "Kısa Vadeli Borç",
    uzun_borç: "Uzun Vadeli Borç",
    özkaynak: "Özkaynak",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            {t("accounting.title")}
          </h2>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <p className="text-slate-400 text-xs">{t("accounting.income")}</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {fmt(totalIncome)}
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <p className="text-slate-400 text-xs">{t("accounting.expense")}</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{fmt(totalExpense)}</p>
        </div>
        <div
          className={`${balance >= 0 ? "bg-blue-500/10 border-blue-500/20" : "bg-orange-500/10 border-orange-500/20"} border rounded-xl p-4`}
        >
          <p className="text-slate-400 text-xs mb-1">
            {t("accounting.balance")}
          </p>
          <p
            className={`text-2xl font-bold ${balance >= 0 ? "text-blue-400" : "text-orange-400"}`}
          >
            {fmt(balance)}
          </p>
        </div>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="bg-slate-800 border border-white/5 mb-6">
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            data-ocid="accounting.transactions.tab"
          >
            {t("accounting.transactions")}
          </TabsTrigger>
          <TabsTrigger
            value="balance"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            data-ocid="accounting.balance.tab"
          >
            {t("accounting.balanceSheet")}
          </TabsTrigger>
          <TabsTrigger
            value="income"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            data-ocid="accounting.income.tab"
          >
            {t("accounting.incomeStatement")}
          </TabsTrigger>
          <TabsTrigger
            value="tax"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            data-ocid="accounting.tax.tab"
          >
            {t("accounting.tax")}
          </TabsTrigger>
          <TabsTrigger
            value="bank"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            data-ocid="accounting.bank.tab"
          >
            {t("accounting.bankAccounts")}
          </TabsTrigger>
          <TabsTrigger
            value="kasa"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            data-ocid="accounting.kasa.tab"
          >
            {t("accounting.kasa")}
          </TabsTrigger>
          <TabsTrigger
            value="reconciliation"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            data-ocid="accounting.reconciliation.tab"
          >
            {t("accounting.bankReconciliation")}
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-slate-400"
            data-ocid="accounting.invoices.tab"
          >
            {t("invoice.invoices")}
          </TabsTrigger>
        </TabsList>

        {/* ---- İşlemler ---- */}
        <TabsContent value="transactions">
          <div className="flex justify-end mb-4">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowDialog(true)}
              data-ocid="accounting.add_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("accounting.addTransaction")}
            </Button>
          </div>
          <div
            className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
            data-ocid="accounting.table"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                    {t("accounting.type")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                    {t("accounting.description")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                    {t("accounting.category")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                    {t("accounting.date")}
                  </th>
                  <th className="text-right text-slate-400 text-xs font-medium px-5 py-3">
                    {t("accounting.amount")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div
                        className="text-center py-10 text-slate-500"
                        data-ocid="accounting.empty_state"
                      >
                        <p className="text-sm">
                          {t("accounting.noTransactions") || "Henüz işlem yok"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                {transactions.map((tx, i) => (
                  <tr
                    key={tx.id}
                    className={`border-b border-white/5 last:border-0 ${tx.type === "income" ? "hover:bg-emerald-500/5" : "hover:bg-red-500/5"}`}
                    data-ocid={`accounting.row.${i + 1}`}
                  >
                    <td className="px-5 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${tx.type === "income" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}
                      >
                        {t(`accounting.${tx.type}`)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-white text-sm">
                      {tx.description}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm">
                      {tx.category}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-sm">
                      {tx.date}
                    </td>
                    <td
                      className={`px-5 py-3 text-right font-semibold text-sm ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {fmt(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ---- Bilanço ---- */}
        <TabsContent value="balance">
          <div className="flex justify-end mb-4">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowBSDialog(true)}
              data-ocid="accounting.bs.add_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("accounting.addItem")}
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets */}
            <div className="bg-slate-800 rounded-xl border border-white/5 p-5">
              <h3 className="text-emerald-400 font-semibold mb-3">
                {t("accounting.assets")}
              </h3>
              {bsItems
                .filter(
                  (i) =>
                    i.category === "dönen_varlık" ||
                    i.category === "duran_varlık",
                )
                .map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    data-ocid={`accounting.bs.asset.row.${idx + 1}`}
                  >
                    <div>
                      <p className="text-white text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {bsCategoryLabel[item.category]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-300 font-semibold">
                        {fmt(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteBSItem(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        data-ocid={`accounting.bs.asset.delete_button.${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                <span className="text-slate-400 text-sm">
                  {t("accounting.assets")} Toplam
                </span>
                <span className="text-emerald-400 font-bold">
                  {fmt(totalAssets)}
                </span>
              </div>
            </div>
            {/* Liabilities + Equity */}
            <div className="bg-slate-800 rounded-xl border border-white/5 p-5">
              <h3 className="text-red-400 font-semibold mb-3">
                {t("accounting.liabilities")} + {t("accounting.equity")}
              </h3>
              {bsItems
                .filter(
                  (i) =>
                    i.category === "kısa_borç" ||
                    i.category === "uzun_borç" ||
                    i.category === "özkaynak",
                )
                .map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    data-ocid={`accounting.bs.liab.row.${idx + 1}`}
                  >
                    <div>
                      <p className="text-white text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        {bsCategoryLabel[item.category]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-red-300 font-semibold">
                        {fmt(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteBSItem(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                        data-ocid={`accounting.bs.liab.delete_button.${idx + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                <span className="text-slate-400 text-sm">
                  Borç+Özkaynak Toplam
                </span>
                <span className="text-red-400 font-bold">
                  {fmt(totalLiabilities)}
                </span>
              </div>
            </div>
          </div>
          {bsItems.length > 0 && (
            <div
              className={`mt-4 p-4 rounded-xl border ${Math.abs(totalAssets - totalLiabilities) < 1 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"}`}
            >
              <p
                className={`text-sm font-semibold ${Math.abs(totalAssets - totalLiabilities) < 1 ? "text-emerald-300" : "text-amber-300"}`}
              >
                {Math.abs(totalAssets - totalLiabilities) < 1
                  ? "✓ Bilanço dengeli"
                  : `⚠ Fark: ${fmt(Math.abs(totalAssets - totalLiabilities))}`}
              </p>
            </div>
          )}
        </TabsContent>

        {/* ---- Gelir Tablosu ---- */}
        <TabsContent value="income">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl border border-white/5 p-5">
              <h3 className="text-emerald-400 font-semibold mb-3">
                {t("accounting.income")} ({t("accounting.category")})
              </h3>
              {Object.entries(incomeByCategory).map(([cat, amt], idx) => (
                <div
                  key={cat}
                  className="flex justify-between py-2 border-b border-white/5 last:border-0"
                  data-ocid={`accounting.income.cat.row.${idx + 1}`}
                >
                  <span className="text-slate-300 text-sm">{cat}</span>
                  <span className="text-emerald-300 font-semibold">
                    {fmt(amt)}
                  </span>
                </div>
              ))}
              {Object.keys(incomeByCategory).length === 0 && (
                <p className="text-slate-500 text-sm">Henüz gelir yok</p>
              )}
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                <span className="text-slate-400 text-sm">Toplam Gelir</span>
                <span className="text-emerald-400 font-bold">
                  {fmt(totalIncome)}
                </span>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-white/5 p-5">
              <h3 className="text-red-400 font-semibold mb-3">
                {t("accounting.expense")} ({t("accounting.category")})
              </h3>
              {Object.entries(expenseByCategory).map(([cat, amt], idx) => (
                <div
                  key={cat}
                  className="flex justify-between py-2 border-b border-white/5 last:border-0"
                  data-ocid={`accounting.expense.cat.row.${idx + 1}`}
                >
                  <span className="text-slate-300 text-sm">{cat}</span>
                  <span className="text-red-300 font-semibold">{fmt(amt)}</span>
                </div>
              ))}
              {Object.keys(expenseByCategory).length === 0 && (
                <p className="text-slate-500 text-sm">Henüz gider yok</p>
              )}
              <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                <span className="text-slate-400 text-sm">Toplam Gider</span>
                <span className="text-red-400 font-bold">
                  {fmt(totalExpense)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">
                {t("accounting.grossProfit")}
              </p>
              <p
                className={`text-2xl font-bold ${grossProfit >= 0 ? "text-blue-400" : "text-orange-400"}`}
              >
                {fmt(grossProfit)}
              </p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-1">
                {t("accounting.netProfit")}
              </p>
              <p
                className={`text-2xl font-bold ${netProfit >= 0 ? "text-purple-400" : "text-orange-400"}`}
              >
                {fmt(netProfit)}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ---- Vergi ---- */}
        <TabsContent value="tax">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-800 rounded-xl border border-white/5 p-5">
              <h3 className="text-amber-400 font-semibold mb-4">
                KDV Hesaplama
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300 text-sm">
                    {t("accounting.taxRate")}
                  </Label>
                  <Select
                    value={taxForm.rate}
                    onValueChange={(v) =>
                      setTaxForm((p) => ({ ...p, rate: v }))
                    }
                  >
                    <SelectTrigger
                      className="bg-slate-700 border-white/10 text-white mt-1"
                      data-ocid="accounting.tax.rate.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10">
                      <SelectItem value="8" className="text-white">
                        %8
                      </SelectItem>
                      <SelectItem value="18" className="text-white">
                        %18
                      </SelectItem>
                      <SelectItem value="20" className="text-white">
                        %20
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300 text-sm">
                    {t("accounting.grossAmount")}
                  </Label>
                  <Input
                    type="number"
                    value={taxForm.grossAmount}
                    onChange={(e) =>
                      setTaxForm((p) => ({ ...p, grossAmount: e.target.value }))
                    }
                    className="bg-slate-700 border-white/10 text-white mt-1"
                    data-ocid="accounting.tax.gross.input"
                  />
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={calculateTax}
                  data-ocid="accounting.tax.calculate_button"
                >
                  {t("accounting.calculate")}
                </Button>
                {taxCalc && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-xs text-slate-400">
                        {t("accounting.taxAmount")}
                      </p>
                      <p className="text-amber-300 font-bold">
                        {fmt(taxCalc.tax)}
                      </p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-xs text-slate-400">
                        {t("accounting.netAmount")}
                      </p>
                      <p className="text-blue-300 font-bold">
                        {fmt(taxCalc.net)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-white/5 p-5">
              <h3 className="text-amber-400 font-semibold mb-3">
                Vergi Geçmişi
              </h3>
              {taxEntries.length === 0 ? (
                <p
                  className="text-slate-500 text-sm"
                  data-ocid="accounting.tax.empty_state"
                >
                  Henüz hesaplama yok
                </p>
              ) : (
                <div className="space-y-2">
                  {taxEntries
                    .slice()
                    .reverse()
                    .map((e, idx) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between py-2 border-b border-white/5"
                        data-ocid={`accounting.tax.row.${idx + 1}`}
                      >
                        <div>
                          <p className="text-white text-sm">
                            {fmt(e.grossAmount)} × %{e.rate}
                          </p>
                          <p className="text-xs text-slate-500">{e.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-300 text-sm">
                            KDV: {fmt(e.taxAmount)}
                          </p>
                          <p className="text-slate-400 text-xs">
                            Net: {fmt(e.netAmount)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        {/* ---- Banka Hesapları ---- */}
        <TabsContent value="bank">
          <BankAccountsTab cid={cid} t={t} />
        </TabsContent>

        {/* ---- Kasa ---- */}
        <TabsContent value="kasa">
          <KasaTab cid={cid} t={t} />
        </TabsContent>

        {/* ---- Banka Mutabakatı ---- */}
        <TabsContent value="reconciliation">
          <ReconciliationTab cid={cid} t={t} transactions={transactions} />
        </TabsContent>

        {/* ---- Faturalar ---- */}
        <TabsContent value="invoices">
          <InvoiceTab
            cid={cid}
            t={t}
            onCreateIncomeEntry={(description, amount) => {
              setTransactions((prev) => [
                {
                  id: Date.now().toString(),
                  type: "income",
                  description,
                  amount,
                  date: new Date().toISOString().slice(0, 10),
                  category: "Fatura Geliri",
                },
                ...prev,
              ]);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="accounting.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("accounting.addTransaction")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.type")}
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as TxType }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="accounting.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="income" className="text-white">
                    {t("accounting.income")}
                  </SelectItem>
                  <SelectItem value="expense" className="text-white">
                    {t("accounting.expense")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.description")}
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="accounting.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.amount")}
              </Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.category")}
              </Label>
              <Input
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.date")}
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="accounting.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleSave}
                data-ocid="accounting.save_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Sheet Item Dialog */}
      <Dialog open={showBSDialog} onOpenChange={setShowBSDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="accounting.bs.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("accounting.addItem")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.description")}
              </Label>
              <Input
                value={bsForm.name}
                onChange={(e) =>
                  setBsForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="accounting.bs.name.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.amount")}
              </Label>
              <Input
                type="number"
                value={bsForm.amount}
                onChange={(e) =>
                  setBsForm((p) => ({ ...p, amount: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="accounting.bs.amount.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("accounting.category")}
              </Label>
              <Select
                value={bsForm.category}
                onValueChange={(v) =>
                  setBsForm((p) => ({ ...p, category: v as BSCategory }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="accounting.bs.category.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {(
                    Object.entries(bsCategoryLabel) as [BSCategory, string][]
                  ).map(([k, v]) => (
                    <SelectItem key={k} value={k} className="text-white">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowBSDialog(false)}
                data-ocid="accounting.bs.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={saveBSItem}
                data-ocid="accounting.bs.save_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
