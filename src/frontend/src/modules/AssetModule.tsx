import {
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Edit2,
  HardDrive,
  Plus,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
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
import { Progress } from "../components/ui/progress";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface MaintenanceLog {
  id: string;
  date: string;
  note: string;
}

interface Asset {
  id: string;
  name: string;
  category: string;
  serialNo: string;
  purchaseDate: string;
  purchaseValue: number;
  currentValue: number;
  location: string;
  assignedPersonnel: string;
  status: string;
  maintenanceLogs: MaintenanceLog[];
  usefulLifeYears?: number;
  salvageValue?: number;
  appliedDepreciationMonths?: number;
}

interface Transaction {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  date: string;
  category: string;
  currency?: string;
}

const CATEGORIES = ["Ekipman", "Araç", "BT Donanımı", "Mobilya", "Diğer"];
const STATUSES = ["Aktif", "Bakımda", "Kullanım Dışı"];

function getMonthlyDepreciation(asset: Asset): number {
  const purchaseValue = asset.purchaseValue || 0;
  const salvageValue = asset.salvageValue ?? 0;
  const usefulLifeYears = asset.usefulLifeYears ?? 5;
  const totalMonths = usefulLifeYears * 12;
  if (totalMonths === 0 || purchaseValue <= salvageValue) return 0;
  return (purchaseValue - salvageValue) / totalMonths;
}

function getAppliedMonths(asset: Asset): number {
  return asset.appliedDepreciationMonths ?? 0;
}

function getTotalMonths(asset: Asset): number {
  return (asset.usefulLifeYears ?? 5) * 12;
}

function getAccumulatedDepreciation(asset: Asset): number {
  return getMonthlyDepreciation(asset) * getAppliedMonths(asset);
}

function getBookValue(asset: Asset): number {
  return (asset.purchaseValue || 0) - getAccumulatedDepreciation(asset);
}

export default function AssetModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";

  const [assets, setAssets] = useLocalStorage<Asset[]>(
    `erpverse_assets_${cid}`,
    [],
  );

  const [, setTransactions] = useLocalStorage<Transaction[]>(
    `erpverse_accounting_${cid}`,
    [],
  );

  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [maintenanceNote, setMaintenanceNote] = useState("");
  const [scheduleAsset, setScheduleAsset] = useState<Asset | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "Ekipman",
    serialNo: "",
    purchaseDate: "",
    purchaseValue: "",
    currentValue: "",
    location: "",
    assignedPersonnel: "",
    status: "Aktif",
    usefulLifeYears: "5",
    salvageValue: "0",
  });

  const resetForm = () => {
    setForm({
      name: "",
      category: "Ekipman",
      serialNo: "",
      purchaseDate: "",
      purchaseValue: "",
      currentValue: "",
      location: "",
      assignedPersonnel: "",
      status: "Aktif",
      usefulLifeYears: "5",
      salvageValue: "0",
    });
    setEditId(null);
  };

  const openAdd = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEdit = (a: Asset) => {
    setForm({
      name: a.name,
      category: a.category,
      serialNo: a.serialNo,
      purchaseDate: a.purchaseDate,
      purchaseValue: String(a.purchaseValue),
      currentValue: String(a.currentValue),
      location: a.location,
      assignedPersonnel: a.assignedPersonnel,
      status: a.status,
      usefulLifeYears: String(a.usefulLifeYears ?? 5),
      salvageValue: String(a.salvageValue ?? 0),
    });
    setEditId(a.id);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error(t("asset.nameRequired"));
      return;
    }
    if (editId) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === editId
            ? {
                ...a,
                name: form.name,
                category: form.category,
                serialNo: form.serialNo,
                purchaseDate: form.purchaseDate,
                purchaseValue: Number(form.purchaseValue) || 0,
                currentValue: Number(form.currentValue) || 0,
                location: form.location,
                assignedPersonnel: form.assignedPersonnel,
                status: form.status,
                usefulLifeYears: Number(form.usefulLifeYears) || 5,
                salvageValue: Number(form.salvageValue) || 0,
              }
            : a,
        ),
      );
      toast.success(t("common.updated"));
    } else {
      const newAsset: Asset = {
        id: Date.now().toString(),
        name: form.name,
        category: form.category,
        serialNo: form.serialNo,
        purchaseDate: form.purchaseDate,
        purchaseValue: Number(form.purchaseValue) || 0,
        currentValue: Number(form.currentValue) || 0,
        location: form.location,
        assignedPersonnel: form.assignedPersonnel,
        status: form.status,
        maintenanceLogs: [],
        usefulLifeYears: Number(form.usefulLifeYears) || 5,
        salvageValue: Number(form.salvageValue) || 0,
        appliedDepreciationMonths: 0,
      };
      setAssets((prev) => [...prev, newAsset]);
      toast.success(t("common.added"));
    }
    setShowDialog(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success(t("common.deleted"));
  };

  const addMaintenance = (assetId: string) => {
    if (!maintenanceNote.trim()) return;
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId
          ? {
              ...a,
              maintenanceLogs: [
                ...a.maintenanceLogs,
                {
                  id: Date.now().toString(),
                  date: new Date().toISOString().slice(0, 10),
                  note: maintenanceNote,
                },
              ],
            }
          : a,
      ),
    );
    setMaintenanceNote("");
    toast.success(t("asset.maintenanceAdded"));
  };

  const applyDepreciation = (asset: Asset) => {
    const totalMonths = getTotalMonths(asset);
    const applied = getAppliedMonths(asset);
    if (applied >= totalMonths) return;

    const monthly = getMonthlyDepreciation(asset);

    setAssets((prev) =>
      prev.map((a) =>
        a.id === asset.id
          ? {
              ...a,
              appliedDepreciationMonths: (a.appliedDepreciationMonths ?? 0) + 1,
            }
          : a,
      ),
    );

    const today = new Date().toISOString().slice(0, 10);
    const entry: Transaction = {
      id: `dep_${Date.now()}`,
      type: "expense",
      description: `${t("asset.depreciationEntry")} - ${asset.name}`,
      amount: Math.round(monthly * 100) / 100,
      date: today,
      category: "Gider",
      currency: "TRY",
    };
    setTransactions((prev) => [...prev, entry]);
    toast.success(t("asset.depreciationApplied"));
  };

  const filtered = assets.filter(
    (a) =>
      (filterCategory === "all" || a.category === filterCategory) &&
      (filterStatus === "all" || a.status === filterStatus),
  );

  const statusColor = (s: string) => {
    if (s === "Aktif")
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "Bakımda")
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const simpleDepreciation = (a: Asset) => {
    if (!a.purchaseValue) return 0;
    return Math.round(
      ((a.purchaseValue - a.currentValue) / a.purchaseValue) * 100,
    );
  };

  // Depreciation summary
  const totalOriginalValue = assets.reduce(
    (s, a) => s + (a.purchaseValue || 0),
    0,
  );
  const totalAccumulated = assets.reduce(
    (s, a) => s + getAccumulatedDepreciation(a),
    0,
  );
  const totalBookValue = assets.reduce((s, a) => s + getBookValue(a), 0);

  // Schedule modal
  const renderScheduleModal = () => {
    if (!scheduleAsset) return null;
    const monthly = getMonthlyDepreciation(scheduleAsset);
    const totalMonths = getTotalMonths(scheduleAsset);
    const applied = getAppliedMonths(scheduleAsset);
    const rows: Array<{
      month: number;
      amount: number;
      accumulated: number;
      book: number;
    }> = [];
    let acc = 0;
    for (let i = 1; i <= totalMonths; i++) {
      acc += monthly;
      rows.push({
        month: i,
        amount: monthly,
        accumulated: acc,
        book: (scheduleAsset.purchaseValue || 0) - acc,
      });
    }
    return (
      <Dialog
        open={!!scheduleAsset}
        onOpenChange={() => setScheduleAsset(null)}
      >
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-2xl max-h-[80vh] overflow-auto"
          data-ocid="asset.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              {t("asset.depreciationSchedule")} — {scheduleAsset.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-400">
                    {t("asset.month")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-right">
                    {t("asset.monthlyDepreciation")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-right">
                    {t("asset.accumulatedDepreciation")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-right">
                    {t("asset.bookValue")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow
                    key={r.month}
                    className={`border-white/10 ${
                      r.month <= applied
                        ? "bg-purple-500/10 text-purple-300"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <TableCell className="font-medium">{r.month}</TableCell>
                    <TableCell className="text-right">
                      {r.amount.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </TableCell>
                    <TableCell className="text-right">
                      {r.accumulated.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </TableCell>
                    <TableCell className="text-right">
                      {Math.max(0, r.book).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end mt-3">
            <Button
              variant="ghost"
              onClick={() => setScheduleAsset(null)}
              className="text-slate-400"
              data-ocid="asset.close_button"
            >
              <X className="w-4 h-4 mr-1" />
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-orange-400" />
            {t("modules.Assets")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {t("asset.totalAssets")}: {assets.length}
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-orange-600 hover:bg-orange-700 text-white"
          data-ocid="asset.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("asset.addAsset")}
        </Button>
      </div>

      <Tabs defaultValue="assets">
        <TabsList className="bg-slate-800 border border-white/10">
          <TabsTrigger
            value="assets"
            className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-slate-300"
            data-ocid="asset.tab"
          >
            {t("asset.assetsTab")}
          </TabsTrigger>
          <TabsTrigger
            value="depreciation"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-300"
            data-ocid="asset.tab"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            {t("asset.depreciationTab")}
          </TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger
                className="w-48 bg-slate-800 border-white/10 text-white"
                data-ocid="asset.select"
              >
                <SelectValue placeholder={t("asset.filterCategory")} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="all" className="text-white">
                  {t("common.all")}
                </SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-white">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger
                className="w-48 bg-slate-800 border-white/10 text-white"
                data-ocid="asset.status.select"
              >
                <SelectValue placeholder={t("asset.filterStatus")} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                <SelectItem value="all" className="text-white">
                  {t("common.all")}
                </SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-white">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="asset.empty_state"
            >
              <HardDrive className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("asset.noAssets")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("asset.assetName")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("asset.assetCategory")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("asset.serialNo")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("asset.purchaseValue")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("asset.currentValue")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("asset.depreciation")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("asset.status")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a, idx) => (
                    <>
                      <TableRow
                        key={a.id}
                        className="border-white/10 hover:bg-white/5 cursor-pointer"
                        data-ocid={`asset.row.${idx + 1}`}
                      >
                        <TableCell className="text-white font-medium">
                          {a.name}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {a.category}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {a.serialNo || "-"}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {a.purchaseValue.toLocaleString()} ₺
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {a.currentValue.toLocaleString()} ₺
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-sm font-semibold ${simpleDepreciation(a) > 50 ? "text-red-400" : "text-amber-400"}`}
                          >
                            %{simpleDepreciation(a)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`border ${statusColor(a.status)}`}>
                            {a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setExpandedId(expandedId === a.id ? null : a.id)
                              }
                              className="text-slate-400 hover:text-white h-8 w-8"
                              data-ocid={`asset.toggle.${idx + 1}`}
                            >
                              {expandedId === a.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(a)}
                              className="text-slate-400 hover:text-blue-400 h-8 w-8"
                              data-ocid={`asset.edit_button.${idx + 1}`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(a.id)}
                              className="text-slate-400 hover:text-red-400 h-8 w-8"
                              data-ocid={`asset.delete_button.${idx + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === a.id && (
                        <TableRow
                          key={`${a.id}-expand`}
                          className="border-white/10"
                        >
                          <TableCell
                            colSpan={8}
                            className="bg-slate-900/50 p-4"
                          >
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                <span>
                                  {t("asset.location")}:{" "}
                                  <span className="text-white">
                                    {a.location || "-"}
                                  </span>
                                </span>
                                <span>
                                  {t("asset.assignedPersonnel")}:{" "}
                                  <span className="text-white">
                                    {a.assignedPersonnel || "-"}
                                  </span>
                                </span>
                                <span>
                                  {t("asset.purchaseDate")}:{" "}
                                  <span className="text-white">
                                    {a.purchaseDate || "-"}
                                  </span>
                                </span>
                              </div>
                              <div>
                                <p className="text-slate-400 text-sm font-medium mb-2 flex items-center gap-1">
                                  <Wrench className="w-4 h-4" />
                                  {t("asset.maintenanceLog")}
                                </p>
                                {a.maintenanceLogs.length === 0 ? (
                                  <p className="text-slate-600 text-sm">
                                    {t("asset.noMaintenance")}
                                  </p>
                                ) : (
                                  <div className="space-y-1">
                                    {a.maintenanceLogs.map((log) => (
                                      <div
                                        key={log.id}
                                        className="text-sm flex gap-3"
                                      >
                                        <span className="text-slate-500">
                                          {log.date}
                                        </span>
                                        <span className="text-slate-300">
                                          {log.note}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="flex gap-2 mt-2">
                                  <Input
                                    value={maintenanceNote}
                                    onChange={(e) =>
                                      setMaintenanceNote(e.target.value)
                                    }
                                    placeholder={t("asset.addMaintenance")}
                                    className="bg-slate-800 border-white/10 text-white text-sm h-8"
                                    data-ocid="asset.input"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => addMaintenance(a.id)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white h-8"
                                    data-ocid="asset.save_button"
                                  >
                                    {t("common.add")}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Depreciation Tab */}
        <TabsContent value="depreciation" className="mt-4 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl p-4 border border-white/10">
              <p className="text-slate-400 text-xs mb-1">
                {t("asset.totalAssets")}
              </p>
              <p className="text-white text-2xl font-bold">{assets.length}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-white/10">
              <p className="text-slate-400 text-xs mb-1">
                {t("asset.totalOriginalValue")}
              </p>
              <p className="text-orange-400 text-xl font-bold">
                {totalOriginalValue.toLocaleString("tr-TR", {
                  maximumFractionDigits: 0,
                })}{" "}
                ₺
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-white/10">
              <p className="text-slate-400 text-xs mb-1">
                {t("asset.totalAccumulatedDepreciation")}
              </p>
              <p className="text-red-400 text-xl font-bold">
                {totalAccumulated.toLocaleString("tr-TR", {
                  maximumFractionDigits: 0,
                })}{" "}
                ₺
              </p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-white/10">
              <p className="text-slate-400 text-xs mb-1">
                {t("asset.totalBookValue")}
              </p>
              <p className="text-emerald-400 text-xl font-bold">
                {totalBookValue.toLocaleString("tr-TR", {
                  maximumFractionDigits: 0,
                })}{" "}
                ₺
              </p>
            </div>
          </div>

          {assets.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="asset.empty_state"
            >
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t("asset.noAssets")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("asset.assetName")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("asset.purchaseValue")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("asset.salvageValue")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("asset.usefulLifeYears")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("asset.monthlyDepreciation")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("asset.appliedDepreciation")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("asset.bookValue")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-center">
                      {t("asset.appliedMonths")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("common.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((a, idx) => {
                    const monthly = getMonthlyDepreciation(a);
                    const applied = getAppliedMonths(a);
                    const total = getTotalMonths(a);
                    const accumulated = getAccumulatedDepreciation(a);
                    const book = getBookValue(a);
                    const isFullyDepreciated = applied >= total;
                    const progressPct =
                      total > 0 ? Math.min(100, (applied / total) * 100) : 0;

                    return (
                      <TableRow
                        key={a.id}
                        className="border-white/10 hover:bg-white/5"
                        data-ocid={`asset.row.${idx + 1}`}
                      >
                        <TableCell>
                          <button
                            type="button"
                            className="text-purple-400 hover:text-purple-300 font-medium underline-offset-2 hover:underline text-left"
                            onClick={() => setScheduleAsset(a)}
                          >
                            {a.name}
                          </button>
                        </TableCell>
                        <TableCell className="text-right text-slate-300">
                          {(a.purchaseValue || 0).toLocaleString("tr-TR", {
                            maximumFractionDigits: 0,
                          })}{" "}
                          ₺
                        </TableCell>
                        <TableCell className="text-right text-slate-300">
                          {(a.salvageValue ?? 0).toLocaleString("tr-TR", {
                            maximumFractionDigits: 0,
                          })}{" "}
                          ₺
                        </TableCell>
                        <TableCell className="text-right text-slate-300">
                          {a.usefulLifeYears ?? 5}
                        </TableCell>
                        <TableCell className="text-right text-amber-400 font-medium">
                          {monthly.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </TableCell>
                        <TableCell className="text-right text-red-400">
                          {accumulated.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </TableCell>
                        <TableCell className="text-right text-emerald-400 font-semibold">
                          {Math.max(0, book).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-slate-400">
                              {applied}/{total}
                            </span>
                            <Progress
                              value={progressPct}
                              className="h-1.5 w-20"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            disabled={isFullyDepreciated}
                            onClick={() => applyDepreciation(a)}
                            className={`h-7 text-xs ${
                              isFullyDepreciated
                                ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                                : "bg-purple-600 hover:bg-purple-700 text-white"
                            }`}
                            data-ocid={`asset.secondary_button.${idx + 1}`}
                          >
                            {isFullyDepreciated
                              ? t("asset.fullyDepreciated")
                              : t("asset.applyDepreciation")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Depreciation Schedule Modal */}
      {renderScheduleModal()}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-lg"
          data-ocid="asset.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {editId ? t("asset.editAsset") : t("asset.addAsset")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.assetName")} *
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="asset.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.assetCategory")}
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
              >
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white"
                  data-ocid="asset.select"
                >
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
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.status")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white"
                  data-ocid="asset.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-white/10">
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-white">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.serialNo")}
              </Label>
              <Input
                value={form.serialNo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, serialNo: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="asset.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.purchaseDate")}
              </Label>
              <Input
                type="date"
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, purchaseDate: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="asset.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.purchaseValue")}
              </Label>
              <Input
                type="number"
                value={form.purchaseValue}
                onChange={(e) =>
                  setForm((p) => ({ ...p, purchaseValue: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="asset.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.currentValue")}
              </Label>
              <Input
                type="number"
                value={form.currentValue}
                onChange={(e) =>
                  setForm((p) => ({ ...p, currentValue: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="asset.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.usefulLifeYears")}
              </Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={form.usefulLifeYears}
                onChange={(e) =>
                  setForm((p) => ({ ...p, usefulLifeYears: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="asset.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.salvageValue")}
              </Label>
              <Input
                type="number"
                min="0"
                value={form.salvageValue}
                onChange={(e) =>
                  setForm((p) => ({ ...p, salvageValue: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="asset.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.location")}
              </Label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm((p) => ({ ...p, location: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="asset.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("asset.assignedPersonnel")}
              </Label>
              <Input
                value={form.assignedPersonnel}
                onChange={(e) =>
                  setForm((p) => ({ ...p, assignedPersonnel: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="asset.input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
              className="text-slate-400"
              data-ocid="asset.cancel_button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              data-ocid="asset.submit_button"
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
