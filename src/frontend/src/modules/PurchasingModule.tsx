import { Plus, ShoppingCart, Trash2 } from "lucide-react";
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
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import SupplierModule from "./SupplierModule";
import type { Supplier } from "./SupplierModule";

type OrderStatus = "pending" | "approved" | "delivered";

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  amount: number;
  status: OrderStatus;
}

function statusBadge(status: OrderStatus, t: (k: string) => string) {
  const map: Record<OrderStatus, string> = {
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    approved: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    delivered: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status]}`}>
      {t(`purchasing.${status}`)}
    </Badge>
  );
}

export default function PurchasingModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>(
    `erpverse_purchasing_suppliers_${company?.id || "default"}`,
    [],
  );
  const [orders, setOrders] = useLocalStorage<PurchaseOrder[]>(
    `erpverse_purchasing_orders_${company?.id || "default"}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    supplier: "",
    amount: "",
    date: "",
    status: "pending" as OrderStatus,
  });

  const totalAmount = orders.reduce((s, o) => s + o.amount, 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const getSupplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.name ?? id;

  const handleAdd = () => {
    if (!form.supplier || !form.amount || !form.date) return;
    setOrders((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        supplier: form.supplier,
        amount: Number(form.amount),
        date: form.date,
        status: form.status,
      },
    ]);
    setForm({ supplier: "", amount: "", date: "", status: "pending" });
    setShowDialog(false);
  };

  const handleDelete = (id: string) =>
    setOrders((prev) => prev.filter((o) => o.id !== id));

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
                        {statusBadge(order.status, t)}
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
          />
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
            <div>
              <Label className="text-slate-300 text-sm">
                {t("purchasing.status")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as OrderStatus }))
                }
              >
                <SelectTrigger className="bg-slate-700 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-white/10">
                  <SelectItem value="pending" className="text-white">
                    {t("purchasing.pending")}
                  </SelectItem>
                  <SelectItem value="approved" className="text-white">
                    {t("purchasing.approved")}
                  </SelectItem>
                  <SelectItem value="delivered" className="text-white">
                    {t("purchasing.delivered")}
                  </SelectItem>
                </SelectContent>
              </Select>
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
    </div>
  );
}
