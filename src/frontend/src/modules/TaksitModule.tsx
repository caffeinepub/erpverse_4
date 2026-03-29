import { ArrowLeft, CheckCircle, CreditCard, Plus, Wallet } from "lucide-react";
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
import { useAuditLog } from "../contexts/AuditLogContext";
import { useAuth } from "../contexts/AuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Installment {
  id: string;
  index: number;
  dueDate: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  paidDate?: string;
}

interface InstallmentPlan {
  id: string;
  name: string;
  customerName: string;
  totalAmount: number;
  currency: string;
  installmentCount: number;
  frequency: "monthly" | "biweekly" | "weekly";
  startDate: string;
  notes: string;
  installments: Installment[];
  createdAt: string;
}

const EMPTY_FORM = {
  name: "",
  customerName: "",
  totalAmount: "",
  installmentCount: "12",
  startDate: "",
  frequency: "monthly" as InstallmentPlan["frequency"],
  currency: "TRY",
  notes: "",
};

function generateInstallments(
  total: number,
  count: number,
  startDate: string,
  frequency: InstallmentPlan["frequency"],
): Installment[] {
  const perInstallment = total / count;
  const installments: Installment[] = [];
  let current = new Date(startDate);
  for (let i = 0; i < count; i++) {
    installments.push({
      id: `${Date.now()}-${i}`,
      index: i + 1,
      dueDate: current.toISOString().split("T")[0],
      amount: Math.round(perInstallment * 100) / 100,
      status: "pending",
    });
    const next = new Date(current);
    if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
    else if (frequency === "biweekly") next.setDate(next.getDate() + 14);
    else next.setDate(next.getDate() + 7);
    current = next;
  }
  return installments;
}

function getEffectiveStatus(
  inst: Installment,
  today: string,
): "pending" | "paid" | "overdue" {
  if (inst.status === "paid") return "paid";
  if (inst.dueDate < today) return "overdue";
  return "pending";
}

