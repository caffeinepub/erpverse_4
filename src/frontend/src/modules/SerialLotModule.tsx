import { AlertTriangle, Hash, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useLanguage } from "../contexts/LanguageContext";

interface SerialLotEntry {
  id: string;
  type: "serial" | "lot";
  number: string;
  productName: string;
  quantity: number;
  direction: "in" | "out";
  expiryDate: string;
  status: "active" | "consumed" | "expired";
  date: string;
}

export default function SerialLotModule() {
  const { t } = useLanguage();
  const LS_KEY = "erp_serial_lot";

  const load = (): SerialLotEntry[] => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    } catch {
      return [];
    }
  };
  const save = (d: SerialLotEntry[]) =>
    localStorage.setItem(LS_KEY, JSON.stringify(d));

  const [entries, setEntries] = useState<SerialLotEntry[]>(load);
  const [form, setForm] = useState({
    type: "serial",
    number: "",
    productName: "",
    quantity: "1",
    direction: "in",
    expiryDate: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const computeStatus = (entry: SerialLotEntry): SerialLotEntry["status"] => {
    if (entry.status === "consumed") return "consumed";
    if (entry.expiryDate && entry.expiryDate < today) return "expired";
    return "active";
  };

  const add = () => {
    if (!form.number.trim() || !form.productName.trim()) return;
    const entry: SerialLotEntry = {
      id: Date.now().toString(),
      type: form.type as "serial" | "lot",
      number: form.number.trim(),
      productName: form.productName.trim(),
      quantity: Number.parseInt(form.quantity) || 1,
      direction: form.direction as "in" | "out",
      expiryDate: form.expiryDate,
      status: "active",
      date: form.date,
    };
    const updated = [entry, ...entries];
    setEntries(updated);
    save(updated);
    setForm({
      type: "serial",
      number: "",
      productName: "",
      quantity: "1",
      direction: "in",
      expiryDate: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const consume = (id: string) => {
    const updated = entries.map((e) =>
      e.id === id ? { ...e, status: "consumed" as const } : e,
    );
    setEntries(updated);
    save(updated);
  };

  const remove = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    save(updated);
  };

  const filtered = entries.filter((e) => {
    const s = computeStatus(e);
    if (filterType !== "all" && e.type !== filterType) return false;
    if (filterStatus !== "all" && s !== filterStatus) return false;
    if (
      search &&
      !e.number.toLowerCase().includes(search.toLowerCase()) &&
      !e.productName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const statusColor = (s: string) => {
    if (s === "active")
      return "bg-green-500/20 text-green-300 border-green-500/30";
    if (s === "consumed")
      return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    return "bg-red-500/20 text-red-300 border-red-500/30";
  };

  const statusLabel = (s: string) => {
    if (s === "active") return t("seriallot.active");
    if (s === "consumed") return t("seriallot.consumed");
    return t("seriallot.expired");
  };

  const expiringSoon = entries.filter((e) => {
    if (!e.expiryDate || e.status === "consumed") return false;
    const diff =
      (new Date(e.expiryDate).getTime() - new Date(today).getTime()) / 86400000;
    return diff >= 0 && diff <= 30;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Hash className="w-6 h-6 text-teal-400" />
        <h2 className="text-xl font-bold text-white">
          {t("modules.SerialLot")}
        </h2>
      </div>

      {expiringSoon.length > 0 && (
        <div
          className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3"
          data-ocid="seriallot.expiry_warning"
        >
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <span className="text-yellow-300 text-sm">
            {expiringSoon.length} {t("seriallot.expiringSoonAlert")}
          </span>
        </div>
      )}

      {/* Add form */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
        <h3 className="text-sm font-semibold text-slate-300">
          {t("seriallot.addEntry")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">
              {t("seriallot.type")}
            </Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
            >
              <SelectTrigger
                className="bg-slate-700 border-slate-600 text-white text-sm"
                data-ocid="seriallot.type_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serial">{t("seriallot.serial")}</SelectItem>
                <SelectItem value="lot">{t("seriallot.lot")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">
              {t("seriallot.number")}
            </Label>
            <Input
              value={form.number}
              onChange={(e) =>
                setForm((p) => ({ ...p, number: e.target.value }))
              }
              placeholder={form.type === "serial" ? "SN-001" : "LOT-2024-01"}
              className="bg-slate-700 border-slate-600 text-white text-sm"
              data-ocid="seriallot.number_input"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">
              {t("seriallot.product")}
            </Label>
            <Input
              value={form.productName}
              onChange={(e) =>
                setForm((p) => ({ ...p, productName: e.target.value }))
              }
              placeholder={t("seriallot.productPlaceholder")}
              className="bg-slate-700 border-slate-600 text-white text-sm"
              data-ocid="seriallot.product_input"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">
              {t("seriallot.quantity")}
            </Label>
            <Input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) =>
                setForm((p) => ({ ...p, quantity: e.target.value }))
              }
              className="bg-slate-700 border-slate-600 text-white text-sm"
              data-ocid="seriallot.quantity_input"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">
              {t("seriallot.direction")}
            </Label>
            <Select
              value={form.direction}
              onValueChange={(v) => setForm((p) => ({ ...p, direction: v }))}
            >
              <SelectTrigger
                className="bg-slate-700 border-slate-600 text-white text-sm"
                data-ocid="seriallot.direction_select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in">{t("seriallot.in")}</SelectItem>
                <SelectItem value="out">{t("seriallot.out")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">
              {t("seriallot.expiryDate")}
            </Label>
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, expiryDate: e.target.value }))
              }
              className="bg-slate-700 border-slate-600 text-white text-sm"
              data-ocid="seriallot.expiry_input"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-400 mb-1 block">
              {t("seriallot.date")}
            </Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="bg-slate-700 border-slate-600 text-white text-sm"
              data-ocid="seriallot.date_input"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={add}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              data-ocid="seriallot.add_button"
            >
              <Plus className="w-4 h-4 mr-1" />
              {t("common.add")}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("seriallot.search")}
          className="bg-slate-800 border-slate-700 text-white max-w-xs"
          data-ocid="seriallot.search_input"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger
            className="bg-slate-800 border-slate-700 text-white w-40"
            data-ocid="seriallot.filter_type_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("seriallot.allTypes")}</SelectItem>
            <SelectItem value="serial">{t("seriallot.serial")}</SelectItem>
            <SelectItem value="lot">{t("seriallot.lot")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger
            className="bg-slate-800 border-slate-700 text-white w-40"
            data-ocid="seriallot.filter_status_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("seriallot.allStatuses")}</SelectItem>
            <SelectItem value="active">{t("seriallot.active")}</SelectItem>
            <SelectItem value="consumed">{t("seriallot.consumed")}</SelectItem>
            <SelectItem value="expired">{t("seriallot.expired")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-12 text-slate-500"
          data-ocid="seriallot.empty_state"
        >
          <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>{t("seriallot.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2" data-ocid="seriallot.list">
          {filtered.map((entry, idx) => {
            const s = computeStatus(entry);
            return (
              <div
                key={entry.id}
                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 flex items-center gap-3"
                data-ocid={`seriallot.item.${idx + 1}`}
              >
                <div
                  className={`px-2 py-1 rounded text-xs font-mono font-bold ${entry.type === "serial" ? "bg-teal-500/20 text-teal-300" : "bg-purple-500/20 text-purple-300"}`}
                >
                  {entry.type === "serial" ? "SN" : "LOT"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-sm font-semibold">
                      {entry.number}
                    </span>
                    <Badge className={`text-xs border ${statusColor(s)}`}>
                      {statusLabel(s)}
                    </Badge>
                    <Badge
                      className={`text-xs border ${entry.direction === "in" ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-red-500/20 text-red-300 border-red-500/30"}`}
                    >
                      {entry.direction === "in"
                        ? t("seriallot.in")
                        : t("seriallot.out")}
                    </Badge>
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    <span>{entry.productName}</span>
                    <span className="mx-2">·</span>
                    <span>
                      {t("seriallot.qty")}: {entry.quantity}
                    </span>
                    <span className="mx-2">·</span>
                    <span>{entry.date}</span>
                    {entry.expiryDate && (
                      <>
                        <span className="mx-2">·</span>
                        <span
                          className={
                            entry.expiryDate < today ? "text-red-400" : ""
                          }
                        >
                          {t("seriallot.expires")}: {entry.expiryDate}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {s === "active" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => consume(entry.id)}
                      className="text-xs border-slate-600 text-slate-300 hover:text-white"
                      data-ocid={`seriallot.consume_button.${idx + 1}`}
                    >
                      {t("seriallot.consume")}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(entry.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    data-ocid={`seriallot.delete_button.${idx + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
