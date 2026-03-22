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
  ArrowRight,
  CheckCircle,
  FileText,
  Plus,
  Printer,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface QuotationItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
  lineTotal: number;
  vatAmount: number;
  lineTotalWithVat: number;
}

interface Quotation {
  id: string;
  quotationNo: string;
  type: "quotation" | "proforma";
  customerId: string;
  customerName: string;
  status:
    | "draft"
    | "sent"
    | "approved"
    | "rejected"
    | "cancelled"
    | "converted";
  validUntil: string;
  items: QuotationItem[];
  notes: string;
  currency: string;
  subtotal: number;
  totalVat: number;
  total: number;
  createdAt: string;
  createdBy: string;
  convertedToInvoice?: boolean;
  relatedQuotationId?: string;
  companyId: string;
}

interface CRMCustomer {
  id: string;
  name: string;
  email?: string;
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function calcItem(
  item: Omit<QuotationItem, "lineTotal" | "vatAmount" | "lineTotalWithVat">,
): QuotationItem {
  const lineTotal =
    item.quantity * item.unitPrice * (1 - item.discountPercent / 100);
  const vatAmount = lineTotal * (item.vatRate / 100);
  return {
    ...item,
    lineTotal,
    vatAmount,
    lineTotalWithVat: lineTotal + vatAmount,
  };
}

function calcTotals(items: QuotationItem[]) {
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const totalVat = items.reduce((s, i) => s + i.vatAmount, 0);
  return { subtotal, totalVat, total: subtotal + totalVat };
}

function writeAuditLog(
  companyId: string,
  module: string,
  action: string,
  description: string,
  userId: string,
) {
  try {
    const key = `erp_audit_log_${companyId}`;
    const logs = JSON.parse(localStorage.getItem(key) || "[]");
    logs.unshift({
      id: genId(),
      module,
      action,
      description,
      userId,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 500)));
  } catch {}
}

