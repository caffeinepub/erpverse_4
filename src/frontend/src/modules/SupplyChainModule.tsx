import { Edit2, Link2, Plus, Trash2, Truck } from "lucide-react";
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
import { useAuditLog } from "../contexts/AuditLogContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface SupplierPerformance {
  id: string;
  supplierName: string;
  score: number;
  deliveryRate: number;
  qualityRate: number;
  lastEvaluated: string;
  notes: string;
}

interface Shipment {
  id: string;
  trackingNo: string;
  supplier: string;
  productName: string;
  origin: string;
  destination: string;
  status: "preparing" | "in_transit" | "customs" | "delivered" | "delayed";
  estimatedDate: string;
  actualDate: string;
  notes: string;
}

interface InventoryRotation {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  avgMonthlySales: number;
  rotationDays: number;
  status: "fast" | "normal" | "slow" | "dead";
  lastUpdated: string;
}

type ActiveTab = "performance" | "shipments" | "rotation";

export default function SupplyChainModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();

  const [performances, setPerformances] = useLocalStorage<
    SupplierPerformance[]
  >(`erpverse_sc_perf_${cid}`, []);
  const [shipments, setShipments] = useLocalStorage<Shipment[]>(
    `erpverse_sc_ship_${cid}`,
    [],
  );
  const [rotations, setRotations] = useLocalStorage<InventoryRotation[]>(
    `erpverse_sc_rot_${cid}`,
    [],
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("performance");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [pForm, setPForm] = useState({
    supplierName: "",
    score: "",
    deliveryRate: "",
    qualityRate: "",
    lastEvaluated: "",
    notes: "",
  });
  const [sForm, setSForm] = useState({
    trackingNo: "",
    supplier: "",
    productName: "",
    origin: "",
    destination: "",
    status: "preparing" as Shipment["status"],
    estimatedDate: "",
    actualDate: "",
    notes: "",
  });
  const [rForm, setRForm] = useState({
    productName: "",
    sku: "",
    currentStock: "",
    avgMonthlySales: "",
    rotationDays: "",
    status: "normal" as InventoryRotation["status"],
    lastUpdated: "",
  });

  const today = new Date().toISOString().slice(0, 10);

  const openAdd = () => {
    setEditId(null);
    setPForm({
      supplierName: "",
      score: "",
      deliveryRate: "",
      qualityRate: "",
      lastEvaluated: today,
      notes: "",
    });
    setSForm({
      trackingNo: "",
      supplier: "",
      productName: "",
      origin: "",
      destination: "",
      status: "preparing",
      estimatedDate: today,
      actualDate: "",
      notes: "",
    });
    setRForm({
      productName: "",
      sku: "",
      currentStock: "",
      avgMonthlySales: "",
      rotationDays: "",
      status: "normal",
      lastUpdated: today,
    });
    setShowDialog(true);
  };

  const openEdit = (id: string) => {
    setEditId(id);
    if (activeTab === "performance") {
      const p = performances.find((x) => x.id === id);
      if (p)
        setPForm({
          supplierName: p.supplierName,
          score: String(p.score),
          deliveryRate: String(p.deliveryRate),
          qualityRate: String(p.qualityRate),
          lastEvaluated: p.lastEvaluated,
          notes: p.notes,
        });
    } else if (activeTab === "shipments") {
      const s = shipments.find((x) => x.id === id);
      if (s)
        setSForm({
          trackingNo: s.trackingNo,
          supplier: s.supplier,
          productName: s.productName || "",
          origin: s.origin,
          destination: s.destination,
          status: s.status,
          estimatedDate: s.estimatedDate,
          actualDate: s.actualDate,
          notes: s.notes,
        });
    } else {
      const r = rotations.find((x) => x.id === id);
      if (r)
        setRForm({
          productName: r.productName,
          sku: r.sku,
          currentStock: String(r.currentStock),
          avgMonthlySales: String(r.avgMonthlySales),
          rotationDays: String(r.rotationDays),
          status: r.status,
          lastUpdated: r.lastUpdated,
        });
    }
    setShowDialog(true);
  };

  const savePerformance = () => {
    if (!pForm.supplierName) {
      toast.error(t("sc.fieldsRequired"));
      return;
    }
    const item: SupplierPerformance = {
      id: editId || Date.now().toString(),
      supplierName: pForm.supplierName,
      score: Number.parseFloat(pForm.score) || 0,
      deliveryRate: Number.parseFloat(pForm.deliveryRate) || 0,
      qualityRate: Number.parseFloat(pForm.qualityRate) || 0,
      lastEvaluated: pForm.lastEvaluated,
      notes: pForm.notes,
    };
    setPerformances((prev) =>
      editId ? prev.map((x) => (x.id === editId ? item : x)) : [item, ...prev],
    );
    setShowDialog(false);
    toast.success(t("common.saved"));
  };

  const saveShipment = () => {
    if (!sForm.trackingNo || !sForm.supplier) {
      toast.error(t("sc.fieldsRequired"));
      return;
    }
    const item: Shipment = {
      id: editId || Date.now().toString(),
      trackingNo: sForm.trackingNo,
      supplier: sForm.supplier,
      productName: sForm.productName,
      origin: sForm.origin,
      destination: sForm.destination,
      status: sForm.status,
      estimatedDate: sForm.estimatedDate,
      actualDate: sForm.actualDate,
      notes: sForm.notes,
    };

    // Check if status changed to delivered
    const prevShipment = editId ? shipments.find((s) => s.id === editId) : null;
    const justDelivered =
      sForm.status === "delivered" &&
      (!prevShipment || prevShipment.status !== "delivered");

    setShipments((prev) =>
      editId ? prev.map((x) => (x.id === editId ? item : x)) : [item, ...prev],
    );

    // Inventory sync on delivery using product name matching
    if (justDelivered && sForm.productName) {
      try {
        const invKey = `erpverse_inventory_${cid}`;
        const invItems: {
          id: string;
          name: string;
          stock: number;
          unit: string;
          minStock: number;
          price: number;
        }[] = JSON.parse(localStorage.getItem(invKey) || "[]");

        const searchTerm = sForm.productName.toLowerCase();
        const matchIdx = invItems.findIndex(
          (i) =>
            i.name.toLowerCase().includes(searchTerm) ||
            searchTerm.includes(i.name.toLowerCase()),
        );

        if (matchIdx >= 0) {
          const matched = invItems[matchIdx];
          invItems[matchIdx].stock = (matched.stock || 0) + 1;
          localStorage.setItem(invKey, JSON.stringify(invItems));
          toast.success(
            `${t("sc.deliveredInventorySync")}: ${matched.name} +1`,
          );
          addNotification({
            type: "info",
            title: t("sc.deliveredInventorySync"),
            message: `${sForm.trackingNo} — ${matched.name} +1`,
            companyId: cid,
            targetRole: "all",
          });
          addLog({
            action: t("sc.deliveredInventorySync"),
            module: "SupplyChain",
            detail: `${sForm.trackingNo} → ${matched.name} stok +1`,
          });
        } else {
          toast.success(t("sc.deliveredInventorySync"));
          addNotification({
            type: "info",
            title: t("sc.deliveredInventorySync"),
            message: `${sForm.trackingNo} — ${sForm.productName}`,
            companyId: cid,
            targetRole: "all",
          });
          addLog({
            action: t("sc.deliveredInventorySync"),
            module: "SupplyChain",
            detail: `${sForm.trackingNo} teslim edildi (eşleşme bulunamadı: ${sForm.productName})`,
          });
        }
      } catch (_e) {
        // silently ignore inventory sync errors
      }
    }

    setShowDialog(false);
    toast.success(t("common.saved"));
  };

  const saveRotation = () => {
    if (!rForm.productName) {
      toast.error(t("sc.fieldsRequired"));
      return;
    }
    const item: InventoryRotation = {
      id: editId || Date.now().toString(),
      productName: rForm.productName,
      sku: rForm.sku,
      currentStock: Number.parseFloat(rForm.currentStock) || 0,
      avgMonthlySales: Number.parseFloat(rForm.avgMonthlySales) || 0,
      rotationDays: Number.parseFloat(rForm.rotationDays) || 0,
      status: rForm.status,
      lastUpdated: rForm.lastUpdated,
    };
    setRotations((prev) =>
      editId ? prev.map((x) => (x.id === editId ? item : x)) : [item, ...prev],
    );
    setShowDialog(false);
    toast.success(t("common.saved"));
  };

  const deletePerf = (id: string) => {
    setPerformances((p) => p.filter((x) => x.id !== id));
    toast.success(t("common.deleted"));
  };
  const deleteShip = (id: string) => {
    setShipments((p) => p.filter((x) => x.id !== id));
    toast.success(t("common.deleted"));
  };
  const deleteRot = (id: string) => {
    setRotations((p) => p.filter((x) => x.id !== id));
    toast.success(t("common.deleted"));
  };

  const shipStatusColors: Record<string, string> = {
    preparing: "bg-slate-700 text-slate-200",
    in_transit: "bg-blue-700 text-blue-100",
    customs: "bg-yellow-700 text-yellow-100",
    delivered: "bg-emerald-700 text-emerald-100",
    delayed: "bg-red-700 text-red-100",
  };

  const rotStatusColors: Record<string, string> = {
    fast: "bg-emerald-700 text-emerald-100",
    normal: "bg-blue-700 text-blue-100",
    slow: "bg-yellow-700 text-yellow-100",
    dead: "bg-red-700 text-red-100",
  };

  const avgScore =
    performances.length > 0
      ? (
          performances.reduce((a, p) => a + p.score, 0) / performances.length
        ).toFixed(1)
      : "--";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-500/20">
            <Link2 className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {t("modules.SupplyChain")}
            </h1>
            <p className="text-sm text-slate-400">{t("sc.subtitle")}</p>
          </div>
        </div>
        <Button
          onClick={openAdd}
          className="bg-teal-600 hover:bg-teal-700 text-white"
          data-ocid="sc.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("sc.add")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t("sc.supplierCount")}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {performances.length}
          </p>
          <p className="text-xs text-teal-400 mt-1">
            {t("sc.avgScore")}: {avgScore}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t("sc.shipmentCount")}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {shipments.length}
          </p>
          <p className="text-xs text-red-400 mt-1">
            {shipments.filter((s) => s.status === "delayed").length}{" "}
            {t("sc.delayed")}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t("sc.rotationItems")}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {rotations.length}
          </p>
          <p className="text-xs text-yellow-400 mt-1">
            {rotations.filter((r) => r.status === "dead").length}{" "}
            {t("sc.deadStock")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["performance", "shipments", "rotation"] as ActiveTab[]).map(
          (tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              data-ocid={`sc.${tab}.tab`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-teal-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {t(`sc.tab.${tab}`)}
            </button>
          ),
        )}
      </div>

      {/* Performance Table */}
      {activeTab === "performance" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {performances.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="sc.perf.empty_state"
            >
              {t("sc.noPerformance")}
            </div>
          ) : (
            <Table data-ocid="sc.perf.table">
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">
                    {t("sc.supplierName")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.score")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.deliveryRate")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.qualityRate")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.lastEvaluated")}
                  </TableHead>
                  <TableHead className="text-slate-400" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {performances.map((p, i) => (
                  <TableRow
                    key={p.id}
                    className="border-slate-700"
                    data-ocid={`sc.perf.row.${i + 1}`}
                  >
                    <TableCell className="text-white">
                      {p.supplierName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${
                          p.score >= 80
                            ? "text-emerald-400"
                            : p.score >= 60
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {p.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {p.deliveryRate}%
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {p.qualityRate}%
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {p.lastEvaluated}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(p.id)}
                        data-ocid={`sc.perf.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={() => deletePerf(p.id)}
                        data-ocid={`sc.perf.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Shipments Table */}
      {activeTab === "shipments" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {shipments.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="sc.ship.empty_state"
            >
              {t("sc.noShipments")}
            </div>
          ) : (
            <Table data-ocid="sc.ship.table">
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">
                    {t("sc.trackingNo")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.supplier")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.productName")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.origin")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.destination")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.status")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.estimatedDate")}
                  </TableHead>
                  <TableHead className="text-slate-400" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s, i) => (
                  <TableRow
                    key={s.id}
                    className="border-slate-700"
                    data-ocid={`sc.ship.row.${i + 1}`}
                  >
                    <TableCell className="text-white font-mono">
                      {s.trackingNo}
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {s.supplier}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {s.productName || "—"}
                    </TableCell>
                    <TableCell className="text-slate-400">{s.origin}</TableCell>
                    <TableCell className="text-slate-400">
                      {s.destination}
                    </TableCell>
                    <TableCell>
                      <Badge className={shipStatusColors[s.status]}>
                        {t(`sc.shipStatus.${s.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {s.estimatedDate}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(s.id)}
                        data-ocid={`sc.ship.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={() => deleteShip(s.id)}
                        data-ocid={`sc.ship.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Rotation Table */}
      {activeTab === "rotation" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {rotations.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="sc.rot.empty_state"
            >
              {t("sc.noRotation")}
            </div>
          ) : (
            <Table data-ocid="sc.rot.table">
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">
                    {t("sc.productName")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.sku")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.currentStock")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.avgMonthlySales")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.rotationDays")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sc.status")}
                  </TableHead>
                  <TableHead className="text-slate-400" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rotations.map((r, i) => (
                  <TableRow
                    key={r.id}
                    className="border-slate-700"
                    data-ocid={`sc.rot.row.${i + 1}`}
                  >
                    <TableCell className="text-white">
                      {r.productName}
                    </TableCell>
                    <TableCell className="text-slate-400 font-mono">
                      {r.sku}
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {r.currentStock}
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {r.avgMonthlySales}
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {r.rotationDays}
                    </TableCell>
                    <TableCell>
                      <Badge className={rotStatusColors[r.status]}>
                        {t(`sc.rotStatus.${r.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(r.id)}
                        data-ocid={`sc.rot.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={() => deleteRot(r.id)}
                        data-ocid={`sc.rot.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-900 border-slate-700 text-white max-w-lg"
          data-ocid="sc.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-teal-400" />
              {editId ? t("common.edit") : t("sc.add")} -{" "}
              {t(`sc.tab.${activeTab}`)}
            </DialogTitle>
          </DialogHeader>

          {activeTab === "performance" && (
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300">{t("sc.supplierName")}</Label>
                <Input
                  data-ocid="sc.perf.name.input"
                  value={pForm.supplierName}
                  onChange={(e) =>
                    setPForm((p) => ({ ...p, supplierName: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-slate-300">{t("sc.score")}</Label>
                  <Input
                    data-ocid="sc.perf.score.input"
                    type="number"
                    min="0"
                    max="100"
                    value={pForm.score}
                    onChange={(e) =>
                      setPForm((p) => ({ ...p, score: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sc.deliveryRate")} %
                  </Label>
                  <Input
                    data-ocid="sc.perf.delivery.input"
                    type="number"
                    min="0"
                    max="100"
                    value={pForm.deliveryRate}
                    onChange={(e) =>
                      setPForm((p) => ({ ...p, deliveryRate: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sc.qualityRate")} %
                  </Label>
                  <Input
                    data-ocid="sc.perf.quality.input"
                    type="number"
                    min="0"
                    max="100"
                    value={pForm.qualityRate}
                    onChange={(e) =>
                      setPForm((p) => ({ ...p, qualityRate: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">
                  {t("sc.lastEvaluated")}
                </Label>
                <Input
                  data-ocid="sc.perf.date.input"
                  type="date"
                  value={pForm.lastEvaluated}
                  onChange={(e) =>
                    setPForm((p) => ({ ...p, lastEvaluated: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">{t("sales.notes")}</Label>
                <Textarea
                  data-ocid="sc.perf.notes.textarea"
                  value={pForm.notes}
                  onChange={(e) =>
                    setPForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-slate-600 text-slate-300"
                  data-ocid="sc.perf.cancel_button"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={savePerformance}
                  className="bg-teal-600 hover:bg-teal-700"
                  data-ocid="sc.perf.save_button"
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "shipments" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sc.trackingNo")}</Label>
                  <Input
                    data-ocid="sc.ship.tracking.input"
                    value={sForm.trackingNo}
                    onChange={(e) =>
                      setSForm((p) => ({ ...p, trackingNo: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">{t("sc.supplier")}</Label>
                  <Input
                    data-ocid="sc.ship.supplier.input"
                    value={sForm.supplier}
                    onChange={(e) =>
                      setSForm((p) => ({ ...p, supplier: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">{t("sc.productName")}</Label>
                <Input
                  data-ocid="sc.ship.product.input"
                  value={sForm.productName}
                  onChange={(e) =>
                    setSForm((p) => ({ ...p, productName: e.target.value }))
                  }
                  placeholder={t("sc.productName")}
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sc.origin")}</Label>
                  <Input
                    data-ocid="sc.ship.origin.input"
                    value={sForm.origin}
                    onChange={(e) =>
                      setSForm((p) => ({ ...p, origin: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sc.destination")}
                  </Label>
                  <Input
                    data-ocid="sc.ship.dest.input"
                    value={sForm.destination}
                    onChange={(e) =>
                      setSForm((p) => ({ ...p, destination: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sc.status")}</Label>
                  <Select
                    value={sForm.status}
                    onValueChange={(v) =>
                      setSForm((p) => ({
                        ...p,
                        status: v as Shipment["status"],
                      }))
                    }
                  >
                    <SelectTrigger
                      className="bg-slate-800 border-slate-600 text-white mt-1"
                      data-ocid="sc.ship.status.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {[
                        "preparing",
                        "in_transit",
                        "customs",
                        "delivered",
                        "delayed",
                      ].map((s) => (
                        <SelectItem key={s} value={s} className="text-white">
                          {t(`sc.shipStatus.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sc.estimatedDate")}
                  </Label>
                  <Input
                    data-ocid="sc.ship.date.input"
                    type="date"
                    value={sForm.estimatedDate}
                    onChange={(e) =>
                      setSForm((p) => ({ ...p, estimatedDate: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">{t("sales.notes")}</Label>
                <Textarea
                  data-ocid="sc.ship.notes.textarea"
                  value={sForm.notes}
                  onChange={(e) =>
                    setSForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              {sForm.status === "delivered" && sForm.productName && (
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-3">
                  <p className="text-teal-300 text-sm">
                    ⚡ {t("sc.deliveredInventorySync")}: {sForm.productName}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-slate-600 text-slate-300"
                  data-ocid="sc.ship.cancel_button"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={saveShipment}
                  className="bg-teal-600 hover:bg-teal-700"
                  data-ocid="sc.ship.save_button"
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "rotation" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">
                    {t("sc.productName")}
                  </Label>
                  <Input
                    data-ocid="sc.rot.product.input"
                    value={rForm.productName}
                    onChange={(e) =>
                      setRForm((p) => ({ ...p, productName: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">{t("sc.sku")}</Label>
                  <Input
                    data-ocid="sc.rot.sku.input"
                    value={rForm.sku}
                    onChange={(e) =>
                      setRForm((p) => ({ ...p, sku: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-slate-300">
                    {t("sc.currentStock")}
                  </Label>
                  <Input
                    data-ocid="sc.rot.stock.input"
                    type="number"
                    value={rForm.currentStock}
                    onChange={(e) =>
                      setRForm((p) => ({ ...p, currentStock: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sc.avgMonthlySales")}
                  </Label>
                  <Input
                    data-ocid="sc.rot.sales.input"
                    type="number"
                    value={rForm.avgMonthlySales}
                    onChange={(e) =>
                      setRForm((p) => ({
                        ...p,
                        avgMonthlySales: e.target.value,
                      }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sc.rotationDays")}
                  </Label>
                  <Input
                    data-ocid="sc.rot.days.input"
                    type="number"
                    value={rForm.rotationDays}
                    onChange={(e) =>
                      setRForm((p) => ({ ...p, rotationDays: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sc.status")}</Label>
                  <Select
                    value={rForm.status}
                    onValueChange={(v) =>
                      setRForm((p) => ({
                        ...p,
                        status: v as InventoryRotation["status"],
                      }))
                    }
                  >
                    <SelectTrigger
                      className="bg-slate-800 border-slate-600 text-white mt-1"
                      data-ocid="sc.rot.status.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {["fast", "normal", "slow", "dead"].map((s) => (
                        <SelectItem key={s} value={s} className="text-white">
                          {t(`sc.rotStatus.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sc.lastUpdated")}
                  </Label>
                  <Input
                    data-ocid="sc.rot.date.input"
                    type="date"
                    value={rForm.lastUpdated}
                    onChange={(e) =>
                      setRForm((p) => ({ ...p, lastUpdated: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-slate-600 text-slate-300"
                  data-ocid="sc.rot.cancel_button"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={saveRotation}
                  className="bg-teal-600 hover:bg-teal-700"
                  data-ocid="sc.rot.save_button"
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
