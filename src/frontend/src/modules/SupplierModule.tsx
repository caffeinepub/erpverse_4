import { Edit2, Plus, Star, Trash2, Users2 } from "lucide-react";
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
import { Textarea } from "../components/ui/textarea";
import { useLanguage } from "../contexts/LanguageContext";

export type SupplierCategory =
  | "Hammadde"
  | "Ekipman"
  | "Lojistik"
  | "Hizmet"
  | "Diğer";

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  category: SupplierCategory;
  paymentTerms: string;
  rating: number;
  notes: string;
}

const CATEGORY_COLORS: Record<SupplierCategory, string> = {
  Hammadde: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Ekipman: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Lojistik: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  Hizmet: "bg-teal-500/15 text-teal-300 border-teal-500/30",
  Diğer: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const CATEGORIES: SupplierCategory[] = [
  "Hammadde",
  "Ekipman",
  "Lojistik",
  "Hizmet",
  "Diğer",
];

function StarRating({
  value,
  onChange,
}: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`transition-colors ${
            n <= value ? "text-amber-400" : "text-slate-600"
          } ${onChange ? "hover:text-amber-300 cursor-pointer" : "cursor-default"}`}
        >
          <Star className="w-4 h-4 fill-current" />
        </button>
      ))}
    </div>
  );
}

const EMPTY_FORM: Omit<Supplier, "id"> = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  category: "Hammadde",
  paymentTerms: "Net 30",
  rating: 3,
  notes: "",
};

interface Props {
  suppliers: Supplier[];
  onAdd: (s: Supplier) => void;
  onUpdate: (s: Supplier) => void;
  onDelete: (id: string) => void;
}

export default function SupplierModule({
  suppliers,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const { t } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<Supplier, "id">>(EMPTY_FORM);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (s: Supplier) => {
    setEditTarget(s);
    setForm({
      name: s.name,
      contactPerson: s.contactPerson,
      phone: s.phone,
      email: s.email,
      category: s.category,
      paymentTerms: s.paymentTerms,
      rating: s.rating,
      notes: s.notes,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editTarget) {
      onUpdate({ ...form, id: editTarget.id });
    } else {
      onAdd({ ...form, id: String(Date.now()) });
    }
    setShowDialog(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center">
            <Users2 className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t("supplier.title")}
            </h2>
            <p className="text-slate-400 text-sm">
              {suppliers.length} {t("supplier.totalSuppliers").toLowerCase()}
            </p>
          </div>
        </div>
        <Button
          className="bg-rose-600 hover:bg-rose-700 text-white"
          onClick={openAdd}
          data-ocid="supplier.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("supplier.add")}
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="supplier.empty_state"
        >
          <Users2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t("supplier.add")}</p>
        </div>
      ) : (
        <div
          className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
          data-ocid="supplier.table"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                  {t("supplier.name")}
                </th>
                <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                  {t("supplier.contact")}
                </th>
                <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                  {t("supplier.category")}
                </th>
                <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                  {t("supplier.paymentTerms")}
                </th>
                <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                  {t("supplier.rating")}
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s, i) => (
                <tr
                  key={s.id}
                  className="border-b border-white/5 last:border-0"
                  data-ocid={`supplier.row.${i + 1}`}
                >
                  <td className="px-5 py-3">
                    <p className="text-white font-medium">{s.name}</p>
                    <p className="text-slate-500 text-xs">{s.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-300 text-sm">{s.contactPerson}</p>
                    <p className="text-slate-500 text-xs">{s.phone}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${CATEGORY_COLORS[s.category]}`}
                    >
                      {s.category}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">
                    {s.paymentTerms}
                  </td>
                  <td className="px-5 py-3">
                    <StarRating value={s.rating} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="text-slate-500 hover:text-blue-400 transition-colors"
                        data-ocid={`supplier.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(s.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        data-ocid={`supplier.delete_button.${i + 1}`}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-lg"
          data-ocid="supplier.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {editTarget ? t("supplier.edit") : t("supplier.add")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-slate-300 text-sm">
                  {t("supplier.name")}
                </Label>
                <Input
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  data-ocid="supplier.input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("supplier.contact")}
                </Label>
                <Input
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, contactPerson: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("supplier.phone")}
                </Label>
                <Input
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("supplier.email")}
                </Label>
                <Input
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("supplier.category")}
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, category: v as SupplierCategory }))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-white/10 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-white/10">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-white">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("supplier.paymentTerms")}
                </Label>
                <Input
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  value={form.paymentTerms}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, paymentTerms: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-300 text-sm mb-2 block">
                  {t("supplier.rating")}
                </Label>
                <StarRating
                  value={form.rating}
                  onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
                />
              </div>
              <div className="col-span-2">
                <Label className="text-slate-300 text-sm">
                  {t("supplier.notes")}
                </Label>
                <Textarea
                  className="bg-slate-700 border-white/10 text-white mt-1 resize-none"
                  rows={3}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="supplier.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleSave}
                data-ocid="supplier.save_button"
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
