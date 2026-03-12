import { ChevronDown, ChevronRight, FolderKanban, Plus } from "lucide-react";
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

type ProjectStatus = "planning" | "active" | "completed" | "paused";

interface Task {
  id: string;
  title: string;
  done: boolean;
}

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  teamSize: number;
  tasks: Task[];
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  completed: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  paused: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export default function ProjectsModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const [projects, setProjects] = useLocalStorage<Project[]>(
    `erpverse_projects_${company?.id || "default"}`,
    [],
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    status: "planning" as ProjectStatus,
    startDate: "",
    endDate: "",
    teamSize: "",
  });

  const handleSave = () => {
    if (!form.name.trim()) return;
    setProjects((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: form.name,
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate,
        teamSize: Number(form.teamSize) || 1,
        tasks: [],
      },
    ]);
    setForm({
      name: "",
      status: "planning",
      startDate: "",
      endDate: "",
      teamSize: "",
    });
    setShowDialog(false);
  };

  const toggleTask = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t,
              ),
            }
          : p,
      ),
    );
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            {t("projects.title")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {projects.length} {t("projects.project").toLowerCase()}
          </p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => setShowDialog(true)}
          data-ocid="projects.add_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("projects.addProject")}
        </Button>
      </div>

      <div className="space-y-3" data-ocid="projects.list">
        {projects.length === 0 ? (
          <div
            className="text-center py-12 text-slate-500"
            data-ocid="projects.empty_state"
          >
            <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t("projects.addProject")}</p>
          </div>
        ) : (
          projects.map((project, i) => {
            const completedTasks = project.tasks.filter((t) => t.done).length;
            const isExpanded = expanded === project.id;
            return (
              <div
                key={project.id}
                className="bg-slate-800 rounded-xl border border-white/5"
                data-ocid={`projects.item.${i + 1}`}
              >
                <button
                  type="button"
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/2 rounded-xl transition-all"
                  onClick={() => setExpanded(isExpanded ? null : project.id)}
                >
                  <div className="flex-1 flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        {project.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {project.startDate} → {project.endDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">
                      {project.teamSize} {t("projects.team")}
                    </span>
                    {project.tasks.length > 0 && (
                      <span className="text-xs text-slate-400">
                        {completedTasks}/{project.tasks.length}{" "}
                        {t("projects.tasks")}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-xs ${STATUS_COLORS[project.status]}`}
                    >
                      {t(`projects.${project.status}_status`)}
                    </Badge>
                  </div>
                </button>

                {isExpanded && project.tasks.length > 0 && (
                  <div className="px-5 pb-4 border-t border-white/5 pt-3">
                    <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">
                      {t("projects.tasks")}
                    </p>
                    <div className="space-y-1.5">
                      {project.tasks.map((task) => (
                        <label
                          key={task.id}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={() => toggleTask(project.id, task.id)}
                            className="rounded border-slate-600 bg-slate-700 text-indigo-500"
                          />
                          <span
                            className={`text-sm ${task.done ? "text-slate-500 line-through" : "text-slate-300"}`}
                          >
                            {task.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {isExpanded && project.tasks.length === 0 && (
                  <div className="px-5 pb-4 border-t border-white/5 pt-3 text-center">
                    <p className="text-xs text-slate-600">
                      {t("projects.tasks")}: 0
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="projects.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("projects.addProject")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("projects.project")}
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="projects.input"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("projects.status")}
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as ProjectStatus }))
                }
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="projects.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="planning" className="text-white">
                    {t("projects.planning_status")}
                  </SelectItem>
                  <SelectItem value="active" className="text-white">
                    {t("projects.active_status")}
                  </SelectItem>
                  <SelectItem value="completed" className="text-white">
                    {t("projects.completed_status")}
                  </SelectItem>
                  <SelectItem value="paused" className="text-white">
                    {t("projects.paused_status")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("projects.startDate")}
                </Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("projects.endDate")}
                </Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endDate: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("projects.team")}
              </Label>
              <Input
                type="number"
                value={form.teamSize}
                onChange={(e) =>
                  setForm((p) => ({ ...p, teamSize: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="projects.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleSave}
                data-ocid="projects.save_button"
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
