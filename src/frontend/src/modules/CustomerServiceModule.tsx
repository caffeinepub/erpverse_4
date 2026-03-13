import { AlertCircle, Edit2, HeadphonesIcon, Plus, Trash2 } from "lucide-react";
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
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Ticket {
  id: string;
  ticketNo: string;
  customerName: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedPersonnel: string;
  createdDate: string;
  resolutionNotes: string;
}

const PRIORITIES = ["Düşük", "Orta", "Yüksek", "Kritik"];
const STATUSES = ["Açık", "İşlemde", "Çözüldü", "Kapalı"];

function isOverdue(ticket: Ticket): boolean {
  if (ticket.status !== "Açık" && ticket.status !== "İşlemde") return false;
  const created = new Date(ticket.createdDate);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 3;
}

export default function CustomerServiceModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";

  const [tickets, setTickets] = useLocalStorage<Ticket[]>(
    `erpverse_cs_${cid}`,
    [],
  );

  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const [form, setForm] = useState({
    customerName: "",
    subject: "",
    description: "",
    priority: "Orta",
    status: "Açık",
    assignedPersonnel: "",
    resolutionNotes: "",
  });

  const resetForm = () => {
    setForm({
      customerName: "",
      subject: "",
      description: "",
      priority: "Orta",
      status: "Açık",
      assignedPersonnel: "",
      resolutionNotes: "",
    });
    setEditId(null);
  };

  const nextTicketNo = () => {
    const nums = tickets.map((t) =>
      Number.parseInt(t.ticketNo.replace("TKT-", ""), 10),
    );
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return `TKT-${String(max + 1).padStart(3, "0")}`;
  };

  const openAdd = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEdit = (tk: Ticket) => {
    setForm({
      customerName: tk.customerName,
      subject: tk.subject,
      description: tk.description,
      priority: tk.priority,
      status: tk.status,
      assignedPersonnel: tk.assignedPersonnel,
      resolutionNotes: tk.resolutionNotes,
    });
    setEditId(tk.id);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.customerName.trim() || !form.subject.trim()) {
      toast.error(t("cs.fieldsRequired"));
      return;
    }
    if (editId) {
      setTickets((prev) =>
        prev.map((tk) => (tk.id === editId ? { ...tk, ...form } : tk)),
      );
      toast.success(t("common.updated"));
    } else {
      const ticket: Ticket = {
        id: Date.now().toString(),
        ticketNo: nextTicketNo(),
        customerName: form.customerName,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        status: form.status,
        assignedPersonnel: form.assignedPersonnel,
        createdDate: new Date().toISOString().slice(0, 10),
        resolutionNotes: form.resolutionNotes,
      };
      setTickets((prev) => [...prev, ticket]);
      toast.success(t("common.added"));
    }
    setShowDialog(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setTickets((prev) => prev.filter((tk) => tk.id !== id));
    toast.success(t("common.deleted"));
  };

  const filtered = tickets.filter(
    (tk) =>
      (filterStatus === "all" || tk.status === filterStatus) &&
      (filterPriority === "all" || tk.priority === filterPriority),
  );

  const priorityColor = (p: string) => {
    if (p === "Kritik") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (p === "Yüksek")
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (p === "Orta")
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const statusColor = (s: string) => {
    if (s === "Çözüldü" || s === "Kapalı")
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "İşlemde")
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const openCount = tickets.filter(
    (tk) => tk.status === "Açık" || tk.status === "İşlemde",
  ).length;
  const overdueCount = tickets.filter(isOverdue).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <HeadphonesIcon className="w-6 h-6 text-sky-400" />
            {t("modules.CustomerService")}
          </h2>
          <div className="flex gap-4 mt-1">
            <p className="text-slate-400 text-sm">
              {t("cs.totalTickets")}: {tickets.length}
            </p>
            <p className="text-blue-400 text-sm">
              {t("cs.openTickets")}: {openCount}
            </p>
            {overdueCount > 0 && (
              <p className="text-red-400 text-sm flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t("cs.overdue")}: {overdueCount}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={openAdd}
          className="bg-sky-600 hover:bg-sky-700 text-white"
          data-ocid="cs.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("cs.addTicket")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger
            className="w-44 bg-slate-800 border-white/10 text-white"
            data-ocid="cs.select"
          >
            <SelectValue placeholder={t("cs.filterStatus")} />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/10">
            <SelectItem value="all" className="text-white">
              {t("common.all")}
            </SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-white">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger
            className="w-44 bg-slate-800 border-white/10 text-white"
            data-ocid="cs.priority.select"
          >
            <SelectValue placeholder={t("cs.filterPriority")} />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/10">
            <SelectItem value="all" className="text-white">
              {t("common.all")}
            </SelectItem>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p} className="text-white">
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="cs.empty_state"
        >
          <HeadphonesIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("cs.noTickets")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400">
                  {t("cs.ticketNo")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("cs.customerName")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("cs.subject")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("cs.priority")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("cs.status")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("cs.createdDate")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("cs.assignedPersonnel")}
                </TableHead>
                <TableHead className="text-slate-400 text-right">
                  {t("common.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tk, idx) => (
                <TableRow
                  key={tk.id}
                  className="border-white/10 hover:bg-white/5"
                  data-ocid={`cs.row.${idx + 1}`}
                >
                  <TableCell className="text-white font-mono text-sm">
                    <div className="flex items-center gap-2">
                      {tk.ticketNo}
                      {isOverdue(tk) && (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 border text-xs px-1 py-0">
                          {t("cs.overdueLabel")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {tk.customerName}
                  </TableCell>
                  <TableCell className="text-slate-300 max-w-[200px] truncate">
                    {tk.subject}
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${priorityColor(tk.priority)}`}>
                      {tk.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${statusColor(tk.status)}`}>
                      {tk.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {tk.createdDate}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {tk.assignedPersonnel || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(tk)}
                        className="text-slate-400 hover:text-blue-400 h-8 w-8"
                        data-ocid={`cs.edit_button.${idx + 1}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tk.id)}
                        className="text-slate-400 hover:text-red-400 h-8 w-8"
                        data-ocid={`cs.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-lg"
          data-ocid="cs.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {editId ? t("cs.editTicket") : t("cs.addTicket")}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="col-span-2">
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cs.customerName")} *
              </Label>
              <Input
                value={form.customerName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, customerName: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="cs.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cs.subject")} *
              </Label>
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm((p) => ({ ...p, subject: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="cs.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cs.description")}
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white resize-none"
                rows={2}
                data-ocid="cs.textarea"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cs.priority")}
              </Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}
              >
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white"
                  data-ocid="cs.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-white/10">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="text-white">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cs.status")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white"
                  data-ocid="cs.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-white/10">
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="text-white">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cs.assignedPersonnel")}
              </Label>
              <Input
                value={form.assignedPersonnel}
                onChange={(e) =>
                  setForm((p) => ({ ...p, assignedPersonnel: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white"
                data-ocid="cs.input"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("cs.resolution")}
              </Label>
              <Textarea
                value={form.resolutionNotes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, resolutionNotes: e.target.value }))
                }
                className="bg-slate-700 border-white/10 text-white resize-none"
                rows={2}
                data-ocid="cs.textarea"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
              className="text-slate-400"
              data-ocid="cs.cancel_button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              className="bg-sky-600 hover:bg-sky-700 text-white"
              data-ocid="cs.submit_button"
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
