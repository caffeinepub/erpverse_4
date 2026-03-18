import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, Package, Plus, Star, Truck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface SupplierPerf {
  id: string;
  supplierName: string;
  onTimeRate: number;
  qualityScore: number;
}

interface Delivery {
  id: string;
  supplierName: string;
  orderNo: string;
  expectedDate: string;
  actualDate: string;
}

interface PurchaseOrder {
  id?: string;
  supplierName?: string;
  supplier?: string;
  totalAmount?: number;
  amount?: number;
  total?: number;
}

const PERF_KEY = "erp_supply_deep_performance";
const DELIVERY_KEY = "erp_supply_deep_deliveries";
const PURCHASING_KEY = "erp_purchasing_orders";

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

function calcOverall(perf: SupplierPerf): number {
  return Math.round(((perf.onTimeRate / 10 + perf.qualityScore) / 2) * 10) / 10;
}

function perfBadge(score: number): { label: string; color: string } {
  if (score >= 8)
    return {
      label: "excellent",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    };
  if (score >= 5)
    return {
      label: "good",
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    };
  return {
    label: "poor",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
  };
}

function calcDelay(expected: string, actual: string): number {
  if (!expected || !actual) return 0;
  const diff = new Date(actual).getTime() - new Date(expected).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function deliveryStatus(delay: number): string {
  if (delay < 0) return "early";
  if (delay === 0) return "onTime";
  return "delayed";
}

function deliveryStatusColor(status: string): string {
  if (status === "early")
    return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  if (status === "onTime")
    return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  return "bg-red-500/20 text-red-300 border-red-500/30";
}

export default function SupplyChainDeepModule() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"perf" | "delivery" | "orders">(
    "perf",
  );

  // Supplier Performance
  const [perfs, setPerfs] = useState<SupplierPerf[]>(() =>
    load<SupplierPerf>(PERF_KEY),
  );
  const [showPerfForm, setShowPerfForm] = useState(false);
  const [editPerfId, setEditPerfId] = useState<string | null>(null);
  const [perfForm, setPerfForm] = useState({
    supplierName: "",
    onTimeRate: "",
    qualityScore: "",
  });

  // Delivery Tracking
  const [deliveries, setDeliveries] = useState<Delivery[]>(() =>
    load<Delivery>(DELIVERY_KEY),
  );
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    supplierName: "",
    orderNo: "",
    expectedDate: "",
    actualDate: "",
  });

  // Order Analysis
  const purchaseOrders = useMemo(() => load<PurchaseOrder>(PURCHASING_KEY), []);
  const orderStats = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {};
    for (const o of purchaseOrders) {
      const supplier = o.supplierName || o.supplier || t("supplydeep.unknown");
      const amount = o.totalAmount ?? o.amount ?? o.total ?? 0;
      if (!map[supplier]) map[supplier] = { count: 0, total: 0 };
      map[supplier].count++;
      map[supplier].total += Number(amount);
    }
    return Object.entries(map).map(([name, stats]) => ({
      name,
      count: stats.count,
      total: stats.total,
      avg: stats.count > 0 ? stats.total / stats.count : 0,
    }));
  }, [purchaseOrders, t]);

  const persistPerfs = (updated: SupplierPerf[]) => {
    setPerfs(updated);
    save(PERF_KEY, updated);
  };

  const handlePerfSubmit = () => {
    if (!perfForm.supplierName.trim()) return;
    const entry: SupplierPerf = {
      id: editPerfId || Date.now().toString(),
      supplierName: perfForm.supplierName.trim(),
      onTimeRate: Math.min(100, Math.max(0, Number(perfForm.onTimeRate) || 0)),
      qualityScore: Math.min(
        10,
        Math.max(0, Number(perfForm.qualityScore) || 0),
      ),
    };
    if (editPerfId) {
      persistPerfs(perfs.map((p) => (p.id === editPerfId ? entry : p)));
    } else {
      persistPerfs([...perfs, entry]);
    }
    setPerfForm({ supplierName: "", onTimeRate: "", qualityScore: "" });
    setShowPerfForm(false);
    setEditPerfId(null);
  };

  const handleEditPerf = (p: SupplierPerf) => {
    setEditPerfId(p.id);
    setPerfForm({
      supplierName: p.supplierName,
      onTimeRate: String(p.onTimeRate),
      qualityScore: String(p.qualityScore),
    });
    setShowPerfForm(true);
  };

  const handleDeletePerf = (id: string) => {
    persistPerfs(perfs.filter((p) => p.id !== id));
  };

  const persistDeliveries = (updated: Delivery[]) => {
    setDeliveries(updated);
    save(DELIVERY_KEY, updated);
  };

  const handleDeliverySubmit = () => {
    if (!deliveryForm.supplierName.trim() || !deliveryForm.orderNo.trim())
      return;
    const entry: Delivery = {
      id: Date.now().toString(),
      ...deliveryForm,
    };
    persistDeliveries([...deliveries, entry]);
    setDeliveryForm({
      supplierName: "",
      orderNo: "",
      expectedDate: "",
      actualDate: "",
    });
    setShowDeliveryForm(false);
  };

  const handleDeleteDelivery = (id: string) => {
    persistDeliveries(deliveries.filter((d) => d.id !== id));
  };

  const tabs = [
    {
      id: "perf" as const,
      label: t("supplydeep.supplierPerf"),
      icon: <Star className="w-4 h-4" />,
    },
    {
      id: "delivery" as const,
      label: t("supplydeep.deliveryTracking"),
      icon: <Truck className="w-4 h-4" />,
    },
    {
      id: "orders" as const,
      label: t("supplydeep.orderAnalysis"),
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          {t("supplydeep.title")}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {t("supplydeep.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6" data-ocid="supplydeep.tab">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-teal-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            }`}
            data-ocid={`supplydeep.${tab.id}_tab`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Supplier Performance */}
      {activeTab === "perf" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              {t("supplydeep.supplierPerf")}
            </h3>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => {
                setShowPerfForm(true);
                setEditPerfId(null);
                setPerfForm({
                  supplierName: "",
                  onTimeRate: "",
                  qualityScore: "",
                });
              }}
              data-ocid="supplydeep.perf_add_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("supplydeep.addPerf")}
            </Button>
          </div>

          {showPerfForm && (
            <Card className="bg-slate-800 border-white/10 mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">
                  {editPerfId ? t("common.edit") : t("supplydeep.addPerf")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <Label className="text-slate-300 text-sm mb-1 block">
                      {t("supplydeep.supplier")}
                    </Label>
                    <Input
                      value={perfForm.supplierName}
                      onChange={(e) =>
                        setPerfForm((f) => ({
                          ...f,
                          supplierName: e.target.value,
                        }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="supplydeep.supplier_input"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1 block">
                      {t("supplydeep.onTimeRate")} (0-100)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={perfForm.onTimeRate}
                      onChange={(e) =>
                        setPerfForm((f) => ({
                          ...f,
                          onTimeRate: e.target.value,
                        }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="supplydeep.ontime_input"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1 block">
                      {t("supplydeep.qualityScore")} (0-10)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.1}
                      value={perfForm.qualityScore}
                      onChange={(e) =>
                        setPerfForm((f) => ({
                          ...f,
                          qualityScore: e.target.value,
                        }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="supplydeep.quality_input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={handlePerfSubmit}
                    data-ocid="supplydeep.perf_submit_button"
                  >
                    {t("common.save")}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 text-slate-300"
                    onClick={() => {
                      setShowPerfForm(false);
                      setEditPerfId(null);
                    }}
                    data-ocid="supplydeep.perf_cancel_button"
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {perfs.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="supplydeep.perf_empty_state"
            >
              <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("supplydeep.noData")}</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full" data-ocid="supplydeep.perf_table">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.supplier")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.onTimeRate")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.qualityScore")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.overallScore")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.status")}
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {perfs.map((p, i) => {
                    const overall = calcOverall(p);
                    const badge = perfBadge(overall);
                    return (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/5"
                        data-ocid={`supplydeep.perf_row.${i + 1}`}
                      >
                        <td className="px-5 py-3 text-white font-medium">
                          {p.supplierName}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-cyan-300 font-semibold">
                            {p.onTimeRate}%
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-violet-300 font-semibold">
                            {p.qualityScore}/10
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-white font-bold">
                            {overall}/10
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge
                            variant="outline"
                            className={`text-xs ${badge.color}`}
                          >
                            {t(`supplydeep.${badge.label}`)}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => handleEditPerf(p)}
                              className="text-slate-400 hover:text-white transition-colors"
                              data-ocid={`supplydeep.perf_edit_button.${i + 1}`}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePerf(p.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors"
                              data-ocid={`supplydeep.perf_delete_button.${i + 1}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Delivery Tracking */}
      {activeTab === "delivery" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">
              {t("supplydeep.deliveryTracking")}
            </h3>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              onClick={() => setShowDeliveryForm(true)}
              data-ocid="supplydeep.delivery_add_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("supplydeep.logDelivery")}
            </Button>
          </div>

          {showDeliveryForm && (
            <Card className="bg-slate-800 border-white/10 mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">
                  {t("supplydeep.logDelivery")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-slate-300 text-sm mb-1 block">
                      {t("supplydeep.supplier")}
                    </Label>
                    <Input
                      value={deliveryForm.supplierName}
                      onChange={(e) =>
                        setDeliveryForm((f) => ({
                          ...f,
                          supplierName: e.target.value,
                        }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="supplydeep.delivery_supplier_input"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1 block">
                      {t("supplydeep.orderNo")}
                    </Label>
                    <Input
                      value={deliveryForm.orderNo}
                      onChange={(e) =>
                        setDeliveryForm((f) => ({
                          ...f,
                          orderNo: e.target.value,
                        }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="supplydeep.orderno_input"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1 block">
                      {t("supplydeep.expectedDate")}
                    </Label>
                    <Input
                      type="date"
                      value={deliveryForm.expectedDate}
                      onChange={(e) =>
                        setDeliveryForm((f) => ({
                          ...f,
                          expectedDate: e.target.value,
                        }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="supplydeep.expected_date_input"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm mb-1 block">
                      {t("supplydeep.actualDate")}
                    </Label>
                    <Input
                      type="date"
                      value={deliveryForm.actualDate}
                      onChange={(e) =>
                        setDeliveryForm((f) => ({
                          ...f,
                          actualDate: e.target.value,
                        }))
                      }
                      className="bg-white/10 border-white/20 text-white"
                      data-ocid="supplydeep.actual_date_input"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={handleDeliverySubmit}
                    data-ocid="supplydeep.delivery_submit_button"
                  >
                    {t("common.save")}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/20 text-slate-300"
                    onClick={() => setShowDeliveryForm(false)}
                    data-ocid="supplydeep.delivery_cancel_button"
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {deliveries.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="supplydeep.delivery_empty_state"
            >
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("supplydeep.noData")}</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full" data-ocid="supplydeep.delivery_table">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.supplier")}
                    </th>
                    <th className="text-left text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.orderNo")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.expectedDate")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.actualDate")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.delayDays")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.status")}
                    </th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d, i) => {
                    const delay = calcDelay(d.expectedDate, d.actualDate);
                    const status = deliveryStatus(delay);
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-white/5 last:border-0 hover:bg-white/5"
                        data-ocid={`supplydeep.delivery_row.${i + 1}`}
                      >
                        <td className="px-5 py-3 text-white font-medium">
                          {d.supplierName}
                        </td>
                        <td className="px-5 py-3 text-slate-300">
                          {d.orderNo}
                        </td>
                        <td className="px-5 py-3 text-center text-slate-300">
                          {d.expectedDate || "-"}
                        </td>
                        <td className="px-5 py-3 text-center text-slate-300">
                          {d.actualDate || "-"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {d.expectedDate && d.actualDate ? (
                            <span
                              className={
                                delay > 0
                                  ? "text-red-400 font-semibold"
                                  : delay < 0
                                    ? "text-blue-400 font-semibold"
                                    : "text-emerald-400 font-semibold"
                              }
                            >
                              {delay > 0 ? `+${delay}` : delay}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {d.expectedDate && d.actualDate ? (
                            <Badge
                              variant="outline"
                              className={`text-xs ${deliveryStatusColor(status)}`}
                            >
                              {t(`supplydeep.${status}`)}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteDelivery(d.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            data-ocid={`supplydeep.delivery_delete_button.${i + 1}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Order Analysis */}
      {activeTab === "orders" && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            {t("supplydeep.orderAnalysis")}
          </h3>

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-teal-900/40 to-slate-800 border-teal-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-teal-400" />
                  <div>
                    <p className="text-slate-400 text-xs">
                      {t("supplydeep.totalOrders")}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {purchaseOrders.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-violet-900/40 to-slate-800 border-violet-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-violet-400" />
                  <div>
                    <p className="text-slate-400 text-xs">
                      {t("supplydeep.totalAmount")}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {purchaseOrders
                        .reduce(
                          (sum, o) =>
                            sum + (o.totalAmount ?? o.amount ?? o.total ?? 0),
                          0,
                        )
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-900/40 to-slate-800 border-cyan-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Truck className="w-8 h-8 text-cyan-400" />
                  <div>
                    <p className="text-slate-400 text-xs">
                      {t("supplydeep.uniqueSuppliers")}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {orderStats.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {orderStats.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="supplydeep.orders_empty_state"
            >
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t("supplydeep.noOrderData")}</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full" data-ocid="supplydeep.orders_table">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.supplier")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.totalOrders")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.totalAmount")}
                    </th>
                    <th className="text-center text-slate-400 text-sm px-5 py-3">
                      {t("supplydeep.avgOrderValue")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderStats
                    .sort((a, b) => b.total - a.total)
                    .map((s, i) => (
                      <tr
                        key={s.name}
                        className="border-b border-white/5 last:border-0 hover:bg-white/5"
                        data-ocid={`supplydeep.orders_row.${i + 1}`}
                      >
                        <td className="px-5 py-3 text-white font-medium">
                          {s.name}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge
                            variant="outline"
                            className="border-teal-500/30 text-teal-300"
                          >
                            {s.count}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-center text-emerald-300 font-semibold">
                          {s.total.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-center text-violet-300">
                          {Math.round(s.avg).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
