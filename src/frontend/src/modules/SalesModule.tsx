import {
  Edit2,
  FileText,
  Plus,
  ShoppingBag,
  Trash2,
  TrendingUp,
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface SalesQuote {
  id: string;
  quoteNo: string;
  customer: string;
  amount: number;
  status: "draft" | "sent" | "accepted" | "rejected";
  date: string;
  notes: string;
  convertedToInvoice?: boolean;
}

interface SalesOrder {
  id: string;
  orderNo: string;
  customer: string;
  amount: number;
  status: "pending" | "processing" | "delivered" | "cancelled";
  date: string;
  notes: string;
}

interface SalesOpportunity {
  id: string;
  title: string;
  customer: string;
  value: number;
  probability: number;
  stage:
    | "prospecting"
    | "qualification"
    | "proposal"
    | "negotiation"
    | "closed_won"
    | "closed_lost";
  date: string;
  notes: string;
}

type ActiveTab = "quotes" | "orders" | "opportunities";

export default function SalesModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const { addNotification } = useNotifications();
  const cid = company?.id || "default";

  const [quotes, setQuotes] = useLocalStorage<SalesQuote[]>(
    `erpverse_sales_quotes_${cid}`,
    [],
  );
  const [orders, setOrders] = useLocalStorage<SalesOrder[]>(
    `erpverse_sales_orders_${cid}`,
    [],
  );
  const [opportunities, setOpportunities] = useLocalStorage<SalesOpportunity[]>(
    `erpverse_sales_opps_${cid}`,
    [],
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("quotes");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Quote form
  const [qForm, setQForm] = useState({
    quoteNo: "",
    customer: "",
    amount: "",
    status: "draft" as SalesQuote["status"],
    date: "",
    notes: "",
  });
  // Order form
  const [oForm, setOForm] = useState({
    orderNo: "",
    customer: "",
    amount: "",
    status: "pending" as SalesOrder["status"],
    date: "",
    notes: "",
  });
  // Opportunity form
  const [opForm, setOpForm] = useState({
    title: "",
    customer: "",
    value: "",
    probability: "",
    stage: "prospecting" as SalesOpportunity["stage"],
    date: "",
    notes: "",
  });

  const openAdd = () => {
    setEditId(null);
    resetForms();
    setShowDialog(true);
  };

  const resetForms = () => {
    setQForm({
      quoteNo: "",
      customer: "",
      amount: "",
      status: "draft",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setOForm({
      orderNo: "",
      customer: "",
      amount: "",
      status: "pending",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    setOpForm({
      title: "",
      customer: "",
      value: "",
      probability: "50",
      stage: "prospecting",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  };

  const openEdit = (id: string) => {
    setEditId(id);
    if (activeTab === "quotes") {
      const q = quotes.find((x) => x.id === id);
      if (q)
        setQForm({
          quoteNo: q.quoteNo,
          customer: q.customer,
          amount: String(q.amount),
          status: q.status,
          date: q.date,
          notes: q.notes,
        });
    } else if (activeTab === "orders") {
      const o = orders.find((x) => x.id === id);
      if (o)
        setOForm({
          orderNo: o.orderNo,
          customer: o.customer,
          amount: String(o.amount),
          status: o.status,
          date: o.date,
          notes: o.notes,
        });
    } else {
      const op = opportunities.find((x) => x.id === id);
      if (op)
        setOpForm({
          title: op.title,
          customer: op.customer,
          value: String(op.value),
          probability: String(op.probability),
          stage: op.stage,
          date: op.date,
          notes: op.notes,
        });
    }
    setShowDialog(true);
  };

  const saveQuote = () => {
    if (!qForm.customer || !qForm.quoteNo) {
      toast.error(t("sales.fieldsRequired"));
      return;
    }
    const item: SalesQuote = {
      id: editId || Date.now().toString(),
      quoteNo: qForm.quoteNo,
      customer: qForm.customer,
      amount: Number.parseFloat(qForm.amount) || 0,
      status: qForm.status,
      date: qForm.date,
      notes: qForm.notes,
    };
    setQuotes((prev) =>
      editId ? prev.map((x) => (x.id === editId ? item : x)) : [item, ...prev],
    );
    setShowDialog(false);
    toast.success(t("common.saved"));
  };

  const saveOrder = () => {
    if (!oForm.customer || !oForm.orderNo) {
      toast.error(t("sales.fieldsRequired"));
      return;
    }
    const item: SalesOrder = {
      id: editId || Date.now().toString(),
      orderNo: oForm.orderNo,
      customer: oForm.customer,
      amount: Number.parseFloat(oForm.amount) || 0,
      status: oForm.status,
      date: oForm.date,
      notes: oForm.notes,
    };
    setOrders((prev) =>
      editId ? prev.map((x) => (x.id === editId ? item : x)) : [item, ...prev],
    );
    // Integration: delivered order -> accounting revenue
    if (
      (!editId && item.status === "delivered") ||
      (editId && oForm.status === "delivered")
    ) {
      const acctKey = `erpverse_accounting_${cid}`;
      const existing = (() => {
        try {
          return JSON.parse(localStorage.getItem(acctKey) || "[]");
        } catch {
          return [];
        }
      })();
      const tx = {
        id: Date.now().toString(),
        type: "income",
        description: `${t("modules.SalesManagement")}: ${item.customer}`,
        amount: item.amount,
        date: item.date,
        category: "Sales",
      };
      localStorage.setItem(acctKey, JSON.stringify([tx, ...existing]));
      toast.success(t("integration.salesIncomeCreated"));
    }
    setShowDialog(false);
    toast.success(t("common.saved"));
  };

  const saveOpportunity = () => {
    if (!opForm.title || !opForm.customer) {
      toast.error(t("sales.fieldsRequired"));
      return;
    }
    const item: SalesOpportunity = {
      id: editId || Date.now().toString(),
      title: opForm.title,
      customer: opForm.customer,
      value: Number.parseFloat(opForm.value) || 0,
      probability: Number.parseInt(opForm.probability) || 0,
      stage: opForm.stage,
      date: opForm.date,
      notes: opForm.notes,
    };
    setOpportunities((prev) =>
      editId ? prev.map((x) => (x.id === editId ? item : x)) : [item, ...prev],
    );
    setShowDialog(false);
    toast.success(t("common.saved"));
  };

  const deleteQuote = (id: string) => {
    setQuotes((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("common.deleted"));
  };
  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("common.deleted"));
  };
  const deleteOpportunity = (id: string) => {
    setOpportunities((prev) => prev.filter((x) => x.id !== id));
    toast.success(t("common.deleted"));
  };
  const convertToInvoice = (id: string) => {
    const q = quotes.find((x) => x.id === id);
    if (!q) return;
    const cid = company?.id ?? "";
    const invKey = `erp_invoices_${cid}`;
    const existing: unknown[] = JSON.parse(
      localStorage.getItem(invKey) ?? "[]",
    );
    const newInvoice = {
      id: Date.now().toString(),
      customerName: q.customer,
      description: `${t("sales.quoteNo")}: ${q.quoteNo}`,
      amount: q.amount,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
    };
    localStorage.setItem(invKey, JSON.stringify([...existing, newInvoice]));
    setQuotes((prev) =>
      prev.map((x) => (x.id === id ? { ...x, convertedToInvoice: true } : x)),
    );
    addNotification({
      type: "info",
      title: t("sales.convertedToInvoice"),
      message: `${q.quoteNo} - ${q.customer}`,
      companyId: cid,
    });
    toast.success(t("sales.convertedToInvoice"));
  };

  const quoteStatusColors: Record<string, string> = {
    draft: "bg-slate-700 text-slate-200",
    sent: "bg-blue-700 text-blue-100",
    accepted: "bg-emerald-700 text-emerald-100",
    rejected: "bg-red-700 text-red-100",
  };

  const orderStatusColors: Record<string, string> = {
    pending: "bg-yellow-700 text-yellow-100",
    processing: "bg-blue-700 text-blue-100",
    delivered: "bg-emerald-700 text-emerald-100",
    cancelled: "bg-red-700 text-red-100",
  };

  const stageColors: Record<string, string> = {
    prospecting: "bg-slate-700 text-slate-200",
    qualification: "bg-blue-700 text-blue-100",
    proposal: "bg-indigo-700 text-indigo-100",
    negotiation: "bg-yellow-700 text-yellow-100",
    closed_won: "bg-emerald-700 text-emerald-100",
    closed_lost: "bg-red-700 text-red-100",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-green-500/20">
            <ShoppingBag className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {t("modules.SalesManagement")}
            </h1>
            <p className="text-sm text-slate-400">{t("sales.subtitle")}</p>
          </div>
        </div>
        <Button
          onClick={openAdd}
          className="bg-green-600 hover:bg-green-700 text-white"
          data-ocid="sales.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("sales.add")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t("sales.totalQuotes")}</p>
          <p className="text-2xl font-bold text-white mt-1">{quotes.length}</p>
          <p className="text-xs text-green-400 mt-1">
            {quotes.filter((q) => q.status === "accepted").length}{" "}
            {t("sales.accepted")}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">{t("sales.totalOrders")}</p>
          <p className="text-2xl font-bold text-white mt-1">{orders.length}</p>
          <p className="text-xs text-emerald-400 mt-1">
            {orders.filter((o) => o.status === "delivered").length}{" "}
            {t("sales.delivered")}
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm">
            {t("sales.totalOpportunities")}
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {opportunities.length}
          </p>
          <p className="text-xs text-yellow-400 mt-1">
            {opportunities.filter((o) => o.stage === "closed_won").length}{" "}
            {t("sales.wonLabel")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["quotes", "orders", "opportunities"] as ActiveTab[]).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            data-ocid={`sales.${tab}.tab`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-green-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            {t(`sales.tab.${tab}`)}
          </button>
        ))}
      </div>

      {/* Quotes Table */}
      {activeTab === "quotes" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {quotes.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="sales.quotes.empty_state"
            >
              {t("sales.noQuotes")}
            </div>
          ) : (
            <Table data-ocid="sales.quotes.table">
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">
                    {t("sales.quoteNo")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.customer")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.amount")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.status")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.date")}
                  </TableHead>
                  <TableHead className="text-slate-400" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotes.map((q, i) => (
                  <TableRow
                    key={q.id}
                    className="border-slate-700"
                    data-ocid={`sales.quotes.row.${i + 1}`}
                  >
                    <TableCell className="text-white font-mono">
                      {q.quoteNo}
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {q.customer}
                    </TableCell>
                    <TableCell className="text-white">
                      {q.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={quoteStatusColors[q.status]}>
                        {t(`sales.quoteStatus.${q.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">{q.date}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(q.id)}
                        data-ocid={`sales.quotes.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={() => deleteQuote(q.id)}
                        data-ocid={`sales.quotes.delete_button.${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {q.status === "accepted" && !q.convertedToInvoice && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-400"
                          onClick={() => convertToInvoice(q.id)}
                          title={t("sales.convertToInvoice")}
                          data-ocid={`sales.quotes.convert_button.${i + 1}`}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                      {q.convertedToInvoice && (
                        <Badge className="bg-emerald-800 text-emerald-200 text-xs">
                          {t("sales.invoiced")}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Orders Table */}
      {activeTab === "orders" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {orders.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="sales.orders.empty_state"
            >
              {t("sales.noOrders")}
            </div>
          ) : (
            <Table data-ocid="sales.orders.table">
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">
                    {t("sales.orderNo")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.customer")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.amount")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.status")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.date")}
                  </TableHead>
                  <TableHead className="text-slate-400" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o, i) => (
                  <TableRow
                    key={o.id}
                    className="border-slate-700"
                    data-ocid={`sales.orders.row.${i + 1}`}
                  >
                    <TableCell className="text-white font-mono">
                      {o.orderNo}
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {o.customer}
                    </TableCell>
                    <TableCell className="text-white">
                      {o.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={orderStatusColors[o.status]}>
                        {t(`sales.orderStatus.${o.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">{o.date}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(o.id)}
                        data-ocid={`sales.orders.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={() => deleteOrder(o.id)}
                        data-ocid={`sales.orders.delete_button.${i + 1}`}
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

      {/* Opportunities Table */}
      {activeTab === "opportunities" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          {opportunities.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="sales.opps.empty_state"
            >
              {t("sales.noOpportunities")}
            </div>
          ) : (
            <Table data-ocid="sales.opps.table">
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-400">
                    {t("sales.title")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.customer")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.value")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.probability")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.stage")}
                  </TableHead>
                  <TableHead className="text-slate-400">
                    {t("sales.date")}
                  </TableHead>
                  <TableHead className="text-slate-400" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((op, i) => (
                  <TableRow
                    key={op.id}
                    className="border-slate-700"
                    data-ocid={`sales.opps.row.${i + 1}`}
                  >
                    <TableCell className="text-white">{op.title}</TableCell>
                    <TableCell className="text-slate-200">
                      {op.customer}
                    </TableCell>
                    <TableCell className="text-white">
                      {op.value.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-200">
                      {op.probability}%
                    </TableCell>
                    <TableCell>
                      <Badge className={stageColors[op.stage]}>
                        {t(`sales.stage.${op.stage}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">{op.date}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(op.id)}
                        data-ocid={`sales.opps.edit_button.${i + 1}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400"
                        onClick={() => deleteOpportunity(op.id)}
                        data-ocid={`sales.opps.delete_button.${i + 1}`}
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
          data-ocid="sales.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              {editId ? t("common.edit") : t("sales.add")} -{" "}
              {t(`sales.tab.${activeTab}`)}
            </DialogTitle>
          </DialogHeader>

          {activeTab === "quotes" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sales.quoteNo")}</Label>
                  <Input
                    data-ocid="sales.quoteno.input"
                    value={qForm.quoteNo}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, quoteNo: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sales.customer")}
                  </Label>
                  <Input
                    data-ocid="sales.customer.input"
                    value={qForm.customer}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, customer: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sales.amount")}</Label>
                  <Input
                    data-ocid="sales.amount.input"
                    type="number"
                    value={qForm.amount}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, amount: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">{t("sales.date")}</Label>
                  <Input
                    data-ocid="sales.date.input"
                    type="date"
                    value={qForm.date}
                    onChange={(e) =>
                      setQForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">{t("sales.status")}</Label>
                <Select
                  value={qForm.status}
                  onValueChange={(v) =>
                    setQForm((p) => ({
                      ...p,
                      status: v as SalesQuote["status"],
                    }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    data-ocid="sales.status.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {["draft", "sent", "accepted", "rejected"].map((s) => (
                      <SelectItem key={s} value={s} className="text-white">
                        {t(`sales.quoteStatus.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">{t("sales.notes")}</Label>
                <Textarea
                  data-ocid="sales.notes.textarea"
                  value={qForm.notes}
                  onChange={(e) =>
                    setQForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-slate-600 text-slate-300"
                  data-ocid="sales.cancel_button"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={saveQuote}
                  className="bg-green-600 hover:bg-green-700"
                  data-ocid="sales.save_button"
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sales.orderNo")}</Label>
                  <Input
                    data-ocid="sales.orderno.input"
                    value={oForm.orderNo}
                    onChange={(e) =>
                      setOForm((p) => ({ ...p, orderNo: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sales.customer")}
                  </Label>
                  <Input
                    data-ocid="sales.order.customer.input"
                    value={oForm.customer}
                    onChange={(e) =>
                      setOForm((p) => ({ ...p, customer: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sales.amount")}</Label>
                  <Input
                    data-ocid="sales.order.amount.input"
                    type="number"
                    value={oForm.amount}
                    onChange={(e) =>
                      setOForm((p) => ({ ...p, amount: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">{t("sales.date")}</Label>
                  <Input
                    data-ocid="sales.order.date.input"
                    type="date"
                    value={oForm.date}
                    onChange={(e) =>
                      setOForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">{t("sales.status")}</Label>
                <Select
                  value={oForm.status}
                  onValueChange={(v) =>
                    setOForm((p) => ({
                      ...p,
                      status: v as SalesOrder["status"],
                    }))
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    data-ocid="sales.order.status.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {["pending", "processing", "delivered", "cancelled"].map(
                      (s) => (
                        <SelectItem key={s} value={s} className="text-white">
                          {t(`sales.orderStatus.${s}`)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">{t("sales.notes")}</Label>
                <Textarea
                  data-ocid="sales.order.notes.textarea"
                  value={oForm.notes}
                  onChange={(e) =>
                    setOForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-slate-600 text-slate-300"
                  data-ocid="sales.order.cancel_button"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={saveOrder}
                  className="bg-green-600 hover:bg-green-700"
                  data-ocid="sales.order.save_button"
                >
                  {t("common.save")}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "opportunities" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sales.title")}</Label>
                  <Input
                    data-ocid="sales.opp.title.input"
                    value={opForm.title}
                    onChange={(e) =>
                      setOpForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sales.customer")}
                  </Label>
                  <Input
                    data-ocid="sales.opp.customer.input"
                    value={opForm.customer}
                    onChange={(e) =>
                      setOpForm((p) => ({ ...p, customer: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sales.value")}</Label>
                  <Input
                    data-ocid="sales.opp.value.input"
                    type="number"
                    value={opForm.value}
                    onChange={(e) =>
                      setOpForm((p) => ({ ...p, value: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">
                    {t("sales.probability")} (%)
                  </Label>
                  <Input
                    data-ocid="sales.opp.prob.input"
                    type="number"
                    min="0"
                    max="100"
                    value={opForm.probability}
                    onChange={(e) =>
                      setOpForm((p) => ({ ...p, probability: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">{t("sales.stage")}</Label>
                  <Select
                    value={opForm.stage}
                    onValueChange={(v) =>
                      setOpForm((p) => ({
                        ...p,
                        stage: v as SalesOpportunity["stage"],
                      }))
                    }
                  >
                    <SelectTrigger
                      className="bg-slate-800 border-slate-600 text-white mt-1"
                      data-ocid="sales.opp.stage.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {[
                        "prospecting",
                        "qualification",
                        "proposal",
                        "negotiation",
                        "closed_won",
                        "closed_lost",
                      ].map((s) => (
                        <SelectItem key={s} value={s} className="text-white">
                          {t(`sales.stage.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-300">{t("sales.date")}</Label>
                  <Input
                    data-ocid="sales.opp.date.input"
                    type="date"
                    value={opForm.date}
                    onChange={(e) =>
                      setOpForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">{t("sales.notes")}</Label>
                <Textarea
                  data-ocid="sales.opp.notes.textarea"
                  value={opForm.notes}
                  onChange={(e) =>
                    setOpForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-slate-600 text-slate-300"
                  data-ocid="sales.opp.cancel_button"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={saveOpportunity}
                  className="bg-green-600 hover:bg-green-700"
                  data-ocid="sales.opp.save_button"
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
