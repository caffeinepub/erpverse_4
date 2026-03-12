import { AlertTriangle, Package, Plus } from "lucide-react";
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
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
}

const LOW_STOCK_THRESHOLD = 10;

export default function InventoryModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const [products, setProducts] = useLocalStorage<Product[]>(
    `erpverse_inventory_${company?.id || "default"}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    unitPrice: "",
  });

  const totalValue = products.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
  const lowStock = products.filter(
    (p) => p.quantity < LOW_STOCK_THRESHOLD,
  ).length;
  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    });

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", category: "", quantity: "", unitPrice: "" });
    setShowDialog(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      quantity: String(p.quantity),
      unitPrice: String(p.unitPrice),
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const data = {
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity) || 0,
      unitPrice: Number(form.unitPrice) || 0,
    };
    if (editId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editId ? { ...p, ...data } : p)),
      );
    } else {
      setProducts((prev) => [...prev, { id: Date.now().toString(), ...data }]);
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-cyan-400" />
            {t("inventory.title")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {products.length} {t("inventory.product").toLowerCase()}
          </p>
        </div>
        <Button
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          onClick={openAdd}
          data-ocid="inventory.add_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("inventory.addProduct")}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">
            {t("inventory.product")}
          </p>
          <p className="text-3xl font-bold text-cyan-400">{products.length}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">
            {t("inventory.totalValue")}
          </p>
          <p className="text-2xl font-bold text-blue-400">{fmt(totalValue)}</p>
        </div>
        <div
          className={`${lowStock > 0 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"} border rounded-xl p-4`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {lowStock > 0 && (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            )}
            <p className="text-slate-400 text-xs">{t("inventory.lowStock")}</p>
          </div>
          <p
            className={`text-3xl font-bold ${lowStock > 0 ? "text-red-400" : "text-emerald-400"}`}
          >
            {lowStock}
          </p>
        </div>
      </div>

      <div
        className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
        data-ocid="inventory.table"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("inventory.product")}
              </th>
              <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                {t("inventory.category")}
              </th>
              <th className="text-right text-slate-400 text-xs font-medium px-5 py-3">
                {t("inventory.quantity")}
              </th>
              <th className="text-right text-slate-400 text-xs font-medium px-5 py-3">
                {t("inventory.unitPrice")}
              </th>
              <th className="text-right text-slate-400 text-xs font-medium px-5 py-3">
                {t("inventory.totalValue")}
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div
                    className="text-center py-12 text-slate-500"
                    data-ocid="inventory.empty_state"
                  >
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{t("inventory.addProduct")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-white/5 last:border-0 ${p.quantity < LOW_STOCK_THRESHOLD ? "bg-red-500/5" : "hover:bg-white/2"}`}
                  data-ocid={`inventory.row.${i + 1}`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm">{p.name}</p>
                      {p.quantity < LOW_STOCK_THRESHOLD && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-red-500/20 text-red-300 border-red-500/30"
                        >
                          {t("inventory.lowStock")}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">
                    {p.category}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-semibold text-sm ${p.quantity < LOW_STOCK_THRESHOLD ? "text-red-400" : "text-slate-300"}`}
                  >
                    {p.quantity}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-300 text-sm">
                    {fmt(p.unitPrice)}
                  </td>
                  <td className="px-5 py-3 text-right text-cyan-400 font-semibold text-sm">
                    {fmt(p.quantity * p.unitPrice)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-xs text-slate-400 hover:text-cyan-300 mr-3 transition-colors"
                      data-ocid={`inventory.edit_button.${i + 1}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                      data-ocid={`inventory.delete_button.${i + 1}`}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="inventory.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {editId ? t("inventory.product") : t("inventory.addProduct")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("inventory.product")}
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="inventory.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("inventory.category")}
              </Label>
              <Input
                value={form.category}
                onChange={(e) =>
                  setForm((p) => ({ ...p, category: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("inventory.quantity")}
                </Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("inventory.unitPrice")}
                </Label>
                <Input
                  type="number"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, unitPrice: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="inventory.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                onClick={handleSave}
                data-ocid="inventory.save_button"
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
