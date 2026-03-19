import {
  ArrowLeftRight,
  CheckCircle,
  ClipboardList,
  Package,
  Plus,
  Truck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useLanguage } from "../contexts/LanguageContext";

interface WarehouseTransfer {
  id: string;
  fromWarehouse: string;
  toWarehouse: string;
  product: string;
  quantity: number;
  notes: string;
  date: string;
  status: "Bekliyor" | "Onaylandı" | "Tamamlandı" | "İptal";
  createdAt: string;
}

const WAREHOUSES = ["Ana Depo", "Şube Deposu", "Üretim Deposu", "Yedek Depo"];

export default function WarehouseTransferModule() {
  const { t } = useLanguage();
  const companyId = localStorage.getItem("erpverse_selected_company") || "";
  const STORAGE_KEY = `erpverse_warehouse_transfers_${companyId}`;

  const [transfers, setTransfers] = useState<WarehouseTransfer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<"list" | "new">("list");
  const [error, setError] = useState("");

  // Form state
  const [fromWarehouse, setFromWarehouse] = useState(WAREHOUSES[0]);
  const [toWarehouse, setToWarehouse] = useState(WAREHOUSES[1]);
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const save = (updated: WarehouseTransfer[]) => {
    setTransfers(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleCreate = () => {
    setError("");
    if (fromWarehouse === toWarehouse) {
      setError(t("warehouseTransfer.sameWarehouse"));
      return;
    }
    if (!product.trim() || !quantity) return;

    const newTransfer: WarehouseTransfer = {
      id: `wt_${Date.now()}`,
      fromWarehouse,
      toWarehouse,
      product: product.trim(),
      quantity: Number(quantity),
      notes: notes.trim(),
      date,
      status: "Bekliyor",
      createdAt: new Date().toISOString(),
    };

    save([newTransfer, ...transfers]);
    setProduct("");
    setQuantity("");
    setNotes("");
    setDate(new Date().toISOString().split("T")[0]);
    setFromWarehouse(WAREHOUSES[0]);
    setToWarehouse(WAREHOUSES[1]);
    setActiveTab("list");
  };

  const updateStatus = (id: string, status: WarehouseTransfer["status"]) => {
    save(transfers.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const getStatusBadge = (status: WarehouseTransfer["status"]) => {
    const map: Record<
      WarehouseTransfer["status"],
      { label: string; className: string }
    > = {
      Bekliyor: {
        label: t("warehouseTransfer.pending"),
        className: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      },
      Onaylandı: {
        label: t("warehouseTransfer.approved"),
        className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      },
      Tamamlandı: {
        label: t("warehouseTransfer.completed"),
        className: "bg-green-500/20 text-green-300 border-green-500/30",
      },
      İptal: {
        label: t("warehouseTransfer.cancelled"),
        className: "bg-red-500/20 text-red-300 border-red-500/30",
      },
    };
    const cfg = map[status];
    return (
      <Badge variant="outline" className={cfg.className}>
        {cfg.label}
      </Badge>
    );
  };

  const pending = transfers.filter((t) => t.status === "Bekliyor").length;
  const completed = transfers.filter((t) => t.status === "Tamamlandı").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {t("warehouseTransfer.title")}
            </h2>
            <p className="text-sm text-slate-400">
              {transfers.length} transfer
            </p>
          </div>
        </div>
        <Button
          onClick={() => setActiveTab("new")}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
          data-ocid="warehouse_transfer.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("warehouseTransfer.new")}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Toplam</span>
          </div>
          <p className="text-2xl font-bold text-white">{transfers.length}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ClipboardList className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-400">
              {t("warehouseTransfer.pending")}
            </span>
          </div>
          <p className="text-2xl font-bold text-yellow-300">{pending}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-green-400">
              {t("warehouseTransfer.completed")}
            </span>
          </div>
          <p className="text-2xl font-bold text-green-300">{completed}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "list"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-400 hover:text-white"
          }`}
          data-ocid="warehouse_transfer.list_tab"
        >
          {t("warehouseTransfer.list")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("new")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "new"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-400 hover:text-white"
          }`}
          data-ocid="warehouse_transfer.new_tab"
        >
          {t("warehouseTransfer.new")}
        </button>
      </div>

      {/* List Tab */}
      {activeTab === "list" && (
        <div className="space-y-3">
          {transfers.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-slate-500"
              data-ocid="warehouse_transfer.empty_state"
            >
              <Package className="w-12 h-12 mb-3 opacity-40" />
              <p>{t("warehouseTransfer.empty")}</p>
            </div>
          ) : (
            transfers.map((tr, idx) => (
              <div
                key={tr.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3"
                data-ocid={`warehouse_transfer.item.${idx + 1}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{tr.product}</p>
                      <p className="text-xs text-slate-400">
                        {tr.fromWarehouse} → {tr.toWarehouse}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(tr.status)}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>
                    <span className="text-white font-medium">
                      {tr.quantity}
                    </span>{" "}
                    adet
                  </span>
                  <span>{tr.date}</span>
                  {tr.notes && (
                    <span className="truncate max-w-xs">{tr.notes}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {tr.status === "Bekliyor" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(tr.id, "Onaylandı")}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 h-7 text-xs"
                        data-ocid={`warehouse_transfer.approve.${idx + 1}`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("warehouseTransfer.approve")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(tr.id, "İptal")}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 h-7 text-xs"
                        data-ocid={`warehouse_transfer.cancel.${idx + 1}`}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        {t("warehouseTransfer.cancel")}
                      </Button>
                    </>
                  )}
                  {tr.status === "Onaylandı" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(tr.id, "Tamamlandı")}
                        className="bg-green-600/20 hover:bg-green-600/40 text-green-300 border border-green-500/30 h-7 text-xs"
                        data-ocid={`warehouse_transfer.complete.${idx + 1}`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("warehouseTransfer.complete")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateStatus(tr.id, "İptal")}
                        className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 h-7 text-xs"
                        data-ocid={`warehouse_transfer.cancel.${idx + 1}`}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        {t("warehouseTransfer.cancel")}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Transfer Tab */}
      {activeTab === "new" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 max-w-xl">
          {error && (
            <div
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
              data-ocid="warehouse_transfer.error_state"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">
                {t("warehouseTransfer.from")}
              </Label>
              <select
                value={fromWarehouse}
                onChange={(e) => setFromWarehouse(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                data-ocid="warehouse_transfer.from_select"
              >
                {WAREHOUSES.map((w) => (
                  <option key={w} value={w} className="bg-slate-800">
                    {w}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">
                {t("warehouseTransfer.to")}
              </Label>
              <select
                value={toWarehouse}
                onChange={(e) => setToWarehouse(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
                data-ocid="warehouse_transfer.to_select"
              >
                {WAREHOUSES.map((w) => (
                  <option key={w} value={w} className="bg-slate-800">
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">
              {t("warehouseTransfer.product")}
            </Label>
            <Input
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Ürün / malzeme adı"
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
              data-ocid="warehouse_transfer.product_input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">
                {t("warehouseTransfer.quantity")}
              </Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500"
                data-ocid="warehouse_transfer.quantity_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">Tarih</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                data-ocid="warehouse_transfer.date_input"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-sm">
              {t("warehouseTransfer.notes")}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opsiyonel notlar..."
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 resize-none"
              rows={3}
              data-ocid="warehouse_transfer.notes_textarea"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleCreate}
              disabled={!product.trim() || !quantity}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
              data-ocid="warehouse_transfer.submit_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Transfer Oluştur
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab("list")}
              className="border-white/20 text-slate-300 hover:text-white"
              data-ocid="warehouse_transfer.cancel_button"
            >
              {t("warehouseTransfer.cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
