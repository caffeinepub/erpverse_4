import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface CalEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
  source: "hr" | "maintenance" | "contracts" | "tasks" | "custom";
}

const SOURCE_COLORS: Record<CalEvent["source"], string> = {
  hr: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  maintenance: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  contracts: "bg-red-500/20 text-red-300 border-red-500/30",
  tasks: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  custom: "bg-green-500/20 text-green-300 border-green-500/30",
};

const DOT_COLORS: Record<CalEvent["source"], string> = {
  hr: "bg-blue-400",
  maintenance: "bg-orange-400",
  contracts: "bg-red-400",
  tasks: "bg-violet-400",
  custom: "bg-green-400",
};

export default function CalendarModule() {
  const { t } = useLanguage();
  const { company: selectedCompany } = useAuth();
  const companyId = selectedCompany?.id ?? "default";

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    description: "",
  });

  const [customEvents, setCustomEvents] = useState<CalEvent[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`erpverse_calendar_events_${companyId}`) || "[]",
      );
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      `erpverse_calendar_events_${companyId}`,
      JSON.stringify(customEvents),
    );
  }, [customEvents, companyId]);

  const gatherEvents = (): CalEvent[] => {
    const events: CalEvent[] = [...customEvents];

    try {
      const leaves = JSON.parse(
        localStorage.getItem(`erpverse_hr_leaves_${companyId}`) || "[]",
      );
      for (const l of leaves) {
        if (l.startDate)
          events.push({
            id: `hr-${l.id || Math.random()}`,
            title: l.personnel || l.name || "İzin",
            date: l.startDate,
            source: "hr",
          });
      }
    } catch {
      /* empty */
    }

    try {
      const maintenance = JSON.parse(
        localStorage.getItem(`erpverse_maintenance_${companyId}`) || "[]",
      );
      for (const m of maintenance) {
        if (m.scheduledDate)
          events.push({
            id: `maint-${m.id || Math.random()}`,
            title: m.title || m.equipment || "Bakım",
            date: m.scheduledDate,
            source: "maintenance",
          });
      }
    } catch {
      /* empty */
    }

    try {
      const contracts = JSON.parse(
        localStorage.getItem(`erpverse_contracts_${companyId}`) || "[]",
      );
      for (const c of contracts) {
        if (c.endDate)
          events.push({
            id: `contract-${c.id || Math.random()}`,
            title: c.name || c.title || "Sözleşme",
            date: c.endDate,
            source: "contracts",
          });
      }
    } catch {
      /* empty */
    }

    try {
      const tasks = JSON.parse(
        localStorage.getItem(`erpverse_tasks_${companyId}`) || "[]",
      );
      for (const task of tasks) {
        if (task.dueDate)
          events.push({
            id: `task-${task.id || Math.random()}`,
            title: task.title || "Görev",
            date: task.dueDate,
            source: "tasks",
          });
      }
    } catch {
      /* empty */
    }

    return events;
  };

  const allEvents = gatherEvents();

  const getDaysInMonth = (y: number, m: number) =>
    new Date(y, m + 1, 0).getDate();
  const getFirstDayOfWeek = (y: number, m: number) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday=0
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const formatDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const eventsForDay = (dateStr: string) =>
    allEvents.filter((e) => e.date === dateStr);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);
  const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

  const MONTH_NAMES = [
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
  const DAY_NAMES = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const selectedEvents = selectedDay ? eventsForDay(selectedDay) : [];

  const handleAddEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return;
    const ev: CalEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: newEvent.date,
      description: newEvent.description,
      source: "custom",
    };
    setCustomEvents((prev) => [...prev, ev]);
    setNewEvent({ title: "", date: "", description: "" });
    setShowAddDialog(false);
  };

  const removeCustomEvent = (id: string) => {
    setCustomEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const cells = Array.from({ length: totalCells }, (_, idx) => {
    const dayNum = idx - firstDayOfWeek + 1;
    const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
    const dateStr = isCurrentMonth ? formatDate(year, month, dayNum) : "";
    return { idx, dayNum, isCurrentMonth, dateStr };
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-sky-400" />
          <h2 className="text-xl font-bold text-white">
            {t("modules.Calendar")}
          </h2>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-sky-600 hover:bg-sky-500 text-white"
          data-ocid="calendar.open_modal_button"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t("calendar.addEvent")}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {(Object.keys(DOT_COLORS) as CalEvent["source"][]).map((src) => (
          <div key={src} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${DOT_COLORS[src]}`} />
            <span className="text-xs text-slate-400">
              {src === "hr"
                ? t("calendar.sources.hr")
                : src === "maintenance"
                  ? t("calendar.sources.maintenance")
                  : src === "contracts"
                    ? t("calendar.sources.contracts")
                    : src === "tasks"
                      ? t("calendar.sources.tasks")
                      : t("calendar.sources.custom")}
            </span>
          </div>
        ))}
      </div>

      {/* Month navigation */}
      <div className="bg-slate-800 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="text-slate-300 hover:text-white"
            data-ocid="calendar.pagination_prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-white font-semibold">
            {MONTH_NAMES[month]} {year}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="text-slate-300 hover:text-white"
            data-ocid="calendar.pagination_next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/10">
          {DAY_NAMES.map((d) => (
            <div
              key={d}
              className="p-2 text-center text-xs font-medium text-slate-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map(({ idx, dayNum, isCurrentMonth, dateStr }) => {
            const dayEvents = isCurrentMonth ? eventsForDay(dateStr) : [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;

            return (
              <button
                type="button"
                key={`cell-${idx}`}
                onClick={() =>
                  isCurrentMonth && setSelectedDay(isSelected ? null : dateStr)
                }
                data-ocid="calendar.canvas_target"
                className={`min-h-[72px] p-1.5 border-b border-r border-white/5 text-left transition-colors ${
                  !isCurrentMonth ? "opacity-0 pointer-events-none" : ""
                } ${
                  isSelected
                    ? "bg-sky-600/20"
                    : isToday
                      ? "bg-slate-700/60"
                      : "hover:bg-slate-700/40"
                }`}
              >
                <span
                  className={`text-xs font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full ${
                    isToday
                      ? "bg-sky-500 text-white"
                      : isSelected
                        ? "text-sky-300"
                        : "text-slate-300"
                  }`}
                >
                  {isCurrentMonth ? dayNum : ""}
                </span>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div
                      key={ev.id}
                      className={`w-full h-1.5 rounded-full ${DOT_COLORS[ev.source]}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-slate-400">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div
          className="bg-slate-800 border border-white/10 rounded-xl p-4"
          data-ocid="calendar.panel"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">{selectedDay}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDay(null)}
              className="text-slate-400"
              data-ocid="calendar.close_button"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {selectedEvents.length === 0 ? (
            <p
              className="text-slate-400 text-sm"
              data-ocid="calendar.empty_state"
            >
              {t("calendar.noEvents")}
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev, i) => (
                <div
                  key={ev.id}
                  data-ocid={`calendar.item.${i + 1}`}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 border text-sm ${SOURCE_COLORS[ev.source]}`}
                >
                  <div>
                    <span className="font-medium">{ev.title}</span>
                    {ev.description && (
                      <p className="text-xs opacity-70 mt-0.5">
                        {ev.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-[10px] ${SOURCE_COLORS[ev.source]}`}
                    >
                      {ev.source === "hr"
                        ? t("calendar.sources.hr")
                        : ev.source === "maintenance"
                          ? t("calendar.sources.maintenance")
                          : ev.source === "contracts"
                            ? t("calendar.sources.contracts")
                            : ev.source === "tasks"
                              ? t("calendar.sources.tasks")
                              : t("calendar.sources.custom")}
                    </Badge>
                    {ev.source === "custom" && (
                      <button
                        type="button"
                        onClick={() => removeCustomEvent(ev.id)}
                        data-ocid={`calendar.delete_button.${i + 1}`}
                        className="opacity-60 hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white"
          data-ocid="calendar.dialog"
        >
          <DialogHeader>
            <DialogTitle>{t("calendar.addEvent")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">{t("calendar.title")}</Label>
              <Input
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="calendar.input"
              />
            </div>
            <div>
              <Label className="text-slate-300">{t("calendar.date")}</Label>
              <Input
                type="date"
                value={newEvent.date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, date: e.target.value })
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">{t("tasks.description")}</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                rows={2}
                data-ocid="calendar.textarea"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowAddDialog(false)}
                className="text-slate-400"
                data-ocid="calendar.cancel_button"
              >
                İptal
              </Button>
              <Button
                onClick={handleAddEvent}
                className="bg-sky-600 hover:bg-sky-500 text-white"
                data-ocid="calendar.save_button"
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
