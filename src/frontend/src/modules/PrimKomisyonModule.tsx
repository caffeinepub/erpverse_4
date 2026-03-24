import {
  Award,
  Calculator,
  CreditCard,
  Pencil,
  Percent,
  Plus,
  Trash2,
} from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type RuleType = "sales" | "target" | "fixed";
type PaymentStatus = "pending" | "paid" | "transferred";

interface BonusRule {
  id: string;
  name: string;
  type: RuleType;
  rate?: number;
  targetAmount?: number;
  bonusRate?: number;
  fixedAmount?: number;
  employeeId: string; // "all" or specific employee id
  createdAt: string;
}

interface BonusPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  ruleId: string;
  ruleName: string;
  period: string;
  salesAmount: number;
  targetAmount: number;
  achievement: number;
  calculatedBonus: number;
  status: PaymentStatus;
  createdAt: string;
}

interface HREmployee {
  id: string;
  name: string;
  department?: string;
  position?: string;
}

interface Invoice {
  id: string;
  amount?: number;
  total?: number;
  employeeId?: string;
  date?: string;
  createdAt?: string;
}

interface Props {
  companyId: string;
  userRole: string;
}

const STATUS_COLORS: Record<PaymentStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  paid: "bg-green-500/20 text-green-300 border-green-500/30",
  transferred: "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const EMPTY_RULE: Omit<BonusRule, "id" | "createdAt"> = {
  name: "",
  type: "sales",
  rate: 5,
  targetAmount: 0,
  bonusRate: 10,
  fixedAmount: 0,
  employeeId: "all",
};