export default function TaksitModule() {
  const { company } = useAuth();
  const companyId = company?.id ?? "default";
  const { addLog } = useAuditLog();
  const [plans, setPlans] = useLocalStorage<InstallmentPlan[]>(
    `erpverse_taksit_${companyId}`,
    [],
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const today = new Date().toISOString().split("T")[0];

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  const fmt = (n: number, currency = "TRY") =>
    n.toLocaleString("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });

  // Summary stats
  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => {
    const allPaid = p.installments.every((i) => i.status === "paid");
    return !allPaid;
  }).length;
  const totalReceivable = plans.reduce((s, p) => {
    const unpaid = p.installments
      .filter((i) => i.status !== "paid")
      .reduce((a, i) => a + i.amount, 0);
    return s + unpaid;
  }, 0);
  const totalCollected = plans.reduce((s, p) => {
    const paid = p.installments
      .filter((i) => i.status === "paid")
      .reduce((a, i) => a + i.amount, 0);
    return s + paid;
  }, 0);

  const handleCreate = () => {
    if (
      !form.name.trim() ||
      !form.customerName.trim() ||
      !form.totalAmount ||
      !form.startDate
    ) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }
    const total = Number(form.totalAmount);
    const count = Number(form.installmentCount);
    if (total <= 0 || count < 2 || count > 60) {
      toast.error("Geçersiz tutar veya taksit sayısı");
      return;
    }
    const installments = generateInstallments(
      total,
      count,
      form.startDate,
      form.frequency,
    );
    const plan: InstallmentPlan = {
      id: Date.now().toString(),
      name: form.name,
      customerName: form.customerName,
      totalAmount: total,
      currency: form.currency,
      installmentCount: count,
      frequency: form.frequency,
      startDate: form.startDate,
      notes: form.notes,
      installments,
      createdAt: new Date().toISOString(),
    };
    setPlans((prev) => [...prev, plan]);
    addLog({
      action: "Taksit Planı Oluşturuldu",
      module: "Taksit",
      detail: `${plan.name} - ${plan.customerName} - ${fmt(plan.totalAmount, plan.currency)}`,
    });
    toast.success(`${plan.name} planı oluşturuldu`);
    setShowDialog(false);
    setForm({ ...EMPTY_FORM });
  };

  const handleMarkPaid = (planId: string, installmentId: string) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== planId) return p;
        return {
          ...p,
          installments: p.installments.map((i) =>
            i.id === installmentId
              ? { ...i, status: "paid", paidDate: today }
              : i,
          ),
        };
      }),
    );
    addLog({
      action: "Taksit Ödendi",
      module: "Taksit",
      detail: `Plan ID: ${planId}`,
    });
    toast.success("Taksit ödendi olarak işaretlendi");
  };

  const handleDeletePlan = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    setSelectedPlanId(null);
    addLog({
      action: "Taksit Planı Silindi",
      module: "Taksit",
      detail: plan?.name ?? planId,
    });
    toast.success("Plan silindi");
  };

  const statusBadge = (status: "pending" | "paid" | "overdue") => {
    if (status === "paid")
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          Ödendi
        </Badge>
      );
    if (status === "overdue")
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
          Gecikti
        </Badge>
      );
    return (
      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        Bekliyor
      </Badge>
    );
  };

  const planStatusBadge = (plan: InstallmentPlan) => {
    const allPaid = plan.installments.every((i) => i.status === "paid");
    if (allPaid)
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          Tamamlandı
        </Badge>
      );
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
        Aktif
      </Badge>
    );
  };

  const freqLabel = (f: InstallmentPlan["frequency"]) => {
    if (f === "monthly") return "Aylık";
    if (f === "biweekly") return "2 Haftada Bir";
    return "Haftalık";
  };

  // Detail view
  if (selectedPlan) {
    const paidCount = selectedPlan.installments.filter(
      (i) => i.status === "paid",
    ).length;
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPlanId(null)}
            data-ocid="taksit.close_button"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Geri
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">
              {selectedPlan.name}
            </h2>
            <p className="text-sm text-slate-400">
              {selectedPlan.customerName}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeletePlan(selectedPlan.id)}
            data-ocid="taksit.delete_button"
          >
            Planı Sil
          </Button>
        </div>

        {/* Plan header cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Toplam Tutar</p>
              <p className="text-lg font-bold text-white">
                {fmt(selectedPlan.totalAmount, selectedPlan.currency)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Taksit</p>
              <p className="text-lg font-bold text-white">
                {paidCount}/{selectedPlan.installmentCount}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Frekans</p>
              <p className="text-lg font-bold text-white">
                {freqLabel(selectedPlan.frequency)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400">Başlangıç</p>
              <p className="text-lg font-bold text-white">
                {selectedPlan.startDate}
              </p>
            </CardContent>
          </Card>
        </div>

        {selectedPlan.notes && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-300">
            <span className="text-slate-400 font-medium">Not: </span>
            {selectedPlan.notes}
          </div>
        )}

        {/* Installments table */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">#</th>
                <th className="text-left px-4 py-3">Vade Tarihi</th>
                <th className="text-right px-4 py-3">Tutar</th>
                <th className="text-left px-4 py-3">Durum</th>
                <th className="text-left px-4 py-3">Ödeme Tarihi</th>
                <th className="text-right px-4 py-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {selectedPlan.installments.map((inst, idx) => {
                const effective = getEffectiveStatus(inst, today);
                return (
                  <tr
                    key={inst.id}
                    className="border-t border-slate-700 hover:bg-slate-750"
                    data-ocid={`taksit.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 text-slate-300">{inst.index}</td>
                    <td className="px-4 py-3 text-slate-300">{inst.dueDate}</td>
                    <td className="px-4 py-3 text-right text-white font-medium">
                      {fmt(inst.amount, selectedPlan.currency)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(effective)}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {inst.paidDate ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {effective !== "paid" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                          onClick={() =>
                            handleMarkPaid(selectedPlan.id, inst.id)
                          }
                          data-ocid={`taksit.confirm_button.${idx + 1}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Ödendi
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-violet-400" />
            Taksit & Ödeme Planı
          </h1>
          <p className="text-slate-400 mt-1">
            Müşteri taksit planlarını oluşturun ve takip edin
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="bg-violet-600 hover:bg-violet-700"
          data-ocid="taksit.primary_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Plan Oluştur
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-normal">
              Toplam Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{totalPlans}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-normal">
              Aktif Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">{activePlans}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-normal">
              Toplam Alacak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-400">
              {totalReceivable.toLocaleString("tr-TR", {
                maximumFractionDigits: 0,
              })}{" "}
              ₺
            </p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-slate-400 font-normal">
              Toplam Tahsil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              {totalCollected.toLocaleString("tr-TR", {
                maximumFractionDigits: 0,
              })}{" "}
              ₺
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plans list */}
      {plans.length === 0 ? (
        <div
          className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center"
          data-ocid="taksit.empty_state"
        >
          <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Henüz taksit planı oluşturulmadı</p>
          <Button
            onClick={() => setShowDialog(true)}
            variant="outline"
            className="mt-4 border-slate-600 text-slate-300"
          >
            İlk planı oluştur
          </Button>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3">Plan Adı</th>
                <th className="text-left px-4 py-3">Müşteri</th>
                <th className="text-right px-4 py-3">Toplam Tutar</th>
                <th className="text-left px-4 py-3">Taksit</th>
                <th className="text-left px-4 py-3">Durum</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, idx) => {
                const paidCount = plan.installments.filter(
                  (i) => i.status === "paid",
                ).length;
                return (
                  <tr
                    key={plan.id}
                    className="border-t border-slate-700 hover:bg-slate-700/50 cursor-pointer"
                    onClick={() => setSelectedPlanId(plan.id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setSelectedPlanId(plan.id)
                    }
                    data-ocid={`taksit.item.${idx + 1}`}
                  >
                    <td className="px-4 py-3 text-white font-medium">
                      {plan.name}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {plan.customerName}
                    </td>
                    <td className="px-4 py-3 text-right text-white">
                      {fmt(plan.totalAmount, plan.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {paidCount}/{plan.installmentCount}
                    </td>
                    <td className="px-4 py-3">{planStatusBadge(plan)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent
          className="bg-slate-900 border-slate-700 text-white max-w-lg"
          data-ocid="taksit.dialog"
        >
          <DialogHeader>
            <DialogTitle>Yeni Taksit Planı</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-slate-300">Plan Adı *</Label>
                <Input
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Ör: Aylık Ödeme Planı"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  data-ocid="taksit.input"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-slate-300">Müşteri Adı *</Label>
                <Input
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Müşteri adı"
                  value={form.customerName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customerName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Toplam Tutar *</Label>
                <Input
                  type="number"
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="0"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, totalAmount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Para Birimi</Label>
                <Select
                  value={form.currency}
                  onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                >
                  <SelectTrigger
                    className="bg-slate-800 border-slate-600 text-white"
                    data-ocid="taksit.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="TRY">TRY (₺)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Taksit Sayısı (2–60)</Label>
                <Input
                  type="number"
                  min={2}
                  max={60}
                  className="bg-slate-800 border-slate-600 text-white"
                  value={form.installmentCount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, installmentCount: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Frekans</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      frequency: v as InstallmentPlan["frequency"],
                    }))
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    <SelectItem value="monthly">Aylık</SelectItem>
                    <SelectItem value="biweekly">2 Haftada Bir</SelectItem>
                    <SelectItem value="weekly">Haftalık</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-slate-300">Başlangıç Tarihi *</Label>
                <Input
                  type="date"
                  className="bg-slate-800 border-slate-600 text-white"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-slate-300">Notlar</Label>
                <Input
                  className="bg-slate-800 border-slate-600 text-white"
                  placeholder="Opsiyonel not"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  data-ocid="taksit.textarea"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDialog(false);
                  setForm({ ...EMPTY_FORM });
                }}
                className="text-slate-300"
                data-ocid="taksit.cancel_button"
              >
                İptal
              </Button>
              <Button
                onClick={handleCreate}
                className="bg-violet-600 hover:bg-violet-700"
                data-ocid="taksit.submit_button"
              >
                Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
