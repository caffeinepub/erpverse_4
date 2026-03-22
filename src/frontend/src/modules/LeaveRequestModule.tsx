import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { CalendarCheck, CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Beklemede" | "Onaylandı" | "Reddedildi";
  rejectionNote?: string;
  createdAt: string;
}

interface Props {
  companyId: string;
  userId: string;
  userRole: string;
}

export default function LeaveRequestModule({ companyId }: Props) {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState("Tümü");
  const [filterType, setFilterType] = useState("Tümü");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState("");

  const storageKey = `hr_leave_requests_${companyId}`;

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setRequests(JSON.parse(raw));
      } catch {
        setRequests([]);
      }
    }
  }, [storageKey]);

  const save = (updated: LeaveRequest[]) => {
    setRequests(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const handleApprove = (id: string) => {
    const updated = requests.map((r) =>
      r.id === id ? { ...r, status: "Onaylandı" as const } : r,
    );
    save(updated);
    toast.success(t("leaveRequests.approved"));
  };

  const handleReject = (id: string) => {
    const updated = requests.map((r) =>
      r.id === id ? { ...r, status: "Reddedildi" as const, rejectionNote } : r,
    );
    save(updated);
    setRejectingId(null);
    setRejectionNote("");
    toast.success(t("leaveRequests.rejected"));
  };

  const leaveTypes = [
    t("leaveRequests.annual"),
    t("leaveRequests.sick"),
    t("leaveRequests.excuse"),
    t("leaveRequests.unpaid"),
    t("leaveRequests.parental"),
  ];

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const pendingCount = requests.filter((r) => r.status === "Beklemede").length;
  const approvedThisMonth = requests.filter(
    (r) => r.status === "Onaylandı" && r.createdAt.startsWith(thisMonth),
  ).length;
  const rejectedThisMonth = requests.filter(
    (r) => r.status === "Reddedildi" && r.createdAt.startsWith(thisMonth),
  ).length;

  const filtered = requests.filter((r) => {
    const statusMatch = filterStatus === "Tümü" || r.status === filterStatus;
    const typeMatch = filterType === "Tümü" || r.leaveType === filterType;
    return statusMatch && typeMatch;
  });

  const statusBadge = (status: string) => {
    if (status === "Beklemede")
      return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
          {t("leaveRequests.pending")}
        </Badge>
      );
    if (status === "Onaylandı")
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          {t("leaveRequests.approved")}
        </Badge>
      );
    return (
      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
        {t("leaveRequests.rejected")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-ocid="leaverequests.section">
      <div className="flex items-center gap-3">
        <CalendarCheck className="w-7 h-7 text-teal-400" />
        <div>
          <h2 className="text-white text-xl font-bold">
            {t("leaveRequests.title")}
          </h2>
          <p className="text-slate-400 text-sm">
            {t("leaveRequests.manageSubtitle")}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4"
          data-ocid="leaverequests.pending.card"
        >
          <Clock className="w-8 h-8 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-400 text-2xl font-bold">{pendingCount}</p>
            <p className="text-slate-400 text-sm">
              {t("leaveRequests.pendingTotal")}
            </p>
          </div>
        </div>
        <div
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4"
          data-ocid="leaverequests.approved.card"
        >
          <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-emerald-400 text-2xl font-bold">
              {approvedThisMonth}
            </p>
            <p className="text-slate-400 text-sm">
              {t("leaveRequests.approvedMonth")}
            </p>
          </div>
        </div>
        <div
          className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-4"
          data-ocid="leaverequests.rejected.card"
        >
          <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 text-2xl font-bold">
              {rejectedThisMonth}
            </p>
            <p className="text-slate-400 text-sm">
              {t("leaveRequests.rejectedMonth")}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger
            className="w-44 bg-slate-800 border-white/10 text-white"
            data-ocid="leaverequests.status.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/10">
            <SelectItem value="Tümü" className="text-white focus:bg-white/10">
              {t("leaveRequests.all")}
            </SelectItem>
            <SelectItem
              value="Beklemede"
              className="text-white focus:bg-white/10"
            >
              {t("leaveRequests.pending")}
            </SelectItem>
            <SelectItem
              value="Onaylandı"
              className="text-white focus:bg-white/10"
            >
              {t("leaveRequests.approved")}
            </SelectItem>
            <SelectItem
              value="Reddedildi"
              className="text-white focus:bg-white/10"
            >
              {t("leaveRequests.rejected")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger
            className="w-52 bg-slate-800 border-white/10 text-white"
            data-ocid="leaverequests.type.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/10">
            <SelectItem value="Tümü" className="text-white focus:bg-white/10">
              {t("leaveRequests.allTypes")}
            </SelectItem>
            {leaveTypes.map((lt) => (
              <SelectItem
                key={lt}
                value={lt}
                className="text-white focus:bg-white/10"
              >
                {lt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="leaverequests.empty_state"
        >
          <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("leaveRequests.empty")}</p>
        </div>
      ) : (
        <div
          className="rounded-xl border border-white/10 overflow-hidden"
          data-ocid="leaverequests.table"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-400">
                  {t("leaveRequests.employee")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("leaveRequests.leaveType")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("leaveRequests.startDate")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("leaveRequests.endDate")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("leaveRequests.days")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("leaveRequests.reason")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("leaveRequests.statusLabel")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("leaveRequests.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req, idx) => (
                <>
                  <TableRow
                    key={req.id}
                    className="border-white/10 hover:bg-white/5"
                    data-ocid={`leaverequests.item.${idx + 1}`}
                  >
                    <TableCell className="text-white font-medium">
                      {req.employeeName}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {req.leaveType}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {req.startDate}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {req.endDate}
                    </TableCell>
                    <TableCell className="text-slate-300">{req.days}</TableCell>
                    <TableCell className="text-slate-400 max-w-[160px] truncate">
                      {req.reason}
                    </TableCell>
                    <TableCell>{statusBadge(req.status)}</TableCell>
                    <TableCell>
                      {req.status === "Beklemede" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white"
                            onClick={() => handleApprove(req.id)}
                            data-ocid={`leaverequests.approve.button.${idx + 1}`}
                          >
                            {t("leaveRequests.approve")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setRejectingId(req.id);
                              setRejectionNote("");
                            }}
                            data-ocid={`leaverequests.reject.button.${idx + 1}`}
                          >
                            {t("leaveRequests.reject")}
                          </Button>
                        </div>
                      )}
                      {req.status === "Reddedildi" && req.rejectionNote && (
                        <span className="text-red-400 text-xs">
                          {req.rejectionNote}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  {rejectingId === req.id && (
                    <TableRow
                      key={`reject-${req.id}`}
                      className="border-white/10 bg-red-500/5"
                    >
                      <TableCell colSpan={8}>
                        <div className="flex items-center gap-3 py-1">
                          <Input
                            placeholder={t("leaveRequests.rejectionNote")}
                            value={rejectionNote}
                            onChange={(e) => setRejectionNote(e.target.value)}
                            className="bg-slate-800 border-white/20 text-white flex-1"
                            data-ocid="leaverequests.rejection_note.input"
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(req.id)}
                            data-ocid="leaverequests.confirm_reject.button"
                          >
                            {t("leaveRequests.confirmReject")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-slate-400"
                            onClick={() => setRejectingId(null)}
                            data-ocid="leaverequests.cancel_reject.button"
                          >
                            {t("leaveRequests.cancel")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
