import { CalendarCheck, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { useAuditLog } from "../contexts/AuditLogContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Contract {
  id: string;
  title: string;
  counterparty: string;
}

interface Milestone {
  id: string;
  contractId: string;
  description: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
}

export default function PaymentScheduleTab({
  cid,
  t,
  contracts,
  onCreateIncomeEntry,
}: {
  cid: string;
  t: (k: string) => string;
  contracts: Contract[];
  onCreateIncomeEntry: (description: string, amount: number) => void;
}) {
  const { addLog } = useAuditLog();
  const [milestones, setMilestones] = useLocalStorage<Milestone[]>(
    `erp_contract_milestones_${cid}`,
    [],
  );
  const [selectedContractId, setSelectedContractId] = useState<string>(
    contracts[0]?.id || "",
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    dueDate: "",
  });

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    });

  const contractMilestones = milestones.filter(
    (m) => m.contractId === selectedContractId,
  );

  const selectedContract = contracts.find((c) => c.id === selectedContractId);

  const handleAdd = () => {
    if (
      !form.description.trim() ||
      !form.amount ||
      !form.dueDate ||
      !selectedContractId
    )
      return;
    const newM: Milestone = {
      id: Date.now().toString(),
      contractId: selectedContractId,
      description: form.description,
      amount: Number(form.amount),
      dueDate: form.dueDate,
      paid: false,
    };
    setMilestones((prev) => [...prev, newM]);
    addLog({
      action: t("payment_schedule.add_milestone"),
      module: "Contracts",
      detail: `${selectedContract?.title} - ${form.description} - ${fmt(Number(form.amount))}`,
    });
    setForm({ description: "", amount: "", dueDate: "" });
    setShowDialog(false);
  };

  const handlePay = (m: Milestone) => {
    setMilestones((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
              ...x,
              paid: true,
              paidDate: new Date().toISOString().slice(0, 10),
            }
          : x,
      ),
    );
    onCreateIncomeEntry(
      `${t("payment_schedule.milestone")}: ${selectedContract?.title} - ${m.description}`,
      m.amount,
    );
    addLog({
      action: t("payment_schedule.mark_milestone_paid"),
      module: "Contracts",
      detail: `${selectedContract?.title} - ${m.description} - ${fmt(m.amount)}`,
    });
    toast.success(t("payment_schedule.mark_milestone_paid"));
  };

  const handleDelete = (id: string) =>
    setMilestones((prev) => prev.filter((m) => m.id !== id));

  const today = new Date().toISOString().slice(0, 10);
  const totalAmount = contractMilestones.reduce((s, m) => s + m.amount, 0);
  const paidAmount = contractMilestones
    .filter((m) => m.paid)
    .reduce((s, m) => s + m.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div>
      {/* Contract selector */}
      <div className="mb-6">
        <Label className="text-slate-300 text-sm mb-2 block">
          {t("payment_schedule.select_contract")}
        </Label>
        {contracts.length === 0 ? (
          <p className="text-slate-500 text-sm">{t("common.noData")}</p>
        ) : (
          <Select
            value={selectedContractId}
            onValueChange={setSelectedContractId}
          >
            <SelectTrigger
              className="bg-slate-800 border-white/10 text-white w-80"
              data-ocid="payment_schedule.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              {contracts.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-white">
                  {c.title} - {c.counterparty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedContractId && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-xs mb-1">
                {t("payment_schedule.total")}
              </p>
              <p className="text-xl font-bold text-white">{fmt(totalAmount)}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
              <p className="text-slate-400 text-xs mb-1">
                {t("payment_schedule.paid")}
              </p>
              <p className="text-xl font-bold text-emerald-400">
                {fmt(paidAmount)}
              </p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
              <p className="text-slate-400 text-xs mb-1">
                {t("payment_schedule.pending")}
              </p>
              <p className="text-xl font-bold text-amber-400">
                {fmt(pendingAmount)}
              </p>
            </div>
          </div>

          {/* Add button */}
          <div className="flex justify-end mb-4">
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => setShowDialog(true)}
              data-ocid="payment_schedule.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("payment_schedule.add_milestone")}
            </Button>
          </div>

          {/* Milestones list */}
          {contractMilestones.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500 bg-slate-800 rounded-xl border border-white/5"
              data-ocid="payment_schedule.empty_state"
            >
              <CalendarCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t("common.noData")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contractMilestones.map((m, i) => {
                const isOverdue = !m.paid && m.dueDate < today;
                return (
                  <div
                    key={m.id}
                    className={`flex items-center justify-between bg-slate-800 rounded-xl px-5 py-4 border ${
                      isOverdue
                        ? "border-red-500/30"
                        : m.paid
                          ? "border-emerald-500/20"
                          : "border-white/5"
                    }`}
                    data-ocid={`payment_schedule.item.${i + 1}`}
                  >
                    <div>
                      <p className="text-white font-medium">{m.description}</p>
                      <p className="text-slate-400 text-xs">
                        {t("invoice.due_date")}: {m.dueDate}
                        {m.paidDate &&
                          ` · ${t("payment_schedule.paid_on")}: ${m.paidDate}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-white font-bold">{fmt(m.amount)}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          m.paid
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                            : isOverdue
                              ? "bg-red-500/15 text-red-300 border-red-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {m.paid
                          ? t("invoice.paid")
                          : isOverdue
                            ? t("invoice.overdue")
                            : t("payment_schedule.pending")}
                      </Badge>
                      {!m.paid && (
                        <Button
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-white h-7 px-3 text-xs"
                          onClick={() => handlePay(m)}
                          data-ocid={`payment_schedule.primary_button.${i + 1}`}
                        >
                          {t("payment_schedule.mark_milestone_paid")}
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        data-ocid={`payment_schedule.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Milestone Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="payment_schedule.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("payment_schedule.add_milestone")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("payment_schedule.milestone_description")}
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="payment_schedule.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("payment_schedule.milestone_amount")}
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
                  {t("payment_schedule.milestone_due")}
                </Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dueDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              className="text-slate-400"
              onClick={() => setShowDialog(false)}
              data-ocid="payment_schedule.cancel_button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={handleAdd}
              data-ocid="payment_schedule.submit_button"
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