function formatCurrency(amount: number, currency: string) {
  return `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

const STATUS_BADGE: Record<
  Quotation["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Taslak",
    className: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  },
  sent: {
    label: "Gönderildi",
    className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  approved: {
    label: "Onaylandı",
    className: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  rejected: {
    label: "Reddedildi",
    className: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  cancelled: {
    label: "İptal",
    className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  },
  converted: {
    label: "Faturaya Dönüştü",
    className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
};

const VAT_RATES = [0, 1, 8, 18, 20];
const CURRENCIES = ["TRY", "USD", "EUR", "GBP"];

type View = "list" | "create" | "detail";

export default function QuotationsModule() {
  const { t } = useLanguage();
  const { company, user } = useAuth();
  const companyId = company?.id ?? "";
  const userId = user?.id ?? "";

  const [view, setView] = useState<View>("list");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [selected, setSelected] = useState<Quotation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showConvertConfirm, setShowConvertConfirm] = useState<
    "proforma" | "invoice" | null
  >(null);

  // Form state
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formValidUntil, setFormValidUntil] = useState("");
  const [formCurrency, setFormCurrency] = useState("TRY");
  const [formNotes, setFormNotes] = useState("");
  const [formItems, setFormItems] = useState<QuotationItem[]>([
    calcItem({
      id: genId(),
      productName: "",
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      vatRate: 18,
    }),
  ]);

  const STORAGE_KEY = `erp_quotations_${companyId}`;

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setQuotations(JSON.parse(raw));

    const crmRaw = localStorage.getItem(`erp_crm_customers_${companyId}`);
    if (crmRaw) {
      const all = JSON.parse(crmRaw);
      setCustomers(
        all.map((c: CRMCustomer) => ({
          id: c.id,
          name: c.name,
          email: c.email,
        })),
      );
    }
  }, [companyId, STORAGE_KEY]);

  function save(updated: Quotation[]) {
    setQuotations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function nextQuotationNo(type: "quotation" | "proforma") {
    const prefix = type === "quotation" ? "TKL" : "PRF";
    const year = new Date().getFullYear();
    const existing = quotations.filter((q) => q.type === type).length + 1;
    return `${prefix}-${year}-${String(existing).padStart(3, "0")}`;
  }

  function resetForm() {
    setFormCustomerId("");
    setFormValidUntil("");
    setFormCurrency("TRY");
    setFormNotes("");
    setFormItems([
      calcItem({
        id: genId(),
        productName: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        vatRate: 18,
      }),
    ]);
  }

  function updateItem(
    idx: number,
    field: keyof Omit<
      QuotationItem,
      "lineTotal" | "vatAmount" | "lineTotalWithVat"
    >,
    value: string | number,
  ) {
    setFormItems((prev) => {
      const next = [...prev];
      const raw = { ...next[idx], [field]: value };
      next[idx] = calcItem(raw);
      return next;
    });
  }

  function addItem() {
    setFormItems((prev) => [
      ...prev,
      calcItem({
        id: genId(),
        productName: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        vatRate: 18,
      }),
    ]);
  }

  function removeItem(idx: number) {
    setFormItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(status: "draft" | "sent") {
    if (!formCustomerId || !formValidUntil) {
      toast.error(t("quotation.fillRequired"));
      return;
    }
    if (formItems.some((i) => !i.productName)) {
      toast.error(t("quotation.fillItems"));
      return;
    }
    const customer = customers.find((c) => c.id === formCustomerId);
    const totals = calcTotals(formItems);
    const q: Quotation = {
      id: genId(),
      quotationNo: nextQuotationNo("quotation"),
      type: "quotation",
      customerId: formCustomerId,
      customerName: customer?.name ?? "",
      status,
      validUntil: formValidUntil,
      items: formItems,
      notes: formNotes,
      currency: formCurrency,
      ...totals,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      companyId,
    };
    save([q, ...quotations]);
    writeAuditLog(
      companyId,
      "Quotations",
      "create",
      `${q.quotationNo} teklifi oluşturuldu`,
      userId,
    );
    toast.success(t("quotation.created"));
    resetForm();
    setView("list");
  }

  function changeStatus(q: Quotation, status: Quotation["status"]) {
    const updated = quotations.map((x) =>
      x.id === q.id ? { ...x, status } : x,
    );
    save(updated);
    setSelected((prev) => (prev?.id === q.id ? { ...prev, status } : prev));
    writeAuditLog(
      companyId,
      "Quotations",
      "update",
      `${q.quotationNo} durumu: ${status}`,
      userId,
    );
    toast.success(t("quotation.statusUpdated"));
  }

  function convertToProforma(q: Quotation) {
    const proforma: Quotation = {
      ...q,
      id: genId(),
      quotationNo: nextQuotationNo("proforma"),
      type: "proforma",
      status: "draft",
      relatedQuotationId: q.id,
      createdAt: new Date().toISOString(),
    };
    const updatedOriginal = quotations.map((x) =>
      x.id === q.id ? { ...x, status: "converted" as const } : x,
    );
    save([proforma, ...updatedOriginal]);
    setSelected(proforma);
    writeAuditLog(
      companyId,
      "Quotations",
      "convert",
      `${q.quotationNo} → Proforma ${proforma.quotationNo}`,
      userId,
    );
    toast.success(t("quotation.convertedToProforma"));
    setShowConvertConfirm(null);
  }

  function convertToInvoice(q: Quotation) {
    const invoiceKey = `erp_invoices_${companyId}`;
    const invoices = JSON.parse(localStorage.getItem(invoiceKey) || "[]");
    const invoice = {
      id: genId(),
      invoiceNo: `FAT-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`,
      customerId: q.customerId,
      customerName: q.customerName,
      status: "draft",
      items: q.items.map((i) => ({
        id: i.id,
        description: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        vatRate: i.vatRate,
        total: i.lineTotalWithVat,
      })),
      subtotal: q.subtotal,
      vatTotal: q.totalVat,
      total: q.total,
      currency: q.currency,
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: q.validUntil,
      notes: q.notes,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      companyId,
      fromQuotationId: q.id,
    };
    invoices.push(invoice);
    localStorage.setItem(invoiceKey, JSON.stringify(invoices));

    const updated = quotations.map((x) =>
      x.id === q.id
        ? { ...x, status: "converted" as const, convertedToInvoice: true }
        : x,
    );
    save(updated);
    setSelected((prev) =>
      prev?.id === q.id
        ? { ...prev, status: "converted", convertedToInvoice: true }
        : prev,
    );
    writeAuditLog(
      companyId,
      "Quotations",
      "convert",
      `${q.quotationNo} faturaya dönüştürüldü → ${invoice.invoiceNo}`,
      userId,
    );
    toast.success(t("quotation.convertedToInvoice"));
    setShowConvertConfirm(null);
  }

  function handlePrint(q: Quotation) {
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${q.quotationNo}</title>
  <style>
    body { font-family: sans-serif; padding: 32px; color: #111; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 13px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { background: #f3f4f6; text-align: left; padding: 8px; font-size: 13px; border: 1px solid #e5e7eb; }
    td { padding: 8px; font-size: 13px; border: 1px solid #e5e7eb; }
    .totals { margin-top: 20px; text-align: right; }
    .totals p { margin: 4px 0; font-size: 14px; }
    .totals .grand { font-size: 18px; font-weight: bold; margin-top: 8px; }
    .notes { margin-top: 24px; font-size: 13px; color: #555; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>${q.type === "proforma" ? "Proforma Fatura" : "Fiyat Teklifi"}: ${q.quotationNo}</h1>
  <div class="meta">
    <b>Müşteri:</b> ${q.customerName} &nbsp;|
    <b>Tarih:</b> ${q.createdAt.split("T")[0]} &nbsp;|
    <b>Geçerlilik:</b> ${q.validUntil} &nbsp;|
    <b>Para Birimi:</b> ${q.currency}
  </div>
  <table>
    <thead><tr><th>#</th><th>Ürün/Hizmet</th><th>Miktar</th><th>Birim Fiyat</th><th>İskonto %</th><th>KDV %</th><th>Ara Toplam</th><th>KDV</th><th>Toplam</th></tr></thead>
    <tbody>
      ${q.items
        .map(
          (item, i) =>
            `<tr><td>${i + 1}</td><td>${item.productName}</td><td>${item.quantity}</td><td>${item.unitPrice.toFixed(2)}</td><td>${item.discountPercent}%</td><td>${item.vatRate}%</td><td>${item.lineTotal.toFixed(2)}</td><td>${item.vatAmount.toFixed(2)}</td><td>${item.lineTotalWithVat.toFixed(2)}</td></tr>`,
        )
        .join("")}
    </tbody>
  </table>
  <div class="totals">
    <p>Ara Toplam: ${q.subtotal.toFixed(2)} ${q.currency}</p>
    <p>Toplam KDV: ${q.totalVat.toFixed(2)} ${q.currency}</p>
    <p class="grand">GENEL TOPLAM: ${q.total.toFixed(2)} ${q.currency}</p>
  </div>
  ${q.notes ? `<div class="notes"><b>Notlar:</b> ${q.notes}</div>` : ""}
  <script>window.print();</script>
</body>
</html>`;
    win.document.write(html);
    win.document.close();
  }

  const filtered = quotations.filter((q) => {
    if (filterStatus !== "all" && q.status !== filterStatus) return false;
    if (filterType !== "all" && q.type !== filterType) return false;
    if (
      search &&
      !q.customerName.toLowerCase().includes(search.toLowerCase()) &&
      !q.quotationNo.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // ---------- LIST VIEW ----------
  if (view === "list") {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t("quotation.title")}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              {t("quotation.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setView("create");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            data-ocid="quotation.open_modal_button"
          >
            <Plus className="w-4 h-4" />
            {t("quotation.new")}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder={t("quotation.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border-white/10 text-white placeholder-slate-400 w-64"
            data-ocid="quotation.search_input"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger
              className="bg-slate-800 border-white/10 text-white w-40"
              data-ocid="quotation.status_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="all" className="text-white">
                {t("quotation.allStatuses")}
              </SelectItem>
              <SelectItem value="draft" className="text-white">
                {t("quotation.draft")}
              </SelectItem>
              <SelectItem value="sent" className="text-white">
                {t("quotation.sent")}
              </SelectItem>
              <SelectItem value="approved" className="text-white">
                {t("quotation.approved")}
              </SelectItem>
              <SelectItem value="rejected" className="text-white">
                {t("quotation.rejected")}
              </SelectItem>
              <SelectItem value="cancelled" className="text-white">
                {t("quotation.cancelled")}
              </SelectItem>
              <SelectItem value="converted" className="text-white">
                {t("quotation.converted")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger
              className="bg-slate-800 border-white/10 text-white w-40"
              data-ocid="quotation.type_select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/10">
              <SelectItem value="all" className="text-white">
                {t("quotation.allTypes")}
              </SelectItem>
              <SelectItem value="quotation" className="text-white">
                {t("quotation.typeQuotation")}
              </SelectItem>
              <SelectItem value="proforma" className="text-white">
                {t("quotation.typeProforma")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-slate-400"
              data-ocid="quotation.empty_state"
            >
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p>{t("quotation.noData")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-slate-400">
                    {t("quotation.no")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("quotation.customer")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("quotation.type")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("quotation.status")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("quotation.validUntil")}
                  </TableHead>
                  <TableHead className="text-slate-400 text-right">
                    {t("quotation.total")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("quotation.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((q, idx) => (
                  <TableRow
                    key={q.id}
                    className="border-white/5 hover:bg-white/5 cursor-pointer"
                    data-ocid={`quotation.item.${idx + 1}`}
                    onClick={() => {
                      setSelected(q);
                      setView("detail");
                    }}
                  >
                    <TableCell className="text-white font-mono text-sm">
                      {q.quotationNo}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {q.customerName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          q.type === "proforma"
                            ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                            : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                        }
                      >
                        {q.type === "proforma"
                          ? t("quotation.typeProforma")
                          : t("quotation.typeQuotation")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_BADGE[q.status].className}
                      >
                        {t(`quotation.${q.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {q.validUntil}
                    </TableCell>
                    <TableCell className="text-right text-white font-semibold">
                      {formatCurrency(q.total, q.currency)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(q);
                          setView("detail");
                        }}
                        data-ocid={`quotation.edit_button.${idx + 1}`}
                      >
                        {t("quotation.view")}
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

  // ---------- CREATE VIEW ----------
  if (view === "create") {
    const totals = calcTotals(formItems);
    return (
      <div className="p-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={() => setView("list")}
            data-ocid="quotation.cancel_button"
          >
            ← {t("quotation.back")}
          </Button>
          <h2 className="text-xl font-bold text-white">{t("quotation.new")}</h2>
        </div>

        <div className="bg-slate-800 rounded-xl border border-white/5 p-6 space-y-5">
          {/* Header Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-slate-300">
                {t("quotation.customer")} *
              </Label>
              {customers.length > 0 ? (
                <Select
                  value={formCustomerId}
                  onValueChange={setFormCustomerId}
                >
                  <SelectTrigger
                    className="bg-slate-700 border-white/10 text-white"
                    data-ocid="quotation.select"
                  >
                    <SelectValue placeholder={t("quotation.selectCustomer")} />
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
                  placeholder={t("quotation.noCustomers")}
                  disabled
                  className="bg-slate-700 border-white/10 text-slate-400"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">
                {t("quotation.validUntil")} *
              </Label>
              <Input
                type="date"
                value={formValidUntil}
                onChange={(e) => setFormValidUntil(e.target.value)}
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="quotation.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">
                {t("quotation.currency")}
              </Label>
              <Select value={formCurrency} onValueChange={setFormCurrency}>
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white"
                  data-ocid="quotation.currency_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-white">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">
                {t("quotation.items")}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addItem}
                className="border-white/10 text-slate-300 hover:text-white gap-1.5"
                data-ocid="quotation.secondary_button"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("quotation.addItem")}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 pb-2 font-medium pr-2">
                      {t("quotation.productName")}
                    </th>
                    <th className="text-right text-slate-400 pb-2 font-medium w-20 pr-2">
                      {t("quotation.qty")}
                    </th>
                    <th className="text-right text-slate-400 pb-2 font-medium w-28 pr-2">
                      {t("quotation.unitPrice")}
                    </th>
                    <th className="text-right text-slate-400 pb-2 font-medium w-24 pr-2">
                      {t("quotation.discount")}
                    </th>
                    <th className="text-right text-slate-400 pb-2 font-medium w-24 pr-2">
                      {t("quotation.vatRate")}
                    </th>
                    <th className="text-right text-slate-400 pb-2 font-medium w-28 pr-2">
                      {t("quotation.lineTotal")}
                    </th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {formItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-2 pr-2">
                        <Input
                          value={item.productName}
                          onChange={(e) =>
                            updateItem(idx, "productName", e.target.value)
                          }
                          placeholder={t("quotation.productPlaceholder")}
                          className="bg-slate-700 border-white/10 text-white h-8 text-sm"
                          data-ocid={`quotation.input.${idx + 1}`}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(idx, "quantity", Number(e.target.value))
                          }
                          className="bg-slate-700 border-white/10 text-white h-8 text-sm text-right"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(idx, "unitPrice", Number(e.target.value))
                          }
                          className="bg-slate-700 border-white/10 text-white h-8 text-sm text-right"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discountPercent}
                          onChange={(e) =>
                            updateItem(
                              idx,
                              "discountPercent",
                              Number(e.target.value),
                            )
                          }
                          className="bg-slate-700 border-white/10 text-white h-8 text-sm text-right"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <Select
                          value={String(item.vatRate)}
                          onValueChange={(v) =>
                            updateItem(idx, "vatRate", Number(v))
                          }
                        >
                          <SelectTrigger className="bg-slate-700 border-white/10 text-white h-8 text-sm">
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
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <span className="text-white font-semibold">
                          {item.lineTotalWithVat.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                          data-ocid={`quotation.delete_button.${idx + 1}`}
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
              <div className="space-y-1 text-sm min-w-52">
                <div className="flex justify-between text-slate-400">
                  <span>{t("quotation.subtotal")}</span>
                  <span>
                    {totals.subtotal.toFixed(2)} {formCurrency}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t("quotation.totalVat")}</span>
                  <span>
                    {totals.totalVat.toFixed(2)} {formCurrency}
                  </span>
                </div>
                <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-1">
                  <span>{t("quotation.total")}</span>
                  <span>
                    {totals.total.toFixed(2)} {formCurrency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-slate-300">{t("quotation.notes")}</Label>
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={t("quotation.notesPlaceholder")}
              className="bg-slate-700 border-white/10 text-white placeholder-slate-400"
              rows={3}
              data-ocid="quotation.textarea"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              className="border-white/10 text-slate-300 hover:text-white"
              data-ocid="quotation.save_button"
            >
              {t("quotation.saveDraft")}
            </Button>
            <Button
              onClick={() => handleSubmit("sent")}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              data-ocid="quotation.submit_button"
            >
              <Send className="w-4 h-4" />
              {t("quotation.sendQuotation")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- DETAIL VIEW ----------
  if (view === "detail" && selected) {
    const q = selected;
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
            data-ocid="quotation.close_button"
          >
            ← {t("quotation.back")}
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{q.quotationNo}</h2>
            <Badge
              variant="outline"
              className={`${STATUS_BADGE[q.status].className} mt-1`}
            >
              {t(`quotation.${q.status}`)}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrint(q)}
            className="border-white/10 text-slate-300 hover:text-white gap-1.5"
            data-ocid="quotation.secondary_button"
          >
            <Printer className="w-4 h-4" />
            {t("quotation.print")}
          </Button>
        </div>

        {/* Info */}
        <div className="bg-slate-800 rounded-xl border border-white/5 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-slate-400 text-xs mb-1">
                {t("quotation.customer")}
              </p>
              <p className="text-white font-semibold">{q.customerName}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">
                {t("quotation.type")}
              </p>
              <p className="text-white">
                {q.type === "proforma"
                  ? t("quotation.typeProforma")
                  : t("quotation.typeQuotation")}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">
                {t("quotation.validUntil")}
              </p>
              <p className="text-white">{q.validUntil}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">
                {t("quotation.currency")}
              </p>
              <p className="text-white">{q.currency}</p>
            </div>
          </div>

          {/* Items */}
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="text-slate-400">
                  {t("quotation.productName")}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("quotation.qty")}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("quotation.unitPrice")}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("quotation.discount")}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("quotation.vatRate")}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("quotation.lineTotal")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {q.items.map((item) => (
                <TableRow key={item.id} className="border-white/5">
                  <TableCell className="text-white">
                    {item.productName}
                  </TableCell>
                  <TableCell className="text-slate-300 text-right">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-slate-300 text-right">
                    {item.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-slate-300 text-right">
                    %{item.discountPercent}
                  </TableCell>
                  <TableCell className="text-slate-300 text-right">
                    %{item.vatRate}
                  </TableCell>
                  <TableCell className="text-white text-right font-semibold">
                    {formatCurrency(item.lineTotalWithVat, q.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="space-y-1 text-sm min-w-52">
              <div className="flex justify-between text-slate-400">
                <span>{t("quotation.subtotal")}</span>
                <span>{formatCurrency(q.subtotal, q.currency)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{t("quotation.totalVat")}</span>
                <span>{formatCurrency(q.totalVat, q.currency)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base border-t border-white/10 pt-1">
                <span>{t("quotation.total")}</span>
                <span>{formatCurrency(q.total, q.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {q.notes && (
            <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
              <p className="text-slate-400 text-xs mb-1">
                {t("quotation.notes")}
              </p>
              <p className="text-slate-300 text-sm">{q.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {q.status === "draft" && (
            <>
              <Button
                onClick={() => changeStatus(q, "sent")}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                data-ocid="quotation.primary_button"
              >
                <Send className="w-4 h-4" />
                {t("quotation.send")}
              </Button>
              <Button
                variant="outline"
                onClick={() => changeStatus(q, "cancelled")}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                data-ocid="quotation.delete_button"
              >
                <XCircle className="w-4 h-4 mr-1" />
                {t("quotation.cancel")}
              </Button>
            </>
          )}
          {q.status === "sent" && (
            <>
              <Button
                onClick={() => changeStatus(q, "approved")}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                data-ocid="quotation.confirm_button"
              >
                <CheckCircle className="w-4 h-4" />
                {t("quotation.approve")}
              </Button>
              <Button
                variant="outline"
                onClick={() => changeStatus(q, "rejected")}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                data-ocid="quotation.secondary_button"
              >
                {t("quotation.reject")}
              </Button>
              <Button
                variant="outline"
                onClick={() => changeStatus(q, "cancelled")}
                className="border-slate-500/30 text-slate-400 hover:bg-slate-500/10"
                data-ocid="quotation.delete_button"
              >
                {t("quotation.cancel")}
              </Button>
            </>
          )}
          {q.status === "approved" && (
            <>
              <Button
                onClick={() => setShowConvertConfirm("proforma")}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                data-ocid="quotation.primary_button"
              >
                <ArrowRight className="w-4 h-4" />
                {t("quotation.convertToProforma")}
              </Button>
              <Button
                onClick={() => setShowConvertConfirm("invoice")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                data-ocid="quotation.confirm_button"
              >
                <ArrowRight className="w-4 h-4" />
                {t("quotation.convertToInvoice")}
              </Button>
            </>
          )}
          {q.type === "proforma" && q.status !== "converted" && (
            <Button
              onClick={() => setShowConvertConfirm("invoice")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              data-ocid="quotation.confirm_button"
            >
              <ArrowRight className="w-4 h-4" />
              {t("quotation.convertToInvoice")}
            </Button>
          )}
        </div>

        {/* Convert Confirm Dialog */}
        <Dialog
          open={!!showConvertConfirm}
          onOpenChange={() => setShowConvertConfirm(null)}
        >
          <DialogContent
            className="bg-slate-800 border-white/10 text-white"
            data-ocid="quotation.dialog"
          >
            <DialogHeader>
              <DialogTitle className="text-white">
                {showConvertConfirm === "proforma"
                  ? t("quotation.convertToProforma")
                  : t("quotation.convertToInvoice")}
              </DialogTitle>
            </DialogHeader>
            <p className="text-slate-400 text-sm">
              {showConvertConfirm === "proforma"
                ? t("quotation.confirmProforma")
                : t("quotation.confirmInvoice")}
            </p>
            <div className="flex gap-3 justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setShowConvertConfirm(null)}
                className="border-white/10 text-slate-300"
                data-ocid="quotation.cancel_button"
              >
                {t("quotation.cancel")}
              </Button>
              <Button
                onClick={() => {
                  if (showConvertConfirm === "proforma") convertToProforma(q);
                  else convertToInvoice(q);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-ocid="quotation.confirm_button"
              >
                {t("quotation.confirm")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return null;
}
