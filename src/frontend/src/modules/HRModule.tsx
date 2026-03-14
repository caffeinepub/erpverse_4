import {
  Trash2 as HRTrash2,
  Plus,
  Search,
  Target,
  TrendingUp,
  Users2,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type EmployeeStatus = "active" | "onLeave" | "terminated";

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  status: EmployeeStatus;
  email: string;
  salary?: number;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annual: { total: number; used: number };
  sick: { total: number; used: number };
}

type LeaveType = "annual" | "sick" | "maternity" | "unpaid" | "other";

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  onLeave: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  terminated: "bg-red-500/20 text-red-300 border-red-500/30",
};

interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  goals: string;
  score: number;
  comment: string;
  reviewedAt: string;
}

function scoreColor(score: number): string {
  if (score <= 2) return "bg-red-500/20 text-red-300 border-red-500/30";
  if (score === 3) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
}

function PerformanceTab({
  employees,
  companyId,
  t,
}: {
  employees: { id: string; name: string }[];
  companyId: string;
  t: (key: string) => string;
}) {
  const [reviews, setReviews] = useLocalStorage<PerformanceReview[]>(
    `erpverse_performance_${companyId}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    period: "",
    goals: "",
    score: "3",
    comment: "",
  });

  const saveReview = () => {
    if (!form.employeeId || !form.period) return;
    const emp = employees.find((e) => e.id === form.employeeId);
    setReviews((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        employeeId: form.employeeId,
        employeeName: emp?.name || "",
        period: form.period,
        goals: form.goals,
        score: Number(form.score),
        comment: form.comment,
        reviewedAt: new Date().toISOString().slice(0, 10),
      },
    ]);
    setForm({ employeeId: "", period: "", goals: "", score: "3", comment: "" });
    setShowDialog(false);
  };

  const avgScore = reviews.length
    ? (reviews.reduce((s, r) => s + r.score, 0) / reviews.length).toFixed(1)
    : "—";

  const topReview = reviews.reduce<PerformanceReview | null>(
    (best, r) => (!best || r.score > best.score ? r : best),
    null,
  );

  return (
    <div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">{t("hr.avgScore")}</p>
          <p className="text-3xl font-bold text-purple-300">{avgScore}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">{t("hr.reviewCount")}</p>
          <p className="text-3xl font-bold text-blue-300">{reviews.length}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-slate-400 text-xs mb-1">{t("hr.topPerformer")}</p>
          <p className="text-lg font-bold text-emerald-300 truncate">
            {topReview?.employeeName || "—"}
          </p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setShowDialog(true)}
          data-ocid="hr.performance.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("hr.addReview")}
        </Button>
      </div>

      {reviews.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="hr.performance.empty_state"
        >
          <Users2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t("hr.reviewEmpty")}</p>
        </div>
      ) : (
        <div
          className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
          data-ocid="hr.performance.table"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("hr.employee")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("hr.period")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("hr.score")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("hr.goals")}
                </th>
                <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                  {t("hr.comment")}
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r, i) => (
                <tr
                  key={r.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/2"
                  data-ocid={`hr.performance.row.${i + 1}`}
                >
                  <td className="px-5 py-3 text-white text-sm font-medium">
                    {r.employeeName}
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">
                    {r.period}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${scoreColor(r.score)}`}
                    >
                      {"★".repeat(r.score)}
                      {"☆".repeat(5 - r.score)} {r.score}/5
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm max-w-xs truncate">
                    {r.goals}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-sm max-w-xs truncate">
                    {r.comment}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="hr.performance.dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("hr.addReview")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-slate-300 text-sm">
                {t("hr.employee")}
              </Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm((p) => ({ ...p, employeeId: v }))}
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white mt-1"
                  data-ocid="hr.performance.employee.select"
                >
                  <SelectValue placeholder={t("hr.employee")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-white">
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">{t("hr.period")}</Label>
              <Input
                value={form.period}
                onChange={(e) =>
                  setForm((p) => ({ ...p, period: e.target.value }))
                }
                placeholder="2025 Q1"
                className="bg-white/10 border-white/20 text-white mt-1"
                data-ocid="hr.performance.period.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">{t("hr.goals")}</Label>
              <Textarea
                value={form.goals}
                onChange={(e) =>
                  setForm((p) => ({ ...p, goals: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white mt-1"
                rows={2}
                data-ocid="hr.performance.goals.textarea"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("hr.score")} (1-5)
              </Label>
              <Select
                value={form.score}
                onValueChange={(v) => setForm((p) => ({ ...p, score: v }))}
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white mt-1"
                  data-ocid="hr.performance.score.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem
                      key={n}
                      value={String(n)}
                      className="text-white"
                    >
                      {"★".repeat(n)} {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("hr.comment")}
              </Label>
              <Textarea
                value={form.comment}
                onChange={(e) =>
                  setForm((p) => ({ ...p, comment: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white mt-1"
                rows={2}
                data-ocid="hr.performance.comment.textarea"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="hr.performance.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={saveReview}
                data-ocid="hr.performance.save_button"
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

function LeaveManagementTab({
  employees,
  companyId,
  t,
  addNotification,
  addLog,
  isManagerOrOwner,
}: {
  employees: { id: string; name: string }[];
  companyId: string;
  t: (key: string) => string;
  addNotification: (n: {
    type: "approval_required" | "stock_alert" | "leave_request" | "info";
    title: string;
    message: string;
    companyId: string;
    targetRole?: "owner" | "manager" | "all";
  }) => void;
  addLog: (l: { action: string; module: string; detail: string }) => void;
  isManagerOrOwner: boolean;
}) {
  const [leaveBalances, setLeaveBalances] = useLocalStorage<LeaveBalance[]>(
    `hr_leave_balances_${companyId}`,
    [],
  );
  const [leaveRequests, setLeaveRequests] = useLocalStorage<
    {
      id: string;
      employeeId: string;
      employeeName: string;
      leaveType: LeaveType;
      startDate: string;
      endDate: string;
      days: number;
      reason: string;
      status: "Bekliyor" | "Onaylandı" | "Reddedildi";
      createdAt: string;
    }[]
  >(`hr_leave_requests_${companyId}`, []);

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    leaveType: "annual" as LeaveType,
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Ensure all employees have a balance entry
  const balancesWithAll = employees.map((emp) => {
    const existing = leaveBalances.find((b) => b.employeeId === emp.id);
    if (existing) return existing;
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      annual: { total: 15, used: 0 },
      sick: { total: 10, used: 0 },
    };
  });

  const calcDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff =
      Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0, diff);
  };

  const createLeave = () => {
    if (!form.employeeId || !form.startDate || !form.endDate) return;
    const emp = employees.find((e) => e.id === form.employeeId);
    if (!emp) return;
    const days = calcDays(form.startDate, form.endDate);
    const req = {
      id: Date.now().toString(),
      employeeId: form.employeeId,
      employeeName: emp.name,
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      days,
      reason: form.reason,
      status: "Bekliyor" as const,
      createdAt: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [req, ...prev]);
    addNotification({
      type: "leave_request",
      title: t("hr.createLeave"),
      message: `${emp.name} - ${days} ${t("hr.daysCount")}`,
      companyId,
      targetRole: "manager",
    });
    addLog({
      action: t("hr.createLeave"),
      module: "HR",
      detail: `${emp.name} ${form.startDate} - ${form.endDate}`,
    });
    setForm({
      employeeId: "",
      leaveType: "annual",
      startDate: "",
      endDate: "",
      reason: "",
    });
    setShowDialog(false);
  };

  const approveLeave = (id: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;
    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "Onaylandı" as const } : r,
      ),
    );
    // Deduct from balance
    const bal = balancesWithAll.find((b) => b.employeeId === req.employeeId);
    if (bal) {
      const updated = balancesWithAll.map((b) => {
        if (b.employeeId !== req.employeeId) return b;
        const nb = { ...b };
        if (req.leaveType === "annual")
          nb.annual = { ...nb.annual, used: nb.annual.used + req.days };
        else if (req.leaveType === "sick")
          nb.sick = { ...nb.sick, used: nb.sick.used + req.days };
        return nb;
      });
      setLeaveBalances(updated);
    }
    addNotification({
      type: "info",
      title: t("hr.leaveApprove"),
      message: `${req.employeeName} - ${req.days} ${t("hr.daysCount")}`,
      companyId,
      targetRole: "all",
    });
    addLog({
      action: t("hr.leaveApprove"),
      module: "HR",
      detail: `${req.employeeName} ${req.startDate} - ${req.endDate}`,
    });
  };

  const rejectLeave = (id: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;
    setLeaveRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "Reddedildi" as const } : r,
      ),
    );
    addNotification({
      type: "info",
      title: t("hr.leaveReject"),
      message: `${req.employeeName}`,
      companyId,
      targetRole: "all",
    });
    addLog({
      action: t("hr.leaveReject"),
      module: "HR",
      detail: `${req.employeeName}`,
    });
  };

  const leaveTypeLabel: Record<LeaveType, string> = {
    annual: t("hr.leaveAnnual"),
    sick: t("hr.leaveSick"),
    maternity: t("hr.leaveMaternity"),
    unpaid: t("hr.leaveUnpaid"),
    other: t("hr.leaveOther"),
  };

  const statusColors: Record<string, string> = {
    Bekliyor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Onaylandı: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Reddedildi: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  // Build calendar for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return d.toISOString().slice(0, 10);
  });

  const approvedRequests = leaveRequests.filter(
    (r) => r.status === "Onaylandı",
  );

  return (
    <div className="space-y-6">
      {/* Leave Balances */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">
            {t("hr.leaveBalanceTitle")}
          </h3>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setShowDialog(true)}
            data-ocid="hr.leavemgmt.open_modal_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("hr.createLeave")}
          </Button>
        </div>
        {balancesWithAll.length === 0 ? (
          <div
            className="text-center py-8 text-slate-500"
            data-ocid="hr.leavemgmt.empty_state"
          >
            {t("hr.leaveBalanceEmpty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {balancesWithAll.map((bal) => (
              <div
                key={bal.employeeId}
                className="bg-slate-800 rounded-xl border border-white/5 p-4"
              >
                <p className="text-white font-medium text-sm mb-3">
                  {bal.employeeName}
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">
                        {t("hr.leaveAnnual")}
                      </span>
                      <span className="text-emerald-400">
                        {bal.annual.total - bal.annual.used}/{bal.annual.total}{" "}
                        {t("hr.daysCount")}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (bal.annual.used / bal.annual.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">
                        {t("hr.leaveSick")}
                      </span>
                      <span className="text-blue-400">
                        {bal.sick.total - bal.sick.used}/{bal.sick.total}{" "}
                        {t("hr.daysCount")}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (bal.sick.used / bal.sick.total) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Requests List */}
      <div>
        <h3 className="text-white font-semibold mb-3">
          {t("hr.leaveRequests")}
        </h3>
        {leaveRequests.length === 0 ? (
          <div
            className="text-center py-8 text-slate-500"
            data-ocid="hr.leavemgmt.requests.empty_state"
          >
            {t("hr.leaveEmpty")}
          </div>
        ) : (
          <div
            className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
            data-ocid="hr.leavemgmt.table"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("hr.leaveEmployee")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("hr.leaveType")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("hr.leaveStart")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("hr.leaveEnd")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("hr.totalDays")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("hr.leaveStatus")}
                  </th>
                  {isManagerOrOwner && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map((req, i) => (
                  <tr
                    key={req.id}
                    className="border-b border-white/5 last:border-0"
                    data-ocid={`hr.leavemgmt.row.${i + 1}`}
                  >
                    <td className="px-4 py-3 text-white text-sm">
                      {req.employeeName}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {leaveTypeLabel[req.leaveType]}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {req.startDate}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {req.endDate}
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {req.days} {t("hr.daysCount")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusColors[req.status]}`}
                      >
                        {req.status}
                      </Badge>
                    </td>
                    {isManagerOrOwner && req.status === "Bekliyor" && (
                      <td className="px-4 py-3 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs"
                          onClick={() => approveLeave(req.id)}
                          data-ocid={`hr.leavemgmt.approve.${i + 1}`}
                        >
                          {t("hr.leaveApprove")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-7 text-xs"
                          onClick={() => rejectLeave(req.id)}
                          data-ocid={`hr.leavemgmt.reject.${i + 1}`}
                        >
                          {t("hr.leaveReject")}
                        </Button>
                      </td>
                    )}
                    {isManagerOrOwner && req.status !== "Bekliyor" && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Calendar */}
      <div>
        <h3 className="text-white font-semibold mb-3">
          {t("hr.leaveCalendar")} —{" "}
          {now.toLocaleString("default", { month: "long" })} {year}
        </h3>
        <div className="bg-slate-800 rounded-xl border border-white/5 p-4 overflow-x-auto">
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `minmax(120px,1fr) repeat(${daysInMonth}, minmax(28px,1fr))`,
            }}
          >
            {/* Header row */}
            <div className="text-slate-400 text-xs font-medium py-1">
              {t("hr.leaveEmployee")}
            </div>
            {monthDays.map((day) => (
              <div
                key={day}
                className="text-center text-slate-500 text-xs py-1"
              >
                {day.slice(8)}
              </div>
            ))}
            {/* Employee rows */}
            {employees.map((emp) => (
              <>
                <div
                  key={`name-${emp.id}`}
                  className="text-white text-xs py-1 truncate pr-2"
                >
                  {emp.name}
                </div>
                {monthDays.map((day) => {
                  const onLeave = approvedRequests.some(
                    (r) =>
                      r.employeeId === emp.id &&
                      r.startDate <= day &&
                      r.endDate >= day,
                  );
                  return (
                    <div
                      key={`${emp.id}-${day}`}
                      className={`h-6 rounded text-center text-xs leading-6 ${onLeave ? "bg-purple-500/40 text-purple-300" : "bg-slate-700/30"}`}
                    >
                      {onLeave ? "●" : ""}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Create Leave Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="hr.leavemgmt.dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("hr.createLeave")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.leaveEmployee")}
              </Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm((p) => ({ ...p, employeeId: v }))}
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.leavemgmt.employee.select"
                >
                  <SelectValue placeholder={t("hr.leaveEmployee")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-white">
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.leaveType")}
              </Label>
              <Select
                value={form.leaveType}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, leaveType: v as LeaveType }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.leavemgmt.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="annual" className="text-white">
                    {t("hr.leaveAnnual")}
                  </SelectItem>
                  <SelectItem value="sick" className="text-white">
                    {t("hr.leaveSick")}
                  </SelectItem>
                  <SelectItem value="maternity" className="text-white">
                    {t("hr.leaveMaternity")}
                  </SelectItem>
                  <SelectItem value="unpaid" className="text-white">
                    {t("hr.leaveUnpaid")}
                  </SelectItem>
                  <SelectItem value="other" className="text-white">
                    {t("hr.leaveOther")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("hr.leaveStart")}
                </Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.leavemgmt.start.input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("hr.leaveEnd")}
                </Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.leavemgmt.end.input"
                />
              </div>
            </div>
            {form.startDate && form.endDate && (
              <p className="text-purple-400 text-sm">
                {calcDays(form.startDate, form.endDate)} {t("hr.daysCount")}
              </p>
            )}
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.leaveReason")}
              </Label>
              <Textarea
                value={form.reason}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reason: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white resize-none"
                rows={3}
                data-ocid="hr.leavemgmt.reason.textarea"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="hr.leavemgmt.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={createLeave}
                data-ocid="hr.leavemgmt.submit_button"
              >
                {t("hr.createLeave")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface Goal {
  id: string;
  employeeId: string;
  title: string;
  target: number;
  current: number;
  deadline: string;
  status: "ongoing" | "completed" | "overdue";
}

function GoalTrackingTab({
  companyId,
  employees,
  t,
}: {
  companyId: string;
  employees: { id: string; name: string }[];
  t: (k: string) => string;
}) {
  const [goals, setGoals] = useLocalStorage<Goal[]>(
    `erpverse_hr_goals_${companyId}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    title: "",
    target: "",
    current: "",
    deadline: "",
    status: "ongoing" as Goal["status"],
  });

  const handleAdd = () => {
    if (!form.employeeId || !form.title || !form.target) return;
    const g: Goal = {
      id: String(Date.now()),
      employeeId: form.employeeId,
      title: form.title,
      target: Number(form.target),
      current: Number(form.current) || 0,
      deadline: form.deadline,
      status: form.status,
    };
    setGoals((prev) => [...prev, g]);
    setForm({
      employeeId: "",
      title: "",
      target: "",
      current: "",
      deadline: "",
      status: "ongoing",
    });
    setShowDialog(false);
  };

  const handleDelete = (id: string) =>
    setGoals((prev) => prev.filter((g) => g.id !== id));

  const statusColors: Record<Goal["status"], string> = {
    ongoing: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    overdue: "bg-red-500/15 text-red-300 border-red-500/30",
  };

  const empName = (id: string) =>
    employees.find((e) => e.id === id)?.name ?? id;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setShowDialog(true)}
          data-ocid="hr.goals.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("addGoal")}
        </Button>
      </div>
      {goals.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="hr.goals.empty_state"
        >
          <Target className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t("goalTracking")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g, i) => {
            const pct =
              g.target > 0
                ? Math.min(100, Math.round((g.current / g.target) * 100))
                : 0;
            return (
              <div
                key={g.id}
                className="bg-slate-800 rounded-xl p-4 border border-white/5"
                data-ocid={`hr.goals.item.${i + 1}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">{g.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {empName(g.employeeId)}{" "}
                      {g.deadline ? `· ${g.deadline}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${statusColors[g.status]}`}
                    >
                      {t(`goal.status.${g.status}`)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="text-slate-500 hover:text-red-400"
                      data-ocid={`hr.goals.delete_button.${i + 1}`}
                    >
                      <HRTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${g.status === "completed" ? "bg-emerald-500" : g.status === "overdue" ? "bg-red-500" : "bg-purple-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-slate-400 text-xs w-14 text-right">
                    {g.current}/{g.target} ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="hr.goals.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">{t("addGoal")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.employee")}
              </Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm((p) => ({ ...p, employeeId: v }))}
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.goals.employee.select"
                >
                  <SelectValue placeholder="..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-white">
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("goalTitle")}
              </Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="hr.goals.title.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("goalTarget")}
                </Label>
                <Input
                  type="number"
                  value={form.target}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, target: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.goals.target.input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("goalCurrent")}
                </Label>
                <Input
                  type="number"
                  value={form.current}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, current: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.goals.current.input"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("goalDeadline")}
              </Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm((p) => ({ ...p, deadline: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="hr.goals.deadline.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("goalStatus")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as Goal["status"] }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.goals.status.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="ongoing" className="text-white">
                    {t("goal.status.ongoing")}
                  </SelectItem>
                  <SelectItem value="completed" className="text-white">
                    {t("goal.status.completed")}
                  </SelectItem>
                  <SelectItem value="overdue" className="text-white">
                    {t("goal.status.overdue")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              className="text-slate-400"
              onClick={() => setShowDialog(false)}
              data-ocid="hr.goals.cancel_button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleAdd}
              data-ocid="hr.goals.submit_button"
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HRModule() {
  const { t } = useLanguage();
  const { company, membership } = useAuth();
  const companyId = company?.id || "default";
  const { addNotification } = useNotifications();
  const { addLog } = useAuditLog();

  const isManagerOrOwner =
    membership?.roles.some(
      (r) => "CompanyOwner" in r || "CompanyManager" in r,
    ) ?? false;

  const [employees, setEmployees] = useLocalStorage<Employee[]>(
    `erpverse_hr_${companyId}`,
    [],
  );
  const [leaveRequests, setLeaveRequests] = useLocalStorage<LeaveRequest[]>(
    `erpverse_leave_requests_${companyId}`,
    [],
  );

  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    position: "",
    department: "",
    status: "active" as EmployeeStatus,
    email: "",
    salary: "",
  });
  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()),
  );

  const stats = [
    {
      label: t("hr.totalEmployees"),
      value: employees.length,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
    {
      label: t("hr.active"),
      value: employees.filter((e) => e.status === "active").length,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: t("hr.onLeave"),
      value: employees.filter((e) => e.status === "onLeave").length,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  ];

  const openAdd = () => {
    setEditId(null);
    setForm({
      name: "",
      position: "",
      department: "",
      status: "active",
      email: "",
      salary: "",
    });
    setShowDialog(true);
  };

  const openEdit = (emp: Employee) => {
    setEditId(emp.id);
    setForm({
      name: emp.name,
      position: emp.position,
      department: emp.department,
      status: emp.status,
      email: emp.email,
      salary: emp.salary ? String(emp.salary) : "",
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const salary = Number(form.salary) || 0;
    if (editId) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === editId ? { ...e, ...form, salary } : e)),
      );
      addLog({
        action: `${t("hr.employee")} ${t("common.save")}`,
        module: "HR",
        detail: form.name,
      });
    } else {
      const newEmp: Employee = {
        id: Date.now().toString(),
        name: form.name,
        position: form.position,
        department: form.department,
        status: form.status,
        email: form.email,
        salary,
      };
      setEmployees((prev) => [...prev, newEmp]);
      addLog({
        action: t("hr.addEmployee"),
        module: "HR",
        detail: form.name,
      });
      if (salary > 0) {
        const key = `erpverse_accounting_${companyId}`;
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const entry = {
          id: (Date.now() + 1).toString(),
          type: "expense",
          description: `${form.name} - ${t("integration.salaryExpenseDesc")}`,
          amount: salary,
          date: new Date().toISOString().slice(0, 10),
          category: t("integration.salaryCategory"),
        };
        localStorage.setItem(key, JSON.stringify([...existing, entry]));
        toast.success(t("integration.salaryAdded"));
      }
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    if (emp) {
      addLog({
        action: t("personnel.remove"),
        module: "HR",
        detail: emp.name,
      });
    }
  };

  const handleAddLeave = () => {
    if (!leaveForm.employeeId || !leaveForm.startDate || !leaveForm.endDate)
      return;
    const emp = employees.find((e) => e.id === leaveForm.employeeId);
    if (!emp) return;
    const req: LeaveRequest = {
      id: Date.now().toString(),
      employeeId: leaveForm.employeeId,
      employeeName: emp.name,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [...prev, req]);
    addNotification({
      type: "leave_request",
      title: t("approval.leaveRequestTitle"),
      message: `${emp.name} - ${t("approval.leaveRequestMsg")}`,
      companyId,
      targetRole: "manager",
    });
    addLog({
      action: t("hr.addLeaveRequest"),
      module: "HR",
      detail: `${emp.name} ${leaveForm.startDate} - ${leaveForm.endDate}`,
    });
    setLeaveForm({ employeeId: "", startDate: "", endDate: "", reason: "" });
    setShowLeaveDialog(false);
  };

  const handleLeaveApprove = (id: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
    );
    addNotification({
      type: "info",
      title: t("approval.approved"),
      message: `${req.employeeName} - ${t("hr.leaveRequests")}`,
      companyId,
      targetRole: "all",
    });
    addLog({
      action: `${t("approval.approved")} - ${t("hr.leaveRequests")}`,
      module: "HR",
      detail: `${req.employeeName} ${req.startDate} - ${req.endDate}`,
    });
  };

  const handleLeaveReject = (id: string) => {
    const req = leaveRequests.find((r) => r.id === id);
    if (!req) return;
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r)),
    );
    addNotification({
      type: "info",
      title: t("approval.rejected"),
      message: `${req.employeeName} - ${t("hr.leaveRequests")}`,
      companyId,
      targetRole: "all",
    });
    addLog({
      action: `${t("approval.rejected")} - ${t("hr.leaveRequests")}`,
      module: "HR",
      detail: `${req.employeeName} ${req.startDate} - ${req.endDate}`,
    });
  };

  const leaveStatusBadge = (status: LeaveRequest["status"]) => {
    const map = {
      pending: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      rejected: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    const labels = {
      pending: t("hr.leavePending"),
      approved: t("hr.leaveApproved"),
      rejected: t("hr.leaveRejected"),
    };
    return (
      <Badge variant="outline" className={`text-xs ${map[status]}`}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users2 className="w-6 h-6 text-purple-400" />
            {t("hr.title")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {employees.length} {t("hr.employee").toLowerCase()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} border rounded-xl p-4`}>
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="bg-slate-800 border border-white/5 mb-6">
          <TabsTrigger
            value="employees"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            data-ocid="hr.employees.tab"
          >
            {t("hr.title")}
          </TabsTrigger>
          <TabsTrigger
            value="leave"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            data-ocid="hr.leave.tab"
          >
            {t("hr.leaveRequests")}
            {leaveRequests.filter((r) => r.status === "pending").length > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {leaveRequests.filter((r) => r.status === "pending").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="leavemgmt"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            data-ocid="hr.leavemgmt.tab"
          >
            {t("hr.leaveManagement")}
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            data-ocid="hr.performance.tab"
          >
            {t("hr.performance")}
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-slate-400"
            data-ocid="hr.goals.tab"
          >
            {t("goalTracking")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("hr.searchEmployee")}
                className="pl-9 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                data-ocid="hr.search_input"
              />
            </div>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={openAdd}
              data-ocid="hr.add_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("hr.addEmployee")}
            </Button>
          </div>

          <div
            className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
            data-ocid="hr.table"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                    {t("hr.employee")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                    {t("hr.position")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                    {t("hr.department")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                    {t("hr.status")}
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div
                        className="text-center py-12 text-slate-500"
                        data-ocid="hr.empty_state"
                      >
                        <Users2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{t("hr.searchEmployee")}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp, i) => (
                    <tr
                      key={emp.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/2"
                      data-ocid={`hr.row.${i + 1}`}
                    >
                      <td className="px-5 py-3">
                        <p className="text-white font-medium text-sm">
                          {emp.name}
                        </p>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">
                        {emp.position}
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">
                        {emp.department}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[emp.status]}`}
                        >
                          {t(`hr.${emp.status}`)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(emp)}
                          className="text-xs text-slate-400 hover:text-purple-300 mr-3 transition-colors"
                          data-ocid={`hr.edit_button.${i + 1}`}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(emp.id)}
                          className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                          data-ocid={`hr.delete_button.${i + 1}`}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="leave">
          <div className="flex justify-end mb-4">
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setShowLeaveDialog(true)}
              data-ocid="hr.leave.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("hr.addLeaveRequest")}
            </Button>
          </div>

          {leaveRequests.length === 0 ? (
            <div
              className="text-center py-16 text-slate-500"
              data-ocid="hr.leave.empty_state"
            >
              <Users2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>{t("hr.leaveEmpty")}</p>
            </div>
          ) : (
            <div
              className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
              data-ocid="hr.leave.table"
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveEmployee")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveStart")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveEnd")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveReason")}
                    </th>
                    <th className="text-left text-slate-400 text-xs font-medium px-5 py-3">
                      {t("hr.leaveStatus")}
                    </th>
                    {isManagerOrOwner && <th className="px-5 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((req, i) => (
                    <tr
                      key={req.id}
                      className="border-b border-white/5 last:border-0"
                      data-ocid={`hr.leave.row.${i + 1}`}
                    >
                      <td className="px-5 py-3 text-white text-sm font-medium">
                        {req.employeeName}
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">
                        {req.startDate}
                      </td>
                      <td className="px-5 py-3 text-slate-300 text-sm">
                        {req.endDate}
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs">
                        {req.reason}
                      </td>
                      <td className="px-5 py-3">
                        {leaveStatusBadge(req.status)}
                      </td>
                      {isManagerOrOwner && (
                        <td className="px-5 py-3 text-right">
                          {req.status === "pending" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleLeaveApprove(req.id)}
                                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                                data-ocid={`hr.leave.confirm_button.${i + 1}`}
                              >
                                {t("approval.approve")}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLeaveReject(req.id)}
                                className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                data-ocid={`hr.leave.delete_button.${i + 1}`}
                              >
                                {t("approval.reject")}
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance">
          {/* Performance content injected */}
          <PerformanceTab employees={employees} companyId={companyId} t={t} />
        </TabsContent>
        <TabsContent value="leavemgmt">
          <LeaveManagementTab
            employees={employees}
            companyId={companyId}
            t={t}
            addNotification={addNotification}
            addLog={addLog}
            isManagerOrOwner={isManagerOrOwner}
          />
        </TabsContent>
        <TabsContent value="goals">
          <GoalTrackingTab companyId={companyId} employees={employees} t={t} />
        </TabsContent>
      </Tabs>

      {/* Employee Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="hr.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {editId ? t("hr.employee") : t("hr.addEmployee")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.employee")}
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="hr.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.position")}
              </Label>
              <Input
                value={form.position}
                onChange={(e) =>
                  setForm((p) => ({ ...p, position: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.department")}
              </Label>
              <Input
                value={form.department}
                onChange={(e) =>
                  setForm((p) => ({ ...p, department: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.status")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as EmployeeStatus }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="active" className="text-white">
                    {t("hr.active")}
                  </SelectItem>
                  <SelectItem value="onLeave" className="text-white">
                    {t("hr.onLeave")}
                  </SelectItem>
                  <SelectItem value="terminated" className="text-white">
                    {t("hr.terminated")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.salary")}
              </Label>
              <Input
                type="number"
                value={form.salary}
                onChange={(e) =>
                  setForm((p) => ({ ...p, salary: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                placeholder="0"
                data-ocid="hr.salary_input"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="hr.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleSave}
                data-ocid="hr.save_button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Request Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="hr.leave.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("hr.addLeaveRequest")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.leaveEmployee")}
              </Label>
              <Select
                value={leaveForm.employeeId}
                onValueChange={(v) =>
                  setLeaveForm((p) => ({ ...p, employeeId: v }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.leave.select"
                >
                  <SelectValue placeholder={t("hr.leaveEmployee")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-white">
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("hr.leaveStart")}
                </Label>
                <Input
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) =>
                    setLeaveForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="hr.leave.input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("hr.leaveEnd")}
                </Label>
                <Input
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) =>
                    setLeaveForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("hr.leaveReason")}
              </Label>
              <Textarea
                value={leaveForm.reason}
                onChange={(e) =>
                  setLeaveForm((p) => ({ ...p, reason: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white resize-none"
                rows={3}
                data-ocid="hr.leave.textarea"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowLeaveDialog(false)}
                data-ocid="hr.leave.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={handleAddLeave}
                data-ocid="hr.leave.submit_button"
              >
                {t("hr.addLeaveRequest")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
