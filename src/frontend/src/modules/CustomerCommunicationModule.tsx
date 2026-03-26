import {
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

type CommType = "call" | "email" | "meeting" | "note";
type CommDirection = "inbound" | "outbound" | "na";

interface CommRecord {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  type: CommType;
  direction: CommDirection;
  subject: string;
  date: string;
  duration?: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

interface CRMCustomer {
  id: string;
  name: string;
}

const TYPE_CONFIG: Record<
  CommType,
  { icon: React.ReactNode; color: string; badgeClass: string }
> = {
  call: {
    icon: <Phone className="w-4 h-4" />,
    color: "text-green-400",
    badgeClass: "bg-green-900/40 text-green-300 border-green-700",
  },
  email: {
    icon: <Mail className="w-4 h-4" />,
    color: "text-blue-400",
    badgeClass: "bg-blue-900/40 text-blue-300 border-blue-700",
  },
  meeting: {
    icon: <Users className="w-4 h-4" />,
    color: "text-purple-400",
    badgeClass: "bg-purple-900/40 text-purple-300 border-purple-700",
  },
  note: {
    icon: <FileText className="w-4 h-4" />,
    color: "text-amber-400",
    badgeClass: "bg-amber-900/40 text-amber-300 border-amber-700",
  },
};

const EMPTY_FORM = {
  customerId: "",
  customerName: "",
  type: "call" as CommType,
  direction: "outbound" as CommDirection,
  subject: "",
  date: new Date().toISOString().slice(0, 10),
  duration: "" as string | number,
  notes: "",
};

export default function CustomerCommunicationModule() {
  const { t } = useLanguage();
  const { company, user } = useAuth();
  const currentCompany = company;
  const currentUser = user;
  const companyId = currentCompany?.id ?? "";

  const storageKey = `erpverse_customer_comm_${companyId}`;
  const crmKey = `erpverse_crm_customers_${companyId}`;

  const [records, setRecords] = useState<CommRecord[]>([]);
  const [customers, setCustomers] = useState<CRMCustomer[]>([]);
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) setRecords(JSON.parse(raw));
    const crmRaw = localStorage.getItem(crmKey);
    if (crmRaw) setCustomers(JSON.parse(crmRaw));
  }, [storageKey, crmKey]);

  const save = (updated: CommRecord[]) => {
    setRecords(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (r: CommRecord) => {
    setEditingId(r.id);
    setForm({
      customerId: r.customerId,
      customerName: r.customerName,
      type: r.type,
      direction: r.direction,
      subject: r.subject,
      date: r.date,
      duration: r.duration ?? "",
      notes: r.notes,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.customerId || !form.subject || !form.date) return;
    const now = new Date().toISOString();
    if (editingId) {
      save(
        records.map((r) =>
          r.id === editingId
            ? {
                ...r,
                ...form,
                duration:
                  form.duration !== "" ? Number(form.duration) : undefined,
              }
            : r,
        ),
      );
    } else {
      const newRecord: CommRecord = {
        id: crypto.randomUUID(),
        companyId,
        customerId: form.customerId,
        customerName: form.customerName,
        type: form.type,
        direction: form.direction,
        subject: form.subject,
        date: form.date,
        duration: form.duration !== "" ? Number(form.duration) : undefined,
        notes: form.notes,
        createdBy: currentUser?.displayName ?? "",
        createdAt: now,
      };
      save([newRecord, ...records]);
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(t("comm.deleteConfirm"))) return;
    save(records.filter((r) => r.id !== id));
  };

  const handleCustomerChange = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    setForm((f) => ({
      ...f,
      customerId: custId,
      customerName: cust?.name ?? "",
    }));
  };

  const filtered = records
    .filter((r) => filterCustomer === "all" || r.customerId === filterCustomer)
    .filter((r) => filterType === "all" || r.type === filterType)
    .sort((a, b) => b.date.localeCompare(a.date));

  const showDuration = form.type === "call" || form.type === "meeting";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-900/40 text-teal-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">
              {t("comm.title")}
            </h1>
            <p className="text-sm text-slate-400">{t("comm.subtitle")}</p>
          </div>
        </div>
        <Button
          onClick={openNew}
          className="bg-teal-600 hover:bg-teal-700 text-white"
          data-ocid="comm.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("comm.new")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterCustomer} onValueChange={setFilterCustomer}>
          <SelectTrigger
            className="w-52 bg-slate-800 border-slate-700 text-white"
            data-ocid="comm.select"
          >
            <SelectValue placeholder={t("comm.filterCustomer")} />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              {t("comm.filterAll")}
            </SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id} className="text-white">
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger
            className="w-44 bg-slate-800 border-slate-700 text-white"
            data-ocid="comm.tab"
          >
            <SelectValue placeholder={t("comm.type")} />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              {t("comm.filterAll")}
            </SelectItem>
            {(["call", "email", "meeting", "note"] as CommType[]).map((tp) => (
              <SelectItem key={tp} value={tp} className="text-white">
                {t(`comm.type.${tp}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="comm.empty_state"
        >
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("comm.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="comm.list">
          {filtered.map((r, idx) => {
            const cfg = TYPE_CONFIG[r.type];
            return (
              <div
                key={r.id}
                className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 flex items-start justify-between gap-4"
                data-ocid={`comm.item.${idx + 1}`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white truncate">
                        {r.subject}
                      </span>
                      <Badge className={`text-xs ${cfg.badgeClass}`}>
                        {t(`comm.type.${r.type}`)}
                      </Badge>
                      <Badge className="text-xs bg-slate-700 text-slate-300 border-slate-600">
                        {t(`comm.direction.${r.direction}`)}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {r.customerName} · {r.date}
                      {r.duration ? ` · ${r.duration} dk` : ""}
                    </div>
                    {r.notes && (
                      <p className="text-sm text-slate-300 mt-1 line-clamp-2">
                        {r.notes}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {t("comm.createdBy")}: {r.createdBy}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(r)}
                    className="text-slate-400 hover:text-white"
                    data-ocid={`comm.edit_button.${idx + 1}`}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(r.id)}
                    className="text-red-400 hover:text-red-300"
                    data-ocid={`comm.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-slate-900 border-slate-700 text-white max-w-lg"
          data-ocid="comm.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("comm.edit") : t("comm.new")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300">{t("comm.customer")}</Label>
              <Select
                value={form.customerId}
                onValueChange={handleCustomerChange}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue placeholder={t("comm.selectCustomer")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-white">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("comm.type")}</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, type: v as CommType }))
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {(["call", "email", "meeting", "note"] as CommType[]).map(
                      (tp) => (
                        <SelectItem key={tp} value={tp} className="text-white">
                          {t(`comm.type.${tp}`)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">{t("comm.direction")}</Label>
                <Select
                  value={form.direction}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, direction: v as CommDirection }))
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {(["inbound", "outbound", "na"] as CommDirection[]).map(
                      (d) => (
                        <SelectItem key={d} value={d} className="text-white">
                          {t(`comm.direction.${d}`)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">{t("comm.subject")}</Label>
              <Input
                className="bg-slate-800 border-slate-600 text-white mt-1"
                placeholder={t("comm.subjectPlaceholder")}
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                data-ocid="comm.input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("comm.date")}</Label>
                <Input
                  type="date"
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>
              {showDuration && (
                <div>
                  <Label className="text-slate-300">{t("comm.duration")}</Label>
                  <Input
                    type="number"
                    min={0}
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    value={form.duration}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, duration: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>

            <div>
              <Label className="text-slate-300">{t("comm.notes")}</Label>
              <Textarea
                className="bg-slate-800 border-slate-600 text-white mt-1 resize-none"
                rows={3}
                placeholder={t("comm.notesPlaceholder")}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                data-ocid="comm.textarea"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="text-slate-400"
                data-ocid="comm.cancel_button"
              >
                {t("general.cancel")}
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-teal-600 hover:bg-teal-700 text-white"
                data-ocid="comm.submit_button"
              >
                {editingId ? t("general.save") : t("comm.new")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
