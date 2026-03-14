import { Edit2, Package, Plus, Tags, Trash2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  category: "product" | "service";
  unit: "adet" | "kg" | "lt" | "m" | "saat" | "kutu";
  price: number;
  currency: string;
  stock: number;
  status: "active" | "passive";
  description: string;
}

type FilterType = "all" | "product" | "service";

const EMPTY: Omit<CatalogItem, "id"> = {
  code: "",
  name: "",
  category: "product",
  unit: "adet",
  price: 0,
  currency: "TRY",
  stock: 0,
  status: "active",
  description: "",
};

export default function ProductCatalogModule() {
  const { t } = useLanguage();
  const { company: selectedCompany } = useAuth();
  const cid = selectedCompany?.id ?? "default";

  const [items, setItems] = useLocalStorage<CatalogItem[]>(
    `erpverse_catalog_${cid}`,
    [],
  );
  const [filter, setFilter] = useState<FilterType>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState<Omit<CatalogItem, "id">>(EMPTY);

  const filtered = items.filter((i) =>
    filter === "all" ? true : i.category === filter,
  );

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setForm({ ...item });
    setOpen(true);
  };

  const save = () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error(t("catalog.fieldsRequired"));
      return;
    }
    if (editing) {
      setItems(
        items.map((i) =>
          i.id === editing.id ? { ...form, id: editing.id } : i,
        ),
      );
      toast.success(t("catalog.updated"));
    } else {
      setItems([...items, { ...form, id: Date.now().toString() }]);
      toast.success(t("catalog.added"));
    }
    setOpen(false);
  };

  const remove = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    toast.success(t("catalog.deleted"));
  };

  const totalProducts = items.filter((i) => i.category === "product").length;
  const totalServices = items.filter((i) => i.category === "service").length;
  const activeItems = items.filter((i) => i.status === "active").length;

  return (
    <div className="p-6 space-y-6" data-ocid="catalog.page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tags className="w-6 h-6 text-pink-400" />
            {t("modules.ProductCatalog")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">{t("catalog.subtitle")}</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-pink-600 hover:bg-pink-700"
          data-ocid="catalog.add_button"
        >
          <Plus className="w-4 h-4 mr-1" /> {t("catalog.addItem")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t("catalog.totalProducts")}</p>
          <p className="text-2xl font-bold text-white mt-1">{totalProducts}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t("catalog.totalServices")}</p>
          <p className="text-2xl font-bold text-white mt-1">{totalServices}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t("catalog.activeItems")}</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {activeItems}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2" data-ocid="catalog.filter.tab">
        {(["all", "product", "service"] as FilterType[]).map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-pink-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {t(`catalog.filter.${f}`)}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-12 text-slate-400"
          data-ocid="catalog.empty_state"
        >
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>{t("catalog.noItems")}</p>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <Table data-ocid="catalog.table">
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">
                  {t("catalog.code")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("catalog.name")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("catalog.category")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("catalog.unit")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("catalog.price")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("catalog.stock")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("catalog.status")}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("catalog.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item, i) => (
                <TableRow
                  key={item.id}
                  className="border-slate-700 hover:bg-slate-700/50"
                  data-ocid={`catalog.row.${i + 1}`}
                >
                  <TableCell className="text-slate-300 font-mono text-sm">
                    {item.code}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {item.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.category === "product"
                          ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                          : "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      }
                    >
                      {t(`catalog.cat.${item.category}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{item.unit}</TableCell>
                  <TableCell className="text-slate-300">
                    {item.price.toLocaleString()} {item.currency}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {item.category === "product" ? item.stock : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === "active"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                          : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      }
                    >
                      {t(`catalog.status.${item.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(item)}
                      className="text-slate-400 hover:text-white mr-1"
                      data-ocid={`catalog.edit_button.${i + 1}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(item.id)}
                      className="text-red-400 hover:text-red-300"
                      data-ocid={`catalog.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="bg-slate-900 border-slate-700 text-white max-w-lg"
          data-ocid="catalog.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? t("catalog.editItem") : t("catalog.addItem")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("catalog.code")} *</Label>
                <Input
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  data-ocid="catalog.code.input"
                />
              </div>
              <div>
                <Label className="text-slate-300">{t("catalog.name")} *</Label>
                <Input
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-ocid="catalog.name.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">
                  {t("catalog.category")}
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v as CatalogItem["category"] })
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    data-ocid="catalog.category.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="product">
                      {t("catalog.cat.product")}
                    </SelectItem>
                    <SelectItem value="service">
                      {t("catalog.cat.service")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">{t("catalog.unit")}</Label>
                <Select
                  value={form.unit}
                  onValueChange={(v) =>
                    setForm({ ...form, unit: v as CatalogItem["unit"] })
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    data-ocid="catalog.unit.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {(["adet", "kg", "lt", "m", "saat", "kutu"] as const).map(
                      (u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("catalog.price")}</Label>
                <Input
                  type="number"
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                  data-ocid="catalog.price.input"
                />
              </div>
              <div>
                <Label className="text-slate-300">
                  {t("catalog.currency")}
                </Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm({ ...form, currency: v })}
                >
                  <SelectTrigger
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    data-ocid="catalog.currency.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {["TRY", "USD", "EUR", "GBP"].map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.category === "product" && (
              <div>
                <Label className="text-slate-300">{t("catalog.stock")}</Label>
                <Input
                  type="number"
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: Number(e.target.value) })
                  }
                  data-ocid="catalog.stock.input"
                />
              </div>
            )}
            <div>
              <Label className="text-slate-300">
                {t("catalog.status.label")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as CatalogItem["status"] })
                }
              >
                <SelectTrigger
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  data-ocid="catalog.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="active">
                    {t("catalog.status.active")}
                  </SelectItem>
                  <SelectItem value="passive">
                    {t("catalog.status.passive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">
                {t("catalog.description")}
              </Label>
              <Textarea
                className="bg-slate-800 border-slate-600 text-white mt-1"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
                data-ocid="catalog.description.textarea"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-slate-600 text-slate-300"
                data-ocid="catalog.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={save}
                className="bg-pink-600 hover:bg-pink-700"
                data-ocid="catalog.save_button"
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
