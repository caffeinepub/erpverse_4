import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit3, Plus, Target, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

type KPICategory = "Satış" | "HR" | "Üretim" | "Finans" | "Genel";

interface KPI {
  id: string;
  name: string;
  category: KPICategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  assignedTo: string;
}

const STORAGE_KEY = "erpverse_kpi_data";

function loadKPIs(): KPI[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveKPIs(kpis: KPI[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(kpis));
}

function getStatus(kpi: KPI): "completed" | "overdue" | "active" {
  const progress =
    kpi.targetValue > 0 ? (kpi.currentValue / kpi.targetValue) * 100 : 0;
  if (progress >= 100) return "completed";
  const today = new Date().toISOString().split("T")[0];
  if (kpi.endDate && kpi.endDate < today) return "overdue";
  return "active";
}

const CATEGORIES: KPICategory[] = ["Satış", "HR", "Üretim", "Finans", "Genel"];

export default function KPIModule() {
  const { t } = useLanguage();
  const [kpis, setKPIs] = useState<KPI[]>(loadKPIs);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [updateValue, setUpdateValue] = useState("");
  const [form, setForm] = useState<Omit<KPI, "id">>({
    name: "",
    category: "Genel",
    targetValue: 0,
    currentValue: 0,
    unit: "",
    startDate: "",
    endDate: "",
    assignedTo: "",
  });

  const persist = (updated: KPI[]) => {
    setKPIs(updated);
    saveKPIs(updated);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      persist(
        kpis.map((k) => (k.id === editingId ? { ...form, id: editingId } : k)),
      );
    } else {
      persist([...kpis, { ...form, id: Date.now().toString() }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "Genel",
      targetValue: 0,
      currentValue: 0,
      unit: "",
      startDate: "",
      endDate: "",
      assignedTo: "",
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (kpi: KPI) => {
    setForm({
      name: kpi.name,
      category: kpi.category,
      targetValue: kpi.targetValue,
      currentValue: kpi.currentValue,
      unit: kpi.unit,
      startDate: kpi.startDate,
      endDate: kpi.endDate,
      assignedTo: kpi.assignedTo,
    });
    setEditingId(kpi.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => persist(kpis.filter((k) => k.id !== id));

  const handleUpdateValue = (id: string) => {
    const val = Number.parseFloat(updateValue);
    if (Number.isNaN(val)) return;
    persist(kpis.map((k) => (k.id === id ? { ...k, currentValue: val } : k)));
    setUpdateId(null);
    setUpdateValue("");
  };

  const filtered = useMemo(
    () =>
      filterCategory === "all"
        ? kpis
        : kpis.filter((k) => k.category === filterCategory),
    [kpis, filterCategory],
  );

  const statusColor = (s: string) =>
    s === "completed"
      ? "bg-emerald-500"
      : s === "overdue"
        ? "bg-red-500"
        : "bg-blue-500";

  const statusBadgeVariant = (s: string) =>
    s === "completed"
      ? "default"
      : s === "overdue"
        ? "destructive"
        : "secondary";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-7 h-7 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">{t("kpi.title")}</h1>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
          data-ocid="kpi.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("kpi.add")}
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={filterCategory === "all" ? "default" : "outline"}
          onClick={() => setFilterCategory("all")}
          className={
            filterCategory === "all"
              ? "bg-yellow-500 text-black"
              : "border-slate-600 text-slate-300"
          }
          data-ocid="kpi.tab"
        >
          {t("kpi.allCategories")}
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={filterCategory === cat ? "default" : "outline"}
            onClick={() => setFilterCategory(cat)}
            className={
              filterCategory === cat
                ? "bg-yellow-500 text-black"
                : "border-slate-600 text-slate-300"
            }
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card className="bg-slate-800 border-slate-700" data-ocid="kpi.modal">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              {editingId ? t("kpi.name") : t("kpi.add")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-slate-300">{t("kpi.name")}</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
                data-ocid="kpi.input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">{t("kpi.category")}</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, category: v as KPICategory }))
                }
              >
                <SelectTrigger
                  className="bg-slate-700 border-slate-600 text-white"
                  data-ocid="kpi.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-white">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">{t("kpi.unit")}</Label>
              <Input
                value={form.unit}
                onChange={(e) =>
                  setForm((p) => ({ ...p, unit: e.target.value }))
                }
                placeholder="₺, %, adet, saat"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">{t("kpi.target")}</Label>
              <Input
                type="number"
                value={form.targetValue}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    targetValue: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">{t("kpi.current")}</Label>
              <Input
                type="number"
                value={form.currentValue}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    currentValue: Number.parseFloat(e.target.value) || 0,
                  }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">{t("kpi.assignedTo")}</Label>
              <Input
                value={form.assignedTo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, assignedTo: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">{t("kpi.startDate")}</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, startDate: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">{t("kpi.endDate")}</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, endDate: e.target.value }))
                }
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="col-span-full flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={resetForm}
                className="border-slate-600 text-slate-300"
                data-ocid="kpi.cancel_button"
              >
                İptal
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                data-ocid="kpi.submit_button"
              >
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI List */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-slate-400"
          data-ocid="kpi.empty_state"
        >
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("kpi.noData")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((kpi, idx) => {
            const status = getStatus(kpi);
            const pct =
              kpi.targetValue > 0
                ? Math.min(
                    100,
                    Math.round((kpi.currentValue / kpi.targetValue) * 100),
                  )
                : 0;
            return (
              <Card
                key={kpi.id}
                className="bg-slate-800 border-slate-700"
                data-ocid={`kpi.item.${idx + 1}`}
              >
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-white">{kpi.name}</p>
                      <p className="text-xs text-slate-400">
                        {kpi.category} · {kpi.assignedTo}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={statusBadgeVariant(status) as any}
                        className="text-xs"
                      >
                        {t(`kpi.status.${status}`)}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(kpi)}
                        className="h-7 w-7 text-slate-400 hover:text-white"
                        data-ocid={`kpi.edit_button.${idx + 1}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(kpi.id)}
                        className="h-7 w-7 text-slate-400 hover:text-red-400"
                        data-ocid={`kpi.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        {t("kpi.progress")}
                      </span>
                      <span className="text-white font-medium">
                        {kpi.currentValue} / {kpi.targetValue} {kpi.unit} ({pct}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${statusColor(status)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {kpi.startDate && kpi.endDate && (
                    <p className="text-xs text-slate-500">
                      {kpi.startDate} → {kpi.endDate}
                    </p>
                  )}

                  {updateId === kpi.id ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        value={updateValue}
                        onChange={(e) => setUpdateValue(e.target.value)}
                        placeholder={t("kpi.current")}
                        className="bg-slate-700 border-slate-600 text-white h-8 text-sm"
                        data-ocid={`kpi.input.${idx + 1}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateValue(kpi.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs"
                        data-ocid={`kpi.save_button.${idx + 1}`}
                      >
                        Kaydet
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setUpdateId(null)}
                        className="text-slate-400"
                        data-ocid={`kpi.cancel_button.${idx + 1}`}
                      >
                        İptal
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setUpdateId(kpi.id);
                        setUpdateValue(kpi.currentValue.toString());
                      }}
                      className="border-slate-600 text-slate-300 hover:text-white text-xs"
                      data-ocid={`kpi.secondary_button.${idx + 1}`}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      {t("kpi.update")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
