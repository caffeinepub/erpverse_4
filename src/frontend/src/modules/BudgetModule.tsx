import { PiggyBank, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface BudgetItem {
  id: string;
  category: string;
  description: string;
  type: "income" | "expense";
  period: string;
  plannedAmount: number;
  actualAmount: number;
}

export default function BudgetModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const cid = company?.id || "default";

  const [items, setItems] = useLocalStorage<BudgetItem[]>(
    `erp_budget_${cid}`,
    [],
  );
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    category: "",
    description: "",
    type: "income" as BudgetItem["type"],
    period: "",
    plannedAmount: "",
    actualAmount: "",
  });

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    });

  const incomeItems = items.filter((i) => i.type === "income");
  const expenseItems = items.filter((i) => i.type === "expense");
  const plannedIncome = incomeItems.reduce((s, i) => s + i.plannedAmount, 0);
  const plannedExpense = expenseItems.reduce((s, i) => s + i.plannedAmount, 0);
  const actualIncome = incomeItems.reduce((s, i) => s + i.actualAmount, 0);
  const actualExpense = expenseItems.reduce((s, i) => s + i.actualAmount, 0);
  const netDiff = actualIncome - actualExpense;

  const openAdd = () => {
    setEditId(null);
    setForm({
      category: "",
      description: "",
      type: "income",
      period: "",
      plannedAmount: "",
      actualAmount: "0",
    });
    setShowDialog(true);
  };

  const openEdit = (item: BudgetItem) => {
    setEditId(item.id);
    setForm({
      category: item.category,
      description: item.description,
      type: item.type,
      period: item.period,
      plannedAmount: String(item.plannedAmount),
      actualAmount: String(item.actualAmount),
    });
    setShowDialog(true);
  };

  const save = () => {
    if (!form.category.trim() || !form.period.trim()) return;
    const data: BudgetItem = {
      id: editId || Date.now().toString(),
      category: form.category,
      description: form.description,
      type: form.type,
      period: form.period,
      plannedAmount: Number(form.plannedAmount),
      actualAmount: Number(form.actualAmount),
    };
    if (editId) {
      setItems((prev) => prev.map((i) => (i.id === editId ? data : i)));
      toast.success(t("common.updated"));
    } else {
      setItems((prev) => [...prev, data]);
      toast.success(t("common.added"));
    }
    setShowDialog(false);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success(t("common.deleted"));
  };

  // Group by category for summary
  const categoryMap = items.reduce<
    Record<string, { planned: number; actual: number; type: string }>
  >((acc, item) => {
    if (!acc[item.category])
      acc[item.category] = { planned: 0, actual: 0, type: item.type };
    acc[item.category].planned += item.plannedAmount;
    acc[item.category].actual += item.actualAmount;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <PiggyBank className="w-7 h-7 text-violet-400" />
        <h2 className="text-2xl font-bold text-white">{t("modules.Budget")}</h2>
      </div>

      <Tabs defaultValue="items">
        <TabsList className="bg-slate-800 border border-white/10">
          <TabsTrigger
            value="items"
            data-ocid="budget.items.tab"
            className="data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-300"
          >
            {t("budget.items")}
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            data-ocid="budget.summary.tab"
            className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300"
          >
            {t("budget.summary")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <div className="flex justify-end mb-3">
            <Button
              onClick={openAdd}
              className="bg-violet-500 hover:bg-violet-600 text-white"
              data-ocid="budget.item.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("budget.addItem")}
            </Button>
          </div>
          {items.length === 0 ? (
            <div
              className="text-center py-12 text-slate-500"
              data-ocid="budget.items.empty_state"
            >
              <PiggyBank className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t("budget.noItems")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("budget.category")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("budget.description")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("budget.type")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("budget.period")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("budget.planned")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("budget.actual")}
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow
                      key={item.id}
                      className="border-white/5 hover:bg-white/5"
                      data-ocid={`budget.item.row.${idx + 1}`}
                    >
                      <TableCell className="text-white font-medium">
                        {item.category}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {item.description}
                      </TableCell>
                      <TableCell>
                        {item.type === "income" ? (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {t("budget.income")}
                          </Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {t("budget.expense")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {item.period}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {fmt(item.plannedAmount)}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {fmt(item.actualAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(item)}
                            data-ocid={`budget.item.edit_button.${idx + 1}`}
                            className="text-slate-400 hover:text-white"
                          >
                            {t("common.edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteItem(item.id)}
                            data-ocid={`budget.item.delete_button.${idx + 1}`}
                            className="text-red-400 hover:text-red-300"
                          >
                            {t("common.delete")}
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

        <TabsContent value="summary">
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              {
                label: t("budget.plannedIncome"),
                value: fmt(plannedIncome),
                color: "text-green-400",
                bg: "bg-green-500/10 border-green-500/20",
              },
              {
                label: t("budget.plannedExpense"),
                value: fmt(plannedExpense),
                color: "text-red-400",
                bg: "bg-red-500/10 border-red-500/20",
              },
              {
                label: t("budget.actualIncome"),
                value: fmt(actualIncome),
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
              {
                label: t("budget.actualExpense"),
                value: fmt(actualExpense),
                color: "text-orange-400",
                bg: "bg-orange-500/10 border-orange-500/20",
              },
              {
                label: t("budget.netDiff"),
                value: fmt(netDiff),
                color: netDiff >= 0 ? "text-green-400" : "text-red-400",
                bg:
                  netDiff >= 0
                    ? "bg-green-500/10 border-green-500/20"
                    : "bg-red-500/10 border-red-500/20",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.bg} border rounded-xl p-4`}
              >
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className={`${stat.color} text-xl font-bold mt-1`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          {Object.keys(categoryMap).length === 0 ? (
            <div
              className="text-center py-8 text-slate-500"
              data-ocid="budget.summary.empty_state"
            >
              <p>{t("budget.noItems")}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">
                      {t("budget.category")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("budget.type")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("budget.planned")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("budget.actual")}
                    </TableHead>
                    <TableHead className="text-slate-400">
                      {t("budget.variance")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(categoryMap).map(([cat, vals], idx) => {
                    const variance = vals.actual - vals.planned;
                    return (
                      <TableRow
                        key={cat}
                        className="border-white/5 hover:bg-white/5"
                        data-ocid={`budget.summary.row.${idx + 1}`}
                      >
                        <TableCell className="text-white font-medium">
                          {cat}
                        </TableCell>
                        <TableCell>
                          {vals.type === "income" ? (
                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                              {t("budget.income")}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                              {t("budget.expense")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {fmt(vals.planned)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {fmt(vals.actual)}
                        </TableCell>
                        <TableCell
                          className={
                            variance >= 0 ? "text-green-400" : "text-red-400"
                          }
                        >
                          {variance >= 0 ? "+" : ""}
                          {fmt(variance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-900 border-white/10 text-white"
          data-ocid="budget.item.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editId ? t("budget.editItem") : t("budget.addItem")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("budget.category")}</Label>
                <Input
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="budget.item.category.input"
                />
              </div>
              <div>
                <Label className="text-slate-300">{t("budget.period")}</Label>
                <Input
                  value={form.period}
                  placeholder="Ocak 2026"
                  onChange={(e) =>
                    setForm((p) => ({ ...p, period: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="budget.item.period.input"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-300">
                {t("budget.description")}
              </Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                className="bg-slate-800 border-white/10 text-white mt-1"
                data-ocid="budget.item.desc.input"
              />
            </div>
            <div>
              <Label className="text-slate-300">{t("budget.type")}</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, type: v as BudgetItem["type"] }))
                }
              >
                <SelectTrigger
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="budget.item.type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10">
                  <SelectItem value="income" className="text-green-300">
                    {t("budget.income")}
                  </SelectItem>
                  <SelectItem value="expense" className="text-red-300">
                    {t("budget.expense")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">{t("budget.planned")}</Label>
                <Input
                  type="number"
                  value={form.plannedAmount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, plannedAmount: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="budget.item.planned.input"
                />
              </div>
              <div>
                <Label className="text-slate-300">{t("budget.actual")}</Label>
                <Input
                  type="number"
                  value={form.actualAmount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, actualAmount: e.target.value }))
                  }
                  className="bg-slate-800 border-white/10 text-white mt-1"
                  data-ocid="budget.item.actual.input"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowDialog(false)}
                data-ocid="budget.item.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-violet-500 hover:bg-violet-600"
                onClick={save}
                data-ocid="budget.item.submit_button"
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
