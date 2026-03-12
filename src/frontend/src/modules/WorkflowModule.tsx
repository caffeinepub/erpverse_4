import { GitBranch, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

type Priority = "high" | "medium" | "low";
type TaskStatus = "pending" | "inProgress" | "done";

interface WorkflowTask {
  id: string;
  title: string;
  assignee: string;
  priority: Priority;
  status: TaskStatus;
}

function priorityBadge(priority: Priority, t: (k: string) => string) {
  const map: Record<Priority, string> = {
    high: "bg-red-500/15 text-red-300 border-red-500/30",
    medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[priority]}`}>
      {t(`workflow.${priority}`)}
    </Badge>
  );
}

function statusBadge(status: TaskStatus, t: (k: string) => string) {
  const map: Record<TaskStatus, string> = {
    pending: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    inProgress: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    done: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  };
  return (
    <Badge variant="outline" className={`text-xs ${map[status]}`}>
      {t(`workflow.${status}`)}
    </Badge>
  );
}

export default function WorkflowModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const [tasks, setTasks] = useLocalStorage<WorkflowTask[]>(
    `erpverse_workflow_${company?.id || "default"}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    title: "",
    assignee: "",
    priority: "medium" as Priority,
    status: "pending" as TaskStatus,
  });

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const inProgressCount = tasks.filter((t) => t.status === "inProgress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const handleAdd = () => {
    if (!form.title || !form.assignee) return;
    setTasks((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: form.title,
        assignee: form.assignee,
        priority: form.priority,
        status: form.status,
      },
    ]);
    setForm({ title: "", assignee: "", priority: "medium", status: "pending" });
    setShowDialog(false);
  };

  const handleDelete = (id: string) =>
    setTasks((prev) => prev.filter((task) => task.id !== id));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {t("workflow.title")}
            </h2>
            <p className="text-slate-400 text-sm">
              {tasks.length} {t("workflow.task").toLowerCase()}
            </p>
          </div>
        </div>
        <Button
          className="bg-teal-600 hover:bg-teal-700 text-white"
          onClick={() => setShowDialog(true)}
          data-ocid="workflow.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("workflow.addTask")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
          <p className="text-slate-400 text-xs mb-1">{t("workflow.pending")}</p>
          <p className="text-2xl font-bold text-slate-300">{pendingCount}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
          <p className="text-slate-400 text-xs mb-1">
            {t("workflow.inProgress")}
          </p>
          <p className="text-2xl font-bold text-teal-400">{inProgressCount}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-white/5">
          <p className="text-slate-400 text-xs mb-1">{t("workflow.done")}</p>
          <p className="text-2xl font-bold text-emerald-400">{doneCount}</p>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div
          className="text-center py-16 text-slate-500"
          data-ocid="workflow.empty_state"
        >
          <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{t("workflow.addTask")}</p>
        </div>
      ) : (
        <div
          className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden"
          data-ocid="workflow.table"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                  {t("workflow.task")}
                </th>
                <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                  {t("workflow.assignee")}
                </th>
                <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                  {t("workflow.priority")}
                </th>
                <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                  {t("workflow.status")}
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr
                  key={task.id}
                  className="border-b border-white/5 last:border-0"
                  data-ocid={`workflow.row.${i + 1}`}
                >
                  <td className="px-5 py-3 text-white font-medium">
                    {task.title}
                  </td>
                  <td className="px-5 py-3 text-slate-300 text-sm">
                    {task.assignee}
                  </td>
                  <td className="px-5 py-3">
                    {priorityBadge(task.priority, t)}
                  </td>
                  <td className="px-5 py-3">{statusBadge(task.status, t)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      data-ocid={`workflow.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
          data-ocid="workflow.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("workflow.addTask")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm">
                {t("workflow.task")}
              </Label>
              <Input
                className="bg-slate-700 border-white/10 text-white mt-1"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                data-ocid="workflow.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("workflow.assignee")}
              </Label>
              <Input
                className="bg-slate-700 border-white/10 text-white mt-1"
                value={form.assignee}
                onChange={(e) =>
                  setForm((p) => ({ ...p, assignee: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("workflow.priority")}
              </Label>
              <Select
                value={form.priority}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, priority: v as Priority }))
                }
              >
                <SelectTrigger
                  className="bg-slate-700 border-white/10 text-white mt-1"
                  data-ocid="workflow.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-white/10">
                  <SelectItem value="high" className="text-white">
                    {t("workflow.high")}
                  </SelectItem>
                  <SelectItem value="medium" className="text-white">
                    {t("workflow.medium")}
                  </SelectItem>
                  <SelectItem value="low" className="text-white">
                    {t("workflow.low")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-sm">
                {t("workflow.status")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as TaskStatus }))
                }
              >
                <SelectTrigger className="bg-slate-700 border-white/10 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-white/10">
                  <SelectItem value="pending" className="text-white">
                    {t("workflow.pending")}
                  </SelectItem>
                  <SelectItem value="inProgress" className="text-white">
                    {t("workflow.inProgress")}
                  </SelectItem>
                  <SelectItem value="done" className="text-white">
                    {t("workflow.done")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="workflow.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                onClick={handleAdd}
                data-ocid="workflow.submit_button"
              >
                {t("workflow.addTask")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
