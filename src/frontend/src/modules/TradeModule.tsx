import {
  Globe,
  Package,
  Plus,
  Ship,
  TrendingDown,
  TrendingUp,
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type DeclStatus = "draft" | "pending" | "approved" | "completed" | "cancelled";
type DeclType = "export" | "import";
type ShipStatus = "preparing" | "transit" | "customs" | "completed";

interface Declaration {
  id: string;
  no: string;
  date: string;
  type: DeclType;
  country: string;
  description: string;
  quantity: number;
  value: number;
  status: DeclStatus;
}

interface Shipment {
  id: string;
  no: string;
  declarationId: string;
  carrier: string;
  departureDate: string;
  arrivalDate: string;
  status: ShipStatus;
}

const DECL_STATUS_COLORS: Record<DeclStatus, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  approved: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

const SHIP_STATUS_COLORS: Record<ShipStatus, string> = {
  preparing: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  transit: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  customs: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

function genNo(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-8)}`;
}

export default function TradeModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";

  const [declarations, setDeclarations] = useLocalStorage<Declaration[]>(
    `erp_trade_declarations_${cid}`,
    [],
  );
  const [shipments, setShipments] = useLocalStorage<Shipment[]>(
    `erp_trade_shipments_${cid}`,
    [],
  );

  const [showDeclDialog, setShowDeclDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);

  const [declForm, setDeclForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "export" as DeclType,
    country: "",
    description: "",
    quantity: "",
    value: "",
    status: "draft" as DeclStatus,
  });

  const [shipForm, setShipForm] = useState({
    declarationId: "",
    carrier: "",
    departureDate: "",
    arrivalDate: "",
    status: "preparing" as ShipStatus,
  });

  const handleSaveDecl = () => {
    if (!declForm.country.trim() || !declForm.description.trim()) {
      toast.error(t("common.fieldsRequired"));
      return;
    }
    const decl: Declaration = {
      id: Date.now().toString(),
      no: genNo(declForm.type === "export" ? "IHR" : "ITH"),
      date: declForm.date,
      type: declForm.type,
      country: declForm.country,
      description: declForm.description,
      quantity: Number(declForm.quantity) || 0,
      value: Number(declForm.value) || 0,
      status: declForm.status,
    };
    setDeclarations((prev) => [decl, ...prev]);
    setDeclForm({
      date: new Date().toISOString().slice(0, 10),
      type: "export",
      country: "",
      description: "",
      quantity: "",
      value: "",
      status: "draft",
    });
    setShowDeclDialog(false);
    toast.success(t("trade.declAdded"));
  };

  const handleSaveShip = () => {
    if (!shipForm.carrier.trim() || !shipForm.departureDate) {
      toast.error(t("common.fieldsRequired"));
      return;
    }
    const ship: Shipment = {
      id: Date.now().toString(),
      no: genNo("SEV"),
      declarationId: shipForm.declarationId,
      carrier: shipForm.carrier,
      departureDate: shipForm.departureDate,
      arrivalDate: shipForm.arrivalDate,
      status: shipForm.status,
    };
    setShipments((prev) => [ship, ...prev]);
    setShipForm({
      declarationId: "",
      carrier: "",
      departureDate: "",
      arrivalDate: "",
      status: "preparing",
    });
    setShowShipDialog(false);
    toast.success(t("trade.shipAdded"));
  };

  const handleDeleteDecl = (id: string) =>
    setDeclarations((prev) => prev.filter((d) => d.id !== id));

  const handleDeleteShip = (id: string) =>
    setShipments((prev) => prev.filter((s) => s.id !== id));

  const totalExportValue = declarations
    .filter((d) => d.type === "export")
    .reduce((s, d) => s + d.value, 0);
  const totalImportValue = declarations
    .filter((d) => d.type === "import")
    .reduce((s, d) => s + d.value, 0);
  const activeShipments = shipments.filter(
    (s) => s.status !== "completed",
  ).length;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
          <Globe className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{t("trade.title")}</h2>
          <p className="text-slate-400 text-sm">{t("trade.subtitle")}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
          <p className="text-slate-400 text-xs mb-1">
            {t("trade.totalDeclarations")}
          </p>
          <p className="text-2xl font-bold text-white">{declarations.length}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
          <p className="text-slate-400 text-xs mb-1">
            {t("trade.activeShipments")}
          </p>
          <p className="text-2xl font-bold text-blue-400">{activeShipments}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-slate-400 text-xs">{t("trade.exportValue")}</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            ₺{totalExportValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <p className="text-slate-400 text-xs">{t("trade.importValue")}</p>
          </div>
          <p className="text-2xl font-bold text-rose-400">
            ₺{totalImportValue.toLocaleString()}
          </p>
        </div>
      </div>

      <Tabs defaultValue="declarations">
        <TabsList className="bg-slate-800 border border-white/10 mb-4">
          <TabsTrigger
            value="declarations"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
            data-ocid="trade.declarations_tab"
          >
            <Package className="w-4 h-4 mr-2" />
            {t("trade.declarations")}
          </TabsTrigger>
          <TabsTrigger
            value="shipments"
            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400"
            data-ocid="trade.shipments_tab"
          >
            <Ship className="w-4 h-4 mr-2" />
            {t("trade.shipments")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="declarations">
          <div className="flex justify-end mb-3">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => setShowDeclDialog(true)}
              data-ocid="trade.decl.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("trade.addDeclaration")}
            </Button>
          </div>
          <div
            className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
            data-ocid="trade.declarations.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.declNo")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.date")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.type")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.country")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.value")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.status")}
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {declarations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div
                        className="text-center py-10 text-slate-500"
                        data-ocid="trade.declarations.empty_state"
                      >
                        <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t("trade.noDeclarations")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  declarations.map((d, i) => (
                    <TableRow
                      key={d.id}
                      className="border-white/5 hover:bg-white/2"
                      data-ocid={`trade.decl.row.${i + 1}`}
                    >
                      <TableCell className="text-white font-mono text-sm">
                        {d.no}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {d.date}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            d.type === "export"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs"
                          }
                        >
                          {d.type === "export"
                            ? t("trade.export")
                            : t("trade.import")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {d.country}
                      </TableCell>
                      <TableCell className="text-white text-sm font-medium">
                        ₺{d.value.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${DECL_STATUS_COLORS[d.status]}`}
                        >
                          {t(`trade.status_${d.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleDeleteDecl(d.id)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                          data-ocid={`trade.decl.delete_button.${i + 1}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="shipments">
          <div className="flex justify-end mb-3">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => setShowShipDialog(true)}
              data-ocid="trade.ship.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("trade.addShipment")}
            </Button>
          </div>
          <div
            className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
            data-ocid="trade.shipments.table"
          >
            <Table>
              <TableHeader>
                <TableRow className="border-white/5">
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.shipNo")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.declaration")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.carrier")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.departure")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.arrival")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-xs">
                    {t("trade.status")}
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div
                        className="text-center py-10 text-slate-500"
                        data-ocid="trade.shipments.empty_state"
                      >
                        <Ship className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">{t("trade.noShipments")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  shipments.map((s, i) => {
                    const linkedDecl = declarations.find(
                      (d) => d.id === s.declarationId,
                    );
                    return (
                      <TableRow
                        key={s.id}
                        className="border-white/5 hover:bg-white/2"
                        data-ocid={`trade.ship.row.${i + 1}`}
                      >
                        <TableCell className="text-white font-mono text-sm">
                          {s.no}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {linkedDecl ? linkedDecl.no : "-"}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {s.carrier}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {s.departureDate}
                        </TableCell>
                        <TableCell className="text-slate-300 text-sm">
                          {s.arrivalDate || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${SHIP_STATUS_COLORS[s.status]}`}
                          >
                            {t(`trade.ship_${s.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => handleDeleteShip(s.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            data-ocid={`trade.ship.delete_button.${i + 1}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Declaration Dialog */}
      <Dialog open={showDeclDialog} onOpenChange={setShowDeclDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="trade.decl.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("trade.addDeclaration")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("trade.date")}
                </Label>
                <Input
                  type="date"
                  value={declForm.date}
                  onChange={(e) =>
                    setDeclForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="trade.decl.date_input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("trade.type")}
                </Label>
                <Select
                  value={declForm.type}
                  onValueChange={(v) =>
                    setDeclForm((p) => ({ ...p, type: v as DeclType }))
                  }
                >
                  <SelectTrigger
                    className="bg-white/10 border-white/20 text-white"
                    data-ocid="trade.decl.type_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="export" className="text-white">
                      {t("trade.export")}
                    </SelectItem>
                    <SelectItem value="import" className="text-white">
                      {t("trade.import")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("trade.country")}
              </Label>
              <Input
                value={declForm.country}
                onChange={(e) =>
                  setDeclForm((p) => ({ ...p, country: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="trade.decl.country_input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("trade.description")}
              </Label>
              <Textarea
                value={declForm.description}
                onChange={(e) =>
                  setDeclForm((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white resize-none"
                rows={2}
                data-ocid="trade.decl.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("trade.quantity")}
                </Label>
                <Input
                  type="number"
                  value={declForm.quantity}
                  onChange={(e) =>
                    setDeclForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="trade.decl.qty_input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("trade.value")} (₺)
                </Label>
                <Input
                  type="number"
                  value={declForm.value}
                  onChange={(e) =>
                    setDeclForm((p) => ({ ...p, value: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="trade.decl.value_input"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("trade.status")}
              </Label>
              <Select
                value={declForm.status}
                onValueChange={(v) =>
                  setDeclForm((p) => ({ ...p, status: v as DeclStatus }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="trade.decl.status_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {(
                    [
                      "draft",
                      "pending",
                      "approved",
                      "completed",
                      "cancelled",
                    ] as DeclStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s} className="text-white">
                      {t(`trade.status_${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDeclDialog(false)}
                data-ocid="trade.decl.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleSaveDecl}
                data-ocid="trade.decl.submit_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shipment Dialog */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="trade.ship.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("trade.addShipment")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("trade.declaration")}
              </Label>
              <Select
                value={shipForm.declarationId}
                onValueChange={(v) =>
                  setShipForm((p) => ({ ...p, declarationId: v }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="trade.ship.decl_select"
                >
                  <SelectValue placeholder={t("trade.selectDeclaration")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {declarations.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-white">
                      {d.no} - {d.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("trade.carrier")}
              </Label>
              <Input
                value={shipForm.carrier}
                onChange={(e) =>
                  setShipForm((p) => ({ ...p, carrier: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="trade.ship.carrier_input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("trade.departure")}
                </Label>
                <Input
                  type="date"
                  value={shipForm.departureDate}
                  onChange={(e) =>
                    setShipForm((p) => ({
                      ...p,
                      departureDate: e.target.value,
                    }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="trade.ship.departure_input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("trade.arrival")}
                </Label>
                <Input
                  type="date"
                  value={shipForm.arrivalDate}
                  onChange={(e) =>
                    setShipForm((p) => ({ ...p, arrivalDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="trade.ship.arrival_input"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("trade.status")}
              </Label>
              <Select
                value={shipForm.status}
                onValueChange={(v) =>
                  setShipForm((p) => ({ ...p, status: v as ShipStatus }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="trade.ship.status_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {(
                    [
                      "preparing",
                      "transit",
                      "customs",
                      "completed",
                    ] as ShipStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s} className="text-white">
                      {t(`trade.ship_${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowShipDialog(false)}
                data-ocid="trade.ship.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleSaveShip}
                data-ocid="trade.ship.submit_button"
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
