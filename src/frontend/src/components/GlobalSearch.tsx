import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

interface SearchResult {
  module: string;
  moduleLabel: string;
  text: string;
  tabId: string;
  color: string;
}

interface GlobalSearchProps {
  companyId: string;
  onNavigate: (tab: string) => void;
}

const MODULE_CONFIGS = [
  {
    key: (id: string) => `erpverse_hr_${id}`,
    field: "name",
    tabId: "HR",
    labelKey: "module.hr",
    fallback: "İK",
    color: "bg-blue-500/20 text-blue-300",
  },
  {
    key: (id: string) => `erpverse_crm_${id}`,
    field: "name",
    tabId: "CRM",
    labelKey: "module.crm",
    fallback: "CRM",
    color: "bg-green-500/20 text-green-300",
  },
  {
    key: (id: string) => `erpverse_projects_${id}`,
    field: "name",
    tabId: "Projects",
    labelKey: "module.projects",
    fallback: "Projeler",
    color: "bg-purple-500/20 text-purple-300",
  },
  {
    key: (id: string) => `erpverse_inventory_${id}`,
    field: "name",
    tabId: "Inventory",
    labelKey: "module.inventory",
    fallback: "Envanter",
    color: "bg-orange-500/20 text-orange-300",
  },
  {
    key: (id: string) => `erpverse_tasks_${id}`,
    field: "title",
    tabId: "Tasks",
    labelKey: "module.tasks",
    fallback: "Görevler",
    color: "bg-yellow-500/20 text-yellow-300",
  },
  {
    key: (id: string) => `contracts_${id}`,
    field: "title",
    tabId: "Contracts",
    labelKey: "module.contracts",
    fallback: "Sözleşmeler",
    color: "bg-pink-500/20 text-pink-300",
  },
  {
    key: (id: string) => `erp_invoices_${id}`,
    field: "title",
    tabId: "Invoices",
    labelKey: "module.invoices",
    fallback: "Faturalar",
    color: "bg-red-500/20 text-red-300",
  },
  {
    key: (id: string) => `erpverse_catalog_${id}`,
    field: "name",
    tabId: "ProductCatalog",
    labelKey: "module.catalog",
    fallback: "Katalog",
    color: "bg-teal-500/20 text-teal-300",
  },
  {
    key: (id: string) => `erpverse_training_plans_${id}`,
    field: "name",
    tabId: "Training",
    labelKey: "module.training",
    fallback: "Eğitim",
    color: "bg-indigo-500/20 text-indigo-300",
  },
  {
    key: (id: string) => `erpverse_purchasing_suppliers_${id}`,
    field: "name",
    tabId: "Purchasing",
    labelKey: "module.purchasing",
    fallback: "Satın Alma",
    color: "bg-cyan-500/20 text-cyan-300",
  },
];

export default function GlobalSearch({
  companyId,
  onNavigate,
}: GlobalSearchProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const search = useCallback(
    (q: string): SearchResult[] => {
      if (q.length < 2) return [];
      const lower = q.toLowerCase();
      const results: SearchResult[] = [];

      for (const config of MODULE_CONFIGS) {
        try {
          const raw = localStorage.getItem(config.key(companyId));
          if (!raw) continue;
          const items: Record<string, string>[] = JSON.parse(raw);
          if (!Array.isArray(items)) continue;
          for (const item of items) {
            const text = item[config.field];
            if (
              typeof text === "string" &&
              text.toLowerCase().includes(lower)
            ) {
              results.push({
                module: config.key(companyId),
                moduleLabel: t(config.labelKey) || config.fallback,
                text,
                tabId: config.tabId,
                color: config.color,
              });
            }
          }
        } catch {
          // skip invalid data
        }
      }

      return results;
    },
    [companyId, t],
  );

  const results = search(query);
  const hasQuery = query.length >= 2;

  function handleSelect(tabId: string) {
    setOpen(false);
    setQuery("");
    onNavigate(tabId);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery("");
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label={t("search.open") || "Ara"}
          data-ocid="global_search.open_modal_button"
        >
          <Search className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent
        className="bg-slate-900 border-white/10 text-white max-w-lg"
        data-ocid="global_search.modal"
      >
        <DialogHeader>
          <DialogTitle className="text-white">
            {t("search.title") || "Sistem Geneli Arama"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              t("search.placeholder") || "Modüllerde ara... (min. 2 karakter)"
            }
            className="bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
            data-ocid="global_search.search_input"
          />
        </div>
        <ScrollArea className="max-h-80 mt-3">
          {hasQuery && results.length === 0 && (
            <div className="text-center text-slate-400 py-8 text-sm">
              {t("search.no_results") || "Sonuç bulunamadı"}
            </div>
          )}
          {!hasQuery && (
            <div className="text-center text-slate-500 py-8 text-sm">
              {t("search.hint") || "Arama yapmak için en az 2 karakter girin"}
            </div>
          )}
          {results.length > 0 && (
            <div className="space-y-1 pr-2">
              {results.map((result, i) => (
                <button
                  key={`${result.tabId}-${i}`}
                  type="button"
                  onClick={() => handleSelect(result.tabId)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <Badge
                    className={`text-xs shrink-0 border-0 ${result.color}`}
                  >
                    {result.moduleLabel}
                  </Badge>
                  <span className="text-sm text-white truncate">
                    {result.text}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