export default function PrimKomisyonModule({ companyId }: Props) {
  const { t } = useLanguage();

  const [rules, setRules] = useLocalStorage<BonusRule[]>(
    `erpverse_primkomiyon_rules_${companyId}`,
    [],
  );
  const [payments, setPayments] = useLocalStorage<BonusPayment[]>(
    `erpverse_primkomiyon_payments_${companyId}`,
    [],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BonusRule | null>(null);
  const [form, setForm] =
    useState<Omit<BonusRule, "id" | "createdAt">>(EMPTY_RULE);

  const [calcMonth, setCalcMonth] = useState(
    String(new Date().getMonth() + 1).padStart(2, "0"),
  );
  const [calcYear, setCalcYear] = useState(String(new Date().getFullYear()));

  const employees: HREmployee[] = (() => {
    try {
      const raw = localStorage.getItem(`erpverse_hr_employees_${companyId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const invoices: Invoice[] = (() => {
    try {
      const raw = localStorage.getItem(`erpverse_invoices_${companyId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  function openAddDialog() {
    setEditingRule(null);
    setForm(EMPTY_RULE);
    setDialogOpen(true);
  }

  function openEditDialog(rule: BonusRule) {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      type: rule.type,
      rate: rule.rate,
      targetAmount: rule.targetAmount,
      bonusRate: rule.bonusRate,
      fixedAmount: rule.fixedAmount,
      employeeId: rule.employeeId,
    });
    setDialogOpen(true);
  }

  function saveRule() {
    if (!form.name.trim()) {
      toast.error(t("common.required") || "Name required");
      return;
    }
    if (editingRule) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id ? { ...editingRule, ...form } : r,
        ),
      );
      toast.success(t("common.updated") || "Updated");
    } else {
      const newRule: BonusRule = {
        ...form,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setRules((prev) => [...prev, newRule]);
      toast.success(t("common.saved") || "Saved");
    }
    setDialogOpen(false);
  }

  function deleteRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success(t("common.deleted") || "Deleted");
  }

  function getSalesForEmployee(
    empId: string,
    month: string,
    year: string,
  ): number {
    const prefix = `${year}-${month}`;
    return invoices
      .filter((inv) => {
        const dateStr = inv.date || inv.createdAt || "";
        const matchesDate = dateStr.startsWith(prefix);
        const matchesEmp = !inv.employeeId || inv.employeeId === empId;
        return matchesDate && matchesEmp;
      })
      .reduce((sum, inv) => sum + (inv.amount || inv.total || 0), 0);
  }

  function calculateBonuses() {
    const period = `${calcYear}-${calcMonth}`;
    const targetEmps =
      employees.length > 0
        ? employees
        : [{ id: "unknown", name: t("primKomiyon.allEmployees") }];

    const results: BonusPayment[] = [];

    for (const emp of targetEmps) {
      const empRules = rules.filter(
        (r) => r.employeeId === "all" || r.employeeId === emp.id,
      );

      for (const rule of empRules) {
        const salesAmount = getSalesForEmployee(emp.id, calcMonth, calcYear);
        let calculatedBonus = 0;
        let targetAmt = 0;
        let achievement = 0;

        if (rule.type === "sales") {
          calculatedBonus = (salesAmount * (rule.rate || 0)) / 100;
          achievement = salesAmount > 0 ? 100 : 0;
        } else if (rule.type === "target") {
          targetAmt = rule.targetAmount || 0;
          achievement =
            targetAmt > 0 ? Math.min((salesAmount / targetAmt) * 100, 999) : 0;
          if (salesAmount >= targetAmt && targetAmt > 0) {
            calculatedBonus = (salesAmount * (rule.bonusRate || 0)) / 100;
          }
        } else if (rule.type === "fixed") {
          calculatedBonus = rule.fixedAmount || 0;
          achievement = 100;
        }

        results.push({
          id: `${Date.now()}-${emp.id}-${rule.id}`,
          employeeId: emp.id,
          employeeName: emp.name,
          ruleId: rule.id,
          ruleName: rule.name,
          period,
          salesAmount,
          targetAmount: targetAmt,
          achievement: Math.round(achievement),
          calculatedBonus: Math.round(calculatedBonus * 100) / 100,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (results.length === 0) {
      toast.info(t("primKomiyon.noRules"));
      return;
    }

    // Remove existing for same period, then add new
    setPayments((prev) => [
      ...prev.filter((p) => p.period !== period),
      ...results,
    ]);
    toast.success(t("primKomiyon.calculated"));
  }

  function markPaid(id: string) {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "paid" } : p)),
    );
    toast.success(t("primKomiyon.paid"));
  }

  function transferToPayroll(payment: BonusPayment) {
    try {
      const key = `erpverse_payroll_${companyId}`;
      const raw = localStorage.getItem(key);
      const payrollData = raw ? JSON.parse(raw) : [];
      payrollData.push({
        id: `bonus-${payment.id}`,
        type: "bonus",
        employeeId: payment.employeeId,
        employeeName: payment.employeeName,
        amount: payment.calculatedBonus,
        period: payment.period,
        description: payment.ruleName,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(payrollData));
    } catch {
      // ignore
    }
    setPayments((prev) =>
      prev.map((p) =>
        p.id === payment.id ? { ...p, status: "transferred" } : p,
      ),
    );
    toast.success(t("primKomiyon.transferred"));
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: new Date(2000, i, 1).toLocaleString("default", { month: "long" }),
  }));

  const years = Array.from({ length: 5 }, (_, i) =>
    String(new Date().getFullYear() - 2 + i),
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-500/20">
          <Percent className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("primKomiyon.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("primKomiyon.subtitle")}
          </p>
        </div>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="rules" data-ocid="primkomiyon.rules.tab">
            <Award className="w-4 h-4 mr-2" />
            {t("primKomiyon.rules")}
          </TabsTrigger>
          <TabsTrigger value="calculate" data-ocid="primkomiyon.calculate.tab">
            <Calculator className="w-4 h-4 mr-2" />
            {t("primKomiyon.calculate")}
          </TabsTrigger>
          <TabsTrigger value="payments" data-ocid="primkomiyon.payments.tab">
            <CreditCard className="w-4 h-4 mr-2" />
            {t("primKomiyon.payments")}
          </TabsTrigger>
        </TabsList>

        {/* ---- RULES TAB ---- */}
        <TabsContent value="rules" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button
              onClick={openAddDialog}
              className="bg-violet-600 hover:bg-violet-700 text-white"
              data-ocid="primkomiyon.add_rule.button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("primKomiyon.addRule")}
            </Button>
          </div>

          {rules.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent
                className="py-12 text-center text-muted-foreground"
                data-ocid="primkomiyon.rules.empty_state"
              >
                <Award className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>{t("primKomiyon.noRules")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule, idx) => {
                const emp = employees.find((e) => e.id === rule.employeeId);
                return (
                  <Card
                    key={rule.id}
                    className="bg-card border-border"
                    data-ocid={`primkomiyon.rule.item.${idx + 1}`}
                  >
                    <CardContent className="py-4 px-5 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {rule.name}
                          </span>
                          <Badge
                            className={
                              rule.type === "sales"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                : rule.type === "target"
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                                  : "bg-violet-500/20 text-violet-300 border-violet-500/30"
                            }
                          >
                            {t(`primKomiyon.${rule.type}`)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {rule.type === "sales" &&
                            `${t("primKomiyon.rate")}: ${rule.rate}%`}
                          {rule.type === "target" &&
                            `${t("primKomiyon.targetAmount")}: ${rule.targetAmount?.toLocaleString()} | ${t("primKomiyon.rate")}: ${rule.bonusRate}%`}
                          {rule.type === "fixed" &&
                            `${t("primKomiyon.bonusAmount")}: ${rule.fixedAmount?.toLocaleString()}`}
                          {" — "}
                          {rule.employeeId === "all"
                            ? t("primKomiyon.allEmployees")
                            : emp?.name || rule.employeeId}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(rule)}
                          data-ocid={`primkomiyon.rule.edit_button.${idx + 1}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteRule(rule.id)}
                          data-ocid={`primkomiyon.rule.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ---- CALCULATE TAB ---- */}
        <TabsContent value="calculate" className="mt-4">
          <Card className="bg-card border-border mb-4">
            <CardHeader>
              <CardTitle className="text-base text-foreground">
                {t("primKomiyon.selectPeriod")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-muted-foreground mb-1 block">
                    {t("primKomiyon.period")}
                  </Label>
                  <Select value={calcMonth} onValueChange={setCalcMonth}>
                    <SelectTrigger data-ocid="primkomiyon.month.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <Label className="text-muted-foreground mb-1 block">
                    {t("primKomiyon.year")}
                  </Label>
                  <Select value={calcYear} onValueChange={setCalcYear}>
                    <SelectTrigger data-ocid="primkomiyon.year.select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={calculateBonuses}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  data-ocid="primkomiyon.calculate.primary_button"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {t("primKomiyon.calculate")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {(() => {
            const period = `${calcYear}-${calcMonth}`;
            const periodPayments = payments.filter((p) => p.period === period);
            if (periodPayments.length === 0) return null;
            return (
              <Card
                className="bg-card border-border"
                data-ocid="primkomiyon.calc.table"
              >
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-muted-foreground">
                          {t("primKomiyon.employee")}
                        </TableHead>
                        <TableHead className="text-muted-foreground">
                          {t("primKomiyon.rules")}
                        </TableHead>
                        <TableHead className="text-muted-foreground text-right">
                          {t("primKomiyon.salesAmount")}
                        </TableHead>
                        <TableHead className="text-muted-foreground text-right">
                          {t("primKomiyon.targetAmount")}
                        </TableHead>
                        <TableHead className="text-muted-foreground text-right">
                          {t("primKomiyon.achievement")}
                        </TableHead>
                        <TableHead className="text-muted-foreground text-right">
                          {t("primKomiyon.calculatedBonus")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periodPayments.map((p) => (
                        <TableRow key={p.id} className="border-border">
                          <TableCell className="font-medium text-foreground">
                            {p.employeeName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {p.ruleName}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {p.salesAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-foreground">
                            {p.targetAmount > 0
                              ? p.targetAmount.toLocaleString()
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                p.achievement >= 100
                                  ? "text-green-400"
                                  : "text-yellow-400"
                              }
                            >
                              {p.achievement}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-violet-400">
                            {p.calculatedBonus.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        {/* ---- PAYMENTS TAB ---- */}
        <TabsContent value="payments" className="mt-4">
          {payments.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent
                className="py-12 text-center text-muted-foreground"
                data-ocid="primkomiyon.payments.empty_state"
              >
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>{t("primKomiyon.noPayments")}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">
                        {t("primKomiyon.employee")}
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        {t("primKomiyon.rules")}
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        {t("primKomiyon.period")}
                      </TableHead>
                      <TableHead className="text-muted-foreground text-right">
                        {t("primKomiyon.calculatedBonus")}
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        {t("primKomiyon.status")}
                      </TableHead>
                      <TableHead className="text-muted-foreground">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p, idx) => (
                      <TableRow
                        key={p.id}
                        className="border-border"
                        data-ocid={`primkomiyon.payment.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium text-foreground">
                          {p.employeeName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.ruleName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.period}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-violet-400">
                          {p.calculatedBonus.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[p.status]}>
                            {t(`primKomiyon.${p.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {p.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                                  onClick={() => markPaid(p.id)}
                                  data-ocid={`primkomiyon.payment.mark_paid.${idx + 1}`}
                                >
                                  {t("primKomiyon.markPaid")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                                  onClick={() => transferToPayroll(p)}
                                  data-ocid={`primkomiyon.payment.transfer.${idx + 1}`}
                                >
                                  {t("primKomiyon.transferPayroll")}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ---- ADD/EDIT RULE DIALOG ---- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="bg-card border-border max-w-md"
          data-ocid="primkomiyon.rule.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingRule
                ? t("primKomiyon.editRule")
                : t("primKomiyon.addRule")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">
                {t("primKomiyon.ruleName")}
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="mt-1 bg-background border-border text-foreground"
                data-ocid="primkomiyon.rule.name.input"
              />
            </div>

            <div>
              <Label className="text-muted-foreground">
                {t("primKomiyon.ruleType")}
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, type: v as RuleType }))
                }
              >
                <SelectTrigger
                  className="mt-1 bg-background border-border"
                  data-ocid="primkomiyon.rule.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">
                    {t("primKomiyon.sales")}
                  </SelectItem>
                  <SelectItem value="target">
                    {t("primKomiyon.target")}
                  </SelectItem>
                  <SelectItem value="fixed">
                    {t("primKomiyon.fixed")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.type === "sales" && (
              <div>
                <Label className="text-muted-foreground">
                  {t("primKomiyon.rate")}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.rate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, rate: Number(e.target.value) }))
                  }
                  className="mt-1 bg-background border-border text-foreground"
                  data-ocid="primkomiyon.rule.rate.input"
                />
              </div>
            )}

            {form.type === "target" && (
              <>
                <div>
                  <Label className="text-muted-foreground">
                    {t("primKomiyon.targetAmount")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.targetAmount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        targetAmount: Number(e.target.value),
                      }))
                    }
                    className="mt-1 bg-background border-border text-foreground"
                    data-ocid="primkomiyon.rule.target.input"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    {t("primKomiyon.rate")}
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.bonusRate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        bonusRate: Number(e.target.value),
                      }))
                    }
                    className="mt-1 bg-background border-border text-foreground"
                    data-ocid="primkomiyon.rule.bonusrate.input"
                  />
                </div>
              </>
            )}

            {form.type === "fixed" && (
              <div>
                <Label className="text-muted-foreground">
                  {t("primKomiyon.bonusAmount")}
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.fixedAmount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fixedAmount: Number(e.target.value),
                    }))
                  }
                  className="mt-1 bg-background border-border text-foreground"
                  data-ocid="primkomiyon.rule.fixed.input"
                />
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">
                {t("primKomiyon.employee")}
              </Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}
              >
                <SelectTrigger
                  className="mt-1 bg-background border-border"
                  data-ocid="primkomiyon.rule.employee.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("primKomiyon.allEmployees")}
                  </SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={saveRule}
                data-ocid="primkomiyon.rule.save_button"
              >
                {t("common.save")}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
                data-ocid="primkomiyon.rule.cancel_button"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
