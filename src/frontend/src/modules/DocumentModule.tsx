import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "../components/ui/textarea";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Document {
  id: string;
  name: string;
  category: string;
  fileType: string;
  description: string;
  uploadDate: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  contract: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  invoice: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  report: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  policy: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  other: "bg-slate-500/20 text-slate-300 border-slate-500/30",
};

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "🟥",
  word: "🟦",
  excel: "🟩",
  other: "📄",
};

export default function DocumentModule() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const companyId = company?.id ?? "";
  const storageKey = `erp_documents_${companyId}`;

  const [documents, setDocuments] = useLocalStorage<Document[]>(storageKey, []);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    category: "",
    fileType: "",
    description: "",
  });

  const filtered = documents.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase()),
  );

  function handleAdd() {
    if (!form.name || !form.category || !form.fileType) {
      toast.error(t("documents.fieldsRequired"));
      return;
    }
    const doc: Document = {
      id: Date.now().toString(),
      name: form.name,
      category: form.category,
      fileType: form.fileType,
      description: form.description,
      uploadDate: new Date().toLocaleDateString(),
    };
    setDocuments([doc, ...documents]);
    setForm({ name: "", category: "", fileType: "", description: "" });
    setDialogOpen(false);
    toast.success(t("documents.added"));
  }

  function handleDelete(id: string) {
    setDocuments(documents.filter((d) => d.id !== id));
    setDeleteId(null);
    toast.success(t("documents.deleted"));
  }

  const categoryLabel = (cat: string) => t(`documents.cat.${cat}`);
  const fileTypeLabel = (ft: string) => t(`documents.ft.${ft}`);

  return (
    <div className="p-6 space-y-4" data-ocid="documents.panel">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t("modules.Documents")}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {t("documents.subtitle")}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              data-ocid="documents.open_modal_button"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("documents.add")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-slate-900 border-slate-700 text-white"
            data-ocid="documents.dialog"
          >
            <DialogHeader>
              <DialogTitle>{t("documents.addTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-slate-300">{t("documents.name")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  placeholder={t("documents.namePlaceholder")}
                  data-ocid="documents.input"
                />
              </div>
              <div>
                <Label className="text-slate-300">
                  {t("documents.category")}
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    data-ocid="documents.select"
                  >
                    <SelectValue placeholder={t("documents.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {["contract", "invoice", "report", "policy", "other"].map(
                      (cat) => (
                        <SelectItem
                          key={cat}
                          value={cat}
                          className="text-white hover:bg-slate-700"
                        >
                          {categoryLabel(cat)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">
                  {t("documents.fileType")}
                </Label>
                <Select
                  value={form.fileType}
                  onValueChange={(v) => setForm({ ...form, fileType: v })}
                >
                  <SelectTrigger
                    className="bg-slate-800 border-slate-600 text-white mt-1"
                    data-ocid="documents.select"
                  >
                    <SelectValue placeholder={t("documents.selectFileType")} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600">
                    {["pdf", "word", "excel", "other"].map((ft) => (
                      <SelectItem
                        key={ft}
                        value={ft}
                        className="text-white hover:bg-slate-700"
                      >
                        {fileTypeLabel(ft)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">
                  {t("documents.description")}
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1 resize-none"
                  rows={3}
                  placeholder={t("documents.descPlaceholder")}
                  data-ocid="documents.textarea"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                data-ocid="documents.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleAdd}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                data-ocid="documents.submit_button"
              >
                {t("documents.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-slate-800 border-slate-600 text-white"
          placeholder={t("documents.search")}
          data-ocid="documents.search_input"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3"
          data-ocid="documents.empty_state"
        >
          <FileText className="w-10 h-10 opacity-30" />
          <p className="text-sm">
            {search ? t("documents.noResults") : t("documents.empty")}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400">
                  {t("documents.name")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("documents.category")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("documents.fileType")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("documents.description")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("documents.uploadDate")}
                </TableHead>
                <TableHead className="text-slate-400 w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc, i) => (
                <TableRow
                  key={doc.id}
                  className="border-slate-700 hover:bg-slate-800/50"
                  data-ocid={`documents.item.${i + 1}`}
                >
                  <TableCell className="text-white font-medium">
                    <div className="flex items-center gap-2">
                      <span>{FILE_TYPE_ICONS[doc.fileType] ?? "📄"}</span>
                      {doc.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs border ${CATEGORY_COLORS[doc.category] ?? CATEGORY_COLORS.other}`}
                    >
                      {categoryLabel(doc.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {fileTypeLabel(doc.fileType)}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm max-w-xs truncate">
                    {doc.description || "—"}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {doc.uploadDate}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => setDeleteId(doc.id)}
                      data-ocid={`documents.delete_button.${i + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <DialogContent
          className="bg-slate-900 border-slate-700 text-white"
          data-ocid="documents.modal"
        >
          <DialogHeader>
            <DialogTitle>{t("documents.deleteTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-slate-400 text-sm">
            {t("documents.deleteConfirm")}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteId(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              data-ocid="documents.cancel_button"
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              data-ocid="documents.confirm_button"
            >
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
