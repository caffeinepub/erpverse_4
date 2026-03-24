import { CheckCircle, Package, Plus, RotateCcw, XCircle } from "lucide-react";
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
import { Textarea } from "../components/ui/textarea";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type ReturnReason =
  | "defective"
  | "wrong_product"
  | "customer_change"
  | "damaged"
  | "other";

type ReturnStatus =
  | "requested"
  | "approved"
  | "received"
  | "restocked"
  | "refunded"
  | "rejected";

interface ReturnRecord {
  id: string;
  customerName: string;
  orderRef: string;
  productName: string;
  quantity: number;
  reason: ReturnReason;
  status: ReturnStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  companyId: string;
  userRole: string;
}

const STATUS_COLORS: Record<ReturnStatus, string> = {
  requested: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  approved: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  received: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  restocked: "bg-green-500/20 text-green-300 border-green-500/30",
  refunded: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  rejected: "bg-red-500/20 text-red-300 border-red-500/30",
};

const STATUSES: ReturnStatus[] = [
  "requested",
  "approved",
  "received",
  "restocked",
  "refunded",
  "rejected",
];

const REASONS: ReturnReason[] = [
  "defective",
  "wrong_product",
  "customer_change",
  "damaged",
  "other",
];

export default function ReturnRMAModule({ companyId, userRole }: Props) {
  const { t } = useLanguage();
  const { addLog } = useAuditLog();
  const [returns, setReturns] = useLocalStorage<ReturnRecord[]>(
    `erpverse_returns_${companyId}`,
    [],
  );

  const [filterStatus, setFilterStatus] = useState<ReturnStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    customerName: "",
    orderRef: "",
    productName: "",
    quantity: 1,
    reason: "defective" as ReturnReason,
    notes: "",
  });

  const isReadOnly =
    userRole !== "CompanyOwner" &&
    userRole !== "CompanyManager" &&
    userRole !== "CompanyAdministrator";

  function resetForm() {
    setForm({
      customerName: "",
      orderRef: "",
      productName: "",
      quantity: 1,
      reason: "defective",
      notes: "",
    });
  }

  function handleCreate() {
    if (!form.customerName.trim() || !form.productName.trim()) {
      toast.error(t("common.required") || "Required fields missing");
      return;
    }
    const now = new Date().toISOString();
    const record: ReturnRecord = {
      id: Date.now().toString(),
      customerName: form.customerName.trim(),
      orderRef: form.orderRef.trim(),
      productName: form.productName.trim(),
      quantity: form.quantity,
      reason: form.reason,
      status: "requested",
      notes: form.notes.trim(),
      createdAt: now,
      updatedAt: now,
    };
    setReturns((prev) => [record, ...prev]);
    addLog({
      module: "\u0130ade & RMA",
      action: "create",
      detail: `${form.customerName} - ${form.productName}`,
    });
    toast.success(t("rma.new"));
    resetForm();
    setDialogOpen(false);
  }

  function updateStatus(id: string, newStatus: ReturnStatus) {
    setReturns((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: newStatus, updatedAt: new Date().toISOString() }
          : r,
      ),
    );
    addLog({
      module: "\u0130ade & RMA",
      action: "update",
      detail: `Status: ${newStatus}`,
    });
    toast.success(t(`rma.status.${newStatus}`));
  }

  const filtered =
    filterStatus === "all"
      ? returns
      : returns.filter((r) => r.status === filterStatus);

  const total = returns.length;
  const pending = returns.filter(
    (r) => r.status === "requested" || r.status === "approved",
  ).length;
  const completed = returns.filter(
    (r) => r.status === "restocked" || r.status === "refunded",
  ).length;
  const rejected = returns.filter((r) => r.status === "rejected").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/20 rounded-lg">
            <RotateCcw className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t("rma.title")}</h1>
            <p className="text-slate-400 text-sm">{t("rma.subtitle")}</p>
          </div>
        </div>
        {!isReadOnly && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white"
            data-ocid="rma.open_modal_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("rma.new")}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-white/10">
          <p className="text-slate-400 text-xs mb-1">{t("rma.total")}</p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
        <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
          <p className="text-yellow-300 text-xs mb-1">{t("rma.pending")}</p>
          <p className="text-2xl font-bold text-yellow-300">{pending}</p>
        </div>
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
          <p className="text-green-300 text-xs mb-1">{t("rma.completed")}</p>
          <p className="text-2xl font-bold text-green-300">{completed}</p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <p className="text-red-300 text-xs mb-1">{t("rma.rejected")}</p>
          <p className="text-2xl font-bold text-red-300">{rejected}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "all"
              ? "bg-rose-600 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white border border-white/10"
          }`}
          data-ocid="rma.tab"
        >
          {t("rma.filterAll")}
        </button>
        {STATUSES.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === s
                ? "bg-rose-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white border border-white/10"
            }`}
            data-ocid="rma.tab"
          >
            {t(`rma.status.${s}`)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-slate-400"
            data-ocid="rma.empty_state"
          >
            <Package className="w-10 h-10 mb-3 opacity-50" />
            <p>{t("rma.empty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">
                    {t("rma.customer")}
                  </th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">
                    {t("rma.product")}
                  </th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">
                    {t("rma.quantity")}
                  </th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">
                    {t("rma.reason")}
                  </th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">
                    {t("rma.status")}
                  </th>
                  <th className="text-left p-4 text-slate-400 text-sm font-medium">
                    {t("rma.created")}
                  </th>
                  {!isReadOnly && (
                    <th className="text-left p-4 text-slate-400 text-sm font-medium">
                      Aksiyonlar
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/5 hover:bg-slate-700/30 transition-colors"
                    data-ocid={`rma.item.${idx + 1}`}
                  >
                    <td className="p-4">
                      <div className="text-white font-medium">
                        {r.customerName}
                      </div>
                      {r.orderRef && (
                        <div className="text-slate-400 text-xs">
                          {r.orderRef}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">{r.productName}</td>
                    <td className="p-4 text-slate-300">{r.quantity}</td>
                    <td className="p-4">
                      <span className="text-slate-300 text-sm">
                        {t(`rma.reason.${r.reason}`)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge
                        className={`text-xs border ${STATUS_COLORS[r.status]}`}
                      >
                        {t(`rma.status.${r.status}`)}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">
                      {new Date(r.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    {!isReadOnly && (
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {r.status === "requested" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs px-2"
                                onClick={() => updateStatus(r.id, "approved")}
                                data-ocid={`rma.primary_button.${idx + 1}`}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t("rma.action.approve")}
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs px-2"
                                onClick={() => updateStatus(r.id, "rejected")}
                                data-ocid={`rma.delete_button.${idx + 1}`}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                {t("rma.action.reject")}
                              </Button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <Button
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs px-2"
                              onClick={() => updateStatus(r.id, "received")}
                              data-ocid={`rma.secondary_button.${idx + 1}`}
                            >
                              {t("rma.action.receive")}
                            </Button>
                          )}
                          {r.status === "received" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs px-2"
                                onClick={() => updateStatus(r.id, "restocked")}
                                data-ocid={`rma.primary_button.${idx + 1}`}
                              >
                                {t("rma.action.restock")}
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs px-2"
                                onClick={() => updateStatus(r.id, "refunded")}
                                data-ocid={`rma.secondary_button.${idx + 1}`}
                              >
                                {t("rma.action.refund")}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Return Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white max-w-lg"
          data-ocid="rma.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-400" />
              {t("rma.new")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">
                  {t("rma.customer")} *
                </Label>
                <Input
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, customerName: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white"
                  placeholder={t("rma.customer")}
                  data-ocid="rma.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">
                  {t("rma.orderRef")}
                </Label>
                <Input
                  value={form.orderRef}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, orderRef: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white"
                  placeholder="#INV-001"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">
                  {t("rma.product")} *
                </Label>
                <Input
                  value={form.productName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, productName: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white"
                  placeholder={t("rma.product")}
                  data-ocid="rma.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-sm">
                  {t("rma.quantity")}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      quantity: Number.parseInt(e.target.value) || 1,
                    }))
                  }
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">
                {t("rma.reason")}
              </Label>
              <Select
                value={form.reason}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, reason: v as ReturnReason }))
                }
              >
                <SelectTrigger
                  className="bg-slate-800 border-white/10 text-white"
                  data-ocid="rma.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {REASONS.map((r) => (
                    <SelectItem
                      key={r}
                      value={r}
                      className="text-white hover:bg-slate-700"
                    >
                      {t(`rma.reason.${r}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">{t("rma.notes")}</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white resize-none"
                rows={3}
                data-ocid="rma.textarea"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setDialogOpen(false);
                }}
                className="border-white/10 text-slate-300 hover:text-white hover:bg-slate-700"
                data-ocid="rma.cancel_button"
              >
                {t("common.cancel") || "\u0130ptal"}
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-rose-600 hover:bg-rose-700 text-white"
                data-ocid="rma.submit_button"
              >
                {t("rma.new")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
