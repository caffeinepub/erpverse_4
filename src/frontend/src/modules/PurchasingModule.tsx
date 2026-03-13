import { CheckCircle, Plus, ShoppingCart, Trash2, XCircle } from "lucide-react";
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
import { useAuditLog } from "../contexts/AuditLogContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import SupplierModule from "./SupplierModule";
import type { Supplier } from "./SupplierModule";

type OrderStatus =
  | "awaiting_approval"
  | "pending"
  | "approved"
  | "delivered"
  | "rejected";

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  amount: number;
  status: OrderStatus;
}

interface AutoPurchaseRequest {
  id: string;
  productName: string;
  productId: string;
  currentQty: number;
  requestedQty: number;
  date: string;
  status: "pending" | "approved" | "rejected";
}

export default function PurchasingModule() {
  const { t } = useLanguage();
  const { company, membership } = useAuth();
  const companyId = company?.id || "default";
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();

  const isManagerOrOwner =
    membership?.roles.some(
      (r) => "CompanyOwner" in r || "CompanyManager" in r,
    ) ?? false;

  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>(
    `erpverse_purchasing_suppliers_${companyId}`,
    [],
  );
  const [orders, setOrders] = useLocalStorage<PurchaseOrder[]>(
    `erpverse_purchasing_orders_${companyId}`,
    [],
  );
  const [autoRequests, setAutoRequests] = useLocalStorage<
    AutoPurchaseRequest[]
  >(`erpverse_auto_purchase_requests_${companyId}`, []);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedSupplierForOrders, setSelectedSupplierForOrders] = useState<
    import("./SupplierModule").Supplier | null
  >(null);
  const [form, setForm] = useState({
    supplier: "",
    amount: "",
    date: "",
  });

  const totalAmount = orders.reduce((s, o) => s + o.amount, 0);
  const pendingCount = orders.filter(
    (o) => o.status === "awaiting_approval" || o.status === "pending",
  ).length;
  const pendingAutoRequests = autoRequests.filter(
    (r) => r.status === "pending",
  ).length;

  const getSupplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.name ?? id;

  const addAccountingExpense = (order: PurchaseOrder) => {
    const key = `erpverse_accounting_${companyId}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const entry = {
      id: Date.now().toString(),
      type: "expense",
      description: `${getSupplierName(order.supplier)} - Satın Alma`,
      amount: order.amount,
      date: order.date || new Date().toISOString().slice(0, 10),
      category: t("integration.purchaseExpenseCategory"),
    };
    localStorage.setItem(key, JSON.stringify([...existing, entry]));
    toast.success(t("integration.accountingEntryCreated"));
  };

  const handleApproveOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "pending" } : o)),
    );
    addNotification({
      type: "info",
      title: t("approval.approved"),
      message: `${getSupplierName(order.supplier)} - ₺${order.amount.toLocaleString("tr-TR")}`,
      companyId,
      targetRole: "all",
    });
    addLog({
      action: t("approval.approved"),
      module: "Purchasing",
      detail: `${getSupplierName(order.supplier)} - ₺${order.amount.toLocaleString("tr-TR")}`,
    });
  };

  const handleRejectOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "rejected" } : o)),
    );
    addNotification({
      type: "info",
      title: t("approval.rejected"),
      message: `${getSupplierName(order.supplier)} - ₺${order.amount.toLocaleString("tr-TR")}`,
      companyId,
      targetRole: "all",
    });
    addLog({
      action: t("approval.rejected"),
      module: "Purchasing",
      detail: `${getSupplierName(order.supplier)} - ₺${order.amount.toLocaleString("tr-TR")}`,
    });
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    if (newStatus === "delivered") {
      addAccountingExpense({ ...order, status: newStatus });
      addLog({
        action: t("purchasing.delivered"),
        module: "Purchasing",
        detail: `${getSupplierName(order.supplier)} - ₺${order.amount.toLocaleString("tr-TR")}`,
      });
    }
  };

  const handleAdd = () => {
    if (!form.supplier || !form.amount || !form.date) return;
    const newOrder: PurchaseOrder = {
      id: String(Date.now()),
      supplier: form.supplier,
      amount: Number(form.amount),
      date: form.date,
      status: "awaiting_approval",
    };
    setOrders((prev) => [...prev, newOrder]);
    addNotification({
      type: "approval_required",
      title: t("approval.purchaseOrderTitle"),
      message: `${getSupplierName(form.supplier)} - ₺${Number(form.amount).toLocaleString("tr-TR")} - ${t("approval.purchaseOrderMsg")}`,
      companyId,
      targetRole: "owner",
    });
    addLog({
      action: t("purchasing.addOrder"),
      module: "Purchasing",
      detail: `${getSupplierName(form.supplier)} - ₺${Number(form.amount).toLocaleString("tr-TR")}`,
    });
    setForm({ supplier: "", amount: "", date: "" });
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    const order = orders.find((o) => o.id === id);
    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (order) {
      addLog({
        action: t("personnel.remove"),
        module: "Purchasing",
        detail: `${getSupplierName(order.supplier)} - ₺${order.amount.toLocaleString("tr-TR")}`,
      });
    }
  };

  const handleApproveAutoRequest = (req: AutoPurchaseRequest) => {
    setAutoRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "approved" } : r)),
    );
    const firstSupplier = suppliers[0];
    const newOrder: PurchaseOrder = {
      id: String(Date.now()),
      supplier: firstSupplier?.id || "",
      amount: req.requestedQty * 10,
      date: new Date().toISOString().slice(0, 10),
      status: "awaiting_approval",
    };
    setOrders((prev) => [...prev, newOrder]);
    addNotification({
      type: "approval_required",
      title: t("approval.purchaseOrderTitle"),
      message: `${req.productName} - ${t("approval.purchaseOrderMsg")}`,
      companyId,
      targetRole: "owner",
    });
  };

  const handleRejectAutoRequest = (id: string) => {
    setAutoRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)),
    );
  };

  const statusBadge = (status: OrderStatus) => {
    const map: Record<OrderStatus, string> = {
      awaiting_approval: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      pending: "bg-blue-500/15 text-blue-300 border-blue-500/30",
      approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      delivered: "bg-slate-500/15 text-slate-300 border-slate-500/30",
      rejected: "bg-red-500/15 text-red-300 border-red-500/30",
    };
    const labelMap: Record<OrderStatus, string> = {
      awaiting_approval: t("approval.awaitingApproval"),
      pending: t("purchasing.pending"),
      approved: t("purchasing.approved"),
      delivered: t("purchasing.delivered"),
      rejected: t("purchasing.rejected"),
    };
    return (
      <Badge variant="outline" className={`text-xs ${map[status]}`}>
        {labelMap[status]}
      </Badge>
    );
  };

  const autoRequestStatusBadge = (status: AutoPurchaseRequest["status"]) => {
    const map = {
      pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      rejected: "bg-red-500/15 text-red-300 border-red-500/30",
    };
    return (
      <Badge variant="outline" className={`text-xs ${map[status]}`}>
        {t(`purchasing.${status}`)}
      </Badge>
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
          <ShoppingCart className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("purchasing.title")}
          </h2>
        </div>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="bg-slate-800 border border-white/5 mb-6">
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400"
            data-ocid="purchasing.tabs.orders"
          >
            {t("purchasing.tabs.orders")}
          </TabsTrigger>
          <TabsTrigger
            value="suppliers"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400"
            data-ocid="purchasing.tabs.suppliers"
          >
            {t("purchasing.tabs.suppliers")}
          </TabsTrigger>
          <TabsTrigger
            value="auto_requests"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-slate-400 relative"
            data-ocid="purchasing.tabs.auto_requests"
          >
            {t("purchasing.tabs.autoRequests")}
            {pendingAutoRequests > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {pendingAutoRequests}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-xs mb-1">
                {t("purchasing.totalOrders")}
              </p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-xs mb-1">
                {t("purchasing.amount")}
              </p>
              <p className="text-2xl font-bold text-white">
                ₺{totalAmount.toLocaleString("tr-TR")}
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
              <p className="text-slate-400 text-xs mb-1">
                {t("purchasing.pending")}
              </p>
              <p className="text-2xl font-bold text-amber-400">
                {pendingCount}
              </p>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => setShowDialog(true)}
              data-ocid="purchasing.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("purchasing.addOrder")}
            </Button>
          </div>

          {orders.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="purchasing.empty_state"
            >
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t("purchasing.addOrder")}</p>
            </div>
          ) : (
            <div
              className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
              data-ocid="purchasing.table"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("purchasing.supplier")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("purchasing.date")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("purchasing.amount")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("purchasing.status")}
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr
                      key={order.id}
                      className="border-b border-white/5 last:border-0"
                      data-ocid={`purchasing.row.${i + 1}`}
                    >
                      <td className="px-5 py-3 text-white font-medium">
                        {getSupplierName(order.supplier)}
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">
                        {order.date}
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">
                        ₺{order.amount.toLocaleString("tr-TR")}
                      </td>
                      <td className="px-5 py-3">
                        {order.status === "awaiting_approval" &&
                        isManagerOrOwner ? (
                          <div className="flex items-center gap-2">
                            {statusBadge(order.status)}
                            <button
                              type="button"
                              onClick={() => handleApproveOrder(order.id)}
                              className="text-emerald-400 hover:text-emerald-300 transition-colors"
                              title={t("approval.approve")}
                              data-ocid={`purchasing.confirm_button.${i + 1}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectOrder(order.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title={t("approval.reject")}
                              data-ocid={`purchasing.delete_button.${i + 1}`}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : order.status === "awaiting_approval" ? (
                          statusBadge(order.status)
                        ) : (
                          <Select
                            value={order.status}
                            onValueChange={(v) =>
                              handleStatusChange(order.id, v as OrderStatus)
                            }
                            disabled={
                              order.status === "rejected" || !isManagerOrOwner
                            }
                          >
                            <SelectTrigger
                              className="h-7 w-36 bg-transparent border-white/10 text-xs"
                              data-ocid={`purchasing.select.${i + 1}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-white/10">
                              <SelectItem
                                value="pending"
                                className="text-white text-xs"
                              >
                                {t("purchasing.pending")}
                              </SelectItem>
                              <SelectItem
                                value="approved"
                                className="text-white text-xs"
                              >
                                {t("purchasing.approved")}
                              </SelectItem>
                              <SelectItem
                                value="delivered"
                                className="text-white text-xs"
                              >
                                {t("purchasing.delivered")}
                              </SelectItem>
                              <SelectItem
                                value="rejected"
                                className="text-white text-xs"
                              >
                                {t("purchasing.rejected")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(order.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          data-ocid={`purchasing.delete_button.${i + 1}`}
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
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierModule
            suppliers={suppliers}
            onAdd={(s) => setSuppliers((p) => [...p, s])}
            onUpdate={(s) =>
              setSuppliers((p) => p.map((x) => (x.id === s.id ? s : x)))
            }
            onDelete={(id) => setSuppliers((p) => p.filter((x) => x.id !== id))}
            onViewOrders={(s) => setSelectedSupplierForOrders(s)}
          />
        </TabsContent>

        <TabsContent value="auto_requests">
          {autoRequests.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="purchasing.auto_requests.empty_state"
            >
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t("purchasing.autoRequestsEmpty")}</p>
            </div>
          ) : (
            <div
              className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
              data-ocid="purchasing.auto_requests.table"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("inventory.product")}
                    </th>
                    <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">
                      {t("inventory.quantity")}
                    </th>
                    <th className="text-right text-slate-400 text-sm font-medium px-5 py-3">
                      {t("purchasing.amount")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("purchasing.date")}
                    </th>
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                      {t("purchasing.status")}
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {autoRequests.map((req, i) => (
                    <tr
                      key={req.id}
                      className="border-b border-white/5 last:border-0"
                      data-ocid={`purchasing.auto_requests.row.${i + 1}`}
                    >
                      <td className="px-5 py-3 text-white font-medium text-sm">
                        {req.productName}
                      </td>
                      <td className="px-5 py-3 text-right text-sm">
                        <span className="text-red-400">{req.currentQty}</span>
                        <span className="text-slate-500 mx-1">→</span>
                        <span className="text-emerald-400">
                          {req.requestedQty}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-300 text-sm">
                        {req.requestedQty}{" "}
                        {t("inventory.product").toLowerCase()}
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">
                        {req.date}
                      </td>
                      <td className="px-5 py-3">
                        {autoRequestStatusBadge(req.status)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {req.status === "pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleApproveAutoRequest(req)}
                              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                              data-ocid={`purchasing.auto_requests.confirm_button.${i + 1}`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              {t("purchasing.approveRequest")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectAutoRequest(req.id)}
                              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                              data-ocid={`purchasing.auto_requests.delete_button.${i + 1}`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {t("purchasing.rejectRequest")}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="purchasing.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("purchasing.addOrder")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm">
                {t("purchasing.supplier")}
              </Label>
              <Select
                value={form.supplier}
                onValueChange={(v) => setForm((p) => ({ ...p, supplier: v }))}
              >
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  data-ocid="purchasing.select"
                >
                  <SelectValue placeholder={t("purchasing.supplier")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-white/10">
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-white">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("purchasing.amount")} (₺)
              </Label>
              <Input
                type="number"
                className="bg-slate-700 border-white/10 text-white mt-1"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                data-ocid="purchasing.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("purchasing.date")}
              </Label>
              <Input
                type="date"
                className="bg-slate-700 border-white/10 text-white mt-1"
                value={form.date}
                onChange={(e) =>
                  setForm((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="purchasing.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleAdd}
                data-ocid="purchasing.submit_button"
              >
                {t("purchasing.addOrder")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Supplier Orders Dialog */}
      <Dialog
        open={!!selectedSupplierForOrders}
        onOpenChange={(open) => {
          if (!open) setSelectedSupplierForOrders(null);
        }}
      >
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-lg"
          data-ocid="supplier.orders_dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedSupplierForOrders?.name} - {t("supplier.viewOrders")}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {orders.filter(
              (o) =>
                getSupplierName(o.supplier) ===
                  selectedSupplierForOrders?.name ||
                o.supplier === selectedSupplierForOrders?.id,
            ).length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">
                {t("purchasing.noOrders")}
              </p>
            ) : (
              <div className="space-y-2">
                {orders
                  .filter(
                    (o) =>
                      getSupplierName(o.supplier) ===
                        selectedSupplierForOrders?.name ||
                      o.supplier === selectedSupplierForOrders?.id,
                  )
                  .map((order, i) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-3"
                      data-ocid={`supplier.orders_dialog.row.${i + 1}`}
                    >
                      <div>
                        <p className="text-white text-sm font-medium">
                          {order.date}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {t("purchasing.amount")}:{" "}
                          {order.amount.toLocaleString("tr-TR", {
                            style: "currency",
                            currency: "TRY",
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded border ${order.status === "delivered" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : order.status === "rejected" ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}
                      >
                        {t(`purchasing.${order.status}`) || order.status}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
