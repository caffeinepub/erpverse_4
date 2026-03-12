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
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type TxType = "income" | "expense";

interface Transaction {
  id: string;
  type: TxType;
  description: string;
  amount: number;
  date: string;
  category: string;
}

export default function AccountingModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>(
    `erpverse_accounting_${company?.id || "default"}`,
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

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            {t("accounting.title")}
          </h2>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setShowDialog(true)}
          data-ocid="accounting.add_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("accounting.addTransaction")}
        </Button>
      </div>

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
                <td className="px-5 py-3 text-slate-400 text-sm">{tx.date}</td>
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
    </div>
  );
}
