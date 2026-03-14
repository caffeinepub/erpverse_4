import {
  ArrowRightLeft,
  ClipboardList,
  MapPin,
  Plus,
  Warehouse,
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

interface WarehouseLocation {
  id: string;
  code: string;
  name: string;
  zone: "A" | "B" | "C" | "D";
  capacity: number;
  occupancy: number;
  status: "active" | "full" | "maintenance";
}

interface TransferOrder {
  id: string;
  orderNo: string;
  fromLocation: string;
  toLocation: string;
  product: string;
  quantity: number;
  status: "pending" | "inprogress" | "completed";
}

export default function WarehouseModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";

  const [locations, setLocations] = useLocalStorage<WarehouseLocation[]>(
    `erp_warehouse_${cid}`,
    [],
  );
  const [transfers, setTransfers] = useLocalStorage<TransferOrder[]>(
    `erp_warehouse_transfers_${cid}`,
    [],
  );
  const [reservations, setReservations] = useLocalStorage<
    Array<{
      id: string;
      productionOrderId: string;
      productionOrderName: string;
      materialName: string;
      quantity: number;
      unit: string;
      reservedAt: string;
      status: string;
    }>
  >(`erp_warehouse_reservations_${cid}`, []);

  const [showLocDialog, setShowLocDialog] = useState(false);
  const [editLocId, setEditLocId] = useState<string | null>(null);
  const [locForm, setLocForm] = useState({
    code: "",
    name: "",
    zone: "A" as WarehouseLocation["zone"],
    capacity: "",
    occupancy: "",
    status: "active" as WarehouseLocation["status"],
  });

  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [editTransferId, setEditTransferId] = useState<string | null>(null);
  const [transferForm, setTransferForm] = useState({
    fromLocation: "",
    toLocation: "",
    product: "",
    quantity: "",
    status: "pending" as TransferOrder["status"],
  });

  const totalLocations = locations.length;
  const activeLocations = locations.filter((l) => l.status === "active").length;
  const fullLocations = locations.filter((l) => l.status === "full").length;

  const openAddLoc = () => {
    setEditLocId(null);
    setLocForm({
      code: "",
      name: "",
      zone: "A",
      capacity: "",
      occupancy: "0",
      status: "active",
    });
    setShowLocDialog(true);
  };

  const openEditLoc = (l: WarehouseLocation) => {
    setEditLocId(l.id);
    setLocForm({
      code: l.code,
      name: l.name,
      zone: l.zone,
      capacity: String(l.capacity),
      occupancy: String(l.occupancy),
      status: l.status,
    });
    setShowLocDialog(true);
  };

  const saveLoc = () => {
    if (!locForm.code.trim() || !locForm.name.trim()) return;
    const data: WarehouseLocation = {
      id: editLocId || Date.now().toString(),
      code: locForm.code,
      name: locForm.name,
      zone: locForm.zone,
      capacity: Number(locForm.capacity),
      occupancy: Number(locForm.occupancy),
      status: locForm.status,
    };
    if (editLocId) {
      setLocations((prev) => prev.map((l) => (l.id === editLocId ? data : l)));
      toast.success(t("common.updated"));
    } else {
      setLocations((prev) => [...prev, data]);
      toast.success(t("common.added"));
    }
    setShowLocDialog(false);
  };

  const deleteLoc = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    toast.success(t("common.deleted"));
  };

  const openAddTransfer = () => {
    setEditTransferId(null);
    setTransferForm({
      fromLocation: "",
      toLocation: "",
      product: "",
      quantity: "",
      status: "pending",
    });
    setShowTransferDialog(true);
  };

  const openEditTransfer = (tr: TransferOrder) => {
    setEditTransferId(tr.id);
    setTransferForm({
      fromLocation: tr.fromLocation,
      toLocation: tr.toLocation,
      product: tr.product,
      quantity: String(tr.quantity),
      status: tr.status,
    });
    setShowTransferDialog(true);
  };

  const saveTransfer = () => {
    if (
      !transferForm.fromLocation ||
      !transferForm.toLocation ||
      !transferForm.product.trim()
    )
      return;
    const data: TransferOrder = {
      id: editTransferId || Date.now().toString(),
      orderNo: editTransferId
        ? transfers.find((t) => t.id === editTransferId)?.orderNo ||
          `TR-${Date.now()}`
        : `TR-${Date.now()}`,
      fromLocation: transferForm.fromLocation,
      toLocation: transferForm.toLocation,
      product: transferForm.product,
      quantity: Number(transferForm.quantity),
      status: transferForm.status,
    };
    const syncInventory = (d: TransferOrder) => {
      if (d.status === "completed") {
        try {
          const invKey = `erpverse_inventory_${cid}`;
          const inventory = JSON.parse(localStorage.getItem(invKey) || "[]");
          const updated = inventory.map(
            (item: { name: string; quantity: number }) =>
              item.name.toLowerCase() === d.product.toLowerCase()
                ? { ...item, quantity: (item.quantity || 0) + d.quantity }
                : item,
          );
          localStorage.setItem(invKey, JSON.stringify(updated));
          toast.success(t("integration.warehouseInventorySync"));
        } catch (_) {}
      }
    };
    if (editTransferId) {
      setTransfers((prev) =>
        prev.map((tr) => (tr.id === editTransferId ? data : tr)),
      );
      syncInventory(data);
      if (data.status !== "completed") toast.success(t("common.updated"));
    } else {
      setTransfers((prev) => [...prev, data]);
      syncInventory(data);
      if (data.status !== "completed") toast.success(t("common.added"));
    }
    setShowTransferDialog(false);
  };

  const deleteTransfer = (id: string) => {
    setTransfers((prev) => prev.filter((tr) => tr.id !== id));
    toast.success(t("common.deleted"));
  };

  const locationStatusBadge = (status: WarehouseLocation["status"]) => {
    if (status === "active")
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
          {t("warehouse.statusActive")}
        </Badge>
      );
    if (status === "full")
      return (
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
          {t("warehouse.statusFull")}
        </Badge>
      );
    return (
      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
        {t("warehouse.statusMaintenance")}
      </Badge>
    );
  };

  const transferStatusBadge = (status: TransferOrder["status"]) => {
    if (status === "completed")
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
          {t("warehouse.transferCompleted")}
        </Badge>
      );
    if (status === "inprogress")
      return (
        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
          {t("warehouse.transferInProgress")}
        </Badge>
      );
    return (
      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
        {t("warehouse.transferPending")}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Warehouse className="w-7 h-7 text-cyan-400" />
        <h2 className="text-2xl font-bold text-white">
          {t("modules.Warehouse")}
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            label: t("warehouse.totalLocations"),
            value: totalLocations,
            color: "text-cyan-400",
            bg: "bg-cyan-500/10 border-cyan-500/20",
          },
          {
            label: t("warehouse.activeLocations"),
            value: activeLocations,
            color: "text-green-400",
            bg: "bg-green-500/10 border-green-500/20",
          },
          {
            label: t("warehouse.fullLocations"),
            value: fullLocations,
            color: "text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
          },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} border rounded-xl p-4`}>
            <p className="text-slate-400 text-sm">{stat.label}</p>
            <p className={`${stat.color} text-3xl font-bold mt-1`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="locations">
        <TabsList className="bg-slate-800 border border-white/10">
          <TabsTrigger
            value="locations"
            data-ocid="warehouse.locations.tab"
            className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {t("warehouse.locations")}
          </TabsTrigger>
          <TabsTrigger
            value="transfers"
            data-ocid="warehouse.transfers.tab"
            className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            {t("warehouse.transfers")}
          </TabsTrigger>
          <TabsTrigger
            value="reservations"
            data-ocid="warehouse.reservations.tab"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            {t("warehouse.reservations")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="locations">
          <div className="flex justify-end mb-3">
            <Button
              onClick={openAddLoc}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              data-ocid="warehouse.location.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("warehouse.addLocation")}
            </Button>
          </div>
          {locations.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="warehouse.locations.empty_state"
            >
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t("warehouse.noLocations")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("warehouse.code")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("warehouse.name")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("warehouse.zone")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("warehouse.capacity")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("warehouse.occupancy")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.status")}
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((l, idx) => (
                    <TableRow
                      key={l.id}
                      className="border-white/5 hover:bg-white/5"
                      data-ocid={`warehouse.location.row.${idx + 1}`}
                    >
                      <TableCell className="text-cyan-300 font-mono">
                        {l.code}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {l.name}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                          {t("warehouse.zone")} {l.zone}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {l.capacity}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                            <div
                              className="bg-cyan-400 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(100, l.capacity > 0 ? (l.occupancy / l.capacity) * 100 : 0)}%`,
                              }}
                            />
                          </div>
                          <span className="text-slate-400 text-xs">
                            {l.occupancy}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{locationStatusBadge(l.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditLoc(l)}
                            data-ocid={`warehouse.location.edit_button.${idx + 1}`}
                            className="text-slate-400 hover:text-white"
                          >
                            {t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteLoc(l.id)}
                            data-ocid={`warehouse.location.delete_button.${idx + 1}`}
                            className="text-red-400 hover:text-red-300"
                          >
                            {t("common.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transfers">
          <div className="flex justify-end mb-3">
            <Button
              onClick={openAddTransfer}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              data-ocid="warehouse.transfer.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("warehouse.addTransfer")}
            </Button>
          </div>
          {transfers.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="warehouse.transfers.empty_state"
            >
              <ArrowRightLeft className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t("warehouse.noTransfers")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("warehouse.orderNo")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("warehouse.from")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("warehouse.to")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("warehouse.product")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("warehouse.quantity")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("quality.status")}
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((tr, idx) => (
                    <TableRow
                      key={tr.id}
                      className="border-white/5 hover:bg-white/5"
                      data-ocid={`warehouse.transfer.row.${idx + 1}`}
                    >
                      <TableCell className="text-cyan-300 font-mono">
                        {tr.orderNo}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {tr.fromLocation}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {tr.toLocation}
                      </TableCell>
                      <TableCell className="text-white">{tr.product}</TableCell>
                      <TableCell className="text-slate-300">
                        {tr.quantity}
                      </TableCell>
                      <TableCell>{transferStatusBadge(tr.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditTransfer(tr)}
                            data-ocid={`warehouse.transfer.edit_button.${idx + 1}`}
                            className="text-slate-400 hover:text-white"
                          >
                            {t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTransfer(tr.id)}
                            data-ocid={`warehouse.transfer.delete_button.${idx + 1}`}
                            className="text-red-400 hover:text-red-300"
                          >
                            {t("common.delete")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        <TabsContent value="reservations">
          <div
            className="mt-3 bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
            data-ocid="warehouse.reservations.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-slate-400 text-xs">
                    {t("warehouse.productionOrder")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("warehouse.material")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("warehouse.quantity")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("warehouse.unit")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("warehouse.reservedAt")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("warehouse.reservationStatus")}
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div
                        className="text-center py-10 text-slate-500"
                        data-ocid="warehouse.reservations.empty_state"
                      >
                        <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">
                          {t("warehouse.noReservations")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations.map((r, i) => (
                    <TableRow
                      key={r.id}
                      className="border-white/5 hover:bg-white/2"
                      data-ocid={`warehouse.reservation.row.${i + 1}`}
                    >
                      <TableCell className="text-white text-sm">
                        {r.productionOrderName}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {r.materialName}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {r.quantity}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {r.unit}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {r.reservedAt
                          ? new Date(r.reservedAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${r.status === "Tamamlandı" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : r.status === "İptal" ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {r.status === "Rezerve" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setReservations((prev) =>
                                    prev.map((x) =>
                                      x.id === r.id
                                        ? { ...x, status: "Tamamlandı" }
                                        : x,
                                    ),
                                  )
                                }
                                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                data-ocid={`warehouse.reservation.complete_button.${i + 1}`}
                              >
                                {t("warehouse.complete")}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setReservations((prev) =>
                                    prev.map((x) =>
                                      x.id === r.id
                                        ? { ...x, status: "İptal" }
                                        : x,
                                    ),
                                  )
                                }
                                className="text-xs text-red-400 hover:text-red-300 transition-colors ml-2"
                                data-ocid={`warehouse.reservation.cancel_button.${i + 1}`}
                              >
                                {t("common.cancel")}
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Location Dialog */}
      <Dialog open={showLocDialog} onOpenChange={setShowLocDialog}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white"
          data-ocid="warehouse.location.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editLocId
                ? t("warehouse.editLocation")
                : t("warehouse.addLocation")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("warehouse.code")}</Label>
                <Input
                  value={locForm.code}
                  onChange={(e) =>
                    setLocForm((p) => ({ ...p, code: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="warehouse.location.code.input"
                />
              </div>
              <div>
                <Label className="text-slate-300">{t("warehouse.name")}</Label>
                <Input
                  value={locForm.name}
                  onChange={(e) =>
                    setLocForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="warehouse.location.name.input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("warehouse.zone")}</Label>
                <Select
                  value={locForm.zone}
                  onValueChange={(v) =>
                    setLocForm((p) => ({
                      ...p,
                      zone: v as WarehouseLocation["zone"],
                    }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="warehouse.location.zone.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {["A", "B", "C", "D"].map((z) => (
                      <SelectItem key={z} value={z} className="text-white">
                        {t("warehouse.zone")} {z}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">{t("quality.status")}</Label>
                <Select
                  value={locForm.status}
                  onValueChange={(v) =>
                    setLocForm((p) => ({
                      ...p,
                      status: v as WarehouseLocation["status"],
                    }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="warehouse.location.status.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="active" className="text-green-300">
                      {t("warehouse.statusActive")}
                    </SelectItem>
                    <SelectItem value="full" className="text-red-300">
                      {t("warehouse.statusFull")}
                    </SelectItem>
                    <SelectItem value="maintenance" className="text-yellow-300">
                      {t("warehouse.statusMaintenance")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">
                  {t("warehouse.capacity")}
                </Label>
                <Input
                  type="number"
                  value={locForm.capacity}
                  onChange={(e) =>
                    setLocForm((p) => ({ ...p, capacity: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="warehouse.location.capacity.input"
                />
              </div>
              <div>
                <Label className="text-slate-300">
                  {t("warehouse.occupancy")}
                </Label>
                <Input
                  type="number"
                  value={locForm.occupancy}
                  onChange={(e) =>
                    setLocForm((p) => ({ ...p, occupancy: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="warehouse.location.occupancy.input"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowLocDialog(false)}
                data-ocid="warehouse.location.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                onClick={saveLoc}
                data-ocid="warehouse.location.submit_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white"
          data-ocid="warehouse.transfer.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editTransferId
                ? t("warehouse.editTransfer")
                : t("warehouse.addTransfer")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("warehouse.from")}</Label>
                <Select
                  value={transferForm.fromLocation}
                  onValueChange={(v) =>
                    setTransferForm((p) => ({ ...p, fromLocation: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="warehouse.transfer.from.select"
                  >
                    <SelectValue placeholder={t("warehouse.selectLocation")} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {locations.map((l) => (
                      <SelectItem
                        key={l.id}
                        value={l.code}
                        className="text-white"
                      >
                        {l.code} - {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">{t("warehouse.to")}</Label>
                <Select
                  value={transferForm.toLocation}
                  onValueChange={(v) =>
                    setTransferForm((p) => ({ ...p, toLocation: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="warehouse.transfer.to.select"
                  >
                    <SelectValue placeholder={t("warehouse.selectLocation")} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {locations.map((l) => (
                      <SelectItem
                        key={l.id}
                        value={l.code}
                        className="text-white"
                      >
                        {l.code} - {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">{t("warehouse.product")}</Label>
              <Input
                value={transferForm.product}
                onChange={(e) =>
                  setTransferForm((p) => ({ ...p, product: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="warehouse.transfer.product.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">
                  {t("warehouse.quantity")}
                </Label>
                <Input
                  type="number"
                  value={transferForm.quantity}
                  onChange={(e) =>
                    setTransferForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="warehouse.transfer.qty.input"
                />
              </div>
              <div>
                <Label className="text-slate-300">{t("quality.status")}</Label>
                <Select
                  value={transferForm.status}
                  onValueChange={(v) =>
                    setTransferForm((p) => ({
                      ...p,
                      status: v as TransferOrder["status"],
                    }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="warehouse.transfer.status.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="pending" className="text-yellow-300">
                      {t("warehouse.transferPending")}
                    </SelectItem>
                    <SelectItem value="inprogress" className="text-blue-300">
                      {t("warehouse.transferInProgress")}
                    </SelectItem>
                    <SelectItem value="completed" className="text-green-300">
                      {t("warehouse.transferCompleted")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowTransferDialog(false)}
                data-ocid="warehouse.transfer.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={saveTransfer}
                data-ocid="warehouse.transfer.submit_button"
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
