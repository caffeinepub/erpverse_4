import { Factory, Plus, Trash2 } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import CapacityPlanningTab from "./CapacityPlanningTab";

type ProdStatus = "planned" | "inProgress" | "completed";

interface ProductionOrder {
  id: string;
  product: string;
  quantity: number;
  startDate: string;
  progress: number;
  status: ProdStatus;
}

interface InventoryProduct {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category: string;
}

function statusBadge(status: ProdStatus, t: (k: string) => string) {
  const map: Record<ProdStatus, string> = {
    planned: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    inProgress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status]}`}>
      {t(`production.${status}`)}
    </Badge>
  );
}

export default function ProductionModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const companyId = company?.id || "default";
  const { addNotification } = useNotifications();
  const [orders, setOrders] = useLocalStorage<ProductionOrder[]>(
    `erpverse_production_${companyId}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [deductionOrder, setDeductionOrder] = useState<ProductionOrder | null>(
    null,
  );
  const [deductions, setDeductions] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    product: "",
    quantity: "",
    startDate: "",
    status: "planned" as ProdStatus,
  });

  const inventoryProducts: InventoryProduct[] = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(`erpverse_inventory_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  })();

  const inProgressCount = orders.filter(
    (o) => o.status === "inProgress",
  ).length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  const handleAdd = () => {
    if (!form.product || !form.quantity || !form.startDate) return;
    setOrders((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        product: form.product,
        quantity: Number(form.quantity),
        startDate: form.startDate,
        progress: 0,
        status: form.status,
      },
    ]);
    setForm({ product: "", quantity: "", startDate: "", status: "planned" });
    setShowDialog(false);
  };

  const handleDelete = (id: string) =>
    setOrders((prev) => prev.filter((o) => o.id !== id));

  const handleStatusChange = (orderId: string, newStatus: ProdStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: newStatus,
              progress:
                newStatus === "completed"
                  ? 100
                  : newStatus === "inProgress"
                    ? 50
                    : 0,
            }
          : o,
      ),
    );
    if (newStatus === "inProgress") {
      const reservKey = `erp_warehouse_reservations_${companyId}`;
      const existing: unknown[] = (() => {
        try {
          return JSON.parse(localStorage.getItem(reservKey) || "[]");
        } catch {
          return [];
        }
      })();
      const reservation = {
        id: Date.now().toString(),
        productionOrderId: order.id,
        productionOrderName: order.product,
        materialName: order.product,
        quantity: order.quantity,
        unit: t("production.unit"),
        reservedAt: new Date().toISOString(),
        status: "Rezerve",
      };
      localStorage.setItem(
        reservKey,
        JSON.stringify([...(existing as object[]), reservation]),
      );
      addNotification({
        type: "info",
        title: t("integration.productionStarted"),
        message: `${order.product} - ${t("integration.materialsReserved")}`,
        companyId,
        targetRole: "manager",
      });
      toast.success(t("integration.productionStarted"));
    }
    if (newStatus === "completed" && inventoryProducts.length > 0) {
      setDeductionOrder({ ...order, status: newStatus });
      setDeductions({});
    }
  };

  const handleConfirmDeduction = () => {
    const key = `erpverse_inventory_${companyId}`;
    const updated = inventoryProducts.map((p) => ({
      ...p,
      quantity: Math.max(0, p.quantity - (deductions[p.id] || 0)),
    }));
    localStorage.setItem(key, JSON.stringify(updated));
    toast.success(t("integration.inventoryDeducted"));
    setDeductionOrder(null);
  };

  return (
    <div className="p-8">
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-slate-800 border border-white/5 mb-6">
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400"
            data-ocid="production.orders.tab"
          >
            {t("production.title")}
          </TabsTrigger>
          <TabsTrigger
            value="capacity"
            className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400"
            data-ocid="production.capacity.tab"
          >
            {t("capacity.capacity_planning")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-500/15 flex items-center justify-center">
                  <Factory className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {t("production.title")}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {orders.length} {t("production.title").toLowerCase()}
                  </p>
                </div>
              </div>
              <Button
                className="bg-slate-600 hover:bg-slate-500 text-white"
                onClick={() => setShowDialog(true)}
                data-ocid="production.open_modal_button"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("production.addOrder")}
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
                <p className="text-slate-400 text-xs mb-1">Toplam</p>
                <p className="text-2xl font-bold text-white">{orders.length}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
                <p className="text-slate-400 text-xs mb-1">
                  {t("production.inProgress")}
                </p>
                <p className="text-2xl font-bold text-amber-400">
                  {inProgressCount}
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
                <p className="text-slate-400 text-xs mb-1">
                  {t("production.completed")}
                </p>
                <p className="text-2xl font-bold text-emerald-400">
                  {completedCount}
                </p>
              </div>
            </div>

            {orders.length === 0 ? (
              <div
                className="text-center py-16 text-slate-500"
                data-ocid="production.empty_state"
              >
                <Factory className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>{t("production.addOrder")}</p>
              </div>
            ) : (
              <div
                className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
                data-ocid="production.table"
              >
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                        {t("production.product")}
                      </th>
                      <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                        {t("production.quantity")}
                      </th>
                      <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                        {t("production.progress")}
                      </th>
                      <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                        {t("production.status")}
                      </th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => (
                      <tr
                        key={order.id}
                        className="border-b border-white/5 last:border-0"
                        data-ocid={`production.row.${i + 1}`}
                      >
                        <td className="px-5 py-3">
                          <p className="text-white font-medium">
                            {order.product}
                          </p>
                          <p className="text-xs text-slate-500">
                            {order.startDate}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-slate-300 text-sm">
                          {order.quantity}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${order.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-8">
                              {order.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Select
                            value={order.status}
                            onValueChange={(v) =>
                              handleStatusChange(order.id, v as ProdStatus)
                            }
                          >
                            <SelectTrigger
                              className="h-7 w-32 bg-transparent border-0 p-0"
                              data-ocid={`production.status_select.${i + 1}`}
                            >
                              {statusBadge(order.status, t)}
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10">
                              <SelectItem
                                value="planned"
                                className="text-white text-xs"
                              >
                                {t("production.planned")}
                              </SelectItem>
                              <SelectItem
                                value="inProgress"
                                className="text-white text-xs"
                              >
                                {t("production.inProgress")}
                              </SelectItem>
                              <SelectItem
                                value="completed"
                                className="text-white text-xs"
                              >
                                {t("production.completed")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(order.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            data-ocid={`production.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add Order Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogContent
                className="bg-slate-800 border-white/10 text-white max-w-md"
                data-ocid="production.dialog"
              >
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {t("production.addOrder")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("production.product")}
                    </Label>
                    <Input
                      className="bg-slate-700 border-white/10 text-white mt-1"
                      value={form.product}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, product: e.target.value }))
                      }
                      data-ocid="production.input"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("production.quantity")}
                    </Label>
                    <Input
                      type="number"
                      className="bg-slate-700 border-white/10 text-white mt-1"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, quantity: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">
                      Başlangıç Tarihi
                    </Label>
                    <Input
                      type="date"
                      className="bg-slate-700 border-white/10 text-white mt-1"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, startDate: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("production.status")}
                    </Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) =>
                        setForm((p) => ({ ...p, status: v as ProdStatus }))
                      }
                    >
                      <SelectTrigger
                        className="bg-slate-700 border-white/10 text-white mt-1"
                        data-ocid="production.select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-white/10">
                        <SelectItem value="planned" className="text-white">
                          {t("production.planned")}
                        </SelectItem>
                        <SelectItem value="inProgress" className="text-white">
                          {t("production.inProgress")}
                        </SelectItem>
                        <SelectItem value="completed" className="text-white">
                          {t("production.completed")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-white/20 text-slate-300"
                      onClick={() => setShowDialog(false)}
                      data-ocid="production.cancel_button"
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      className="flex-1 bg-slate-600 hover:bg-slate-500 text-white"
                      onClick={handleAdd}
                      data-ocid="production.submit_button"
                    >
                      {t("production.addOrder")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
        <TabsContent value="capacity">
          <CapacityPlanningTab cid={companyId} t={t} />
        </TabsContent>
      </Tabs>
      {/* Material Deduction Dialog */}
      <Dialog
        open={!!deductionOrder}
        onOpenChange={(open) => {
          if (!open) setDeductionOrder(null);
        }}
      >
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="production.deduction.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("production.materialDeduction")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm mb-4">
            Üretim tamamlandı:{" "}
            <span className="text-white font-medium">
              {deductionOrder?.product}
            </span>
            . Kullanılan malzemeleri girin:
          </p>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {inventoryProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-sm text-slate-300 flex-1">{p.name}</span>
                <span className="text-xs text-slate-500 w-16">
                  Stok: {p.quantity}
                </span>
                <Input
                  type="number"
                  min={0}
                  max={p.quantity}
                  value={deductions[p.id] || ""}
                  onChange={(e) =>
                    setDeductions((d) => ({
                      ...d,
                      [p.id]: Number(e.target.value),
                    }))
                  }
                  placeholder="0"
                  className="bg-slate-700 border-white/10 text-white w-24 h-8 text-sm"
                  data-ocid="production.deduction.input"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-white/20 text-slate-300"
              onClick={() => setDeductionOrder(null)}
              data-ocid="production.deduction.cancel_button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmDeduction}
              data-ocid="production.deduction.confirm_button"
            >
              {t("production.confirmDeduction")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
