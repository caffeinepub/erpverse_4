import { Cpu, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Machine {
  id: string;
  name: string;
  capacityPerHour: number;
  shiftHoursPerDay: number;
}

interface ProductionOrder {
  id: string;
  product: string;
  quantity: number;
  startDate: string;
  progress: number;
  status: string;
  assignedMachineId?: string;
}

function getUtilizationColor(pct: number) {
  if (pct > 90) return "bg-red-500";
  if (pct > 70) return "bg-amber-500";
  return "bg-emerald-500";
}

export default function CapacityPlanningTab({
  cid,
  t,
}: {
  cid: string;
  t: (k: string) => string;
}) {
  const [machines, setMachines] = useLocalStorage<Machine[]>(
    `erp_capacity_${cid}`,
    [],
  );
  const [orders, setOrders] = useLocalStorage<ProductionOrder[]>(
    `erpverse_production_${cid}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    name: "",
    capacityPerHour: "",
    shiftHoursPerDay: "8",
  });

  const handleAdd = () => {
    if (!form.name.trim() || !form.capacityPerHour) return;
    setMachines((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: form.name,
        capacityPerHour: Number(form.capacityPerHour),
        shiftHoursPerDay: Number(form.shiftHoursPerDay) || 8,
      },
    ]);
    toast.success(t("capacity.machine_added"));
    setForm({ name: "", capacityPerHour: "", shiftHoursPerDay: "8" });
    setShowDialog(false);
  };

  const handleDeleteMachine = (id: string) =>
    setMachines((prev) => prev.filter((m) => m.id !== id));

  const handleAssignMachine = (orderId: string, machineId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, assignedMachineId: machineId || undefined }
          : o,
      ),
    );
  };

  // Utilization: assigned order quantities per machine / daily capacity
  const getMachineUtilization = (machine: Machine) => {
    const assignedOrders = orders.filter(
      (o) => o.assignedMachineId === machine.id && o.status !== "completed",
    );
    const totalUnits = assignedOrders.reduce((s, o) => s + o.quantity, 0);
    const dailyCapacity = machine.capacityPerHour * machine.shiftHoursPerDay;
    if (dailyCapacity === 0) return 0;
    return Math.min(Math.round((totalUnits / dailyCapacity) * 100), 150);
  };

  return (
    <div className="space-y-6">
      {/* Machines */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-slate-400" />
            {t("capacity.machines")}
          </h3>
          <Button
            className="bg-slate-600 hover:bg-slate-500 text-white"
            size="sm"
            onClick={() => setShowDialog(true)}
            data-ocid="capacity.open_modal_button"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t("capacity.add_machine")}
          </Button>
        </div>

        {machines.length === 0 ? (
          <div
            className="text-center py-10 text-slate-500 bg-slate-800 rounded-xl border border-white/5"
            data-ocid="capacity.empty_state"
          >
            <Cpu className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t("capacity.add_machine")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {machines.map((machine, i) => {
              const utilPct = getMachineUtilization(machine);
              const dailyCap =
                machine.capacityPerHour * machine.shiftHoursPerDay;
              const assignedCount = orders.filter(
                (o) =>
                  o.assignedMachineId === machine.id &&
                  o.status !== "completed",
              ).length;
              return (
                <div
                  key={machine.id}
                  className={`bg-slate-800 rounded-xl p-4 border ${
                    utilPct > 90
                      ? "border-red-500/30"
                      : utilPct > 70
                        ? "border-amber-500/30"
                        : "border-white/5"
                  }`}
                  data-ocid={`capacity.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-medium">{machine.name}</p>
                      <p className="text-slate-400 text-xs">
                        {machine.capacityPerHour} {t("capacity.units_per_hour")}{" "}
                        · {machine.shiftHoursPerDay}h/gün
                      </p>
                      <p className="text-slate-500 text-xs">
                        {t("capacity.daily_capacity")}: {dailyCap}{" "}
                        {t("capacity.units")} · {assignedCount}{" "}
                        {t("capacity.assigned_orders")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMachine(machine.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      data-ocid={`capacity.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        {t("capacity.utilization")}
                      </span>
                      <span
                        className={`font-medium ${
                          utilPct > 90
                            ? "text-red-400"
                            : utilPct > 70
                              ? "text-amber-400"
                              : "text-emerald-400"
                        }`}
                      >
                        {utilPct}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getUtilizationColor(utilPct)}`}
                        style={{ width: `${Math.min(utilPct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Assignment */}
      <div>
        <h3 className="text-white font-semibold mb-4">
          {t("capacity.assign_machine")}
        </h3>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            {t("common.noData")}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("production.product")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("production.quantity")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("production.status")}
                  </th>
                  <th className="text-left text-slate-400 text-xs font-medium px-4 py-3">
                    {t("capacity.assign_machine")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr
                    key={order.id}
                    className="border-b border-white/5 last:border-0"
                    data-ocid={`capacity.row.${i + 1}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white text-sm">{order.product}</p>
                      <p className="text-xs text-slate-500">
                        {order.startDate}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-300 text-sm">
                      {order.quantity}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {order.status}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={order.assignedMachineId || ""}
                        onValueChange={(v) => handleAssignMachine(order.id, v)}
                      >
                        <SelectTrigger
                          className="bg-slate-700 border-white/10 text-white h-8 w-44 text-xs"
                          data-ocid={`capacity.select.${i + 1}`}
                        >
                          <SelectValue
                            placeholder={t("capacity.select_machine")}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          <SelectItem
                            value=""
                            className="text-slate-400 text-xs"
                          >
                            {t("capacity.no_machine")}
                          </SelectItem>
                          {machines.map((m) => (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              className="text-white text-xs"
                            >
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Machine Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-800 border-white/10 text-white max-w-md"
          data-ocid="capacity.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("capacity.add_machine")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300 text-sm mb-1.5 block">
                {t("capacity.machine_name")}
              </Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                className="bg-white/10 border-white/20 text-white"
                data-ocid="capacity.input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("capacity.capacity_per_hour")}
                </Label>
                <Input
                  type="number"
                  value={form.capacityPerHour}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, capacityPerHour: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">
                  {t("capacity.shift_hours")}
                </Label>
                <Input
                  type="number"
                  value={form.shiftHoursPerDay}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, shiftHoursPerDay: e.target.value }))
                  }
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="ghost"
              className="text-slate-400"
              onClick={() => setShowDialog(false)}
              data-ocid="capacity.cancel_button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-slate-600 hover:bg-slate-500 text-white"
              onClick={handleAdd}
              data-ocid="capacity.submit_button"
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
