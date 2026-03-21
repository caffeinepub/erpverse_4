import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  CalendarClock,
  FileText,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  description: string;
  amount: number;
  currency: "TRY" | "USD" | "EUR" | "GBP";
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate?: string;
  notes?: string;
  status: "active" | "paused" | "cancelled";
  lastInvoiceDate?: string;
  createdAt: string;
}

interface CRMCustomer {
  id: string;
  name: string;
  email?: string;
}

interface Props {
  companyId: string;
}

function calcNextDate(
  period: Subscription["period"],
  fromDate: string,
): string {
  const d = new Date(fromDate);
  switch (period) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
  }
  return d.toISOString().split("T")[0];
}

export default function AbonelikYonetimi({ companyId }: Props) {
  const { t } = useLanguage();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    description: "",
    amount: "",
    currency: "TRY" as Subscription["currency"],
    period: "monthly" as Subscription["period"],
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    const raw = localStorage.getItem(`erpSubscriptions_${companyId}`);
    if (raw) setSubscriptions(JSON.parse(raw));

    const crmRaw = localStorage.getItem(`erpCRM_${companyId}`);
    if (crmRaw) {
      const crmData = JSON.parse(crmRaw);
      const cList: CRMCustomer[] = (crmData.customers || []).map(
        (c: { id: string; name: string; email?: string }) => ({
          id: c.id,
          name: c.name,
          email: c.email,
        }),
      );
      setCustomers(cList);
    }
  }, [companyId]);

  const save = (list: Subscription[]) => {
    setSubscriptions(list);
    localStorage.setItem(`erpSubscriptions_${companyId}`, JSON.stringify(list));
  };

  const handleCreate = () => {
    if (!form.customerId || !form.description || !form.amount) {
      toast.error(t("subscription.fillRequired"));
      return;
    }
    const customer = customers.find((c) => c.id === form.customerId);
    const newSub: Subscription = {
      id: Date.now().toString(),
      customerId: form.customerId,
      customerName: customer?.name ?? form.customerId,
      description: form.description,
      amount: Number.parseFloat(form.amount),
      currency: form.currency,
      period: form.period,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      notes: form.notes || undefined,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    save([...subscriptions, newSub]);
    toast.success(t("subscription.created"));
    setShowForm(false);
    setForm({
      customerId: "",
      description: "",
      amount: "",
      currency: "TRY",
      period: "monthly",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      notes: "",
    });
  };

  const createInvoice = (sub: Subscription) => {
    const invoiceKey = `erpInvoices_${companyId}`;
    const raw = localStorage.getItem(invoiceKey);
    const invoices = raw ? JSON.parse(raw) : [];
    const today = new Date().toISOString().split("T")[0];
    const invoice = {
      id: `INV-SUB-${Date.now()}`,
      customerId: sub.customerId,
      customerName: sub.customerName,
      date: today,
      dueDate: calcNextDate(sub.period, today),
      items: [
        {
          description: sub.description,
          quantity: 1,
          unitPrice: sub.amount,
          total: sub.amount,
        },
      ],
      subtotal: sub.amount,
      tax: 0,
      total: sub.amount,
      currency: sub.currency,
      status: "pending",
      notes: `${t("subscription.autoInvoice")}: ${sub.description}`,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(invoiceKey, JSON.stringify([...invoices, invoice]));

    const updated = subscriptions.map((s) =>
      s.id === sub.id ? { ...s, lastInvoiceDate: today } : s,
    );
    save(updated);
    toast.success(t("subscription.invoiceCreated"));
  };

  const updateStatus = (id: string, status: Subscription["status"]) => {
    save(subscriptions.map((s) => (s.id === id ? { ...s, status } : s)));
    toast.success(t("subscription.statusUpdated"));
  };

  const deleteSub = (id: string) => {
    save(subscriptions.filter((s) => s.id !== id));
    toast.success(t("subscription.deleted"));
  };

  const getNextDate = (sub: Subscription) => {
    const base = sub.lastInvoiceDate || sub.startDate;
    return calcNextDate(sub.period, base);
  };

  const periodLabel = (p: Subscription["period"]) => {
    const map: Record<string, string> = {
      weekly: t("subscription.weekly"),
      monthly: t("subscription.monthly"),
      quarterly: t("subscription.quarterly"),
      yearly: t("subscription.yearly"),
    };
    return map[p] || p;
  };

  const statusBadge = (status: Subscription["status"]) => {
    if (status === "active")
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          {t("subscription.active")}
        </Badge>
      );
    if (status === "paused")
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          {t("subscription.paused")}
        </Badge>
      );
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        {t("subscription.cancelled")}
      </Badge>
    );
  };

  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const totalMonthly = subscriptions
    .filter((s) => s.status === "active")
    .reduce((acc, s) => {
      let monthly = s.amount;
      if (s.period === "weekly") monthly = s.amount * 4.33;
      else if (s.period === "quarterly") monthly = s.amount / 3;
      else if (s.period === "yearly") monthly = s.amount / 12;
      return acc + monthly;
    }, 0);

  return (
    <div className="p-6 space-y-6" data-ocid="subscription.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("subscription.title")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {t("subscription.subtitle")}
          </p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              data-ocid="subscription.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("subscription.new")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-slate-800 border-white/10 text-white max-w-lg"
            data-ocid="subscription.dialog"
          >
            <DialogHeader>
              <DialogTitle className="text-white">
                {t("subscription.newTitle")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label className="text-slate-300">
                  {t("subscription.customer")}
                </Label>
                <Select
                  value={form.customerId}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, customerId: v }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-700 border-white/10 text-white mt-1"
                    data-ocid="subscription.select"
                  >
                    <SelectValue
                      placeholder={t("subscription.selectCustomer")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-white/10">
                    {customers.length === 0 && (
                      <SelectItem
                        value="__none__"
                        disabled
                        className="text-slate-400"
                      >
                        {t("subscription.noCustomers")}
                      </SelectItem>
                    )}
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
              </div>
              <div>
                <Label className="text-slate-300">
                  {t("subscription.description")}
                </Label>
                <Input
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder={t("subscription.descPlaceholder")}
                  data-ocid="subscription.input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">
                    {t("subscription.amount")}
                  </Label>
                  <Input
                    type="number"
                    className="bg-slate-700 border-white/10 text-white mt-1"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("subscription.currency")}
                  </Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        currency: v as Subscription["currency"],
                      }))
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-white/10 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-white/10">
                      {["TRY", "USD", "EUR", "GBP"].map((c) => (
                        <SelectItem key={c} value={c} className="text-white">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-300">
                  {t("subscription.period")}
                </Label>
                <Select
                  value={form.period}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      period: v as Subscription["period"],
                    }))
                  }
                >
                  <SelectTrigger className="bg-slate-700 border-white/10 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-white/10">
                    <SelectItem value="weekly" className="text-white">
                      {t("subscription.weekly")}
                    </SelectItem>
                    <SelectItem value="monthly" className="text-white">
                      {t("subscription.monthly")}
                    </SelectItem>
                    <SelectItem value="quarterly" className="text-white">
                      {t("subscription.quarterly")}
                    </SelectItem>
                    <SelectItem value="yearly" className="text-white">
                      {t("subscription.yearly")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-300">
                    {t("subscription.startDate")}
                  </Label>
                  <Input
                    type="date"
                    className="bg-slate-700 border-white/10 text-white mt-1"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("subscription.endDate")}
                  </Label>
                  <Input
                    type="date"
                    className="bg-slate-700 border-white/10 text-white mt-1"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">
                  {t("subscription.notes")}
                </Label>
                <Textarea
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  data-ocid="subscription.textarea"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="ghost"
                  className="text-slate-400"
                  onClick={() => setShowForm(false)}
                  data-ocid="subscription.cancel_button"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handleCreate}
                  data-ocid="subscription.submit_button"
                >
                  {t("subscription.create")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs">
              {t("subscription.totalSubs")}
            </p>
            <p className="text-white text-2xl font-bold">
              {subscriptions.length}
            </p>
          </div>
        </div>
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs">
              {t("subscription.activeCount")}
            </p>
            <p className="text-white text-2xl font-bold">{activeCount}</p>
          </div>
        </div>
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs">
              {t("subscription.monthlyRevenue")}
            </p>
            <p className="text-white text-2xl font-bold">
              {totalMonthly.toLocaleString("tr-TR", {
                maximumFractionDigits: 0,
              })}{" "}
              ₺
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      {subscriptions.length === 0 ? (
        <div
          className="text-center py-16 text-slate-400 border border-white/10 rounded-xl bg-slate-800/30"
          data-ocid="subscription.empty_state"
        >
          <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{t("subscription.empty")}</p>
          <p className="text-sm mt-1 opacity-60">
            {t("subscription.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-800/30">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400">
                  {t("subscription.customer")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("subscription.description")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("subscription.amount")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("subscription.period")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("subscription.statusLabel")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("subscription.nextInvoice")}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub, idx) => (
                <TableRow
                  key={sub.id}
                  className="border-white/10 hover:bg-white/5"
                  data-ocid={`subscription.item.${idx + 1}`}
                >
                  <TableCell className="text-white font-medium">
                    {sub.customerName}
                  </TableCell>
                  <TableCell className="text-slate-300 max-w-48 truncate">
                    {sub.description}
                  </TableCell>
                  <TableCell className="text-white">
                    {sub.amount.toLocaleString("tr-TR")} {sub.currency}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {periodLabel(sub.period)}
                  </TableCell>
                  <TableCell>{statusBadge(sub.status)}</TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {getNextDate(sub)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                          data-ocid="subscription.dropdown_menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="bg-slate-700 border-white/10"
                        align="end"
                      >
                        <DropdownMenuItem
                          className="text-white hover:bg-white/10 cursor-pointer"
                          onClick={() => createInvoice(sub)}
                        >
                          <FileText className="w-4 h-4 mr-2 text-blue-400" />
                          {t("subscription.createInvoice")}
                        </DropdownMenuItem>
                        {sub.status === "active" && (
                          <DropdownMenuItem
                            className="text-white hover:bg-white/10 cursor-pointer"
                            onClick={() => updateStatus(sub.id, "paused")}
                          >
                            <Pause className="w-4 h-4 mr-2 text-yellow-400" />
                            {t("subscription.pause")}
                          </DropdownMenuItem>
                        )}
                        {sub.status === "paused" && (
                          <DropdownMenuItem
                            className="text-white hover:bg-white/10 cursor-pointer"
                            onClick={() => updateStatus(sub.id, "active")}
                          >
                            <Play className="w-4 h-4 mr-2 text-emerald-400" />
                            {t("subscription.resume")}
                          </DropdownMenuItem>
                        )}
                        {sub.status !== "cancelled" && (
                          <DropdownMenuItem
                            className="text-white hover:bg-white/10 cursor-pointer"
                            onClick={() => updateStatus(sub.id, "cancelled")}
                          >
                            <XCircle className="w-4 h-4 mr-2 text-red-400" />
                            {t("subscription.cancel")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-400 hover:bg-white/10 cursor-pointer"
                          onClick={() => deleteSub(sub.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
