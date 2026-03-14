import { AlertTriangle, CheckSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useNotifications } from "../contexts/NotificationContext";

type Priority = "low" | "medium" | "high";
type Status = "todo" | "in-progress" | "done";

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  priority: Priority;
  status: Status;
  createdAt: string;
}

const emptyForm = (): Omit<Task, "id" | "createdAt"> => ({
  title: "",
  description: "",
  assignedTo: "",
  dueDate: "",
  priority: "medium",
  status: "todo",
});

export default function TaskModule() {
  const { t } = useLanguage();
  const { company: selectedCompany } = useAuth();
  const { addNotification } = useNotifications();
  const companyId = selectedCompany?.id ?? "default";
  const STORAGE_KEY = `erpverse_tasks_${companyId}`;
  const notifiedRef = useRef(false);

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, STORAGE_KEY]);

  // Check overdue tasks once on mount
  if (!notifiedRef.current) {
    notifiedRef.current = true;
    const todayCheck = new Date().toISOString().split("T")[0];
    const overdue = tasks.filter(
      (task) =>
        task.dueDate && task.dueDate < todayCheck && task.status !== "done",
    );
    if (overdue.length > 0) {
      addNotification({
        type: "info",
        title: t("tasks.overdueAlert"),
        message: `${overdue.length}`,
        companyId: companyId,
      });
    }
  }

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const openAdd = () => {
    setEditingTask(null);
    setForm(emptyForm());
    setShowDialog(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editingTask) {
      saveTasks(
        tasks.map((task) =>
          task.id === editingTask.id ? { ...editingTask, ...form } : task,
        ),
      );
    } else {
      const newTask: Task = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        ...form,
      };
      saveTasks([...tasks, newTask]);
    }
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    saveTasks(tasks.filter((task) => task.id !== id));
  };

  const filtered = tasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (filterPriority !== "all" && task.priority !== filterPriority)
      return false;
    return true;
  });

  const priorityColor = (p: Priority) => {
    if (p === "high") return "bg-red-500/20 text-red-400 border-red-500/30";
    if (p === "medium")
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return "bg-green-500/20 text-green-400 border-green-500/30";
  };

  const statusColor = (s: Status) => {
    if (s === "done")
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s === "in-progress")
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-violet-400" />
          <h2 className="text-xl font-bold text-white">{t("modules.Tasks")}</h2>
        </div>
        <Button
          onClick={openAdd}
          className="bg-violet-600 hover:bg-violet-500 text-white"
          data-ocid="tasks.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t("tasks.add")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1">
          {["all", "todo", "in-progress", "done"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              data-ocid="tasks.filter.tab"
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-violet-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {s === "all"
                ? t("tasks.filterAll")
                : s === "todo"
                  ? t("tasks.todo")
                  : s === "in-progress"
                    ? t("tasks.inProgress")
                    : t("tasks.done")}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all", "low", "medium", "high"].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(p)}
              data-ocid="tasks.filter.tab"
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filterPriority === p
                  ? "bg-violet-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {p === "all"
                ? t("tasks.filterAll")
                : p === "low"
                  ? t("tasks.low")
                  : p === "medium"
                    ? t("tasks.medium")
                    : t("tasks.high")}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-16 text-slate-400"
          data-ocid="tasks.empty_state"
        >
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t("tasks.noTasks")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task, idx) => {
            const isOverdue =
              task.dueDate && task.dueDate < today && task.status !== "done";
            return (
              <div
                key={task.id}
                data-ocid={`tasks.item.${idx + 1}`}
                className={`bg-slate-800 border rounded-lg p-4 ${
                  isOverdue ? "border-red-500/40" : "border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium">
                        {task.title}
                      </span>
                      {isOverdue && (
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    {task.description && (
                      <p className="text-slate-400 text-sm mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge
                        className={`text-xs ${priorityColor(task.priority)}`}
                      >
                        {task.priority === "low"
                          ? t("tasks.low")
                          : task.priority === "medium"
                            ? t("tasks.medium")
                            : t("tasks.high")}
                      </Badge>
                      <Badge className={`text-xs ${statusColor(task.status)}`}>
                        {task.status === "todo"
                          ? t("tasks.todo")
                          : task.status === "in-progress"
                            ? t("tasks.inProgress")
                            : t("tasks.done")}
                      </Badge>
                      {task.assignedTo && (
                        <span className="text-xs text-slate-400">
                          {t("tasks.assignedTo")}: {task.assignedTo}
                        </span>
                      )}
                      {task.dueDate && (
                        <span
                          className={`text-xs ${
                            isOverdue ? "text-red-400" : "text-slate-400"
                          }`}
                        >
                          {t("tasks.dueDate")}: {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(task)}
                      data-ocid={`tasks.edit_button.${idx + 1}`}
                      className="text-slate-400 hover:text-white"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(task.id)}
                      data-ocid={`tasks.delete_button.${idx + 1}`}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white"
          data-ocid="tasks.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editingTask ? t("tasks.edit") : t("tasks.add")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">{t("tasks.title")}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="tasks.input"
              />
            </div>
            <div>
              <Label className="text-slate-300">{t("tasks.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                rows={2}
                data-ocid="tasks.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">
                  {t("tasks.assignedTo")}
                </Label>
                <Input
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({ ...form, assignedTo: e.target.value })
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">{t("tasks.dueDate")}</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("tasks.priority")}</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm({ ...form, priority: v as Priority })
                  }
                >
                  <SelectTrigger
                    className="bg-slate-800 border-white/10 text-white mt-1"
                    data-ocid="tasks.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="low" className="text-white">
                      {t("tasks.low")}
                    </SelectItem>
                    <SelectItem value="medium" className="text-white">
                      {t("tasks.medium")}
                    </SelectItem>
                    <SelectItem value="high" className="text-white">
                      {t("tasks.high")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">{t("tasks.status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as Status })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-white/10 text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/10">
                    <SelectItem value="todo" className="text-white">
                      {t("tasks.todo")}
                    </SelectItem>
                    <SelectItem value="in-progress" className="text-white">
                      {t("tasks.inProgress")}
                    </SelectItem>
                    <SelectItem value="done" className="text-white">
                      {t("tasks.done")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowDialog(false)}
                className="text-slate-400"
                data-ocid="tasks.cancel_button"
              >
                İptal
              </Button>
              <Button
                onClick={handleSave}
                className="bg-violet-600 hover:bg-violet-500 text-white"
                data-ocid="tasks.save_button"
              >
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
