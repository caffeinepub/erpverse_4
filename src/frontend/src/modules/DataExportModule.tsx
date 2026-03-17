import { AlertTriangle, Download, FileJson, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

const MODULE_KEYS: {
  key: string;
  labelKey: string;
  storageKey: (cid: string) => string;
}[] = [
  { key: "HR", labelKey: "modules.HR", storageKey: (c) => `erpverse_hr_${c}` },
  {
    key: "Accounting",
    labelKey: "modules.Accounting",
    storageKey: (c) => `erpverse_accounting_${c}`,
  },
  {
    key: "CRM",
    labelKey: "modules.CRM",
    storageKey: (c) => `erpverse_crm_${c}`,
  },
  {
    key: "Inventory",
    labelKey: "modules.Inventory",
    storageKey: (c) => `erpverse_inventory_${c}`,
  },
  {
    key: "Projects",
    labelKey: "modules.Projects",
    storageKey: (c) => `erpverse_projects_${c}`,
  },
  {
    key: "Purchasing",
    labelKey: "modules.Purchasing",
    storageKey: (c) => `erpverse_purchasing_${c}`,
  },
  {
    key: "Production",
    labelKey: "modules.Production",
    storageKey: (c) => `erpverse_production_${c}`,
  },
  {
    key: "Sales",
    labelKey: "modules.SalesManagement",
    storageKey: (c) => `erpverse_sales_${c}`,
  },
  {
    key: "Contracts",
    labelKey: "contractManagement",
    storageKey: (c) => `erpverse_contracts_${c}`,
  },
  {
    key: "Tasks",
    labelKey: "modules.Tasks",
    storageKey: (c) => `erpverse_tasks_${c}`,
  },
  {
    key: "Payroll",
    labelKey: "modules.Payroll",
    storageKey: (c) => `erpverse_payroll_${c}`,
  },
  {
    key: "Assets",
    labelKey: "modules.Assets",
    storageKey: (c) => `erpverse_assets_${c}`,
  },
  {
    key: "Budget",
    labelKey: "modules.Budget",
    storageKey: (c) => `erpverse_budget_${c}`,
  },
  {
    key: "Risk",
    labelKey: "modules.Risk",
    storageKey: (c) => `erpverse_risk_${c}`,
  },
  {
    key: "Quality",
    labelKey: "modules.Quality",
    storageKey: (c) => `erpverse_quality_${c}`,
  },
  {
    key: "Maintenance",
    labelKey: "modules.Maintenance",
    storageKey: (c) => `erpverse_maintenance_${c}`,
  },
  {
    key: "WorkOrders",
    labelKey: "modules.WorkOrders",
    storageKey: (c) => `erpverse_workorders_${c}`,
  },
  {
    key: "Training",
    labelKey: "modules.Training",
    storageKey: (c) => `erpverse_training_${c}`,
  },
  {
    key: "Shifts",
    labelKey: "modules.Shifts",
    storageKey: (c) => `erpverse_shifts_${c}`,
  },
  {
    key: "SerialLot",
    labelKey: "modules.SerialLot",
    storageKey: (c) => `erpverse_seriallot_${c}`,
  },
  {
    key: "AuditLog",
    labelKey: "auditlog.title",
    storageKey: (c) => `erpverse_audit_log_${c}`,
  },
];

export default function DataExportModule() {
  const { t } = useLanguage();
  const { company } = useAuth();
  const companyId = company?.id || "default";

  const [activeTab, setActiveTab] = useState<"export" | "import">("export");

  // Export state
  const [selected, setSelected] = useState<string[]>(
    MODULE_KEYS.map((m) => m.key),
  );
  const [exported, setExported] = useState(false);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<Record<string, unknown> | null>(
    null,
  );
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [importModules, setImportModules] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? MODULE_KEYS.map((m) => m.key) : []);
  };

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleExport = () => {
    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      companyId,
      modules: {} as Record<string, unknown>,
    };

    for (const mod of MODULE_KEYS) {
      if (!selected.includes(mod.key)) continue;
      const raw = localStorage.getItem(mod.storageKey(companyId));
      try {
        (data.modules as Record<string, unknown>)[mod.key] = raw
          ? JSON.parse(raw)
          : null;
      } catch {
        (data.modules as Record<string, unknown>)[mod.key] = raw;
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `erpverse_export_${companyId}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportError("");
    setImportData(null);
    setImportSuccess(false);
    setConfirming(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!parsed.modules || typeof parsed.modules !== "object") {
          setImportError(t("dataexport.importError"));
          return;
        }
        setImportData(parsed);
        setImportModules(Object.keys(parsed.modules));
      } catch {
        setImportError(t("dataexport.importError"));
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importData) return;
    const modules = importData.modules as Record<string, unknown>;
    for (const modKey of importModules) {
      const modDef = MODULE_KEYS.find((m) => m.key === modKey);
      if (!modDef) continue;
      const val = modules[modKey];
      if (val === null || val === undefined) continue;
      localStorage.setItem(modDef.storageKey(companyId), JSON.stringify(val));
    }
    setImportSuccess(true);
    setConfirming(false);
    setTimeout(() => setImportSuccess(false), 4000);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
          <FileJson className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("dataexport.title")}
          </h2>
          <p className="text-slate-400 text-sm">{t("dataexport.subtitle")}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-xl p-1 border border-white/5">
        <button
          type="button"
          onClick={() => setActiveTab("export")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "export"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
          data-ocid="dataexport.export_tab"
        >
          <Download className="w-4 h-4" />
          {t("dataexport.exportTab")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("import")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "import"
              ? "bg-emerald-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
          data-ocid="dataexport.import_tab"
        >
          <Upload className="w-4 h-4" />
          {t("dataexport.importTab")}
        </button>
      </div>

      {activeTab === "export" && (
        <>
          <div className="bg-slate-800 rounded-xl border border-white/5 p-5 mb-6">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <Checkbox
                id="select-all"
                checked={selected.length === MODULE_KEYS.length}
                onCheckedChange={(v) => toggleAll(!!v)}
                className="border-slate-600"
                data-ocid="dataexport.select_all_checkbox"
              />
              <Label
                htmlFor="select-all"
                className="text-white font-medium cursor-pointer"
              >
                {t("dataexport.selectAll")}
              </Label>
              <span className="ml-auto text-slate-500 text-sm">
                {selected.length}/{MODULE_KEYS.length}{" "}
                {t("dataexport.selected")}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MODULE_KEYS.map((mod) => (
                <div key={mod.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`mod-${mod.key}`}
                    checked={selected.includes(mod.key)}
                    onCheckedChange={() => toggle(mod.key)}
                    className="border-slate-600"
                    data-ocid="dataexport.module_checkbox"
                  />
                  <Label
                    htmlFor={`mod-${mod.key}`}
                    className="text-slate-300 text-sm cursor-pointer"
                  >
                    {t(mod.labelKey)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleExport}
              disabled={selected.length === 0}
              data-ocid="dataexport.primary_button"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("dataexport.export")}
            </Button>
            {exported && (
              <span
                className="text-emerald-400 text-sm"
                data-ocid="dataexport.success_state"
              >
                ✓ {t("dataexport.success")}
              </span>
            )}
          </div>
        </>
      )}

      {activeTab === "import" && (
        <>
          <p className="text-slate-400 text-sm mb-5">
            {t("dataexport.importSubtitle")}
          </p>

          {/* File selector */}
          <label
            htmlFor="file-import-input"
            className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center mb-5 hover:border-emerald-500/40 transition-colors cursor-pointer block"
            data-ocid="dataexport.dropzone"
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-slate-500" />
            <p className="text-slate-300 font-medium mb-1">
              {importFile ? importFile.name : t("dataexport.selectFile")}
            </p>
            {importFile && (
              <p className="text-slate-500 text-xs">
                {(importFile.size / 1024).toFixed(1)} KB
              </p>
            )}
            <input
              ref={fileInputRef}
              id="file-import-input"
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileChange}
              data-ocid="dataexport.upload_button"
            />
          </label>

          {importError && (
            <div
              className="flex items-center gap-2 text-red-400 text-sm mb-4 bg-red-500/10 rounded-lg px-4 py-3"
              data-ocid="dataexport.error_state"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {importError}
            </div>
          )}

          {importData && importModules.length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-white/5 p-4 mb-5">
              <p className="text-slate-300 text-sm font-medium mb-3">
                Geri yüklenecek modüller ({importModules.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {importModules.map((key) => {
                  const mod = MODULE_KEYS.find((m) => m.key === key);
                  return (
                    <span
                      key={key}
                      className="text-xs bg-emerald-500/15 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/20"
                    >
                      {mod ? t(mod.labelKey) : key}
                    </span>
                  );
                })}
              </div>
              {(importData as { exportedAt?: string }).exportedAt && (
                <p className="text-slate-500 text-xs mt-3">
                  Yedekleme tarihi:{" "}
                  {new Date(
                    (importData as { exportedAt: string }).exportedAt,
                  ).toLocaleString("tr-TR")}
                </p>
              )}
            </div>
          )}

          {!confirming && importData && (
            <div className="flex items-center gap-3">
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => setConfirming(true)}
                data-ocid="dataexport.import_button"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t("dataexport.importButton")}
              </Button>
            </div>
          )}

          {confirming && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-300 text-sm">
                  {t("dataexport.importWarning")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-slate-300"
                  onClick={() => setConfirming(false)}
                  data-ocid="dataexport.cancel_button"
                >
                  İptal
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleImport}
                  data-ocid="dataexport.confirm_button"
                >
                  Evet, Geri Yükle
                </Button>
              </div>
            </div>
          )}

          {importSuccess && (
            <div
              className="flex items-center gap-2 text-emerald-400 text-sm mt-4 bg-emerald-500/10 rounded-lg px-4 py-3"
              data-ocid="dataexport.success_state"
            >
              ✓ {t("dataexport.importSuccess")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
