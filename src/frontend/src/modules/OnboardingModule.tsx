import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useLanguage } from "../contexts/LanguageContext";

interface OnboardingTask {
  id: string;
  title: string;
  category: "Documents" | "Access" | "Orientation" | "Equipment" | "Other";
  dueDate: string;
  responsible: string;
  status: "Pending" | "InProgress" | "Done";
}

interface OnboardingPlan {
  id: string;
  employeeName: string;
  startDate: string;
  status: "Active" | "Completed" | "Cancelled";
  tasks: OnboardingTask[];
}

const getCompanyId = () =>
  JSON.parse(localStorage.getItem("erpverse_session") || "{}").companyId ||
  "default";

const STORAGE_KEY = () => `erpverse_onboarding_${getCompanyId()}`;

const loadPlans = (): OnboardingPlan[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY()) || "[]");
  } catch {
    return [];
  }
};

const savePlans = (plans: OnboardingPlan[]) => {
  localStorage.setItem(STORAGE_KEY(), JSON.stringify(plans));
};

const categoryColors: Record<OnboardingTask["category"], string> = {
  Documents: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Access: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  Orientation: "bg-green-500/20 text-green-300 border-green-500/30",
  Equipment: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  Other: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const planStatusBadge: Record<OnboardingPlan["status"], string> = {
  Active: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Completed: "bg-green-500/20 text-green-300 border-green-500/30",
  Cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

const taskStatusIcon = (status: OnboardingTask["status"]) => {
  if (status === "Done")
    return <CheckCircle2 className="w-4 h-4 text-green-400" />;
  if (status === "InProgress")
    return <Clock className="w-4 h-4 text-yellow-400" />;
  return <Circle className="w-4 h-4 text-slate-400" />;
};

export default function OnboardingModule() {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<OnboardingPlan[]>(loadPlans);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // New plan dialog
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [newPlanEmployee, setNewPlanEmployee] = useState("");
  const [newPlanStartDate, setNewPlanStartDate] = useState("");
  const [newPlanStatus, setNewPlanStatus] =
    useState<OnboardingPlan["status"]>("Active");

  // New task dialog
  const [taskDialogPlanId, setTaskDialogPlanId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] =
    useState<OnboardingTask["category"]>("Documents");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskResponsible, setNewTaskResponsible] = useState("");

  const update = (updated: OnboardingPlan[]) => {
    setPlans(updated);
    savePlans(updated);
  };

  const addPlan = () => {
    if (!newPlanEmployee.trim()) return;
    const plan: OnboardingPlan = {
      id: Date.now().toString(),
      employeeName: newPlanEmployee.trim(),
      startDate: newPlanStartDate,
      status: newPlanStatus,
      tasks: [],
    };
    update([...plans, plan]);
    setNewPlanEmployee("");
    setNewPlanStartDate("");
    setNewPlanStatus("Active");
    setPlanDialogOpen(false);
  };

  const deletePlan = (id: string) => {
    update(plans.filter((p) => p.id !== id));
    if (expandedPlanId === id) setExpandedPlanId(null);
  };

  const addTask = (planId: string) => {
    if (!newTaskTitle.trim()) return;
    const task: OnboardingTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      dueDate: newTaskDueDate,
      responsible: newTaskResponsible.trim(),
      status: "Pending",
    };
    update(
      plans.map((p) =>
        p.id === planId ? { ...p, tasks: [...p.tasks, task] } : p,
      ),
    );
    setNewTaskTitle("");
    setNewTaskCategory("Documents");
    setNewTaskDueDate("");
    setNewTaskResponsible("");
    setTaskDialogPlanId(null);
  };

  const deleteTask = (planId: string, taskId: string) => {
    update(
      plans.map((p) =>
        p.id === planId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }
          : p,
      ),
    );
  };

  const advanceTask = (planId: string, taskId: string) => {
    update(
      plans.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const next: Record<
              OnboardingTask["status"],
              OnboardingTask["status"]
            > = {
              Pending: "InProgress",
              InProgress: "Done",
              Done: "Done",
            };
            return { ...t, status: next[t.status] };
          }),
        };
      }),
    );
  };

  const getProgress = (plan: OnboardingPlan) => {
    if (plan.tasks.length === 0) return 0;
    return Math.round(
      (plan.tasks.filter((t) => t.status === "Done").length /
        plan.tasks.length) *
        100,
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <UserCheck className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {t("onboarding.title")}
            </h1>
            <p className="text-sm text-slate-400">{t("onboarding.subtitle")}</p>
          </div>
        </div>
        <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white"
              data-ocid="onboarding.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("onboarding.addPlan")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>{t("onboarding.addPlan")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("onboarding.employeeName")}
                </Label>
                <Input
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                  value={newPlanEmployee}
                  onChange={(e) => setNewPlanEmployee(e.target.value)}
                  data-ocid="onboarding.input"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("onboarding.startDate")}
                </Label>
                <Input
                  type="date"
                  className="mt-1 bg-slate-800 border-white/10 text-white"
                  value={newPlanStartDate}
                  onChange={(e) => setNewPlanStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">
                  {t("onboarding.status")}
                </Label>
                <Select
                  value={newPlanStatus}
                  onValueChange={(v) =>
                    setNewPlanStatus(v as OnboardingPlan["status"])
                  }
                >
                  <SelectTrigger className="mt-1 bg-slate-800 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10 text-white">
                    <SelectItem value="Active">
                      {t("onboarding.active")}
                    </SelectItem>
                    <SelectItem value="Completed">
                      {t("onboarding.completed")}
                    </SelectItem>
                    <SelectItem value="Cancelled">
                      {t("onboarding.cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={addPlan}
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  data-ocid="onboarding.submit_button"
                >
                  {t("onboarding.addPlan")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPlanDialogOpen(false)}
                  className="flex-1 border-white/10 text-slate-300 hover:bg-slate-700"
                  data-ocid="onboarding.cancel_button"
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans */}
      {plans.length === 0 ? (
        <div
          className="text-center py-16 text-slate-400"
          data-ocid="onboarding.empty_state"
        >
          <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{t("onboarding.noPlans")}</p>
        </div>
      ) : (
        <div className="space-y-4" data-ocid="onboarding.list">
          {plans.map((plan, idx) => {
            const progress = getProgress(plan);
            const isExpanded = expandedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                className="bg-slate-800/60 border border-white/10 rounded-lg overflow-hidden"
                data-ocid={`onboarding.item.${idx + 1}`}
              >
                {/* Plan header */}
                <div className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">
                        {plan.employeeName}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded border ${planStatusBadge[plan.status]}`}
                      >
                        {t(`onboarding.${plan.status.toLowerCase()}`)}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      {t("onboarding.startDate")}: {plan.startDate || "—"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress
                        value={progress}
                        className="h-1.5 flex-1 bg-slate-700"
                      />
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {plan.tasks.filter((t2) => t2.status === "Done").length}
                        /{plan.tasks.length} {t("onboarding.progress")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setExpandedPlanId(isExpanded ? null : plan.id)
                      }
                      className="text-slate-400 hover:text-white"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deletePlan(plan.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      data-ocid={`onboarding.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tasks */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4 space-y-3">
                    {plan.tasks.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">
                        {t("onboarding.noTasks")}
                      </p>
                    ) : (
                      plan.tasks.map((task, tidx) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 bg-slate-900/50 rounded-lg p-3"
                          data-ocid={`onboarding.row.${tidx + 1}`}
                        >
                          <div className="mt-0.5">
                            {taskStatusIcon(task.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${task.status === "Done" ? "line-through text-slate-500" : "text-white"}`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded border ${categoryColors[task.category]}`}
                              >
                                {t(
                                  `onboarding.cat.${task.category.toLowerCase()}`,
                                )}
                              </span>
                              {task.responsible && (
                                <span className="text-xs text-slate-400">
                                  {task.responsible}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className="text-xs text-slate-500">
                                  {task.dueDate}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {task.status !== "Done" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => advanceTask(plan.id, task.id)}
                                className="text-xs text-teal-400 hover:text-teal-300 px-2"
                              >
                                {task.status === "Pending"
                                  ? t("onboarding.start")
                                  : t("onboarding.done")}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteTask(plan.id, task.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Add Task */}
                    <Dialog
                      open={taskDialogPlanId === plan.id}
                      onOpenChange={(open) =>
                        setTaskDialogPlanId(open ? plan.id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full border-dashed border-white/20 text-slate-400 hover:text-white hover:bg-slate-700 mt-1"
                          data-ocid={`onboarding.secondary_button.${idx + 1}`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          {t("onboarding.addTask")}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-900 border-white/10 text-white">
                        <DialogHeader>
                          <DialogTitle>{t("onboarding.addTask")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div>
                            <Label className="text-slate-300 text-sm">
                              {t("onboarding.taskTitle")}
                            </Label>
                            <Input
                              className="mt-1 bg-slate-800 border-white/10 text-white"
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300 text-sm">
                              {t("onboarding.category")}
                            </Label>
                            <Select
                              value={newTaskCategory}
                              onValueChange={(v) =>
                                setNewTaskCategory(
                                  v as OnboardingTask["category"],
                                )
                              }
                            >
                              <SelectTrigger className="mt-1 bg-slate-800 border-white/10 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-white/10 text-white">
                                {(
                                  [
                                    "Documents",
                                    "Access",
                                    "Orientation",
                                    "Equipment",
                                    "Other",
                                  ] as const
                                ).map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {t(`onboarding.cat.${cat.toLowerCase()}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-slate-300 text-sm">
                              {t("onboarding.dueDate")}
                            </Label>
                            <Input
                              type="date"
                              className="mt-1 bg-slate-800 border-white/10 text-white"
                              value={newTaskDueDate}
                              onChange={(e) =>
                                setNewTaskDueDate(e.target.value)
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-slate-300 text-sm">
                              {t("onboarding.responsible")}
                            </Label>
                            <Input
                              className="mt-1 bg-slate-800 border-white/10 text-white"
                              value={newTaskResponsible}
                              onChange={(e) =>
                                setNewTaskResponsible(e.target.value)
                              }
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => addTask(plan.id)}
                              className="flex-1 bg-teal-600 hover:bg-teal-700"
                            >
                              {t("onboarding.addTask")}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setTaskDialogPlanId(null)}
                              className="flex-1 border-white/10 text-slate-300 hover:bg-slate-700"
                            >
                              {t("common.cancel")}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
