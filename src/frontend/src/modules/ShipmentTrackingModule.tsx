import {
  Calendar,
  Edit,
  Hash,
  MapPin,
  Package,
  Plus,
  Search,
  Trash2,
  Truck,
  User,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Shipment {
  id: string;
  orderRef: string;
  customerName: string;
  cargoCompany: string;
  trackingNumber: string;
  originAddress: string;
  destinationAddress: string;
  estimatedDelivery: string;
  actualDelivery: string;
  status: "preparing" | "shipped" | "in_transit" | "delivered" | "cancelled";
  notes: string;
  createdAt: string;
}

const STATUS_LABELS: Record<Shipment["status"], string> = {
  preparing: "Hazırlanıyor",
  shipped: "Kargoya Verildi",
  in_transit: "Yolda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
};

const STATUS_COLORS: Record<Shipment["status"], string> = {
  preparing: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  shipped: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  in_transit: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

const CARGO_COMPANIES = [
  "Yurtiçi Kargo",
  "Aras Kargo",
  "MNG Kargo",
  "PTT Kargo",
  "UPS",
  "DHL",
  "FedEx",
  "Sürat Kargo",
  "Diğer",
];

const STATUSES: Shipment["status"][] = [
  "preparing",
  "shipped",
  "in_transit",
  "delivered",
  "cancelled",
];

export default function ShipmentTrackingModule() {
  const { addLog } = useAuditLog();
  const [shipments, setShipments] = useLocalStorage<Shipment[]>(
    "erp_shipments",
    [],
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<Shipment | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<Shipment["status"]>("preparing");
  const [showDetail, setShowDetail] = useState<Shipment | null>(null);

  // Form state
  const [form, setForm] = useState({
    orderRef: "",
    customerName: "",
    cargoCompany: "",
    trackingNumber: "",
    originAddress: "",
    destinationAddress: "",
    estimatedDelivery: "",
    notes: "",
  });

  function resetForm() {
    setForm({
      orderRef: "",
      customerName: "",
      cargoCompany: "",
      trackingNumber: "",
      originAddress: "",
      destinationAddress: "",
      estimatedDelivery: "",
      notes: "",
    });
    setEditItem(null);
  }

  function openNew() {
    resetForm();
    setShowDialog(true);
  }

  function openEdit(s: Shipment) {
    setEditItem(s);
    setForm({
      orderRef: s.orderRef,
      customerName: s.customerName,
      cargoCompany: s.cargoCompany,
      trackingNumber: s.trackingNumber,
      originAddress: s.originAddress,
      destinationAddress: s.destinationAddress,
      estimatedDelivery: s.estimatedDelivery,
      notes: s.notes,
    });
    setShowDialog(true);
  }

  function handleSave() {
    if (!form.customerName.trim() || !form.cargoCompany) {
      toast.error("Müşteri adı ve kargo firması zorunludur");
      return;
    }
    if (editItem) {
      const updated = shipments.map((s) =>
        s.id === editItem.id
          ? {
              ...s,
              ...form,
            }
          : s,
      );
      setShipments(updated);
      addLog({
        module: "ShipmentTracking",
        action: "update",
        detail: `Sevkiyat güncellendi: ${form.customerName}`,
      });
      toast.success("Sevkiyat güncellendi");
    } else {
      const newShipment: Shipment = {
        id: `SHP-${Date.now()}`,
        ...form,
        actualDelivery: "",
        status: "preparing",
        createdAt: new Date().toLocaleDateString("tr-TR"),
      };
      setShipments([newShipment, ...shipments]);
      addLog({
        module: "ShipmentTracking",
        action: "create",
        detail: `Yeni sevkiyat: ${form.customerName}`,
      });
      toast.success("Sevkiyat oluşturuldu");
    }
    setShowDialog(false);
    resetForm();
  }

  function handleDelete(id: string) {
    setShipments(shipments.filter((s) => s.id !== id));
    addLog({
      module: "ShipmentTracking",
      action: "delete",
      detail: "Sevkiyat silindi",
    });
    toast.success("Sevkiyat silindi");
    if (showDetail?.id === id) setShowDetail(null);
  }

  function openStatusUpdate(s: Shipment) {
    setStatusTarget(s);
    setNewStatus(s.status);
    setShowStatusDialog(true);
  }

  function handleStatusUpdate() {
    if (!statusTarget) return;
    const updated = shipments.map((s) =>
      s.id === statusTarget.id
        ? {
            ...s,
            status: newStatus,
            actualDelivery:
              newStatus === "delivered"
                ? new Date().toLocaleDateString("tr-TR")
                : s.actualDelivery,
          }
        : s,
    );
    setShipments(updated);
    addLog({
      module: "ShipmentTracking",
      action: "update",
      detail: `Sevkiyat durumu: ${STATUS_LABELS[newStatus]}`,
    });
    toast.success("Durum güncellendi");
    setShowStatusDialog(false);
    setStatusTarget(null);
    if (showDetail?.id === statusTarget.id) {
      setShowDetail({ ...showDetail, status: newStatus });
    }
  }

  const filtered = shipments.filter((s) => {
    const matchSearch =
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      s.orderRef.toLowerCase().includes(search.toLowerCase()) ||
      s.trackingNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: shipments.length,
    preparing: shipments.filter((s) => s.status === "preparing").length,
    in_transit: shipments.filter(
      (s) => s.status === "in_transit" || s.status === "shipped",
    ).length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-cyan-400" />
            Teslimat & Sevkiyat Takibi
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Kargo takibi, teslimat durumu ve sevkiyat yönetimi
          </p>
        </div>
        <Button
          onClick={openNew}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sevkiyat
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Toplam Sevkiyat",
            value: counts.total,
            color: "text-cyan-400",
          },
          {
            label: "Hazırlanıyor",
            value: counts.preparing,
            color: "text-yellow-400",
          },
          {
            label: "Yolda",
            value: counts.in_transit,
            color: "text-purple-400",
          },
          {
            label: "Teslim Edildi",
            value: counts.delivered,
            color: "text-green-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-9 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
            placeholder="Müşteri, sipariş no veya takip numarası ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44 bg-slate-800 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/10">
            <SelectItem value="all" className="text-white">
              Tüm Durumlar
            </SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-white">
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Henüz sevkiyat kaydı yok</p>
            <p className="text-slate-500 text-sm mt-1">
              Yeni sevkiyat oluşturmak için yukarıdaki butonu kullanın
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    "Sevkiyat No",
                    "Müşteri",
                    "Sipariş Ref.",
                    "Kargo Firması",
                    "Takip No",
                    "Tahmini Teslimat",
                    "Durum",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => setShowDetail(s)}
                    onKeyDown={(e) => e.key === "Enter" && setShowDetail(s)}
                    tabIndex={0}
                  >
                    <td className="px-4 py-3 text-cyan-400 font-mono text-sm">
                      {s.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm font-medium">
                        {s.customerName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {s.orderRef || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {s.cargoCompany}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded">
                        {s.trackingNumber || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {s.estimatedDelivery || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[s.status]}
                      >
                        {STATUS_LABELS[s.status]}
                      </Badge>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-white/10 text-slate-300 hover:text-white"
                          onClick={() => openStatusUpdate(s)}
                        >
                          Durum
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-white/10 text-slate-300 hover:text-white"
                          onClick={() => openEdit(s)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 border-red-500/30 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-800 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              {editItem ? "Sevkiyat Düzenle" : "Yeni Sevkiyat"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-400 mb-1">Müşteri Adı *</div>
                <Input
                  className="bg-slate-700 border-white/10 text-white"
                  placeholder="Müşteri adı"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm({ ...form, customerName: e.target.value })
                  }
                />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">
                  Sipariş Referansı
                </div>
                <Input
                  className="bg-slate-700 border-white/10 text-white"
                  placeholder="SIP-001"
                  value={form.orderRef}
                  onChange={(e) =>
                    setForm({ ...form, orderRef: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-400 mb-1">
                  Kargo Firması *
                </div>
                <Select
                  value={form.cargoCompany}
                  onValueChange={(v) => setForm({ ...form, cargoCompany: v })}
                >
                  <SelectTrigger className="bg-slate-700 border-white/10 text-white">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {CARGO_COMPANIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-white">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">
                  Takip Numarası
                </div>
                <Input
                  className="bg-slate-700 border-white/10 text-white"
                  placeholder="TRK123456"
                  value={form.trackingNumber}
                  onChange={(e) =>
                    setForm({ ...form, trackingNumber: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-400 mb-1">Çıkış Adresi</div>
                <Input
                  className="bg-slate-700 border-white/10 text-white"
                  placeholder="Depo adresi"
                  value={form.originAddress}
                  onChange={(e) =>
                    setForm({ ...form, originAddress: e.target.value })
                  }
                />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">
                  Teslimat Adresi
                </div>
                <Input
                  className="bg-slate-700 border-white/10 text-white"
                  placeholder="Müşteri adresi"
                  value={form.destinationAddress}
                  onChange={(e) =>
                    setForm({ ...form, destinationAddress: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">
                Tahmini Teslimat Tarihi
              </div>
              <Input
                type="date"
                className="bg-slate-700 border-white/10 text-white"
                value={form.estimatedDelivery}
                onChange={(e) =>
                  setForm({ ...form, estimatedDelivery: e.target.value })
                }
              />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Notlar</div>
              <Input
                className="bg-slate-700 border-white/10 text-white"
                placeholder="Ek bilgi..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              className="border-white/10 text-slate-300"
              onClick={() => {
                setShowDialog(false);
                resetForm();
              }}
            >
              İptal
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={handleSave}
            >
              {editItem ? "Güncelle" : "Oluştur"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="bg-slate-800 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Durumu Güncelle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-slate-400 text-sm">
              {statusTarget?.customerName} sevkiyatının durumunu güncelleyin
            </p>
            <Select
              value={newStatus}
              onValueChange={(v) => setNewStatus(v as Shipment["status"])}
            >
              <SelectTrigger className="bg-slate-700 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/10">
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-white">
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              className="border-white/10 text-slate-300"
              onClick={() => setShowStatusDialog(false)}
            >
              İptal
            </Button>
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={handleStatusUpdate}
            >
              Güncelle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        open={!!showDetail}
        onOpenChange={(o) => !o && setShowDetail(null)}
      >
        <DialogContent className="bg-slate-800 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-400" />
              Sevkiyat Detayı
            </DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Sevkiyat No</span>
                <span className="font-mono text-cyan-400 text-sm">
                  {showDetail.id}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <User className="w-3 h-3" /> Müşteri
                </span>
                <span className="text-white text-sm">
                  {showDetail.customerName}
                </span>
              </div>
              {showDetail.orderRef && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Sipariş Ref.
                  </span>
                  <span className="text-white text-sm">
                    {showDetail.orderRef}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <Truck className="w-3 h-3" /> Kargo Firması
                </span>
                <span className="text-white text-sm">
                  {showDetail.cargoCompany}
                </span>
              </div>
              {showDetail.trackingNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Takip No</span>
                  <span className="font-mono text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
                    {showDetail.trackingNumber}
                  </span>
                </div>
              )}
              {showDetail.destinationAddress && (
                <div className="flex items-start justify-between">
                  <span className="text-slate-400 text-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Teslimat Adresi
                  </span>
                  <span className="text-white text-sm text-right max-w-48">
                    {showDetail.destinationAddress}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tahmini Teslimat
                </span>
                <span className="text-white text-sm">
                  {showDetail.estimatedDelivery || "-"}
                </span>
              </div>
              {showDetail.actualDelivery && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">
                    Gerçek Teslimat
                  </span>
                  <span className="text-green-400 text-sm">
                    {showDetail.actualDelivery}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Durum</span>
                <Badge
                  variant="outline"
                  className={STATUS_COLORS[showDetail.status]}
                >
                  {STATUS_LABELS[showDetail.status]}
                </Badge>
              </div>
              {showDetail.notes && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-slate-400 text-xs mb-1">Notlar</p>
                  <p className="text-slate-300 text-sm">{showDetail.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
