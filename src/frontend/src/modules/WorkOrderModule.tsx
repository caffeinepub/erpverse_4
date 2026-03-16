import { ClipboardList, Edit, Plus, Trash2, X } from "lucide-react";
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

import { useLanguage } from "../contexts/LanguageContext";

interface WorkOrderMaterial {
  id: string;
  name: string;
  quantity: string;
}

interface WorkOrder {
  id: string;
  woNo: string;
  title: string;
  description: string;
  status: "pending" | "inprogress" | "completed" | "cancelled";
  priority: "normal" | "high" | "critical";
  assigned: string;
  dueDate: string;
  materials: WorkOrderMaterial[];
  createdAt: string;
}

function getCompanyId(): string {
  try {
    const sc = localStorage.getItem("selectedCompany");
    if (sc) return JSON.parse(sc).id;
  } catch {}
  return "default";
}

function getWorkOrders(companyId: string): WorkOrder[] {
  try {
    const stored = localStorage.getItem(`workOrders_${companyId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveWorkOrders(companyId: string, orders: WorkOrder[]) {
  localStorage.setItem(`workOrders_${companyId}`, JSON.stringify(orders));
}

function generateWoNo(orders: WorkOrder[]): string {
  const num = orders.length + 1;
  return `WO-${String(num).padStart(4, "0")}`;
}

const defaultForm = {
  title: "",
  description: "",
  status: "pending" as WorkOrder["status"],
  priority: "normal" as WorkOrder["priority"],
  assigned: "",
  dueDate: "",
  materials: [] as WorkOrderMaterial[],
};

export default function WorkOrderModule() {
  const { t } = useLanguage();

  const companyId = getCompanyId();
  const [orders, setOrders] = useState<WorkOrder[]>(() =>
    getWorkOrders(companyId),
  );
  const [filter, setFilter] = useState<"all" | WorkOrder["status"]>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  function openAdd() {
    setForm(defaultForm);
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(order: WorkOrder) {
    setForm({
      title: order.title,
      description: order.description,
      status: order.status,
      priority: order.priority,
      assigned: order.assigned,
      dueDate: order.dueDate,
      materials: order.materials,
    });
    setEditingId(order.id);
    setDialogOpen(true);
  }

  function saveOrder() {
    if (!form.title.trim()) return;
    let updated: WorkOrder[];
    if (editingId) {
      updated = orders.map((o) => (o.id === editingId ? { ...o, ...form } : o));
    } else {
      const newOrder: WorkOrder = {
        id: Date.now().toString(),
        woNo: generateWoNo(orders),
        ...form,
        createdAt: new Date().toISOString(),
      };
      updated = [...orders, newOrder];
    }
    setOrders(updated);
    saveWorkOrders(companyId, updated);
    setDialogOpen(false);
  }

  function deleteOrder(id: string) {
    const updated = orders.filter((o) => o.id !== id);
    setOrders(updated);
    saveWorkOrders(companyId, updated);
  }

  function addMaterial() {
    setForm((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        { id: Date.now().toString(), name: "", quantity: "" },
      ],
    }));
  }

  function removeMaterial(mid: string) {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== mid),
    }));
  }

  function updateMaterial(
    mid: string,
    field: "name" | "quantity",
    val: string,
  ) {
    setForm((prev) => ({
      ...prev,
      materials: prev.materials.map((m) =>
        m.id === mid ? { ...m, [field]: val } : m,
      ),
    }));
  }

  const statusColors: Record<WorkOrder["status"], string> = {
    pending: "bg-gray-100 text-gray-700",
    inprogress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const priorityColors: Record<WorkOrder["priority"], string> = {
    normal: "bg-slate-100 text-slate-600",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-rose-100 text-rose-700",
  };

  const statusLabel = (s: WorkOrder["status"]) => {
    if (s === "pending") return t("workOrder.statusPending");
    if (s === "inprogress") return t("workOrder.statusInProgress");
    if (s === "completed") return t("workOrder.statusCompleted");
    return t("workOrder.statusCancelled");
  };

  const priorityLabel = (p: WorkOrder["priority"]) => {
    if (p === "normal") return t("workOrder.priorityNormal");
    if (p === "high") return t("workOrder.priorityHigh");
    return t("workOrder.priorityCritical");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t("workOrder.title")}</h2>
              <p className="text-sm text-white/80">
                {orders.length} {t("workOrder.title").toLowerCase()}
              </p>
            </div>
          </div>
          <Button
            onClick={openAdd}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 border"
            data-ocid="workorder.open_modal_button"
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("workOrder.add")}
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(
          ["all", "pending", "inprogress", "completed", "cancelled"] as const
        ).map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setFilter(f)}
            data-ocid={`workorder.${f}.tab`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-indigo-600 text-white shadow"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all"
              ? "Tümü"
              : f === "pending"
                ? t("workOrder.statusPending")
                : f === "inprogress"
                  ? t("workOrder.statusInProgress")
                  : f === "completed"
                    ? t("workOrder.statusCompleted")
                    : t("workOrder.statusCancelled")}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        {filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-gray-400"
            data-ocid="workorder.empty_state"
          >
            <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
            <p>{t("workOrder.noWorkOrders")}</p>
          </div>
        ) : (
          <table className="w-full text-sm" data-ocid="workorder.table">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  {t("workOrder.woNo")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  {t("workOrder.woTitle")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  {t("workOrder.status")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  {t("workOrder.priority")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  {t("workOrder.assigned")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  {t("workOrder.dueDate")}
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  İşlem
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, idx) => (
                <tr
                  key={order.id}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                  data-ocid={`workorder.item.${idx + 1}`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-indigo-700 font-semibold">
                    {order.woNo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">
                      {order.title}
                    </div>
                    {order.description && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate max-w-48">
                        {order.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[order.status]}`}
                    >
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priorityColors[order.priority]}`}
                    >
                      {priorityLabel(order.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.assigned || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.dueDate || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(order)}
                        data-ocid={`workorder.edit_button.${idx + 1}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteOrder(order.id)}
                        data-ocid={`workorder.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="workorder.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("workOrder.edit") : t("workOrder.add")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>{t("workOrder.woTitle")}</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder={t("workOrder.woTitle")}
                data-ocid="workorder.title.input"
              />
            </div>
            <div>
              <Label>{t("workOrder.description")}</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder={t("workOrder.description")}
                data-ocid="workorder.description.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("workOrder.status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, status: v as WorkOrder["status"] }))
                  }
                >
                  <SelectTrigger data-ocid="workorder.status.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      {t("workOrder.statusPending")}
                    </SelectItem>
                    <SelectItem value="inprogress">
                      {t("workOrder.statusInProgress")}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("workOrder.statusCompleted")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("workOrder.statusCancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("workOrder.priority")}</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      priority: v as WorkOrder["priority"],
                    }))
                  }
                >
                  <SelectTrigger data-ocid="workorder.priority.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">
                      {t("workOrder.priorityNormal")}
                    </SelectItem>
                    <SelectItem value="high">
                      {t("workOrder.priorityHigh")}
                    </SelectItem>
                    <SelectItem value="critical">
                      {t("workOrder.priorityCritical")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("workOrder.assigned")}</Label>
                <Input
                  value={form.assigned}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, assigned: e.target.value }))
                  }
                  placeholder={t("workOrder.assigned")}
                  data-ocid="workorder.assigned.input"
                />
              </div>
              <div>
                <Label>{t("workOrder.dueDate")}</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dueDate: e.target.value }))
                  }
                  data-ocid="workorder.duedate.input"
                />
              </div>
            </div>

            {/* Materials */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t("workOrder.materials")}</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addMaterial}
                  data-ocid="workorder.addmaterial.button"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t("workOrder.addMaterial")}
                </Button>
              </div>
              {form.materials.length > 0 && (
                <div className="space-y-2">
                  {form.materials.map((mat, midx) => (
                    <div key={mat.id} className="flex gap-2 items-center">
                      <Input
                        placeholder={t("workOrder.materialName")}
                        value={mat.name}
                        onChange={(e) =>
                          updateMaterial(mat.id, "name", e.target.value)
                        }
                        className="flex-1"
                        data-ocid={`workorder.material_name.input.${midx + 1}`}
                      />
                      <Input
                        placeholder={t("workOrder.quantity")}
                        value={mat.quantity}
                        onChange={(e) =>
                          updateMaterial(mat.id, "quantity", e.target.value)
                        }
                        className="w-24"
                        data-ocid={`workorder.material_qty.input.${midx + 1}`}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => removeMaterial(mat.id)}
                        data-ocid={`workorder.material_delete.button.${midx + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={saveOrder}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                data-ocid="workorder.save_button"
              >
                {editingId ? t("workOrder.edit") : t("workOrder.add")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="workorder.cancel_button"
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
