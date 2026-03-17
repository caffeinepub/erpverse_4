import {
  CheckCircle,
  ClipboardCheck,
  MinusCircle,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface ChecklistItem {
  id: string;
  name: string;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  category: "production" | "warehouse" | "delivery" | "general";
  items: ChecklistItem[];
}

type ItemResult = "pass" | "fail" | "na" | null;

interface InspectionItemResult {
  itemId: string;
  result: ItemResult;
}

type InspectionStatus = "open" | "inprogress" | "completed" | "failed";

interface Inspection {
  id: string;
  templateId: string;
  templateName: string;
  reference: string;
  responsible: string;
  date: string;
  results: InspectionItemResult[];
  templateItems: ChecklistItem[];
}

const STORAGE_KEY = "erpverse_quality_checklist";

function loadData(): {
  templates: ChecklistTemplate[];
  inspections: Inspection[];
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { templates: [], inspections: [] };
}

function saveData(d: {
  templates: ChecklistTemplate[];
  inspections: Inspection[];
}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function getStatus(inspection: Inspection): InspectionStatus {
  const { results, templateItems } = inspection;
  if (results.length === 0 || results.every((r) => r.result === null))
    return "open";
  if (results.some((r) => r.result === "fail")) return "failed";
  const filled = results.filter((r) => r.result !== null);
  if (
    filled.length === templateItems.length &&
    results.every((r) => r.result === "pass" || r.result === "na")
  )
    return "completed";
  return "inprogress";
}

export default function QualityChecklistModule() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"templates" | "inspections">(
    "templates",
  );
  const [data, setData] = useState(() => loadData());

  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplCategory, setTplCategory] =
    useState<ChecklistTemplate["category"]>("general");
  const [tplItems, setTplItems] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState("");

  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [insTemplateId, setInsTemplateId] = useState("");
  const [insReference, setInsReference] = useState("");
  const [insResponsible, setInsResponsible] = useState("");
  const [insDate, setInsDate] = useState(new Date().toISOString().slice(0, 10));

  const [expandedId, setExpandedId] = useState<string | null>(null);

  function update(newData: typeof data) {
    setData(newData);
    saveData(newData);
  }

  function addTemplateItem() {
    if (!newItemName.trim()) return;
    setTplItems((prev) => [...prev, newItemName.trim()]);
    setNewItemName("");
  }

  function saveTemplate() {
    if (!tplName.trim()) return;
    const template: ChecklistTemplate = {
      id: Date.now().toString(),
      name: tplName.trim(),
      category: tplCategory,
      items: tplItems.map((name, i) => ({ id: `${Date.now()}_${i}`, name })),
    };
    update({ ...data, templates: [...data.templates, template] });
    setTplName("");
    setTplCategory("general");
    setTplItems([]);
    setShowTemplateForm(false);
  }

  function deleteTemplate(id: string) {
    update({
      ...data,
      templates: data.templates.filter((tmpl) => tmpl.id !== id),
    });
  }

  function startInspection() {
    if (!insTemplateId || !insReference.trim() || !insResponsible.trim())
      return;
    const tpl = data.templates.find((tmpl) => tmpl.id === insTemplateId);
    if (!tpl) return;
    const inspection: Inspection = {
      id: Date.now().toString(),
      templateId: tpl.id,
      templateName: tpl.name,
      reference: insReference.trim(),
      responsible: insResponsible.trim(),
      date: insDate,
      results: tpl.items.map((item) => ({ itemId: item.id, result: null })),
      templateItems: tpl.items,
    };
    update({ ...data, inspections: [...data.inspections, inspection] });
    setInsTemplateId("");
    setInsReference("");
    setInsResponsible("");
    setShowInspectionForm(false);
    setExpandedId(inspection.id);
  }

  function setItemResult(
    inspectionId: string,
    itemId: string,
    result: ItemResult,
  ) {
    const updated = data.inspections.map((ins) => {
      if (ins.id !== inspectionId) return ins;
      return {
        ...ins,
        results: ins.results.map((r) =>
          r.itemId === itemId ? { ...r, result } : r,
        ),
      };
    });
    update({ ...data, inspections: updated });
  }

  function deleteInspection(id: string) {
    update({
      ...data,
      inspections: data.inspections.filter((i) => i.id !== id),
    });
    if (expandedId === id) setExpandedId(null);
  }

  const categoryLabel = (cat: ChecklistTemplate["category"]) => {
    const map: Record<string, string> = {
      production: t("qualityChecklist.production"),
      warehouse: t("qualityChecklist.warehouse"),
      delivery: t("qualityChecklist.delivery"),
      general: t("qualityChecklist.general"),
    };
    return map[cat] || cat;
  };

  const statusColors: Record<InspectionStatus, string> = {
    open: "bg-gray-100 text-gray-700",
    inprogress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  const statusLabel = (s: InspectionStatus) => {
    const map: Record<InspectionStatus, string> = {
      open: t("qualityChecklist.status.open"),
      inprogress: t("qualityChecklist.status.inprogress"),
      completed: t("qualityChecklist.status.completed"),
      failed: t("qualityChecklist.status.failed"),
    };
    return map[s];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="w-7 h-7 text-teal-500" />
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {t("qualityChecklist.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("qualityChecklist.subtitle")}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          data-ocid="qualitychecklist.tab"
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "templates"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("qualityChecklist.templates")}
        </button>
        <button
          type="button"
          data-ocid="qualitychecklist.tab"
          onClick={() => setActiveTab("inspections")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "inspections"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("qualityChecklist.inspections")}
        </button>
      </div>

      {activeTab === "templates" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              data-ocid="qualitychecklist.primary_button"
              onClick={() => setShowTemplateForm(!showTemplateForm)}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("qualityChecklist.addTemplate")}
            </button>
          </div>

          {showTemplateForm && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("qualityChecklist.templateName")}
                  </p>
                  <input
                    data-ocid="qualitychecklist.input"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("qualityChecklist.category")}
                  </p>
                  <select
                    data-ocid="qualitychecklist.select"
                    value={tplCategory}
                    onChange={(e) =>
                      setTplCategory(
                        e.target.value as ChecklistTemplate["category"],
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="production">
                      {t("qualityChecklist.production")}
                    </option>
                    <option value="warehouse">
                      {t("qualityChecklist.warehouse")}
                    </option>
                    <option value="delivery">
                      {t("qualityChecklist.delivery")}
                    </option>
                    <option value="general">
                      {t("qualityChecklist.general")}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t("qualityChecklist.items")}
                </p>
                <div className="space-y-1">
                  {tplItems.map((item, idx) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setTplItems((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="ml-auto text-destructive hover:opacity-70"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      data-ocid="qualitychecklist.input"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTemplateItem()}
                      placeholder={t("qualityChecklist.itemName")}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      data-ocid="qualitychecklist.secondary_button"
                      onClick={addTemplateItem}
                      className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm transition-colors"
                    >
                      {t("qualityChecklist.addItem")}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  data-ocid="qualitychecklist.cancel_button"
                  onClick={() => setShowTemplateForm(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  {t("common.cancel") || "İptal"}
                </button>
                <button
                  type="button"
                  data-ocid="qualitychecklist.submit_button"
                  onClick={saveTemplate}
                  className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                >
                  {t("common.save") || "Kaydet"}
                </button>
              </div>
            </div>
          )}

          {data.templates.length === 0 ? (
            <div
              data-ocid="qualitychecklist.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t("qualityChecklist.noTemplates")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.templates.map((tpl, idx) => (
                <div
                  key={tpl.id}
                  data-ocid={`qualitychecklist.item.${idx + 1}`}
                  className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {categoryLabel(tpl.category)} · {tpl.items.length}{" "}
                      {t("qualityChecklist.items")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {tpl.items.slice(0, 3).map((item) => (
                        <span
                          key={item.id}
                          className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full"
                        >
                          {item.name}
                        </span>
                      ))}
                      {tpl.items.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{tpl.items.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-ocid={`qualitychecklist.delete_button.${idx + 1}`}
                    onClick={() => deleteTemplate(tpl.id)}
                    className="text-destructive hover:opacity-70 transition-opacity shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "inspections" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              data-ocid="qualitychecklist.primary_button"
              onClick={() => setShowInspectionForm(!showInspectionForm)}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("qualityChecklist.addInspection")}
            </button>
          </div>

          {showInspectionForm && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("qualityChecklist.selectTemplate")}
                  </p>
                  <select
                    data-ocid="qualitychecklist.select"
                    value={insTemplateId}
                    onChange={(e) => setInsTemplateId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">
                      {t("qualityChecklist.selectTemplate")}
                    </option>
                    {data.templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("qualityChecklist.reference")}
                  </p>
                  <input
                    data-ocid="qualitychecklist.input"
                    value={insReference}
                    onChange={(e) => setInsReference(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("qualityChecklist.responsible")}
                  </p>
                  <input
                    data-ocid="qualitychecklist.input"
                    value={insResponsible}
                    onChange={(e) => setInsResponsible(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("qualityChecklist.date")}
                  </p>
                  <input
                    type="date"
                    data-ocid="qualitychecklist.input"
                    value={insDate}
                    onChange={(e) => setInsDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  data-ocid="qualitychecklist.cancel_button"
                  onClick={() => setShowInspectionForm(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  {t("common.cancel") || "İptal"}
                </button>
                <button
                  type="button"
                  data-ocid="qualitychecklist.submit_button"
                  onClick={startInspection}
                  className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                >
                  {t("common.save") || "Kaydet"}
                </button>
              </div>
            </div>
          )}

          {data.inspections.length === 0 ? (
            <div
              data-ocid="qualitychecklist.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t("qualityChecklist.noInspections")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.inspections.map((ins, idx) => {
                const status = getStatus(ins);
                const isExpanded = expandedId === ins.id;
                return (
                  <div
                    key={ins.id}
                    data-ocid={`qualitychecklist.item.${idx + 1}`}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors text-left"
                      onClick={() => setExpandedId(isExpanded ? null : ins.id)}
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {ins.reference}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ins.templateName} · {ins.responsible} · {ins.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            statusColors[status]
                          }`}
                        >
                          {statusLabel(status)}
                        </span>
                        <button
                          type="button"
                          data-ocid={`qualitychecklist.delete_button.${idx + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteInspection(ins.id);
                          }}
                          className="text-destructive hover:opacity-70 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border p-4 space-y-2">
                        {ins.templateItems.map((item) => {
                          const result =
                            ins.results.find((r) => r.itemId === item.id)
                              ?.result ?? null;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3"
                            >
                              <span className="text-sm text-foreground">
                                {item.name}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setItemResult(
                                      ins.id,
                                      item.id,
                                      result === "pass" ? null : "pass",
                                    )
                                  }
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    result === "pass"
                                      ? "bg-green-500 text-white"
                                      : "bg-muted hover:bg-green-100 text-muted-foreground hover:text-green-700"
                                  }`}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  {t("qualityChecklist.pass")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setItemResult(
                                      ins.id,
                                      item.id,
                                      result === "fail" ? null : "fail",
                                    )
                                  }
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    result === "fail"
                                      ? "bg-red-500 text-white"
                                      : "bg-muted hover:bg-red-100 text-muted-foreground hover:text-red-700"
                                  }`}
                                >
                                  <XCircle className="w-3 h-3" />
                                  {t("qualityChecklist.fail")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setItemResult(
                                      ins.id,
                                      item.id,
                                      result === "na" ? null : "na",
                                    )
                                  }
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    result === "na"
                                      ? "bg-gray-500 text-white"
                                      : "bg-muted hover:bg-gray-200 text-muted-foreground"
                                  }`}
                                >
                                  <MinusCircle className="w-3 h-3" />
                                  {t("qualityChecklist.na")}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
