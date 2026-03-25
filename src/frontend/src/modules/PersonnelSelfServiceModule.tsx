import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Award,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface Props {
  user: UserProfile;
  companyId: string;
}

interface PayrollEntry {
  employeeId?: string;
  employeeName: string;
  gross: number;
  deductions: number;
  net: number;
}

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  entries: PayrollEntry[];
  createdAt: string;
}

interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annual: { total: number; used: number };
  sick: { total: number; used: number };
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  createdAt: string;
}

interface Certificate {
  id: string;
  employeeId: string;
  employeeName: string;
  certName: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
}

function nameMatch(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const partsA = na.split(" ");
  const partsB = nb.split(" ");
  return partsA[0] === partsB[0];
}

export default function PersonnelSelfServiceModule({ user, companyId }: Props) {
  const { t } = useLanguage();

  const data = useMemo(() => {
    const displayName = user.displayName || "";

    // Find employee record
    const hrRaw = localStorage.getItem(`erpverse_hr_${companyId}`);
    const hrList: Array<{
      id: string;
      name: string;
      position?: string;
      department?: string;
      status?: string;
      email?: string;
      salary?: number;
    }> = hrRaw ? JSON.parse(hrRaw) : [];
    const employee = hrList.find((e) => nameMatch(e.name, displayName)) || null;

    // Payroll
    const payrollRaw = localStorage.getItem(`erp_payroll_${companyId}`);
    const payrollRuns: PayrollRun[] = payrollRaw ? JSON.parse(payrollRaw) : [];
    const myPayroll: Array<{
      month: number;
      year: number;
      gross: number;
      deductions: number;
      net: number;
    }> = [];
    for (const run of payrollRuns) {
      const entry = run.entries?.find(
        (e) =>
          nameMatch(e.employeeName, displayName) ||
          (employee && e.employeeId === employee.id),
      );
      if (entry) {
        myPayroll.push({
          month: run.month,
          year: run.year,
          gross: entry.gross,
          deductions: entry.deductions,
          net: entry.net,
        });
      }
    }
    myPayroll.sort((a, b) => b.year - a.year || b.month - a.month);

    // Leave balances
    const lbRaw = localStorage.getItem(`hr_leave_balances_${companyId}`);
    const lbList: LeaveBalance[] = lbRaw ? JSON.parse(lbRaw) : [];
    const myBalance =
      lbList.find(
        (l) =>
          (employee && l.employeeId === employee.id) ||
          nameMatch(l.employeeName, displayName),
      ) || null;

    // Leave requests
    const lrRaw = localStorage.getItem(`hr_leave_requests_${companyId}`);
    const lrList: LeaveRequest[] = lrRaw ? JSON.parse(lrRaw) : [];
    const myRequests = lrList.filter(
      (r) =>
        (employee && r.employeeId === employee.id) ||
        nameMatch(r.employeeName, displayName),
    );
    myRequests.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Certificates
    const certRaw = localStorage.getItem(
      `erpverse_training_certs_${companyId}`,
    );
    const certList: Certificate[] = certRaw ? JSON.parse(certRaw) : [];
    const myCerts = certList.filter(
      (c) =>
        (employee && c.employeeId === employee.id) ||
        nameMatch(c.employeeName, displayName),
    );

    return { employee, myPayroll, myBalance, myRequests, myCerts };
  }, [user.displayName, companyId]);

  const monthNames = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];

  const isExpiringSoon = (expiryDate: string) => {
    const exp = new Date(expiryDate);
    const diff = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  };

  const statusBadge = (status: string) => {
    if (status === "Onaylandı" || status === "Approved") {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          {status}
        </Badge>
      );
    }
    if (status === "Reddedildi" || status === "Rejected") {
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          {status}
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" data-ocid="self-service.panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">
          {t("selfService.title")}
        </h2>
        {data.employee ? (
          <p className="text-slate-400 text-sm">
            {data.employee.position}{" "}
            {data.employee.department ? `· ${data.employee.department}` : ""}
          </p>
        ) : (
          <div
            className="mt-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3"
            data-ocid="self-service.error_state"
          >
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-amber-300 text-sm">
              {t("selfService.noEmployee")}
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue="payroll">
        <TabsList className="bg-slate-800 border border-white/10 mb-6">
          <TabsTrigger
            value="payroll"
            className="data-[state=active]:bg-violet-600"
            data-ocid="self-service.payroll.tab"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            {t("selfService.payroll")}
          </TabsTrigger>
          <TabsTrigger
            value="leave"
            className="data-[state=active]:bg-violet-600"
            data-ocid="self-service.leave.tab"
          >
            <CalendarDays className="w-4 h-4 mr-1.5" />
            {t("selfService.leave")}
          </TabsTrigger>
          <TabsTrigger
            value="certs"
            className="data-[state=active]:bg-violet-600"
            data-ocid="self-service.certs.tab"
          >
            <Award className="w-4 h-4 mr-1.5" />
            {t("selfService.certs")}
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className="data-[state=active]:bg-violet-600"
            data-ocid="self-service.goals.tab"
          >
            <Target className="w-4 h-4 mr-1.5" />
            {t("selfService.goals")}
          </TabsTrigger>
        </TabsList>

        {/* PAYROLL TAB */}
        <TabsContent value="payroll">
          {data.myPayroll.length === 0 ? (
            <div
              className="text-center py-16 text-slate-400"
              data-ocid="self-service.payroll.empty_state"
            >
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{t("selfService.noPayroll")}</p>
            </div>
          ) : (
            <div
              className="rounded-xl border border-white/10 overflow-hidden"
              data-ocid="self-service.payroll.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("selfService.period")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("selfService.gross")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("selfService.deductions")}
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      {t("selfService.net")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.myPayroll.map((p, i) => (
                    <TableRow
                      key={`${p.year}-${p.month}`}
                      className="border-white/10"
                      data-ocid={`self-service.payroll.item.${i + 1}`}
                    >
                      <TableCell className="text-white font-medium">
                        {monthNames[(p.month - 1) % 12]} {p.year}
                      </TableCell>
                      <TableCell className="text-right text-slate-300">
                        {p.gross.toLocaleString()} ₺
                      </TableCell>
                      <TableCell className="text-right text-red-400">
                        {p.deductions.toLocaleString()} ₺
                      </TableCell>
                      <TableCell className="text-right text-emerald-400 font-semibold">
                        {p.net.toLocaleString()} ₺
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* LEAVE TAB */}
        <TabsContent value="leave">
          <div className="space-y-6">
            {/* New Leave Request Form */}
            <LeaveRequestForm companyId={companyId} user={user} />
            {/* Balance cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Annual */}
              <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
                <h4 className="text-white font-semibold mb-4">
                  {t("selfService.annualLeave")}
                </h4>
                {data.myBalance ? (
                  <>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">
                        {t("selfService.used")} / {t("selfService.total")}
                      </span>
                      <span className="text-white font-medium">
                        {data.myBalance.annual.used} /{" "}
                        {data.myBalance.annual.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        (data.myBalance.annual.used /
                          Math.max(data.myBalance.annual.total, 1)) *
                        100
                      }
                      className="h-2 mb-3"
                    />
                    <p className="text-emerald-400 font-bold text-lg">
                      {data.myBalance.annual.total - data.myBalance.annual.used}{" "}
                      <span className="text-slate-400 text-sm font-normal">
                        {t("selfService.remaining")}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">
                    {t("selfService.noEmployee")}
                  </p>
                )}
              </div>
              {/* Sick */}
              <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
                <h4 className="text-white font-semibold mb-4">
                  {t("selfService.sickLeave")}
                </h4>
                {data.myBalance ? (
                  <>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-400">
                        {t("selfService.used")} / {t("selfService.total")}
                      </span>
                      <span className="text-white font-medium">
                        {data.myBalance.sick.used} / {data.myBalance.sick.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        (data.myBalance.sick.used /
                          Math.max(data.myBalance.sick.total, 1)) *
                        100
                      }
                      className="h-2 mb-3"
                    />
                    <p className="text-sky-400 font-bold text-lg">
                      {data.myBalance.sick.total - data.myBalance.sick.used}{" "}
                      <span className="text-slate-400 text-sm font-normal">
                        {t("selfService.remaining")}
                      </span>
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">
                    {t("selfService.noEmployee")}
                  </p>
                )}
              </div>
            </div>

            {/* Leave requests */}
            {data.myRequests.length > 0 && (
              <div
                className="rounded-xl border border-white/10 overflow-hidden"
                data-ocid="self-service.leave.table"
              >
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-slate-400">Tür</TableHead>
                      <TableHead className="text-slate-400">
                        Başlangıç
                      </TableHead>
                      <TableHead className="text-slate-400">Bitiş</TableHead>
                      <TableHead className="text-slate-400">Gün</TableHead>
                      <TableHead className="text-slate-400">Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.myRequests.map((r, i) => (
                      <TableRow
                        key={r.id}
                        className="border-white/10"
                        data-ocid={`self-service.leave.item.${i + 1}`}
                      >
                        <TableCell className="text-white">
                          {r.leaveType}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {r.startDate}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {r.endDate}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {r.days}
                        </TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* CERTS TAB */}
        <TabsContent value="certs">
          {data.myCerts.length === 0 ? (
            <div
              className="text-center py-16 text-slate-400"
              data-ocid="self-service.certs.empty_state"
            >
              <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>{t("selfService.noCerts")}</p>
            </div>
          ) : (
            <div
              className="rounded-xl border border-white/10 overflow-hidden"
              data-ocid="self-service.certs.table"
            >
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">Sertifika</TableHead>
                    <TableHead className="text-slate-400">Kurum</TableHead>
                    <TableHead className="text-slate-400">Veriliş</TableHead>
                    <TableHead className="text-slate-400">Geçerlilik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.myCerts.map((c, i) => (
                    <TableRow
                      key={c.id}
                      className="border-white/10"
                      data-ocid={`self-service.certs.item.${i + 1}`}
                    >
                      <TableCell className="text-white font-medium">
                        {c.certName}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {c.issuer}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {c.issueDate}
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-300">{c.expiryDate}</span>
                        {isExpiringSoon(c.expiryDate) && (
                          <Badge className="ml-2 bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                            {t("selfService.expiringSoon")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* GOALS TAB */}
        <TabsContent value="goals">
          <MyGoalsTab companyId={companyId} user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface LeaveFormProps {
  companyId: string;
  user: { displayName: string };
}

function LeaveRequestForm({ companyId, user }: LeaveFormProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const leaveTypes = [
    t("leaveRequests.annual"),
    t("leaveRequests.sick"),
    t("leaveRequests.excuse"),
    t("leaveRequests.unpaid"),
    t("leaveRequests.parental"),
  ];

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(diff / 86400000) + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !startDate || !endDate || !reason) return;

    const storageKey = `hr_leave_requests_${companyId}`;
    const existing = (() => {
      try {
        return JSON.parse(localStorage.getItem(storageKey) || "[]");
      } catch {
        return [];
      }
    })();

    const newRequest = {
      id: `lr_${Date.now()}`,
      employeeName: user.displayName || "Personel",
      leaveType,
      startDate,
      endDate,
      days: calcDays(),
      reason,
      status: "Beklemede",
      createdAt: new Date().toISOString().slice(0, 10),
    };

    localStorage.setItem(storageKey, JSON.stringify([...existing, newRequest]));
    toast.success(t("leaveRequests.submitSuccess"));
    setExpanded(false);
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-white hover:bg-white/5 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        data-ocid="leaverequests.create.toggle"
      >
        <div className="flex items-center gap-2 font-semibold">
          <Plus className="w-4 h-4 text-teal-400" />
          {t("leaveRequests.createNew")}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <form
          onSubmit={handleSubmit}
          className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">
                {t("leaveRequests.leaveType")}
              </Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger
                  className="bg-slate-900 border-white/20 text-white"
                  data-ocid="leaverequests.type.select"
                >
                  <SelectValue placeholder={t("leaveRequests.selectType")} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
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
            <div className="space-y-1">
              <Label className="text-slate-300 text-sm">
                {t("leaveRequests.days")}: {calcDays()}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-slate-400">
                    {t("leaveRequests.startDate")}
                  </Label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/20 rounded-md px-3 py-2 text-white text-sm"
                    data-ocid="leaverequests.start_date.input"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">
                    {t("leaveRequests.endDate")}
                  </Label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/20 rounded-md px-3 py-2 text-white text-sm"
                    data-ocid="leaverequests.end_date.input"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300 text-sm">
              {t("leaveRequests.reason")}
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("leaveRequests.reasonPlaceholder")}
              className="bg-slate-900 border-white/20 text-white resize-none"
              rows={3}
              data-ocid="leaverequests.reason.textarea"
            />
          </div>
          <Button
            type="submit"
            className="bg-teal-600 hover:bg-teal-500 text-white"
            data-ocid="leaverequests.submit.button"
          >
            {t("leaveRequests.submit")}
          </Button>
        </form>
      )}
    </div>
  );
}

interface MyGoalsTabProps {
  companyId: string;
  user: { displayName: string };
}

interface KRView {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

interface ObjView {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  period: string;
  periodLabel: string;
  status: string;
  keyResults: KRView[];
}

function MyGoalsTab({ companyId, user }: MyGoalsTabProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);

  const objectives = useMemo(() => {
    try {
      const all: ObjView[] = JSON.parse(
        localStorage.getItem(`erp_okr_${companyId}`) || "[]",
      );
      const displayName = user.displayName || "";
      return all.filter(
        (o) =>
          o.employeeName.toLowerCase().trim() ===
          displayName.toLowerCase().trim(),
      );
    } catch {
      return [];
    }
  }, [companyId, user.displayName]);

  const calcKRProg = (kr: KRView) =>
    kr.targetValue === 0
      ? 0
      : Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100));

  const calcObjProg = (obj: ObjView) => {
    if (obj.keyResults.length === 0) return 0;
    return Math.round(
      obj.keyResults.reduce((s, kr) => s + calcKRProg(kr), 0) /
        obj.keyResults.length,
    );
  };

  const progressBarColor = (pct: number) => {
    if (pct >= 100) return "bg-emerald-500";
    if (pct >= 60) return "bg-blue-500";
    if (pct >= 30) return "bg-amber-500";
    return "bg-red-500";
  };

  const statusColors: Record<string, string> = {
    Aktif: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    Tamamlandı: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    İptal: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  if (objectives.length === 0) {
    return (
      <div
        className="text-center py-20 text-slate-400"
        data-ocid="self-service.goals.empty_state"
      >
        <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>{t("selfService.noGoals")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-ocid="self-service.goals.list">
      {objectives.map((obj, idx) => {
        const prog = calcObjProg(obj);
        const isExpanded = expanded === obj.id;
        return (
          <div
            key={obj.id}
            className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden"
            data-ocid={`self-service.goals.item.${idx + 1}`}
          >
            <div className="p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${statusColors[obj.status] || "bg-slate-500/20 text-slate-300 border-slate-500/30"}`}
                  >
                    {obj.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {obj.periodLabel}
                  </span>
                </div>
                <p className="text-white font-medium mb-3">{obj.title}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progressBarColor(prog)}`}
                      style={{ width: `${prog}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                    {prog}%
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : obj.id)}
                className="text-slate-400 hover:text-white p-1"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
            {isExpanded && (
              <div className="border-t border-white/10 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {t("okr.keyResultsTitle")}
                </p>
                {obj.keyResults.map((kr, kidx) => {
                  const krProg = calcKRProg(kr);
                  return (
                    <div
                      key={kr.id}
                      className="bg-slate-900/50 rounded-lg p-3"
                      data-ocid={`self-service.goals.kr.${kidx + 1}`}
                    >
                      <p className="text-sm text-white mb-2">{kr.title}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progressBarColor(krProg)}`}
                            style={{ width: `${krProg}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {kr.currentValue} / {kr.targetValue} {kr.unit} (
                          {krProg}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
