import { AlertCircle, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Invoice {
  id: string;
  customerName: string;
  description: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
}

function getStatusColor(status: InvoiceStatus) {
  switch (status) {
    case "draft":
      return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    case "sent":
      return "bg-blue-500/15 text-blue-300 border-blue-500/30";
    case "paid":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "overdue":
      return "bg-red-500/15 text-red-300 border-red-500/30";
  }
}

export default function InvoiceTab({
  cid,
  t,
  onCreateIncomeEntry,
}: {
  cid: string;
  t: (k: string) => string;
  onCreateIncomeEntry: (description: string, amount: number) => void;
}) {
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>(
    `erp_invoices_${cid}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | "all">(
    "all",
  );
  const [form, setForm] = useState({
    customerName: "",
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

  // Auto-detect overdue invoices every render
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    let changed = false;
    const updated = invoices.map((inv) => {
      if (
        inv.status !== "paid" &&
        inv.status !== "overdue" &&
        inv.dueDate &&
        inv.dueDate < today
      ) {
        changed = true;
        return { ...inv, status: "overdue" as InvoiceStatus };
      }
      return inv;
    });
    if (changed) {
      setInvoices(updated);
      const overdueCount = updated.filter((i) => i.status === "overdue").length;
      addNotification({
        type: "info",
        title: t("invoice.overdueAlert"),
        message: `${overdueCount} ${t("invoice.overdueCount")}`,
        companyId: cid,
        targetRole: "manager",
      });
    }
  }, [invoices.length]);

  const handleAdd = () => {
    if (!form.customerName.trim() || !form.amount || !form.dueDate) return;
    const newInv: Invoice = {
      id: Date.now().toString(),
      customerName: form.customerName,
      description: form.description,
      amount: Number(form.amount),
      dueDate: form.dueDate,
      status: "draft",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setInvoices((prev) => [newInv, ...prev]);
    addLog({
      action: t("invoice.create_invoice"),
      module: "Accounting",
      detail: `${form.customerName} - ${fmt(Number(form.amount))}`,
    });
    toast.success(t("invoice.create_invoice"));
    setForm({ customerName: "", description: "", amount: "", dueDate: "" });
    setShowDialog(false);
  };

  const handlePay = (inv: Invoice) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === inv.id ? { ...i, status: "paid" } : i)),
    );
    onCreateIncomeEntry(
      `${t("invoice.invoice_management")}: ${inv.customerName} - ${inv.description}`,
      inv.amount,
    );
    addLog({
      action: t("invoice.mark_paid"),
      module: "Accounting",
      detail: `${inv.customerName} - ${fmt(inv.amount)}`,
    });
    toast.success(t("invoice.mark_paid"));
  };

  const handleDelete = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const handleStatusChange = (id: string, status: InvoiceStatus) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i)),
    );
  };

  const filtered =
    filterStatus === "all"
      ? invoices
      : invoices.filter((i) => i.status === filterStatus);

  const totalAmount = invoices.reduce((s, i) => s + i.amount, 0);
  const paidAmount = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amount, 0);
  const overdueAmount = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amount, 0);
  const paidPct =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const statusLabels: Record<InvoiceStatus, string> = {
    draft: t("invoice.draft"),
    sent: t("invoice.sent"),
    paid: t("invoice.paid"),
    overdue: t("invoice.overdue"),
  };

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
          <p className="text-slate-400 text-xs mb-1">
            {t("invoice.total_invoices")}
          </p>
          <p className="text-2xl font-bold text-white">{fmt(totalAmount)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {invoices.length} {t("invoice.invoices")}
          </p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <p className="text-slate-400 text-xs mb-1">
            {t("invoice.paid_total")}
          </p>
          <p className="text-2xl font-bold text-emerald-400">
            {fmt(paidAmount)}
          </p>
          <Progress value={paidPct} className="mt-2 h-1.5 bg-slate-700" />
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <p className="text-slate-400 text-xs mb-1">
            {t("invoice.overdue_total")}
          </p>
          <p className="text-2xl font-bold text-red-400">
            {fmt(overdueAmount)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {invoices.filter((i) => i.status === "overdue").length}{" "}
            {t("invoice.overdue")}
          </p>
        </div>
      </div>

      {/* Filter + Add */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {(["all", "draft", "sent", "paid", "overdue"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s as InvoiceStatus | "all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
              data-ocid="invoice.filter.tab"
            >
              {s === "all" ? t("common.all") : statusLabels[s as InvoiceStatus]}
            </button>
          ))}
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => setShowDialog(true)}
          data-ocid="invoice.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t("invoice.create_invoice")}
        </Button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="invoice.empty_state"
        >
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>{t("common.noData")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv, i) => (
            <div
              key={inv.id}
              className={`flex items-center justify-between bg-slate-800 rounded-xl px-5 py-4 border ${
                inv.status === "overdue"
                  ? "border-red-500/30"
                  : "border-white/5"
              }`}
              data-ocid={`invoice.item.${i + 1}`}
            >
              <div className="flex items-start gap-3">
                {inv.status === "overdue" && (
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-white font-medium">{inv.customerName}</p>
                  <p className="text-slate-400 text-xs">{inv.description}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {t("invoice.due_date")}: {inv.dueDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-white font-bold">{fmt(inv.amount)}</p>
                  <p className="text-xs text-slate-500">{inv.createdAt}</p>
                </div>
                <Select
                  value={inv.status}
                  onValueChange={(v) =>
                    handleStatusChange(inv.id, v as InvoiceStatus)
                  }
                >
                  <SelectTrigger
                    className="h-7 w-32 bg-transparent border-0 p-0"
                    data-ocid={`invoice.status.select.${i + 1}`}
                  >
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(inv.status)}`}
                    >
                      {statusLabels[inv.status]}
                    </Badge>
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="draft" className="text-white text-xs">
                      {t("invoice.draft")}
                    </SelectItem>
                    <SelectItem value="sent" className="text-white text-xs">
                      {t("invoice.sent")}
                    </SelectItem>
                    <SelectItem value="paid" className="text-white text-xs">
                      {t("invoice.paid")}
                    </SelectItem>
                    <SelectItem value="overdue" className="text-white text-xs">
                      {t("invoice.overdue")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {inv.status !== "paid" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 px-3 text-xs"
                    onClick={() => handlePay(inv)}
                    data-ocid={`invoice.primary_button.${i + 1}`}
                  >
                    {t("invoice.mark_paid")}
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(inv.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  data-ocid={`invoice.delete_button.${i + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="invoice.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("invoice.create_invoice")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("invoice.customer_name")}
              </Label>
              <Input
                value={form.customerName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customerName: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="invoice.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("invoice.description")}
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("invoice.amount")}
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
                  {t("invoice.due_date")}
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
              data-ocid="invoice.cancel_button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAdd}
              data-ocid="invoice.submit_button"
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
