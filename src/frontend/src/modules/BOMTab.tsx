import { Edit2, Eye, Package, Plus, Trash2, X } from "lucide-react";
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
import { useLocalStorage } from "../hooks/useLocalStorage";

interface BOMComponent {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

interface BOM {
  id: string;
  productName: string;
  productCode: string;
  components: BOMComponent[];
  totalCost: number;
  notes: string;
  createdAt: string;
}

const UNITS = ["adet", "kg", "lt", "m", "m²", "m³", "ton", "paket", "kutu"];

function emptyComponent(): BOMComponent {
  return {
    id: crypto.randomUUID(),
    name: "",
    quantity: 1,
    unit: "adet",
    unitCost: 0,
  };
}

function calcTotal(components: BOMComponent[]): number {
  return components.reduce((sum, c) => sum + c.quantity * c.unitCost, 0);
}

interface Props {
  companyId: string;
  t: (k: string) => string;
}

export default function BOMTab({ companyId, t }: Props) {
  const [boms, setBoms] = useLocalStorage<BOM[]>(`erp_bom_${companyId}`, []);
  const [showForm, setShowForm] = useState(false);
  const [viewBom, setViewBom] = useState<BOM | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [notes, setNotes] = useState("");
  const [components, setComponents] = useState<BOMComponent[]>([
    emptyComponent(),
  ]);

  const resetForm = () => {
    setProductName("");
    setProductCode("");
    setNotes("");
    setComponents([emptyComponent()]);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (bom: BOM) => {
    setProductName(bom.productName);
    setProductCode(bom.productCode);
    setNotes(bom.notes);
    setComponents(
      bom.components.length > 0 ? bom.components : [emptyComponent()],
    );
    setEditingId(bom.id);
    setShowForm(true);
  };

  const addComponent = () =>
    setComponents((prev) => [...prev, emptyComponent()]);

  const removeComponent = (id: string) =>
    setComponents((prev) => prev.filter((c) => c.id !== id));

  const updateComponent = (
    id: string,
    field: keyof BOMComponent,
    value: string | number,
  ) =>
    setComponents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );

  const handleSave = () => {
    if (!productName.trim()) {
      toast.error(t("bom.errorName"));
      return;
    }
    const validComponents = components.filter((c) => c.name.trim());
    const total = calcTotal(validComponents);

    if (editingId) {
      setBoms((prev) =>
        prev.map((b) =>
          b.id === editingId
            ? {
                ...b,
                productName,
                productCode,
                notes,
                components: validComponents,
                totalCost: total,
              }
            : b,
        ),
      );
      toast.success(t("bom.updated"));
    } else {
      const newBom: BOM = {
        id: crypto.randomUUID(),
        productName,
        productCode,
        components: validComponents,
        totalCost: total,
        notes,
        createdAt: new Date().toISOString(),
      };
      setBoms((prev) => [...prev, newBom]);
      toast.success(t("bom.created"));
    }
    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setBoms((prev) => prev.filter((b) => b.id !== id));
    toast.success(t("bom.deleted"));
  };

  const liveTotal = calcTotal(components);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
            <Package className="w-5 h-5 text-orange-300" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t("bom.title")}
            </h2>
            <p className="text-xs text-slate-400">{t("bom.subtitle")}</p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="bg-orange-600 hover:bg-orange-700 text-white"
          data-ocid="bom.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("bom.add")}
        </Button>
      </div>

