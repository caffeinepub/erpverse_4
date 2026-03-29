import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Headphones,
  MessageSquare,
  Plus,
  Search,
  Send,
  Tag,
  Ticket,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface HelpDeskResponse {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

interface HelpDeskTicket {
  id: string;
  ticketNo: string;
  customerId: string;
  customerName: string;
  subject: string;
  description: string;
  category: "technical" | "billing" | "general" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  responses: HelpDeskResponse[];
}

interface CRMCustomer {
  id: string;
  name: string;
}

const STORAGE_KEY = (companyId: string) => `helpdesk_tickets_${companyId}`;
const CRM_KEY = (companyId: string) => `crm_customers_${companyId}`;

function loadTickets(companyId: string): HelpDeskTicket[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(companyId)) || "[]");
  } catch {
    return [];
  }
}

function saveTickets(companyId: string, tickets: HelpDeskTicket[]) {
  localStorage.setItem(STORAGE_KEY(companyId), JSON.stringify(tickets));
}

function loadCRMCustomers(companyId: string): CRMCustomer[] {
  try {
    return JSON.parse(localStorage.getItem(CRM_KEY(companyId)) || "[]");
  } catch {
    return [];
  }
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function nextTicketNo(tickets: HelpDeskTicket[]): string {
  const max = tickets.reduce((acc, t) => {
    const n = Number.parseInt(t.ticketNo.replace("TKT-", ""), 10);
    return n > acc ? n : acc;
  }, 0);
  return `TKT-${String(max + 1).padStart(3, "0")}`;
}

const priorityConfig = {
  low: {
    label: "Düşük",
    color: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  },
  medium: {
    label: "Orta",
    color: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  high: {
    label: "Yüksek",
    color: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
  critical: {
    label: "Kritik",
    color: "bg-red-100 text-red-700",
    dot: "bg-red-500",
  },
};

const statusConfig = {
  open: {
    label: "Açık",
    color: "bg-blue-100 text-blue-700",
    icon: AlertCircle,
  },
  in_progress: {
    label: "İşlemde",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  resolved: {
    label: "Çözüldü",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  closed: {
    label: "Kapalı",
    color: "bg-slate-100 text-slate-600",
    icon: XCircle,
  },
};

const categoryLabels: Record<string, string> = {
  technical: "Teknik",
  billing: "Faturalama",
  general: "Genel",
  other: "Diğer",
};

export default function HelpDeskModule() {
  const { t } = useLanguage();
  const { company, user } = useAuth();
  const companyId = company?.id || "";
  const currentUserName = user?.displayName || "";

  const [tickets, setTickets] = useState<HelpDeskTicket[]>(() =>
    loadTickets(companyId),
  );
  const [selectedTicket, setSelectedTicket] = useState<HelpDeskTicket | null>(
    null,
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [responseContent, setResponseContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    subject: "",
    description: "",
    category: "general" as HelpDeskTicket["category"],
    priority: "medium" as HelpDeskTicket["priority"],
    assignedTo: "",
  });

  const customers = loadCRMCustomers(companyId);

  const saveAndSet = (updated: HelpDeskTicket[]) => {
    setTickets(updated);
    saveTickets(companyId, updated);
  };

  const handleCreate = () => {
    if (!form.subject || !form.description) return;
    const now = new Date().toISOString();
    const ticket: HelpDeskTicket = {
      id: genId(),
      ticketNo: nextTicketNo(tickets),
      customerId: form.customerId,
      customerName: form.customerName || form.customerId,
      subject: form.subject,
      description: form.description,
      category: form.category,
      priority: form.priority,
      status: "open",
      assignedTo: form.assignedTo || currentUserName,
      createdAt: now,
      updatedAt: now,
      responses: [],
    };
    saveAndSet([ticket, ...tickets]);
    setForm({
      customerId: "",
      customerName: "",
      subject: "",
      description: "",
      category: "general",
      priority: "medium",
      assignedTo: "",
    });
    setShowCreateModal(false);
  };

  const handleStatusChange = (
    ticketId: string,
    newStatus: HelpDeskTicket["status"],
  ) => {
    const now = new Date().toISOString();
    const updated = tickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: newStatus,
            updatedAt: now,
            resolvedAt: newStatus === "resolved" ? now : t.resolvedAt,
          }
        : t,
    );
    saveAndSet(updated);
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(updated.find((t) => t.id === ticketId) || null);
    }
  };

  const handleAddResponse = () => {
    if (!responseContent.trim() || !selectedTicket) return;
    const now = new Date().toISOString();
    const response: HelpDeskResponse = {
      id: genId(),
      author: currentUserName,
      content: responseContent,
      createdAt: now,
      isInternal,
    };
    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? { ...t, responses: [...t.responses, response], updatedAt: now }
        : t,
    );
    saveAndSet(updated);
    setSelectedTicket(updated.find((t) => t.id === selectedTicket.id) || null);
    setResponseContent("");
    setIsInternal(false);
  };

  const filtered = tickets.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (
      search &&
      !t.subject.toLowerCase().includes(search.toLowerCase()) &&
      !t.customerName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // Summary stats
  const totalOpen = tickets.filter((t) => t.status === "open").length;
  const totalInProgress = tickets.filter(
    (t) => t.status === "in_progress",
  ).length;
  const today = new Date().toDateString();
  const resolvedToday = tickets.filter(
    (t) =>
      t.status === "resolved" &&
      t.resolvedAt &&
      new Date(t.resolvedAt).toDateString() === today,
  ).length;
  const resolvedWithTime = tickets.filter((t) => t.resolvedAt);
  const avgResolution =
    resolvedWithTime.length > 0
      ? Math.round(
          resolvedWithTime.reduce((acc, t) => {
            const diff =
              new Date(t.resolvedAt!).getTime() -
              new Date(t.createdAt).getTime();
            return acc + diff / 3600000;
          }, 0) / resolvedWithTime.length,
        )
      : 0;

  // Detail view
  if (selectedTicket) {
    const ticket =
      tickets.find((t) => t.id === selectedTicket.id) || selectedTicket;
    const pCfg = priorityConfig[ticket.priority];
    const sCfg = statusConfig[ticket.status];
    const StatusIcon = sCfg.icon;

    return (
      <div className="p-6 space-y-4">
        <button
          type="button"
          onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          data-ocid="helpdesk.back_button"
        >
          <ChevronLeft className="w-4 h-4" />
          {t("helpdesk.back") || "Geri"}
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-slate-400 text-sm font-mono">
                {ticket.ticketNo}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sCfg.color}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {sCfg.label}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${pCfg.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`} />
                {pCfg.label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{ticket.subject}</h2>
            <p className="text-slate-400 text-sm mt-1">
              {ticket.customerName} &bull; {categoryLabels[ticket.category]}{" "}
              &bull; {t("helpdesk.assignedTo") || "Atanan"}: {ticket.assignedTo}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {ticket.status === "open" && (
              <Button
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
                onClick={() => handleStatusChange(ticket.id, "in_progress")}
                data-ocid="helpdesk.inprogress_button"
              >
                {t("helpdesk.startProcessing") || "İşleme Al"}
              </Button>
            )}
            {ticket.status === "in_progress" && (
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => handleStatusChange(ticket.id, "resolved")}
                data-ocid="helpdesk.resolve_button"
              >
                {t("helpdesk.resolve") || "Çözüldü İşaretle"}
              </Button>
            )}
            {ticket.status === "resolved" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange(ticket.id, "closed")}
                data-ocid="helpdesk.close_button"
              >
                {t("helpdesk.close") || "Kapat"}
              </Button>
            )}
          </div>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-4">
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
            <p className="text-slate-500 text-xs mt-3">
              {new Date(ticket.createdAt).toLocaleString("tr-TR")}
            </p>
          </CardContent>
        </Card>

        {/* Responses */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            {t("helpdesk.responses") || "Yanıtlar"} ({ticket.responses.length})
          </h3>
          {ticket.responses.length === 0 && (
            <p className="text-slate-500 text-sm">
              {t("helpdesk.noResponses") || "Henüz yanıt yok."}
            </p>
          )}
          {ticket.responses.map((resp, idx) => (
            <div
              key={resp.id}
              className={`rounded-lg p-4 border ${
                resp.isInternal
                  ? "bg-yellow-950 border-yellow-800"
                  : "bg-slate-800 border-slate-700"
              }`}
              data-ocid={`helpdesk.response.item.${idx + 1}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-white text-sm font-medium">
                    {resp.author}
                  </span>
                  {resp.isInternal && (
                    <span className="text-xs bg-yellow-500 text-black px-1.5 py-0.5 rounded">
                      {t("helpdesk.internal") || "Dahili"}
                    </span>
                  )}
                </div>
                <span className="text-slate-500 text-xs">
                  {new Date(resp.createdAt).toLocaleString("tr-TR")}
                </span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {resp.content}
              </p>
            </div>
          ))}
        </div>

        {/* Add response */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm">
              {t("helpdesk.addResponse") || "Yanıt Ekle"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              placeholder={
                t("helpdesk.responsePlaceholder") || "Yanıtınızı yazın..."
              }
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[80px]"
              data-ocid="helpdesk.response_textarea"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded"
                  data-ocid="helpdesk.internal_checkbox"
                />
                {t("helpdesk.internalNote") || "Dahili not"}
              </label>
              <Button
                size="sm"
                onClick={handleAddResponse}
                disabled={!responseContent.trim()}
                className="bg-blue-600 hover:bg-blue-700"
                data-ocid="helpdesk.send_response_button"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {t("helpdesk.send") || "Gönder"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {t("helpdesk.title") || "Yardım Masası"}
            </h1>
            <p className="text-slate-400 text-sm">
              {t("helpdesk.subtitle") ||
                "Destek talepleri ve müşteri sorunları"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
          data-ocid="helpdesk.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("helpdesk.newTicket") || "Yeni Talep"}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">
                  {t("helpdesk.totalOpen") || "Açık Talepler"}
                </p>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {totalOpen}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">
                  {t("helpdesk.inProgress") || "İşlemdeki"}
                </p>
                <p className="text-2xl font-bold text-yellow-400 mt-1">
                  {totalInProgress}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">
                  {t("helpdesk.resolvedToday") || "Bugün Çözülen"}
                </p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {resolvedToday}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">
                  {t("helpdesk.avgResolution") || "Ort. Çözüm (sa)"}
                </p>
                <p className="text-2xl font-bold text-purple-400 mt-1">
                  {avgResolution}
                </p>
              </div>
              <Ticket className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("helpdesk.search") || "Konu veya müşteri ara..."}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            data-ocid="helpdesk.search_input"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger
            className="w-36 bg-slate-800 border-slate-700 text-white"
            data-ocid="helpdesk.status_select"
          >
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              Tüm Durumlar
            </SelectItem>
            <SelectItem value="open" className="text-white">
              Açık
            </SelectItem>
            <SelectItem value="in_progress" className="text-white">
              İşlemde
            </SelectItem>
            <SelectItem value="resolved" className="text-white">
              Çözüldü
            </SelectItem>
            <SelectItem value="closed" className="text-white">
              Kapalı
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger
            className="w-36 bg-slate-800 border-slate-700 text-white"
            data-ocid="helpdesk.priority_select"
          >
            <SelectValue placeholder="Öncelik" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              Tüm Öncelikler
            </SelectItem>
            <SelectItem value="low" className="text-white">
              Düşük
            </SelectItem>
            <SelectItem value="medium" className="text-white">
              Orta
            </SelectItem>
            <SelectItem value="high" className="text-white">
              Yüksek
            </SelectItem>
            <SelectItem value="critical" className="text-white">
              Kritik
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger
            className="w-36 bg-slate-800 border-slate-700 text-white"
            data-ocid="helpdesk.category_select"
          >
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              Tüm Kategoriler
            </SelectItem>
            <SelectItem value="technical" className="text-white">
              Teknik
            </SelectItem>
            <SelectItem value="billing" className="text-white">
              Faturalama
            </SelectItem>
            <SelectItem value="general" className="text-white">
              Genel
            </SelectItem>
            <SelectItem value="other" className="text-white">
              Diğer
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" data-ocid="helpdesk.empty_state">
          <Headphones className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            {t("helpdesk.noTickets") || "Henüz destek talebi yok"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket, idx) => {
            const pCfg = priorityConfig[ticket.priority];
            const sCfg = statusConfig[ticket.status];
            const StatusIcon = sCfg.icon;
            return (
              <Card
                key={ticket.id}
                className="bg-slate-800 border-slate-700 hover:border-indigo-500 cursor-pointer transition-all"
                onClick={() => setSelectedTicket(ticket)}
                data-ocid={`helpdesk.item.${idx + 1}`}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-slate-400 text-xs font-mono">
                          {ticket.ticketNo}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sCfg.color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {sCfg.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pCfg.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${pCfg.dot}`}
                          />
                          {pCfg.label}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                          <Tag className="w-3 h-3 inline mr-1" />
                          {categoryLabels[ticket.category]}
                        </span>
                      </div>
                      <p className="text-white font-medium truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-slate-400 text-sm mt-0.5">
                        {ticket.customerName} &bull;{" "}
                        {t("helpdesk.assignedTo") || "Atanan"}:{" "}
                        {ticket.assignedTo}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <MessageSquare className="w-3 h-3" />
                        {ticket.responses.length}
                      </div>
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(ticket.createdAt).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create ticket modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent
          className="bg-slate-800 border-slate-700 text-white max-w-lg"
          data-ocid="helpdesk.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("helpdesk.newTicket") || "Yeni Destek Talebi"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-sm">
                {t("helpdesk.customer") || "Müşteri"}
              </Label>
              {customers.length > 0 ? (
                <Select
                  value={form.customerId}
                  onValueChange={(v) => {
                    const c = customers.find((c) => c.id === v);
                    setForm({
                      ...form,
                      customerId: v,
                      customerName: c?.name || v,
                    });
                  }}
                >
                  <SelectTrigger
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                    data-ocid="helpdesk.customer_select"
                  >
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
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
                  value={form.customerName}
                  onChange={(e) =>
                    setForm({ ...form, customerName: e.target.value })
                  }
                  placeholder="Müşteri adı"
                  className="mt-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  data-ocid="helpdesk.customer_input"
                />
              )}
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("helpdesk.subject") || "Konu"} *
              </Label>
              <Input
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Talep konusu"
                className="mt-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                data-ocid="helpdesk.subject_input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("helpdesk.category") || "Kategori"}
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      category: v as HelpDeskTicket["category"],
                    })
                  }
                >
                  <SelectTrigger
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                    data-ocid="helpdesk.form_category_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="technical" className="text-white">
                      Teknik
                    </SelectItem>
                    <SelectItem value="billing" className="text-white">
                      Faturalama
                    </SelectItem>
                    <SelectItem value="general" className="text-white">
                      Genel
                    </SelectItem>
                    <SelectItem value="other" className="text-white">
                      Diğer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("helpdesk.priority") || "Öncelik"}
                </Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      priority: v as HelpDeskTicket["priority"],
                    })
                  }
                >
                  <SelectTrigger
                    className="mt-1 bg-slate-700 border-slate-600 text-white"
                    data-ocid="helpdesk.form_priority_select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="low" className="text-white">
                      Düşük
                    </SelectItem>
                    <SelectItem value="medium" className="text-white">
                      Orta
                    </SelectItem>
                    <SelectItem value="high" className="text-white">
                      Yüksek
                    </SelectItem>
                    <SelectItem value="critical" className="text-white">
                      Kritik
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("helpdesk.assignedTo") || "Atanan Kişi"}
              </Label>
              <Input
                value={form.assignedTo}
                onChange={(e) =>
                  setForm({ ...form, assignedTo: e.target.value })
                }
                placeholder={currentUserName || "Atanacak kişi"}
                className="mt-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                data-ocid="helpdesk.assigned_input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("helpdesk.description") || "Açıklama"} *
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Sorunu detaylıca açıklayın..."
                className="mt-1 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
                data-ocid="helpdesk.description_textarea"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              data-ocid="helpdesk.cancel_button"
            >
              {t("common.cancel") || "İptal"}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.subject || !form.description}
              className="bg-indigo-600 hover:bg-indigo-700"
              data-ocid="helpdesk.submit_button"
            >
              {t("helpdesk.create") || "Oluştur"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
