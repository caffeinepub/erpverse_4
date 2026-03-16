import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Award, CalendarDays, FileText } from "lucide-react";
import { useMemo } from "react";
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
      </Tabs>
    </div>
  );
}
