import { BarChart3, Plus, Star, Trash2 } from "lucide-react";
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface Survey {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  rating: number;
  comment: string;
  date: string;
  category: string;
  createdBy: string;
}

const STORAGE_KEY = (companyId: string) => `surveys_${companyId}`;

function loadSurveys(companyId: string): Survey[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY(companyId)) || "[]");
  } catch {
    return [];
  }
}

function saveSurveys(companyId: string, surveys: Survey[]) {
  localStorage.setItem(STORAGE_KEY(companyId), JSON.stringify(surveys));
}

export default function SurveyModule() {
  const { t } = useLanguage();
  const { company: currentCompany, user: currentUser } = useAuth();
  const companyId = currentCompany?.id || "";
  const [surveys, setSurveys] = useState<Survey[]>(() =>
    loadSurveys(companyId),
  );
  const [open, setOpen] = useState(false);
  const [filterCustomer, setFilterCustomer] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    title: "",
    rating: 5,
    comment: "",
    category: "general",
  });

  const categories = ["general", "product", "service", "delivery", "support"];

  function save() {
    if (!form.customerName.trim() || !form.title.trim()) return;
    const newSurvey: Survey = {
      id: Date.now().toString(),
      customerId: form.customerId,
      customerName: form.customerName,
      title: form.title,
      rating: form.rating,
      comment: form.comment,
      date: new Date().toISOString().split("T")[0],
      category: form.category,
      createdBy: currentUser?.displayName ?? "",
    };
    const updated = [newSurvey, ...surveys];
    setSurveys(updated);
    saveSurveys(companyId, updated);
    setOpen(false);
    setForm({
      customerId: "",
      customerName: "",
      title: "",
      rating: 5,
      comment: "",
      category: "general",
    });
  }

  function remove(id: string) {
    if (!window.confirm(t("survey.deleteConfirm"))) return;
    const updated = surveys.filter((s) => s.id !== id);
    setSurveys(updated);
    saveSurveys(companyId, updated);
  }

  const customers = Array.from(
    new Set(surveys.map((s) => s.customerName)),
  ).filter(Boolean);

  const filtered = surveys.filter((s) => {
    if (filterCustomer !== "all" && s.customerName !== filterCustomer)
      return false;
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    return true;
  });

  const avgRating = filtered.length
    ? (
        filtered.reduce((sum, s) => sum + s.rating, 0) / filtered.length
      ).toFixed(1)
    : "–";

  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: filtered.filter((s) => s.rating === r).length,
  }));

  function StarDisplay({ rating }: { rating: number }) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${
              s <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-600"
            }`}
          />
        ))}
      </div>
    );
  }

  const ratingColor = (r: number) =>
    r >= 4 ? "text-green-400" : r === 3 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{t("survey.title")}</h2>
          <p className="text-sm text-slate-400">{t("survey.subtitle")}</p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("survey.new")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-xs text-slate-400">{t("survey.totalResponses")}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {filtered.length}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-xs text-slate-400">{t("survey.avgRating")}</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              Number(avgRating) >= 4
                ? "text-green-400"
                : Number(avgRating) >= 3
                  ? "text-yellow-400"
                  : "text-red-400"
            }`}
          >
            {avgRating} / 5
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-xs text-slate-400">{t("survey.satisfied")}</p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {filtered.length
              ? Math.round(
                  (filtered.filter((s) => s.rating >= 4).length /
                    filtered.length) *
                    100,
                )
              : 0}
            %
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-xs text-slate-400">{t("survey.unsatisfied")}</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {filtered.length
              ? Math.round(
                  (filtered.filter((s) => s.rating <= 2).length /
                    filtered.length) *
                    100,
                )
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Rating distribution */}
      {filtered.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-slate-300">
              {t("survey.distribution")}
            </span>
          </div>
          <div className="space-y-2">
            {ratingCounts.map(({ rating, count }) => (
              <div key={rating} className="flex items-center gap-3">
                <span
                  className={`text-sm font-bold w-6 ${ratingColor(rating)}`}
                >
                  {rating}★
                </span>
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      rating >= 4
                        ? "bg-green-500"
                        : rating === 3
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: filtered.length
                        ? `${(count / filtered.length) * 100}%`
                        : "0%",
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-6">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={filterCustomer} onValueChange={setFilterCustomer}>
          <SelectTrigger className="w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              {t("survey.allCustomers")}
            </SelectItem>
            {customers.map((c) => (
              <SelectItem key={c} value={c} className="text-white">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white">
              {t("survey.allCategories")}
            </SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c} className="text-white">
                {t(`survey.cat.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {t("survey.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">
                      {s.customerName}
                    </span>
                    <Badge className="bg-purple-900 text-purple-300 text-xs">
                      {t(`survey.cat.${s.category}`)}
                    </Badge>
                    <StarDisplay rating={s.rating} />
                    <span
                      className={`text-sm font-bold ${ratingColor(s.rating)}`}
                    >
                      {s.rating}/5
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{s.title}</p>
                  {s.comment && (
                    <p className="text-xs text-slate-400 mt-1 italic">
                      "{s.comment}"
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span>{s.date}</span>
                    <span>
                      {t("survey.by")} {s.createdBy}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:bg-red-900/30 shrink-0"
                  onClick={() => remove(s.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("survey.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">{t("survey.customer")}</Label>
              <Input
                className="bg-slate-800 border-slate-700 text-white mt-1"
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                placeholder={t("survey.customerPlaceholder")}
              />
            </div>
            <div>
              <Label className="text-slate-300">
                {t("survey.surveyTitle")}
              </Label>
              <Input
                className="bg-slate-800 border-slate-700 text-white mt-1"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("survey.titlePlaceholder")}
              />
            </div>
            <div>
              <Label className="text-slate-300">{t("survey.category")}</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="text-white">
                      {t(`survey.cat.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">{t("survey.rating")}</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, rating: r })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        r <= form.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-slate-600 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm text-slate-400 ml-2 self-center">
                  {form.rating}/5
                </span>
              </div>
            </div>
            <div>
              <Label className="text-slate-300">{t("survey.comment")}</Label>
              <Textarea
                className="bg-slate-800 border-slate-700 text-white mt-1"
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder={t("survey.commentPlaceholder")}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                className="text-slate-400"
                onClick={() => setOpen(false)}
              >
                {t("survey.cancel")}
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={save}
              >
                {t("survey.save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