      {/* BOM List */}
      {boms.length === 0 ? (
        <div
          className="text-center py-16 text-slate-400"
          data-ocid="bom.empty_state"
        >
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("bom.empty")}</p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-white/5 overflow-hidden"
          data-ocid="bom.table"
        >
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50 border-b border-white/5">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                  {t("bom.productName")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                  {t("bom.productCode")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                  {t("bom.componentCount")}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-400">
                  {t("bom.totalCost")}
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-400">
                  {t("bom.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {boms.map((bom, idx) => (
                <tr
                  key={bom.id}
                  className="border-b border-white/5 hover:bg-slate-800/30 transition-colors"
                  data-ocid={`bom.item.${idx + 1}`}
                >
                  <td className="px-4 py-3 text-sm text-white font-medium">
                    {bom.productName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className="text-xs text-orange-300 border-orange-500/30 bg-orange-500/10"
                    >
                      {bom.productCode || "-"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {bom.components.length}
                  </td>
                  <td className="px-4 py-3 text-sm text-emerald-300 font-medium">
                    {bom.totalCost.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ₺
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setViewBom(bom)}
                        className="p-1.5 rounded-lg hover:bg-blue-500/15 text-slate-400 hover:text-blue-300 transition-colors"
                        data-ocid={`bom.item.${idx + 1}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(bom)}
                        className="p-1.5 rounded-lg hover:bg-amber-500/15 text-slate-400 hover:text-amber-300 transition-colors"
                        data-ocid={`bom.edit_button.${idx + 1}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(bom.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/15 text-slate-400 hover:text-red-300 transition-colors"
                        data-ocid={`bom.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            resetForm();
          }
        }}
      >
        <DialogContent
          className="bg-slate-900 border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="bom.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("bom.edit") : t("bom.add")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">
                  {t("bom.productName")} *
                </Label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="bg-slate-800 border-white/10 text-white"
                  data-ocid="bom.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">{t("bom.productCode")}</Label>
                <Input
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">{t("bom.notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-slate-800 border-white/10 text-white resize-none"
                rows={2}
                data-ocid="bom.textarea"
              />
            </div>

            {/* Components Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-slate-300">{t("bom.components")}</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addComponent}
                  className="border-white/10 text-slate-300 hover:bg-slate-700"
                  data-ocid="bom.secondary_button"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t("bom.addComponent")}
                </Button>
              </div>
              <div className="rounded-lg border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 border-b border-white/5">
                      <th className="text-left px-3 py-2 text-xs text-slate-400">
                        {t("bom.compName")}
                      </th>
                      <th className="text-left px-3 py-2 text-xs text-slate-400">
                        {t("bom.qty")}
                      </th>
                      <th className="text-left px-3 py-2 text-xs text-slate-400">
                        {t("bom.unit")}
                      </th>
                      <th className="text-left px-3 py-2 text-xs text-slate-400">
                        {t("bom.unitCost")}
                      </th>
                      <th className="text-left px-3 py-2 text-xs text-slate-400">
                        {t("bom.subtotal")}
                      </th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((comp) => (
                      <tr key={comp.id} className="border-b border-white/5">
                        <td className="px-2 py-1.5">
                          <Input
                            value={comp.name}
                            onChange={(e) =>
                              updateComponent(comp.id, "name", e.target.value)
                            }
                            className="bg-slate-800/50 border-white/10 text-white h-8 text-sm"
                            placeholder={t("bom.compNamePlaceholder")}
                          />
                        </td>
                        <td className="px-2 py-1.5 w-20">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={comp.quantity}
                            onChange={(e) =>
                              updateComponent(
                                comp.id,
                                "quantity",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            className="bg-slate-800/50 border-white/10 text-white h-8 text-sm"
                          />
                        </td>
                        <td className="px-2 py-1.5 w-28">
                          <Select
                            value={comp.unit}
                            onValueChange={(v) =>
                              updateComponent(comp.id, "unit", v)
                            }
                          >
                            <SelectTrigger className="bg-slate-800/50 border-white/10 text-white h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-white/10">
                              {UNITS.map((u) => (
                                <SelectItem
                                  key={u}
                                  value={u}
                                  className="text-white hover:bg-slate-700"
                                >
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-2 py-1.5 w-28">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={comp.unitCost}
                            onChange={(e) =>
                              updateComponent(
                                comp.id,
                                "unitCost",
                                Number.parseFloat(e.target.value) || 0,
                              )
                            }
                            className="bg-slate-800/50 border-white/10 text-white h-8 text-sm"
                          />
                        </td>
                        <td className="px-2 py-1.5 w-28 text-emerald-300 font-medium">
                          {(comp.quantity * comp.unitCost).toLocaleString(
                            "tr-TR",
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => removeComponent(comp.id)}
                            className="p-1 rounded hover:bg-red-500/15 text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-2 text-sm">
                <span className="text-slate-400 mr-2">
                  {t("bom.totalCost")}:
                </span>
                <span className="text-emerald-300 font-semibold">
                  {liveTotal.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  ₺
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="border-white/10 text-slate-300 hover:bg-slate-700"
                data-ocid="bom.cancel_button"
              >
                {t("bom.cancel")}
              </Button>
              <Button
                onClick={handleSave}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                data-ocid="bom.submit_button"
              >
                {t("bom.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog
        open={!!viewBom}
        onOpenChange={(open) => {
          if (!open) setViewBom(null);
        }}
      >
        <DialogContent
          className="bg-slate-900 border-white/10 text-white max-w-2xl"
          data-ocid="bom.modal"
        >
          <DialogHeader>
            <DialogTitle>{viewBom?.productName}</DialogTitle>
          </DialogHeader>
          {viewBom && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-slate-400">
                    {t("bom.productCode")}:{" "}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-orange-300 border-orange-500/30 bg-orange-500/10"
                  >
                    {viewBom.productCode || "-"}
                  </Badge>
                </div>
                {viewBom.notes && (
                  <div>
                    <span className="text-slate-400">{t("bom.notes")}: </span>
                    <span className="text-slate-200">{viewBom.notes}</span>
                  </div>
                )}
              </div>
              <div className="rounded-lg border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-800/60 border-b border-white/5">
                      <th className="text-left px-4 py-2 text-xs text-slate-400">
                        {t("bom.compName")}
                      </th>
                      <th className="text-left px-4 py-2 text-xs text-slate-400">
                        {t("bom.qty")}
                      </th>
                      <th className="text-left px-4 py-2 text-xs text-slate-400">
                        {t("bom.unit")}
                      </th>
                      <th className="text-left px-4 py-2 text-xs text-slate-400">
                        {t("bom.unitCost")}
                      </th>
                      <th className="text-left px-4 py-2 text-xs text-slate-400">
                        {t("bom.subtotal")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewBom.components.map((comp) => (
                      <tr key={comp.id} className="border-b border-white/5">
                        <td className="px-4 py-2 text-white">{comp.name}</td>
                        <td className="px-4 py-2 text-slate-300">
                          {comp.quantity}
                        </td>
                        <td className="px-4 py-2 text-slate-300">
                          {comp.unit}
                        </td>
                        <td className="px-4 py-2 text-slate-300">
                          {comp.unitCost.toLocaleString("tr-TR")}
                        </td>
                        <td className="px-4 py-2 text-emerald-300 font-medium">
                          {(comp.quantity * comp.unitCost).toLocaleString(
                            "tr-TR",
                            { minimumFractionDigits: 2 },
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800/40">
                      <td
                        colSpan={4}
                        className="px-4 py-2 text-right text-slate-300 font-medium"
                      >
                        {t("bom.totalCost")}
                      </td>
                      <td className="px-4 py-2 text-emerald-300 font-bold">
                        {viewBom.totalCost.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ₺
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setViewBom(null)}
                  className="border-white/10 text-slate-300 hover:bg-slate-700"
                  data-ocid="bom.close_button"
                >
                  {t("bom.close")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
