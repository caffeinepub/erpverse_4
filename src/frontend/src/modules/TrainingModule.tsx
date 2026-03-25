import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { AlertTriangle, GraduationCap, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  trainer: string;
  startDate: string;
  endDate: string;
  status: "Planned" | "InProgress" | "Completed";
  participants: number;
}

interface Certificate {
  id: string;
  employee: string;
  trainingName: string;
  issueDate: string;
  expiryDate: string;
}

interface TrainingEnrollment {
  id: string;
  planId: string;
  planName: string;
  employee: string;
  enrollDate: string;
  completionDate: string;
  status: "Enrolled" | "InProgress" | "Completed" | "Failed";
}

const STATUS_COLORS = {
  Planned: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  InProgress: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Completed: "bg-green-500/20 text-green-300 border-green-500/30",
};

const ENROLLMENT_STATUS_COLORS: Record<TrainingEnrollment["status"], string> = {
  Enrolled: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  InProgress: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Completed: "bg-green-500/20 text-green-300 border-green-500/30",
  Failed: "bg-red-500/20 text-red-300 border-red-500/30",
};

function isExpiringSoon(dateStr: string): boolean {
  if (!dateStr) return false;
  const expiry = new Date(dateStr);
  const now = new Date();
  const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
}

export default function TrainingModule() {
  const { t } = useLanguage();
  const session = JSON.parse(localStorage.getItem("erpverse_session") || "{}");
  const companyId = session.companyId;
  const plansKey = `erpverse_training_plans_${companyId}`;
  const certsKey = `erpverse_training_certs_${companyId}`;
  const enrollmentsKey = `erpverse_training_enrollments_${companyId}`;

  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [enrollments, setEnrollments] = useState<TrainingEnrollment[]>([]);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  const [newPlan, setNewPlan] = useState<Omit<TrainingPlan, "id">>({
    name: "",
    description: "",
    trainer: "",
    startDate: "",
    endDate: "",
    status: "Planned",
    participants: 0,
  });

  const [newCert, setNewCert] = useState<Omit<Certificate, "id">>({
    employee: "",
    trainingName: "",
    issueDate: "",
    expiryDate: "",
  });

  const [newEnrollment, setNewEnrollment] = useState<
    Omit<TrainingEnrollment, "id">
  >({
    planId: "",
    planName: "",
    employee: "",
    enrollDate: "",
    completionDate: "",
    status: "Enrolled",
  });

  useEffect(() => {
    if (!companyId) return;
    try {
      const p = localStorage.getItem(plansKey);
      const c = localStorage.getItem(certsKey);
      const e = localStorage.getItem(enrollmentsKey);
      if (p) setPlans(JSON.parse(p));
      if (c) setCerts(JSON.parse(c));
      if (e) setEnrollments(JSON.parse(e));
    } catch {}
  }, [companyId, plansKey, certsKey, enrollmentsKey]);

  const savePlans = (updated: TrainingPlan[]) => {
    setPlans(updated);
    localStorage.setItem(plansKey, JSON.stringify(updated));
  };

  const saveCerts = (updated: Certificate[]) => {
    setCerts(updated);
    localStorage.setItem(certsKey, JSON.stringify(updated));
  };

  const saveEnrollments = (updated: TrainingEnrollment[]) => {
    setEnrollments(updated);
    localStorage.setItem(enrollmentsKey, JSON.stringify(updated));
  };

  const addPlan = () => {
    if (!newPlan.name.trim()) return;
    const plan: TrainingPlan = { ...newPlan, id: Date.now().toString() };
    savePlans([...plans, plan]);
    setNewPlan({
      name: "",
      description: "",
      trainer: "",
      startDate: "",
      endDate: "",
      status: "Planned",
      participants: 0,
    });
    setShowPlanDialog(false);
    toast.success(t("training.addPlan"));
  };

  const deletePlan = (id: string) => {
    savePlans(plans.filter((p) => p.id !== id));
  };

  const addCert = () => {
    if (!newCert.employee.trim() || !newCert.trainingName.trim()) return;
    const cert: Certificate = { ...newCert, id: Date.now().toString() };
    saveCerts([...certs, cert]);
    setNewCert({
      employee: "",
      trainingName: "",
      issueDate: "",
      expiryDate: "",
    });
    setShowCertDialog(false);
    toast.success(t("training.addCert"));
  };

  const deleteCert = (id: string) => {
    saveCerts(certs.filter((c) => c.id !== id));
  };

  const addEnrollment = () => {
    if (!newEnrollment.planId || !newEnrollment.employee.trim()) return;
    const enrollment: TrainingEnrollment = {
      ...newEnrollment,
      id: Date.now().toString(),
    };
    saveEnrollments([...enrollments, enrollment]);
    setNewEnrollment({
      planId: "",
      planName: "",
      employee: "",
      enrollDate: "",
      completionDate: "",
      status: "Enrolled",
    });
    setShowEnrollDialog(false);
    toast.success(t("training.addEnrollment"));
  };

  const updateEnrollmentStatus = (
    id: string,
    status: TrainingEnrollment["status"],
  ) => {
    saveEnrollments(
      enrollments.map((e) =>
        e.id === id
          ? {
              ...e,
              status,
              completionDate:
                status === "Completed" || status === "Failed"
                  ? new Date().toISOString().split("T")[0]
                  : e.completionDate,
            }
          : e,
      ),
    );
  };

  const deleteEnrollment = (id: string) => {
    saveEnrollments(enrollments.filter((e) => e.id !== id));
  };

  // Per-plan completion summary
  const planSummaries = plans
    .map((plan) => {
      const planEnrollments = enrollments.filter((e) => e.planId === plan.id);
      const completed = planEnrollments.filter(
        (e) => e.status === "Completed",
      ).length;
      const total = planEnrollments.length;
      return { plan, completed, total };
    })
    .filter((s) => s.total > 0);

  // Expiring certs count
  const expiringCertsCount = certs.filter((c) =>
    isExpiringSoon(c.expiryDate),
  ).length;

  const enrollmentStatusLabel = (status: TrainingEnrollment["status"]) => {
    const map: Record<TrainingEnrollment["status"], string> = {
      Enrolled: t("training.enrolled"),
      InProgress: t("training.inProgress"),
      Completed: t("training.completed"),
      Failed: t("training.failed"),
    };
    return map[status];
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <GraduationCap className="w-6 h-6 text-yellow-400" />
        {t("modules.Training")}
      </h2>

      <Tabs defaultValue="plans">
        <TabsList className="bg-slate-800 border border-white/10">
          <TabsTrigger
            data-ocid="training.plans.tab"
            value="plans"
            className="text-slate-300 data-[state=active]:text-white"
          >
            {t("training.plans")}
          </TabsTrigger>
          <TabsTrigger
            data-ocid="training.completion.tab"
            value="completion"
            className="text-slate-300 data-[state=active]:text-white"
          >
            {t("training.completion")}
          </TabsTrigger>
          <TabsTrigger
            data-ocid="training.certificates.tab"
            value="certs"
            className="text-slate-300 data-[state=active]:text-white"
          >
            {t("training.certificates")}
          </TabsTrigger>
        </TabsList>

        {/* ===== PLANS TAB ===== */}
        <TabsContent value="plans" className="mt-4">
          <div className="flex justify-end mb-3">
            <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="training.plan.open_modal_button"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> {t("training.addPlan")}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-white/10 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("training.addPlan")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("training.planName")}
                    </Label>
                    <Input
                      data-ocid="training.plan.name.input"
                      value={newPlan.name}
                      onChange={(e) =>
                        setNewPlan((p) => ({ ...p, name: e.target.value }))
                      }
                      className="mt-1 bg-slate-700 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("training.description")}
                    </Label>
                    <Textarea
                      data-ocid="training.plan.description.textarea"
                      value={newPlan.description}
                      onChange={(e) =>
                        setNewPlan((p) => ({
                          ...p,
                          description: e.target.value,
                        }))
                      }
                      className="mt-1 bg-slate-700 border-white/20 text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("training.trainer")}
                    </Label>
                    <Input
                      data-ocid="training.plan.trainer.input"
                      value={newPlan.trainer}
                      onChange={(e) =>
                        setNewPlan((p) => ({ ...p, trainer: e.target.value }))
                      }
                      className="mt-1 bg-slate-700 border-white/20 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-sm">
                        {t("training.startDate")}
                      </Label>
                      <Input
                        data-ocid="training.plan.startdate.input"
                        type="date"
                        value={newPlan.startDate}
                        onChange={(e) =>
                          setNewPlan((p) => ({
                            ...p,
                            startDate: e.target.value,
                          }))
                        }
                        className="mt-1 bg-slate-700 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-sm">
                        {t("training.endDate")}
                      </Label>
                      <Input
                        data-ocid="training.plan.enddate.input"
                        type="date"
                        value={newPlan.endDate}
                        onChange={(e) =>
                          setNewPlan((p) => ({ ...p, endDate: e.target.value }))
                        }
                        className="mt-1 bg-slate-700 border-white/20 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-sm">
                        {t("training.status")}
                      </Label>
                      <Select
                        value={newPlan.status}
                        onValueChange={(v) =>
                          setNewPlan((p) => ({
                            ...p,
                            status: v as TrainingPlan["status"],
                          }))
                        }
                      >
                        <SelectTrigger
                          data-ocid="training.plan.status.select"
                          className="mt-1 bg-slate-700 border-white/20 text-white"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/20 text-white">
                          <SelectItem value="Planned">Planned</SelectItem>
                          <SelectItem value="InProgress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300 text-sm">
                        {t("training.participants")}
                      </Label>
                      <Input
                        data-ocid="training.plan.participants.input"
                        type="number"
                        min={0}
                        value={newPlan.participants}
                        onChange={(e) =>
                          setNewPlan((p) => ({
                            ...p,
                            participants: Number(e.target.value),
                          }))
                        }
                        className="mt-1 bg-slate-700 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    data-ocid="training.plan.cancel_button"
                    variant="outline"
                    onClick={() => setShowPlanDialog(false)}
                    className="border-white/20 text-slate-300"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    data-ocid="training.plan.submit_button"
                    onClick={addPlan}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {t("common.add")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {plans.length === 0 ? (
            <div
              data-ocid="training.plans.empty_state"
              className="text-center text-slate-400 py-12"
            >
              {t("training.addPlan")}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("training.planName")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.trainer")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.startDate")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.endDate")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.status")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.participants")}
                    </TableHead>
                    <TableHead className="text-slate-400 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan, idx) => (
                    <TableRow
                      key={plan.id}
                      data-ocid={`training.plans.item.${idx + 1}`}
                      className="border-white/10 hover:bg-slate-800/50"
                    >
                      <TableCell className="text-white font-medium">
                        {plan.name}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {plan.trainer}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {plan.startDate}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {plan.endDate}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[plan.status]}`}
                        >
                          {plan.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {plan.participants}
                      </TableCell>
                      <TableCell>
                        <Button
                          data-ocid={`training.plans.delete_button.${idx + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePlan(plan.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ===== COMPLETION TAB ===== */}
        <TabsContent value="completion" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="training.enrollment.open_modal_button"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("training.addEnrollment")}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-white/10 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("training.addEnrollment")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("training.selectPlan")}
                    </Label>
                    <Select
                      value={newEnrollment.planId}
                      onValueChange={(v) => {
                        const plan = plans.find((p) => p.id === v);
                        setNewEnrollment((e) => ({
                          ...e,
                          planId: v,
                          planName: plan?.name ?? "",
                        }));
                      }}
                    >
                      <SelectTrigger
                        data-ocid="training.enrollment.plan.select"
                        className="mt-1 bg-slate-700 border-white/20 text-white"
                      >
                        <SelectValue placeholder={t("training.selectPlan")} />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-white/20 text-white">
                        {plans.length === 0 ? (
                          <SelectItem value="__none__" disabled>
                            {t("training.addPlan")}
                          </SelectItem>
                        ) : (
                          plans.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("training.employee")}
                    </Label>
                    <Input
                      data-ocid="training.enrollment.employee.input"
                      value={newEnrollment.employee}
                      onChange={(e) =>
                        setNewEnrollment((en) => ({
                          ...en,
                          employee: e.target.value,
                        }))
                      }
                      className="mt-1 bg-slate-700 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("training.enrollDate")}
                    </Label>
                    <Input
                      data-ocid="training.enrollment.date.input"
                      type="date"
                      value={newEnrollment.enrollDate}
                      onChange={(e) =>
                        setNewEnrollment((en) => ({
                          ...en,
                          enrollDate: e.target.value,
                        }))
                      }
                      className="mt-1 bg-slate-700 border-white/20 text-white"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    data-ocid="training.enrollment.cancel_button"
                    variant="outline"
                    onClick={() => setShowEnrollDialog(false)}
                    className="border-white/20 text-slate-300"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    data-ocid="training.enrollment.submit_button"
                    onClick={addEnrollment}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {t("common.add")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Per-plan summary cards */}
          {planSummaries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {planSummaries.map(({ plan, completed, total }) => {
                const pct =
                  total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div
                    key={plan.id}
                    className="bg-slate-800/60 border border-white/10 rounded-lg p-4"
                  >
                    <p className="text-white text-sm font-semibold mb-1 truncate">
                      {plan.name}
                    </p>
                    <p className="text-slate-400 text-xs mb-2">
                      {completed}/{total} {t("training.completedOf")}
                    </p>
                    <Progress value={pct} className="h-2 bg-slate-700" />
                    <p className="text-slate-500 text-xs mt-1 text-right">
                      {pct}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {enrollments.length === 0 ? (
            <div
              data-ocid="training.enrollments.empty_state"
              className="text-center text-slate-400 py-12"
            >
              {t("training.noEnrollments")}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("training.employee")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.planName")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.enrollDate")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.status")}
                    </TableHead>
                    <TableHead className="text-slate-400 w-40" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enr, idx) => (
                    <TableRow
                      key={enr.id}
                      data-ocid={`training.enrollments.item.${idx + 1}`}
                      className="border-white/10 hover:bg-slate-800/50"
                    >
                      <TableCell className="text-white font-medium">
                        {enr.employee}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {enr.planName}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {enr.enrollDate}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border font-medium ${ENROLLMENT_STATUS_COLORS[enr.status]}`}
                        >
                          {enrollmentStatusLabel(enr.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {enr.status !== "InProgress" &&
                            enr.status !== "Completed" &&
                            enr.status !== "Failed" && (
                              <Button
                                data-ocid={`training.enrollments.inprogress_button.${idx + 1}`}
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateEnrollmentStatus(enr.id, "InProgress")
                                }
                                className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 text-xs px-2 py-1 h-auto"
                              >
                                {t("training.inProgress")}
                              </Button>
                            )}
                          {enr.status !== "Completed" && (
                            <Button
                              data-ocid={`training.enrollments.complete_button.${idx + 1}`}
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                updateEnrollmentStatus(enr.id, "Completed")
                              }
                              className="text-green-400 hover:text-green-300 hover:bg-green-900/20 text-xs px-2 py-1 h-auto"
                            >
                              {t("training.completed")}
                            </Button>
                          )}
                          {enr.status !== "Failed" &&
                            enr.status !== "Completed" && (
                              <Button
                                data-ocid={`training.enrollments.fail_button.${idx + 1}`}
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateEnrollmentStatus(enr.id, "Failed")
                                }
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs px-2 py-1 h-auto"
                              >
                                {t("training.failed")}
                              </Button>
                            )}
                          <Button
                            data-ocid={`training.enrollments.delete_button.${idx + 1}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteEnrollment(enr.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1"
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
        </TabsContent>

        {/* ===== CERTIFICATES TAB ===== */}
        <TabsContent value="certs" className="mt-4">
          {/* Expiry alert banner */}
          {expiringCertsCount > 0 && (
            <div
              data-ocid="training.cert.expiry.error_state"
              className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 mb-4 text-orange-300"
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">
                {expiringCertsCount} {t("training.certExpiryWarning")}
              </span>
            </div>
          )}

          <div className="flex justify-end mb-3">
            <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
              <DialogTrigger asChild>
                <Button
                  data-ocid="training.cert.open_modal_button"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> {t("training.addCert")}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-white/10 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("training.addCert")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("training.employee")}
                    </Label>
                    <Input
                      data-ocid="training.cert.employee.input"
                      value={newCert.employee}
                      onChange={(e) =>
                        setNewCert((c) => ({ ...c, employee: e.target.value }))
                      }
                      className="mt-1 bg-slate-700 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 text-sm">
                      {t("training.trainingName")}
                    </Label>
                    <Input
                      data-ocid="training.cert.training.input"
                      value={newCert.trainingName}
                      onChange={(e) =>
                        setNewCert((c) => ({
                          ...c,
                          trainingName: e.target.value,
                        }))
                      }
                      className="mt-1 bg-slate-700 border-white/20 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300 text-sm">
                        {t("training.issueDate")}
                      </Label>
                      <Input
                        data-ocid="training.cert.issuedate.input"
                        type="date"
                        value={newCert.issueDate}
                        onChange={(e) =>
                          setNewCert((c) => ({
                            ...c,
                            issueDate: e.target.value,
                          }))
                        }
                        className="mt-1 bg-slate-700 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 text-sm">
                        {t("training.expiryDate")}
                      </Label>
                      <Input
                        data-ocid="training.cert.expirydate.input"
                        type="date"
                        value={newCert.expiryDate}
                        onChange={(e) =>
                          setNewCert((c) => ({
                            ...c,
                            expiryDate: e.target.value,
                          }))
                        }
                        className="mt-1 bg-slate-700 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button
                    data-ocid="training.cert.cancel_button"
                    variant="outline"
                    onClick={() => setShowCertDialog(false)}
                    className="border-white/20 text-slate-300"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    data-ocid="training.cert.submit_button"
                    onClick={addCert}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {t("common.add")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {certs.length === 0 ? (
            <div
              data-ocid="training.certs.empty_state"
              className="text-center text-slate-400 py-12"
            >
              {t("training.addCert")}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("training.employee")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.trainingName")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.issueDate")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("training.expiryDate")}
                    </TableHead>
                    <TableHead className="text-slate-400 w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certs.map((cert, idx) => (
                    <TableRow
                      key={cert.id}
                      data-ocid={`training.certs.item.${idx + 1}`}
                      className="border-white/10 hover:bg-slate-800/50"
                    >
                      <TableCell className="text-white font-medium">
                        {cert.employee}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {cert.trainingName}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {cert.issueDate}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div className="flex items-center gap-2">
                          {cert.expiryDate}
                          {isExpiringSoon(cert.expiryDate) && (
                            <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {t("training.expiringSoon")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          data-ocid={`training.certs.delete_button.${idx + 1}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCert(cert.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
