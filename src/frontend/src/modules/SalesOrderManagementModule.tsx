import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  CheckCircle,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

interface SalesOrderLine {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface SalesOrder {
  id: string;
  companyId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  deliveryDate: string;
  lines: SalesOrderLine[];
  kdvRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string;
  status:
    | "draft"
    | "confirmed"
    | "preparing"
    | "ready"
    | "delivered"
    | "cancelled";
  createdAt: string;
}

interface CRMCustomer {
  id: string;
  name: string;
}

interface Props {
  company: {
    id: string;
    name: string;
    sector?: string;
    address?: string;
    contactEmail?: string;
    phone?: string;
    foundedYear?: string;
    ownerId?: string;
    createdAt?: string;
  };
  user: {
    id: string;
    displayName: string;
    loginCode?: string;
    personnelCode?: string;
    createdAt?: string;
  };
  membership?: { roles: unknown[]; [key: string]: unknown };
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function calcLine(line: Omit<SalesOrderLine, "lineTotal">): SalesOrderLine {
  return { ...line, lineTotal: line.quantity * line.unitPrice };
}

function calcTotals(lines: SalesOrderLine[], kdvRate: number) {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxAmount = subtotal * (kdvRate / 100);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

function writeAuditLog(
  companyId: string,
  action: string,
  description: string,
  userId: string,
) {
  try {
    const key = `erp_audit_log_${companyId}`;
    const logs = JSON.parse(localStorage.getItem(key) || "[]");
    logs.unshift({
      id: genId(),
      module: "SalesOrders",
      action,
      description,
      userId,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 500)));
  } catch {}
}

const STATUS_CONFIG: Record<
  SalesOrder["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Taslak",
    className: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  confirmed: {
    label: "Onaylandı",
    className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  preparing: {
    label: "Hazırlanıyor",
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  ready: {
    label: "Sevke Hazır",
    className: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  delivered: {
    label: "Teslim Edildi",
    className: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  cancelled: {
    label: "İptal",
    className: "bg-red-500/20 text-red-300 border-red-500/30",
  },
};

const VAT_RATES = [0, 1, 8, 18, 20];

type View = "list" | "form" | "detail";

export default function SalesOrderManagementModule({ company, user }: Props) {
  const { t } = useLanguage();
  const companyId = company?.id ?? "";
  const userId = user?.id ?? "";

  const STORAGE_KEY = `sales_orders_${companyId}`;

  const [view, setView] = useState<View>("list");
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [selected, setSelected] = useState<SalesOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Form state
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formOrderDate, setFormOrderDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formDeliveryDate, setFormDeliveryDate] = useState("");
  const [formKdvRate, setFormKdvRate] = useState(18);
  const [formNotes, setFormNotes] = useState("");
  const [formLines, setFormLines] = useState<SalesOrderLine[]>([
    calcLine({ id: genId(), productName: "", quantity: 1, unitPrice: 0 }),
  ]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setOrders(JSON.parse(raw));

    const crmRaw = localStorage.getItem(`erp_crm_customers_${companyId}`);
    if (crmRaw) {
      const all = JSON.parse(crmRaw) as CRMCustomer[];
      setCustomers(all.map((c) => ({ id: c.id, name: c.name })));
    }
  }, [companyId, STORAGE_KEY]);

  function save(updated: SalesOrder[]) {
    setOrders(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function nextOrderNumber() {
    const num = orders.length + 1;
    return `SO-${String(num).padStart(3, "0")}`;
  }

  function resetForm() {
    setFormCustomerId("");
    setFormOrderDate(new Date().toISOString().split("T")[0]);
    setFormDeliveryDate("");
    setFormKdvRate(18);
    setFormNotes("");
    setFormLines([
      calcLine({ id: genId(), productName: "", quantity: 1, unitPrice: 0 }),
    ]);
  }

  function updateLine(
    idx: number,
    field: keyof Omit<SalesOrderLine, "lineTotal">,
    value: string | number,
  ) {
    setFormLines((prev) => {
      const next = [...prev];
      const raw = { ...next[idx], [field]: value };
      next[idx] = calcLine(raw);
      return next;
    });
  }

  function addLine() {
    setFormLines((prev) => [
      ...prev,
      calcLine({ id: genId(), productName: "", quantity: 1, unitPrice: 0 }),
    ]);
  }

  function removeLine(idx: number) {
    setFormLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function checkStockWarnings(lines: SalesOrderLine[]): string[] {
    try {
      const invRaw = localStorage.getItem(`inventory_products_${companyId}`);
      if (!invRaw) return [];
      const inventory = JSON.parse(invRaw) as Array<{
        name: string;
        quantity: number;
      }>;
      const warnings: string[] = [];
      for (const line of lines) {
        const inv = inventory.find(
          (p) => p.name.toLowerCase() === line.productName.toLowerCase(),
        );
        if (inv && line.quantity > inv.quantity) {
          warnings.push(
            `${line.productName}: Stok ${inv.quantity}, Talep ${line.quantity}`,
          );
        }
      }
      return warnings;
    } catch {
      return [];
    }
  }

  function handleSubmit() {
    if (!formCustomerId || !formOrderDate || !formDeliveryDate) {
      toast.error(
        t("salesOrders.fillRequired") || "Lütfen zorunlu alanları doldurun",
      );
      return;
    }
    if (formLines.some((l) => !l.productName)) {
      toast.error(t("salesOrders.fillLines") || "Ürün adlarını doldurun");
      return;
    }
    const customer = customers.find((c) => c.id === formCustomerId);
    const { subtotal, taxAmount, total } = calcTotals(formLines, formKdvRate);
    const order: SalesOrder = {
      id: genId(),
      companyId,
      orderNumber: nextOrderNumber(),
      customerId: formCustomerId,
      customerName: customer?.name ?? "",
      orderDate: formOrderDate,
      deliveryDate: formDeliveryDate,
      lines: formLines,
      kdvRate: formKdvRate,
      subtotal,
      taxAmount,
      total,
      notes: formNotes,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    save([order, ...orders]);
    writeAuditLog(
      companyId,
      "create",
      `${order.orderNumber} siparişi oluşturuldu`,
      userId,
    );
    toast.success(t("salesOrders.created") || "Sipariş oluşturuldu");
    resetForm();
    setView("list");
  }

  function changeStatus(order: SalesOrder, status: SalesOrder["status"]) {
    const warnings =
      status === "confirmed" ? checkStockWarnings(order.lines) : [];
    const updated = orders.map((o) =>
      o.id === order.id ? { ...o, status } : o,
    );
    save(updated);
    setSelected((prev) => (prev?.id === order.id ? { ...prev, status } : prev));
    writeAuditLog(
      companyId,
      "update",
      `${order.orderNumber} durumu: ${STATUS_CONFIG[status].label}`,
      userId,
    );
    toast.success(t("salesOrders.statusUpdated") || "Durum güncellendi");
    if (warnings.length > 0) setStockWarnings(warnings);
  }

  const filtered = orders.filter((o) => {
    if (filterStatus !== "all" && o.status !== filterStatus) return false;
    if (
      search &&
      !o.customerName.toLowerCase().includes(search.toLowerCase()) &&
      !o.orderNumber.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // Summary stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(
    (o) => o.status === "draft" || o.status === "confirmed",
  ).length;
  const confirmedOrders = orders.filter((o) => o.status === "confirmed").length;
  const deliveredRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((s, o) => s + o.total, 0);

  // ============ LIST VIEW ============
  if (view === "list") {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t("salesOrders.title") || "Satış Siparişi Yönetimi"}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {t("salesOrders.subtitle") ||
                "Siparişleri takip edin, stok ve teslimat yönetin"}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setView("form");
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
            data-ocid="sales_orders.open_modal_button"
          >
            <Plus className="w-4 h-4" />
            {t("salesOrders.new") || "Yeni Sipariş"}
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4 text-orange-400" />
              <span className="text-slate-400 text-xs">
                {t("salesOrders.totalOrders") || "Toplam Sipariş"}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{totalOrders}</p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400 text-xs">
                {t("salesOrders.pending") || "Bekleyen"}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{pendingOrders}</p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-xs">
                {t("salesOrders.confirmed") || "Onaylandı"}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{confirmedOrders}</p>
          </div>
          <div className="bg-slate-800 rounded-xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-xs">
                {t("salesOrders.deliveredRevenue") || "Teslim Cirosu"}
              </span>
            </div>
            <p className="text-xl font-bold text-white">
              {deliveredRevenue.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ₺
            </p>
          </div>
        </div>

        {/* Stock Warnings */}
        {stockWarnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-semibold text-sm">
                {t("salesOrders.stockWarning") || "Stok Uyarısı"}
              </span>
            </div>
            <ul className="space-y-1">
              {stockWarnings.map((w) => (
                <li key={w} className="text-amber-200 text-sm">
                  • {w}
                </li>
              ))}
            </ul>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-amber-400 hover:text-amber-300"
              onClick={() => setStockWarnings([])}
            >
              Kapat
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder={
              t("salesOrders.search") || "Müşteri veya sipariş no ara..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border-white/10 text-white placeholder-slate-400 w-64"
            data-ocid="sales_orders.search_input"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger
              className="bg-slate-800 border-white/10 text-white w-44"
              data-ocid="sales_orders.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="all" className="text-white">
                {t("salesOrders.allStatuses") || "Tüm Durumlar"}
              </SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-white">
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-slate-400"
              data-ocid="sales_orders.empty_state"
            >
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p>{t("salesOrders.noData") || "Henüz sipariş bulunmuyor"}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-slate-400">
                    {t("salesOrders.orderNo") || "Sipariş No"}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("salesOrders.customer") || "Müşteri"}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("salesOrders.orderDate") || "Sipariş Tarihi"}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("salesOrders.deliveryDate") || "Teslimat Tarihi"}
                  </TableHead>
                  <TableHead className="text-slate-400 text-right">
                    {t("salesOrders.total") || "Toplam"}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("salesOrders.status") || "Durum"}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("salesOrders.actions") || "İşlem"}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order, idx) => (
                  <TableRow
                    key={order.id}
                    className="border-white/5 hover:bg-white/5 cursor-pointer"
                    data-ocid={`sales_orders.item.${idx + 1}`}
                    onClick={() => {
                      setSelected(order);
                      setView("detail");
                    }}
                  >
                    <TableCell className="text-white font-mono text-sm">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {order.customerName}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {order.orderDate}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {order.deliveryDate}
                    </TableCell>
                    <TableCell className="text-right text-white font-semibold">
                      {order.total.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      ₺
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_CONFIG[order.status].className}
                      >
                        {STATUS_CONFIG[order.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(order);
                          setView("detail");
                        }}
                        data-ocid={`sales_orders.edit_button.${idx + 1}`}
                      >
                        {t("salesOrders.view") || "Görüntüle"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    );
  }

  // ============ FORM VIEW ============
  if (view === "form") {
    const { subtotal, taxAmount, total } = calcTotals(formLines, formKdvRate);
    return (
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={() => setView("list")}
            data-ocid="sales_orders.cancel_button"
          >
            ← {t("salesOrders.back") || "Geri"}
          </Button>
          <h2 className="text-xl font-bold text-white">
            {t("salesOrders.new") || "Yeni Sipariş"}
          </h2>
        </div>

        <div className="bg-slate-800 rounded-xl border border-white/5 p-6 space-y-5">
          {/* Header Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-slate-300">
                {t("salesOrders.customer") || "Müşteri"} *
              </Label>
              {customers.length > 0 ? (
                <Select
                  value={formCustomerId}
                  onValueChange={setFormCustomerId}
                >
                  <SelectTrigger
                    className="bg-slate-700 border-white/10 text-white"
                    data-ocid="sales_orders.select"
                  >
                    <SelectValue
                      placeholder={
                        t("salesOrders.selectCustomer") || "Müşteri seçin"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    {customers.map((c) => (
                      <SelectItem
                        key={c.id}
                        value={c.id}
                        className="text-white"
                      >
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder={
                    t("salesOrders.noCustomers") ||
                    "CRM'de müşteri tanımlanmamış"
                  }
                  disabled
                  className="bg-slate-700 border-white/10 text-slate-400"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">
                {t("salesOrders.orderDate") || "Sipariş Tarihi"} *
              </Label>
              <Input
                type="date"
                value={formOrderDate}
                onChange={(e) => setFormOrderDate(e.target.value)}
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="sales_orders.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">
                {t("salesOrders.deliveryDate") || "Teslimat Tarihi"} *
              </Label>
              <Input
                type="date"
                value={formDeliveryDate}
                onChange={(e) => setFormDeliveryDate(e.target.value)}
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="sales_orders.input"
              />
            </div>
          </div>

          {/* KDV Rate */}
          <div className="flex items-center gap-4">
            <div className="space-y-1.5 w-48">
              <Label className="text-slate-300">
                {t("salesOrders.kdvRate") || "KDV Oranı"}
              </Label>
              <Select
                value={String(formKdvRate)}
                onValueChange={(v) => setFormKdvRate(Number(v))}
              >
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white"
                  data-ocid="sales_orders.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {VAT_RATES.map((r) => (
                    <SelectItem
                      key={r}
                      value={String(r)}
                      className="text-white"
                    >
                      %{r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">
                {t("salesOrders.orderLines") || "Sipariş Kalemleri"}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addLine}
                className="border-white/10 text-slate-300 hover:text-white gap-1.5"
                data-ocid="sales_orders.secondary_button"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("salesOrders.addLine") || "Kalem Ekle"}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 pb-2 font-medium pr-2">
                      {t("salesOrders.productName") || "Ürün/Hizmet"}
                    </th>
                    <th className="text-right text-slate-400 pb-2 font-medium w-24 pr-2">
                      {t("salesOrders.qty") || "Miktar"}
                    </th>
                    <th className="text-right text-slate-400 pb-2 font-medium w-32 pr-2">
                      {t("salesOrders.unitPrice") || "Birim Fiyat"}
                    </th>
                    <th className="text-right text-slate-400 pb-2 font-medium w-32 pr-2">
                      {t("salesOrders.lineTotal") || "Tutar"}
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {formLines.map((line, idx) => (
                    <tr key={line.id}>
                      <td className="py-2 pr-2">
                        <Input
                          value={line.productName}
                          onChange={(e) =>
                            updateLine(idx, "productName", e.target.value)
                          }
                          placeholder={
                            t("salesOrders.productPlaceholder") || "Ürün adı"
                          }
                          className="bg-slate-700 border-white/10 text-white h-8 text-sm"
                          data-ocid={`sales_orders.input.${idx + 1}`}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(idx, "quantity", Number(e.target.value))
                          }
                          className="bg-slate-700 border-white/10 text-white h-8 text-sm text-right"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) =>
                            updateLine(idx, "unitPrice", Number(e.target.value))
                          }
                          className="bg-slate-700 border-white/10 text-white h-8 text-sm text-right"
                        />
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <span className="text-white font-semibold">
                          {line.lineTotal.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          data-ocid={`sales_orders.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="space-y-1 text-sm min-w-56">
                <div className="flex justify-between text-slate-400">
                  <span>{t("salesOrders.subtotal") || "Ara Toplam"}</span>
                  <span>{subtotal.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>
                    {t("salesOrders.taxAmount") || "KDV"} (%{formKdvRate})
                  </span>
                  <span>{taxAmount.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-1">
                  <span>{t("salesOrders.total") || "Genel Toplam"}</span>
                  <span>{total.toFixed(2)} ₺</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-slate-300">
              {t("salesOrders.notes") || "Notlar"}
            </Label>
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={
                t("salesOrders.notesPlaceholder") || "Sipariş notları..."
              }
              className="bg-slate-700 border-white/10 text-white placeholder-slate-400"
              rows={3}
              data-ocid="sales_orders.textarea"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setView("list")}
              className="border-white/10 text-slate-300 hover:text-white"
              data-ocid="sales_orders.cancel_button"
            >
              {t("salesOrders.cancel") || "Vazgeç"}
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
              data-ocid="sales_orders.submit_button"
            >
              <ShoppingCart className="w-4 h-4" />
              {t("salesOrders.create") || "Sipariş Oluştur"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ DETAIL VIEW ============
  if (view === "detail" && selected) {
    const o = selected;
    const cfg = STATUS_CONFIG[o.status];

    return (
      <div className="p-6 space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={() => {
              setSelected(null);
              setView("list");
            }}
            data-ocid="sales_orders.close_button"
          >
            ← {t("salesOrders.back") || "Geri"}
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{o.orderNumber}</h2>
            <Badge variant="outline" className={`${cfg.className} mt-1`}>
              {cfg.label}
            </Badge>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-slate-800 rounded-xl border border-white/5 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-slate-400 text-xs mb-1">
                {t("salesOrders.customer") || "Müşteri"}
              </p>
              <p className="text-white font-semibold">{o.customerName}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">
                {t("salesOrders.orderDate") || "Sipariş Tarihi"}
              </p>
              <p className="text-white">{o.orderDate}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">
                {t("salesOrders.deliveryDate") || "Teslimat Tarihi"}
              </p>
              <p className="text-white">{o.deliveryDate}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">
                {t("salesOrders.kdvRate") || "KDV"}
              </p>
              <p className="text-white">%{o.kdvRate}</p>
            </div>
          </div>

          {/* Lines Table */}
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-slate-400">
                  {t("salesOrders.productName") || "Ürün"}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("salesOrders.qty") || "Miktar"}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("salesOrders.unitPrice") || "Birim Fiyat"}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("salesOrders.lineTotal") || "Tutar"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {o.lines.map((line) => (
                <TableRow key={line.id} className="border-white/5">
                  <TableCell className="text-white">
                    {line.productName}
                  </TableCell>
                  <TableCell className="text-slate-300 text-right">
                    {line.quantity}
                  </TableCell>
                  <TableCell className="text-slate-300 text-right">
                    {line.unitPrice.toFixed(2)} ₺
                  </TableCell>
                  <TableCell className="text-white text-right font-semibold">
                    {line.lineTotal.toFixed(2)} ₺
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="space-y-1 text-sm min-w-56">
              <div className="flex justify-between text-slate-400">
                <span>{t("salesOrders.subtotal") || "Ara Toplam"}</span>
                <span>{o.subtotal.toFixed(2)} ₺</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>
                  {t("salesOrders.taxAmount") || "KDV"} (%{o.kdvRate})
                </span>
                <span>{o.taxAmount.toFixed(2)} ₺</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-1">
                <span>{t("salesOrders.total") || "Genel Toplam"}</span>
                <span>{o.total.toFixed(2)} ₺</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {o.notes && (
            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
              <p className="text-slate-400 text-xs mb-1">
                {t("salesOrders.notes") || "Notlar"}
              </p>
              <p className="text-slate-300 text-sm">{o.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {o.status === "draft" && (
            <>
              <Button
                onClick={() => changeStatus(o, "confirmed")}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                data-ocid="sales_orders.confirm_button"
              >
                <CheckCircle className="w-4 h-4" />
                {t("salesOrders.confirm") || "Onayla"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                data-ocid="sales_orders.delete_button"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {t("salesOrders.cancelOrder") || "İptal Et"}
              </Button>
            </>
          )}
          {o.status === "confirmed" && (
            <>
              <Button
                onClick={() => changeStatus(o, "preparing")}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                data-ocid="sales_orders.primary_button"
              >
                <Package className="w-4 h-4" />
                {t("salesOrders.startPreparing") || "Hazırlamaya Başla"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                data-ocid="sales_orders.delete_button"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {t("salesOrders.cancelOrder") || "İptal Et"}
              </Button>
            </>
          )}
          {o.status === "preparing" && (
            <>
              <Button
                onClick={() => changeStatus(o, "ready")}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                data-ocid="sales_orders.primary_button"
              >
                <Truck className="w-4 h-4" />
                {t("salesOrders.readyToShip") || "Sevke Hazırla"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                data-ocid="sales_orders.delete_button"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {t("salesOrders.cancelOrder") || "İptal Et"}
              </Button>
            </>
          )}
          {o.status === "ready" && (
            <>
              <Button
                onClick={() => changeStatus(o, "delivered")}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                data-ocid="sales_orders.primary_button"
              >
                <CheckCircle className="w-4 h-4" />
                {t("salesOrders.deliver") || "Teslim Et"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(true)}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                data-ocid="sales_orders.delete_button"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {t("salesOrders.cancelOrder") || "İptal Et"}
              </Button>
            </>
          )}
        </div>

        {/* Cancel Confirm Dialog */}
        <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
          <DialogContent
            className="bg-slate-800 border-white/10 text-white"
            data-ocid="sales_orders.dialog"
          >
            <DialogHeader>
              <DialogTitle className="text-white">
                {t("salesOrders.cancelConfirmTitle") || "Siparişi İptal Et"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-slate-400 text-sm">
              {t("salesOrders.cancelConfirmText") ||
                "Bu siparişi iptal etmek istediğinizden emin misiniz?"}
            </p>
            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                className="border-white/10 text-slate-300"
                data-ocid="sales_orders.cancel_button"
              >
                {t("salesOrders.goBack") || "Vazgeç"}
              </Button>
              <Button
                onClick={() => {
                  changeStatus(o, "cancelled");
                  setShowCancelConfirm(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
                data-ocid="sales_orders.confirm_button"
              >
                {t("salesOrders.confirmCancel") || "İptal Et"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
