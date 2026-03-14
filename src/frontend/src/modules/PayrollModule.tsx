import { ChevronDown, ChevronRight, DollarSign, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAuditLog } from "../contexts/AuditLogContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface HREmployee {
  id: string;
  name: string;
  surname: string;
  salary?: number;
  baseSalary?: number;
  department?: string;
  position?: string;
  status?: string;
}

interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  baseSalary: number;
  sgkDeduction: number;
  incomeTaxDeduction: number;
  netPay: number;
}

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  createdAt: string;
  totalGross: number;
  totalNet: number;
  entries: PayrollEntry[];
}

interface AccountingEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const MONTH_NAMES_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export default function PayrollModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const { addLog } = useAuditLog();
  const cid = company?.id || "default";

  const [payrollRuns, setPayrollRuns] = useLocalStorage<PayrollRun[]>(
    `erp_payroll_${cid}`,
    [],
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const readLS = <T,>(key: string): T[] => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]") as T[];
    } catch {
      return [];
    }
  };

  const employees = readLS<HREmployee>(`erpverse_hr_${cid}`);
  const activeEmployees = employees.filter(
    (e) => !e.status || e.status === "active",
  );

  const alreadyRun = payrollRuns.some(
    (r) => r.month === selectedMonth && r.year === selectedYear,
  );

  const monthLabel = (m: number) => MONTH_NAMES_TR[m - 1] || String(m);

  const runPayroll = () => {
    if (activeEmployees.length === 0) {
      toast.error(t("payroll.noEmployees"));
      return;
    }
    if (alreadyRun) {
      toast.error(t("payroll.alreadyRun"));
      return;
    }

    const entries: PayrollEntry[] = activeEmployees.map((emp) => {
      const base = emp.salary || emp.baseSalary || 0;
      const sgk = Math.round(base * 0.15);
      const tax = Math.round(base * 0.2);
      const net = base - sgk - tax;
      return {
        employeeId: emp.id,
        employeeName: `${emp.name} ${emp.surname}`,
        department: emp.department || "-",
        position: emp.position || "-",
        baseSalary: base,
        sgkDeduction: sgk,
        incomeTaxDeduction: tax,
        netPay: net,
      };
    });

    const totalGross = entries.reduce((s, e) => s + e.baseSalary, 0);
    const totalNet = entries.reduce((s, e) => s + e.netPay, 0);

    const run: PayrollRun = {
      id: Math.random().toString(36).slice(2, 10),
      month: selectedMonth,
      year: selectedYear,
      createdAt: new Date().toISOString(),
      totalGross,
      totalNet,
      entries,
    };

    setPayrollRuns((prev) => [...prev, run]);

    // Add expense to accounting
    const accounting = readLS<AccountingEntry>(`erpverse_accounting_${cid}`);
    const newEntry: AccountingEntry = {
      id: Math.random().toString(36).slice(2, 10),
      date: new Date().toISOString().split("T")[0],
      description: `${t("payroll.accountingDesc")} - ${monthLabel(selectedMonth)} ${selectedYear}`,
      amount: totalGross,
      type: "expense",
      category: t("payroll.category"),
    };
    localStorage.setItem(
      `erpverse_accounting_${cid}`,
      JSON.stringify([...accounting, newEntry]),
    );

    addLog({
      module: "Payroll",
      action: t("common.save"),
      detail: `${monthLabel(selectedMonth)} ${selectedYear}`,
    });
    toast.success(t("payroll.success"));
  };

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", { style: "currency", currency: "TRY" });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <DollarSign className="w-6 h-6 text-emerald-400" />
        <h2 className="text-xl font-bold text-foreground">
          {t("modules.Payroll")}
        </h2>
      </div>

      <Tabs defaultValue="create">
        <TabsList className="mb-4">
          <TabsTrigger value="create" data-ocid="payroll.create.tab">
            {t("payroll.create")}
          </TabsTrigger>
          <TabsTrigger value="history" data-ocid="payroll.history.tab">
            {t("payroll.historyTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("payroll.runPayroll")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("payroll.month")}
                  </p>
                  <Select
                    value={String(selectedMonth)}
                    onValueChange={(v) => setSelectedMonth(Number(v))}
                  >
                    <SelectTrigger
                      className="w-36"
                      data-ocid="payroll.month.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {monthLabel(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {t("payroll.year")}
                  </p>
                  <Select
                    value={String(selectedYear)}
                    onValueChange={(v) => setSelectedYear(Number(v))}
                  >
                    <SelectTrigger
                      className="w-28"
                      data-ocid="payroll.year.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={runPayroll}
                  disabled={alreadyRun}
                  data-ocid="payroll.run.primary_button"
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  {t("payroll.runButton")}
                </Button>
                {alreadyRun && (
                  <Badge className="bg-yellow-500/20 text-yellow-400">
                    {t("payroll.alreadyRunBadge")}
                  </Badge>
                )}
              </div>

              {activeEmployees.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {t("payroll.preview")} — {activeEmployees.length}{" "}
                    {t("payroll.employees")}
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("hr.name")}</TableHead>
                        <TableHead>{t("hr.department")}</TableHead>
                        <TableHead className="text-right">
                          {t("payroll.baseSalary")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("payroll.sgk")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("payroll.tax")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("payroll.netPay")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeEmployees.map((emp, idx) => {
                        const base = emp.salary || emp.baseSalary || 0;
                        const sgk = Math.round(base * 0.15);
                        const tax = Math.round(base * 0.2);
                        const net = base - sgk - tax;
                        return (
                          <TableRow
                            key={emp.id}
                            data-ocid={`payroll.preview.row.${idx + 1}`}
                          >
                            <TableCell>
                              {emp.name} {emp.surname}
                            </TableCell>
                            <TableCell>{emp.department || "-"}</TableCell>
                            <TableCell className="text-right">
                              {fmt(base)}
                            </TableCell>
                            <TableCell className="text-right text-red-400">
                              {fmt(sgk)}
                            </TableCell>
                            <TableCell className="text-right text-red-400">
                              {fmt(tax)}
                            </TableCell>
                            <TableCell className="text-right text-emerald-400 font-semibold">
                              {fmt(net)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {activeEmployees.length === 0 && (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-ocid="payroll.preview.empty_state"
                >
                  {t("payroll.noEmployeesHint")}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {payrollRuns.length === 0 ? (
            <div
              className="text-center py-12 text-muted-foreground"
              data-ocid="payroll.history.empty_state"
            >
              {t("payroll.noHistory")}
            </div>
          ) : (
            <div className="space-y-3">
              {[...payrollRuns].reverse().map((run, idx) => (
                <Card
                  key={run.id}
                  data-ocid={`payroll.history.item.${idx + 1}`}
                >
                  <CardHeader
                    className="py-3 cursor-pointer"
                    onClick={() =>
                      setExpandedRun(expandedRun === run.id ? null : run.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedRun === run.id ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span className="font-semibold">
                          {monthLabel(run.month)} {run.year}
                        </span>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {run.entries.length} {t("payroll.employees")}
                        </Badge>
                      </div>
                      <div className="text-sm text-right">
                        <div className="text-muted-foreground">
                          {t("payroll.totalGross")}:{" "}
                          <span className="text-foreground font-medium">
                            {fmt(run.totalGross)}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          {t("payroll.totalNet")}:{" "}
                          <span className="text-emerald-400 font-medium">
                            {fmt(run.totalNet)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {expandedRun === run.id && (
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("hr.name")}</TableHead>
                            <TableHead>{t("hr.department")}</TableHead>
                            <TableHead className="text-right">
                              {t("payroll.baseSalary")}
                            </TableHead>
                            <TableHead className="text-right">
                              {t("payroll.sgk")}
                            </TableHead>
                            <TableHead className="text-right">
                              {t("payroll.tax")}
                            </TableHead>
                            <TableHead className="text-right">
                              {t("payroll.netPay")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {run.entries.map((e, i) => (
                            <TableRow
                              key={e.employeeId}
                              data-ocid={`payroll.history.row.${i + 1}`}
                            >
                              <TableCell>{e.employeeName}</TableCell>
                              <TableCell>{e.department}</TableCell>
                              <TableCell className="text-right">
                                {fmt(e.baseSalary)}
                              </TableCell>
                              <TableCell className="text-right text-red-400">
                                {fmt(e.sgkDeduction)}
                              </TableCell>
                              <TableCell className="text-right text-red-400">
                                {fmt(e.incomeTaxDeduction)}
                              </TableCell>
                              <TableCell className="text-right text-emerald-400 font-semibold">
                                {fmt(e.netPay)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
