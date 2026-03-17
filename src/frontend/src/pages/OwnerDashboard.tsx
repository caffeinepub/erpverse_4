import {
  BarChart3,
  Barcode,
  Building,
  Building2,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Clock,
  DollarSign,
  Download,
  Factory,
  FileText,
  FolderKanban,
  Gift,
  GitBranch,
  GitMerge,
  Globe,
  GraduationCap,
  Handshake,
  HardDrive,
  Hash,
  Headphones,
  LayoutDashboard,
  Link2,
  LogOut,
  Package,
  Percent,
  PiggyBank,
  Settings,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Target,
  Trash2,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Users2,
  Warehouse as WarehouseIcon,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AuditLogPanel from "../components/AuditLogPanel";
import GlobalSearch from "../components/GlobalSearch";
import NotificationBell from "../components/NotificationBell";
import OrgChartPanel from "../components/OrgChartPanel";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import type {
  Company,
  CompanyMembership,
  UserProfile,
} from "../contexts/AuthContext";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useActor } from "../hooks/useActor";
import AccountingModule from "../modules/AccountingModule";
import AssetModule from "../modules/AssetModule";
import AutomationModule from "../modules/AutomationModule";
import BIModule from "../modules/BIModule";
import BarcodeModule from "../modules/BarcodeModule";
import BudgetModule from "../modules/BudgetModule";
import CRMModule from "../modules/CRMModule";
import CalendarModule from "../modules/CalendarModule";
import CashFlowForecast from "../modules/CashFlowForecast";
import CompanyProfileModule from "../modules/CompanyProfileModule";
import ContractModule from "../modules/ContractModule";
import CustomerServiceModule from "../modules/CustomerServiceModule";
import DataExportModule from "../modules/DataExportModule";
import DocumentModule from "../modules/DocumentModule";
import HRModule from "../modules/HRModule";
import InventoryModule from "../modules/InventoryModule";
import KPIModule from "../modules/KPIModule";
import LoyaltyModule from "../modules/LoyaltyModule";
import MaintenanceModule from "../modules/MaintenanceModule";
import MultiLevelApprovalModule from "../modules/MultiLevelApprovalModule";
import PayrollModule from "../modules/PayrollModule";
import PersonalizedDashboardWidget, {
  trackModuleAccess,
} from "../modules/PersonalizedDashboardWidget";
import PriceListModule from "../modules/PriceListModule";
import ProductCatalogModule from "../modules/ProductCatalogModule";
import ProductionModule from "../modules/ProductionModule";
import ProjectsModule from "../modules/ProjectsModule";
import PurchasingModule from "../modules/PurchasingModule";
import QualityChecklistModule from "../modules/QualityChecklistModule";
import QualityModule from "../modules/QualityModule";
import ReportingModule from "../modules/ReportingModule";
import RiskModule from "../modules/RiskModule";
import SalesModule from "../modules/SalesModule";
import SerialLotModule from "../modules/SerialLotModule";
import ShiftModule from "../modules/ShiftModule";
import SupplyChainModule from "../modules/SupplyChainModule";
import TaskModule from "../modules/TaskModule";
import TimesheetModule from "../modules/TimesheetModule";
import TradeModule from "../modules/TradeModule";
import TrainingModule from "../modules/TrainingModule";
import WarehouseModule from "../modules/WarehouseModule";
import WorkOrderModule from "../modules/WorkOrderModule";
import WorkflowModule from "../modules/WorkflowModule";
import UserProfilePage from "./UserProfilePage";

type Tab =
  | "overview"
  | "personnel"
  | "modules"
  | "settings"
  | "hr"
  | "accounting"
  | "crm"
  | "inventory"
  | "projects"
  | "purchasing"
  | "production"
  | "workflow"
  | "reporting"
  | "profile"
  | "permissions"
  | "auditlog"
  | "orgchart"
  | "quality"
  | "warehouse"
  | "budget"
  | "assets"
  | "customerservice"
  | "sales"
  | "supplychain"
  | "maintenance"
  | "payroll"
  | "bi"
  | "documents"
  | "risk"
  | "trade"
  | "contracts"
  | "tasks"
  | "calendar"
  | "companyprofile"
  | "training"
  | "productcatalog"
  | "automation"
  | "pricelists"
  | "workorders"
  | "shifts"
  | "barcode"
  | "seriallot"
  | "approvals"
  | "dataexport"
  | "timesheet"
  | "cashflow"
  | "loyalty"
  | "qualitychecklist"
  | "kpi";

const ALL_MODULES = [
  "HR",
  "Accounting",
  "CRM",
  "Inventory",
  "Projects",
  "Purchasing",
  "Production",
  "Workflow",
  "Reporting",
  "Quality",
  "Warehouse",
  "Budget",
  "Assets",
  "CustomerService",
  "SalesManagement",
  "SupplyChain",
  "Maintenance",
  "Payroll",
  "BI",
  "Documents",
  "Risk",
  "Trade",
  "Contracts",
  "Tasks",
  "Calendar",
  "CompanyProfile",
  "Training",
  "ProductCatalog",
  "Automation",
  "PriceLists",
  "Shifts",
];

const ROLES = [
  { key: "CompanyManager", labelKey: "role.manager" },
  { key: "CompanyAdmin", labelKey: "role.admin" },
  { key: "CompanyEmployee", labelKey: "role.employee" },
];

const ROLE_PERMISSION_KEYS = [
  "CompanyManager",
  "CompanyAdmin",
  "CompanyEmployee",
] as const;
type RoleKey = (typeof ROLE_PERMISSION_KEYS)[number];

function getRolePermissions(companyId: string): Record<RoleKey, string[]> {
  try {
    const stored = localStorage.getItem(
      `erpverse_role_permissions_${companyId}`,
    );
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    CompanyManager: [...ALL_MODULES],
    CompanyAdmin: ALL_MODULES.filter((m) => m !== "Reporting"),
    CompanyEmployee: [],
  };
}

function saveRolePermissions(
  companyId: string,
  perms: Record<RoleKey, string[]>,
) {
  localStorage.setItem(
    `erpverse_role_permissions_${companyId}`,
    JSON.stringify(perms),
  );
}

function getModulesForRoles(roles: string[], companyId: string): string[] {
  const perms = getRolePermissions(companyId);
  const mods = new Set<string>();
  for (const role of roles) {
    const roleMods = perms[role as RoleKey] ?? [];
    for (const m of roleMods) mods.add(m);
  }
  return Array.from(mods);
}

interface Props {
  user: UserProfile;
  company: Company;
  membership: CompanyMembership;
  onLogout: () => void;
  onSwitchCompany?: () => void;
}

export default function OwnerDashboard({
  user,
  company,
  membership: _membership,
  onLogout,
  onSwitchCompany,
}: Props) {
  const { t } = useLanguage();
  const { setUser } = useAuth();
  const { actor } = useActor();
  const [tab, setTab] = useState<Tab>("overview");
  const [members, setMembers] = useState<CompanyMembership[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<
    Record<string, UserProfile>
  >({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPersonnelCode, setNewPersonnelCode] = useState("");
  const [newRoles, setNewRoles] = useState<string[]>(["CompanyEmployee"]);
  const [newModules, setNewModules] = useState<string[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [moduleChanges, setModuleChanges] = useState<Record<string, string[]>>(
    {},
  );
  const [savingModules, setSavingModules] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<
    Record<string, string[]>
  >(() => getRolePermissions(company.id));
  const [permSaved, setPermSaved] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!actor) return;
    const data = await actor.getCompanyMembers(company.id);
    const mapped: CompanyMembership[] = data
      .filter((m) => !m.roles.some((r) => "CompanyOwner" in r))
      .map((m) => ({
        companyId: m.companyId,
        userId: m.userId,
        roles: m.roles as CompanyMembership["roles"],
        grantedModules: m.grantedModules,
        addedAt: m.addedAt.toString(),
      }));
    setMembers(mapped);
    const profiles: Record<string, UserProfile> = {};
    for (const m of mapped) {
      const p = await actor.getUserProfile(m.userId);
      if (p && p.length > 0) {
        profiles[m.userId] = {
          id: p[0]!.id,
          displayName: p[0]!.displayName,
          loginCode: p[0]!.loginCode,
          personnelCode: p[0]!.personnelCode,
          createdAt: p[0]!.createdAt.toString(),
        };
      }
    }
    setMemberProfiles(profiles);
  }, [actor, company.id]);

  useEffect(() => {
    if (tab === "personnel" || tab === "modules") loadMembers();
  }, [tab, loadMembers]);

  useEffect(() => {
    if (showAddDialog) {
      setNewModules(getModulesForRoles(newRoles, company.id));
    }
  }, [newRoles, showAddDialog, company.id]);

  const handleAddPersonnel = async () => {
    if (!actor || !newPersonnelCode.trim()) return;
    setAddLoading(true);
    setAddError("");
    try {
      const roles = newRoles.map(
        (r) => ({ [r]: null }) as Record<string, null>,
      );
      const ok = await actor.addPersonnelToCompany(
        user.id,
        newPersonnelCode.trim().toUpperCase(),
        company.id,
        roles as any,
        newModules,
      );
      if (!ok) {
        setAddError(t("personnel.notFound"));
        return;
      }
      setShowAddDialog(false);
      setNewPersonnelCode("");
      setNewRoles(["CompanyEmployee"]);
      setNewModules([]);
      await loadMembers();
    } catch {
      setAddError(t("common.error"));
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (targetUserId: string) => {
    if (!actor) return;
    await actor.removePersonnelFromCompany(user.id, targetUserId, company.id);
    await loadMembers();
  };

  const handleModuleToggle = (userId: string, mod: string) => {
    const current =
      moduleChanges[userId] ??
      members.find((m) => m.userId === userId)?.grantedModules ??
      [];
    const updated = current.includes(mod)
      ? current.filter((m) => m !== mod)
      : [...current, mod];
    setModuleChanges((prev) => ({ ...prev, [userId]: updated }));
  };

  const handleSaveModules = async (userId: string) => {
    if (!actor) return;
    setSavingModules(userId);
    const modules =
      moduleChanges[userId] ??
      members.find((m) => m.userId === userId)?.grantedModules ??
      [];
    await actor.updateModulePermissions(user.id, userId, company.id, modules);
    setSavingModules(null);
    await loadMembers();
    setModuleChanges((prev) => {
      const n = { ...prev };
      delete n[userId];
      return n;
    });
  };

  const navItems: { id: Tab; labelKey: string; icon: React.ReactNode }[] = [
    {
      id: "overview",
      labelKey: "dashboard.overview",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "personnel",
      labelKey: "dashboard.personnel",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "modules",
      labelKey: "dashboard.modules",
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      id: "permissions",
      labelKey: "permissions.title",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: "settings",
      labelKey: "dashboard.settings",
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: "hr",
      labelKey: "modules.HR",
      icon: <Users2 className="w-5 h-5 text-purple-400" />,
    },
    {
      id: "accounting",
      labelKey: "modules.Accounting",
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: "crm",
      labelKey: "modules.CRM",
      icon: <Handshake className="w-5 h-5 text-orange-400" />,
    },
    {
      id: "inventory",
      labelKey: "modules.Inventory",
      icon: <Package className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: "projects",
      labelKey: "modules.Projects",
      icon: <FolderKanban className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: "purchasing",
      labelKey: "modules.Purchasing",
      icon: <ShoppingCart className="w-5 h-5 text-red-400" />,
    },
    {
      id: "production",
      labelKey: "modules.Production",
      icon: <Factory className="w-5 h-5 text-slate-400" />,
    },
    {
      id: "workflow",
      labelKey: "modules.Workflow",
      icon: <Workflow className="w-5 h-5 text-teal-400" />,
    },
    {
      id: "reporting",
      labelKey: "modules.Reporting",
      icon: <BarChart3 className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: "auditlog",
      labelKey: "auditlog.title",
      icon: <ClipboardList className="w-5 h-5 text-violet-400" />,
    },
    {
      id: "orgchart" as Tab,
      labelKey: "orgchart.title",
      icon: <GitBranch className="w-5 h-5 text-violet-400" />,
    },
    {
      id: "quality" as Tab,
      labelKey: "modules.Quality",
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
    },
    {
      id: "warehouse" as Tab,
      labelKey: "modules.Warehouse",
      icon: <WarehouseIcon className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: "budget" as Tab,
      labelKey: "modules.Budget",
      icon: <PiggyBank className="w-5 h-5 text-violet-400" />,
    },
    {
      id: "assets" as Tab,
      labelKey: "modules.Assets",
      icon: <HardDrive className="w-5 h-5 text-orange-400" />,
    },
    {
      id: "customerservice" as Tab,
      labelKey: "modules.CustomerService",
      icon: <Headphones className="w-5 h-5 text-sky-400" />,
    },
    {
      id: "sales" as Tab,
      labelKey: "modules.SalesManagement",
      icon: <ShoppingBag className="w-5 h-5 text-green-400" />,
    },
    {
      id: "supplychain" as Tab,
      labelKey: "modules.SupplyChain",
      icon: <Link2 className="w-5 h-5 text-teal-400" />,
    },
    {
      id: "maintenance" as Tab,
      labelKey: "modules.Maintenance",
      icon: <Wrench className="w-5 h-5 text-orange-400" />,
    },
    {
      id: "payroll" as Tab,
      labelKey: "modules.Payroll",
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: "risk" as Tab,
      labelKey: "modules.Risk",
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
    },
    {
      id: "trade" as Tab,
      labelKey: "modules.Trade",
      icon: <Globe className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: "contracts" as Tab,
      labelKey: "contractManagement",
      icon: <FileText className="w-5 h-5 text-teal-400" />,
    },
    {
      id: "tasks" as Tab,
      labelKey: "modules.Tasks",
      icon: <CheckSquare className="w-5 h-5 text-violet-400" />,
    },
    {
      id: "calendar" as Tab,
      labelKey: "modules.Calendar",
      icon: <CalendarDays className="w-5 h-5 text-sky-400" />,
    },
    {
      id: "companyprofile" as Tab,
      labelKey: "companyProfile.title",
      icon: <Building className="w-5 h-5 text-blue-400" />,
    },
    {
      id: "training" as Tab,
      labelKey: "modules.Training",
      icon: <GraduationCap className="w-5 h-5 text-yellow-400" />,
    },
    {
      id: "productcatalog" as Tab,
      labelKey: "modules.ProductCatalog",
      icon: <Tags className="w-5 h-5 text-pink-400" />,
    },
    {
      id: "automation" as Tab,
      labelKey: "modules.Automation",
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
    },
    {
      id: "pricelists" as Tab,
      labelKey: "modules.PriceLists",
      icon: <Percent className="w-5 h-5 text-pink-400" />,
    },
    {
      id: "workorders" as Tab,
      labelKey: "modules.WorkOrders",
      icon: <ClipboardList className="w-5 h-5 text-indigo-400" />,
    },
    {
      id: "shifts" as Tab,
      labelKey: "modules.Shifts",
      icon: <Clock className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: "barcode" as Tab,
      labelKey: "modules.Barcode",
      icon: <Barcode className="w-5 h-5 text-orange-400" />,
    },
    {
      id: "seriallot" as Tab,
      labelKey: "modules.SerialLot",
      icon: <Hash className="w-5 h-5 text-teal-400" />,
    },
    {
      id: "approvals" as Tab,
      labelKey: "modules.Approvals",
      icon: <GitMerge className="w-5 h-5 text-violet-400" />,
    },
    {
      id: "dataexport" as Tab,
      labelKey: "dataexport.title",
      icon: <Download className="w-5 h-5 text-blue-400" />,
    },
    {
      id: "timesheet" as Tab,
      labelKey: "timesheet.title",
      icon: <Clock className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: "cashflow" as Tab,
      labelKey: "modules.CashFlow",
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: "loyalty" as Tab,
      labelKey: "modules.Loyalty",
      icon: <Gift className="w-5 h-5 text-pink-400" />,
    },
    {
      id: "qualitychecklist" as Tab,
      labelKey: "modules.QualityChecklist",
      icon: <ClipboardCheck className="w-5 h-5 text-teal-400" />,
    },
    {
      id: "kpi" as Tab,
      labelKey: "kpi.title",
      icon: <Target className="w-5 h-5 text-yellow-400" />,
    },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-sidebar flex flex-col border-r border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span className="text-white font-bold text-lg">ERPVerse</span>
          </div>
          <p className="text-xs text-slate-400 truncate">{company.name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              data-ocid={`dashboard.${item.id}_tab`}
            >
              {item.icon}
              {t(item.labelKey)}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-medium">
                {user.displayName}
              </p>
              <NotificationBell />
              <GlobalSearch
                companyId={company.id}
                onNavigate={(tab) => setTab(tab as Tab)}
              />
            </div>
            <Badge
              variant="secondary"
              className="text-xs mt-1 bg-blue-500/20 text-blue-300 border-0"
            >
              {t("role.owner")}
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => setTab("profile")}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all mb-1 ${
              tab === "profile"
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
            data-ocid="nav.profile_link"
          >
            <User className="w-4 h-4" />
            {t("nav.profile")}
          </button>
          {onSwitchCompany && (
            <button
              type="button"
              onClick={onSwitchCompany}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              data-ocid="nav.switch_company_button"
            >
              <Building2 className="w-4 h-4" />
              {t("nav.switchCompany")}
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            data-ocid="nav.logout_button"
          >
            <LogOut className="w-4 h-4" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {tab === "overview" && (
          <div className="p-8">
            <PersonalizedDashboardWidget
              companyId={company.id}
              userName={user.displayName}
              onNavigate={(mod) => setTab(mod as Tab)}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
                <p className="text-slate-400 text-sm mb-1">
                  {t("dashboard.employees")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {members.length + 1}
                </p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
                <p className="text-slate-400 text-sm mb-1">
                  {t("dashboard.company")}
                </p>
                <p className="text-lg font-bold text-white truncate">
                  {company.name}
                </p>
                <p className="text-sm text-slate-400">{company.sector}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-5 border border-white/5">
                <p className="text-slate-400 text-sm mb-1">
                  {t("dashboard.activeModules")}
                </p>
                <p className="text-3xl font-bold text-white">
                  {ALL_MODULES.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === "personnel" && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {t("dashboard.personnel")}
                </h2>
                <p className="text-slate-400 text-sm">
                  {members.length} {t("dashboard.employees").toLowerCase()}
                </p>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setShowAddDialog(true)}
                data-ocid="personnel.add_button"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t("personnel.add")}
              </Button>
            </div>
            {members.length === 0 ? (
              <div
                className="text-center py-16 text-slate-500"
                data-ocid="personnel.empty_state"
              >
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t("personnel.noMembers")}</p>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full" data-ocid="personnel.table">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                        Ad
                      </th>
                      <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                        {t("personnel.role")}
                      </th>
                      <th className="text-left text-slate-400 text-sm font-medium px-5 py-3">
                        {t("personnel.modules")}
                      </th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => (
                      <tr
                        key={m.userId}
                        className="border-b border-white/5 last:border-0"
                        data-ocid={`personnel.row.${i + 1}`}
                      >
                        <td className="px-5 py-3">
                          <p className="text-white font-medium">
                            {memberProfiles[m.userId]?.displayName || m.userId}
                          </p>
                          <p className="text-xs text-slate-500">
                            {memberProfiles[m.userId]?.personnelCode}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {m.roles.map((r, ri) => (
                              <Badge
                                key={`${m.userId}-role-${ri}`}
                                variant="outline"
                                className="text-xs border-blue-500/30 text-blue-300"
                              >
                                {t(
                                  Object.keys(r)[0] === "CompanyManager"
                                    ? "role.manager"
                                    : Object.keys(r)[0] === "CompanyAdmin"
                                      ? "role.admin"
                                      : "role.employee",
                                )}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-slate-300 text-sm">
                            {m.grantedModules.length}/{ALL_MODULES.length}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemove(m.userId)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            data-ocid={`personnel.remove_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "modules" && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {t("dashboard.modules")}
            </h2>
            <p className="text-slate-400 mb-6 text-sm">
              Her personelin hangi modüllere erişebileceğini ayarlayın
            </p>
            {members.length === 0 ? (
              <div
                className="text-center py-16 text-slate-500"
                data-ocid="modules.empty_state"
              >
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t("personnel.noMembers")}</p>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl border border-white/5 overflow-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-slate-400 text-sm font-medium px-5 py-3 sticky left-0 bg-slate-800 min-w-[160px]">
                        Personel
                      </th>
                      {ALL_MODULES.map((mod) => (
                        <th
                          key={mod}
                          className="text-center text-slate-400 text-xs font-medium px-3 py-3 min-w-[90px]"
                        >
                          {t(`modules.${mod}`)}
                        </th>
                      ))}
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m, i) => {
                      const currentModules =
                        moduleChanges[m.userId] ?? m.grantedModules;
                      return (
                        <tr
                          key={m.userId}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="px-5 py-3 sticky left-0 bg-slate-800">
                            <p className="text-white text-sm font-medium">
                              {memberProfiles[m.userId]?.displayName ||
                                m.userId}
                            </p>
                          </td>
                          {ALL_MODULES.map((mod) => (
                            <td key={mod} className="px-3 py-3 text-center">
                              <Checkbox
                                checked={currentModules.includes(mod)}
                                onCheckedChange={() =>
                                  handleModuleToggle(m.userId, mod)
                                }
                                className="border-slate-600"
                                data-ocid={`module.permission_checkbox.${i + 1}`}
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              onClick={() => handleSaveModules(m.userId)}
                              disabled={savingModules === m.userId}
                            >
                              {savingModules === m.userId
                                ? "..."
                                : t("common.save")}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "permissions" && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-1">
              {t("permissions.title")}
            </h2>
            <p className="text-slate-400 mb-2 text-sm">
              {t("permissions.subtitle")}
            </p>
            <p className="text-slate-500 mb-6 text-xs">
              {t("permissions.hint")}
            </p>
            <div className="bg-slate-800 rounded-xl border border-white/5 overflow-auto mb-4">
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-slate-400 text-sm font-medium px-5 py-3 sticky left-0 bg-slate-800 min-w-[160px]">
                      {t("personnel.role")}
                    </th>
                    {ALL_MODULES.map((mod) => (
                      <th
                        key={mod}
                        className="text-center text-slate-400 text-xs font-medium px-3 py-3 min-w-[90px]"
                      >
                        {t(`modules.${mod}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLES.map((role, i) => {
                    const currentMods = rolePermissions[role.key] ?? [];
                    return (
                      <tr
                        key={role.key}
                        className="border-b border-white/5 last:border-0"
                        data-ocid={`permissions.row.${i + 1}`}
                      >
                        <td className="px-5 py-3 sticky left-0 bg-slate-800">
                          <p className="text-white text-sm font-medium">
                            {t(role.labelKey)}
                          </p>
                        </td>
                        {ALL_MODULES.map((mod) => (
                          <td key={mod} className="px-3 py-3 text-center">
                            <Checkbox
                              checked={currentMods.includes(mod)}
                              onCheckedChange={(checked) => {
                                const updated = checked
                                  ? [...currentMods, mod]
                                  : currentMods.filter((m) => m !== mod);
                                setRolePermissions((prev) => ({
                                  ...prev,
                                  [role.key]: updated,
                                }));
                                setPermSaved(false);
                              }}
                              className="border-slate-600"
                              data-ocid={`permissions.module_checkbox.${i + 1}`}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  saveRolePermissions(
                    company.id,
                    rolePermissions as Record<RoleKey, string[]>,
                  );
                  setPermSaved(true);
                  setTimeout(() => setPermSaved(false), 3000);
                }}
                data-ocid="permissions.save_button"
              >
                {t("common.save")}
              </Button>
              {permSaved && (
                <span
                  className="text-emerald-400 text-sm"
                  data-ocid="permissions.success_state"
                >
                  ✓ {t("permissions.saveSuccess")}
                </span>
              )}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {t("settings.title")}
            </h2>
            <div className="bg-slate-800 rounded-xl p-6 border border-white/5 max-w-lg">
              <div className="space-y-4">
                {[
                  [t("company.name"), company.name],
                  [t("company.sector"), company.sector],
                  [t("company.address"), company.address],
                  [t("company.email"), company.contactEmail],
                  [t("company.phone"), company.phone],
                  [t("company.foundedYear"), company.foundedYear],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                  >
                    <span className="text-slate-400 text-sm">{k}</span>
                    <span className="text-white text-sm font-medium">
                      {v || "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {tab === "hr" && <HRModule />}
        {tab === "accounting" && <AccountingModule />}
        {tab === "crm" && <CRMModule />}
        {tab === "inventory" && <InventoryModule />}
        {tab === "projects" && <ProjectsModule />}
        {tab === "purchasing" && <PurchasingModule />}
        {tab === "production" && <ProductionModule />}
        {tab === "workflow" && <WorkflowModule />}
        {tab === "reporting" && <ReportingModule />}
        {tab === "auditlog" && <AuditLogPanel />}
        {tab === "orgchart" && <OrgChartPanel />}
        {tab === "quality" && <QualityModule />}
        {tab === "warehouse" && <WarehouseModule />}
        {tab === "budget" && <BudgetModule />}
        {tab === "assets" && <AssetModule />}
        {tab === "customerservice" && <CustomerServiceModule />}
        {tab === "sales" && <SalesModule />}
        {tab === "supplychain" && <SupplyChainModule />}
        {tab === "maintenance" && <MaintenanceModule />}
        {tab === "payroll" && <PayrollModule />}
        {tab === "bi" && <BIModule />}
        {tab === "documents" && <DocumentModule />}
        {tab === "risk" && <RiskModule />}
        {tab === "trade" && <TradeModule />}
        {tab === "contracts" && <ContractModule />}
        {tab === "tasks" && <TaskModule />}
        {tab === "calendar" && <CalendarModule />}
        {tab === "companyprofile" && <CompanyProfileModule />}
        {tab === "training" && <TrainingModule />}
        {tab === "productcatalog" && <ProductCatalogModule />}
        {tab === "automation" && <AutomationModule />}
        {tab === "pricelists" && <PriceListModule />}
        {tab === "workorders" && <WorkOrderModule />}
        {tab === "shifts" && <ShiftModule />}
        {tab === "barcode" && <BarcodeModule />}
        {tab === "seriallot" && <SerialLotModule />}
        {tab === "approvals" && <MultiLevelApprovalModule />}
        {tab === "dataexport" && <DataExportModule />}
        {tab === "timesheet" && <TimesheetModule />}
        {tab === "cashflow" && <CashFlowForecast />}
        {tab === "loyalty" && <LoyaltyModule />}
        {tab === "qualitychecklist" && <QualityChecklistModule />}
        {tab === "kpi" && <KPIModule />}
        {tab === "profile" && (
          <UserProfilePage
            user={user}
            onBack={() => setTab("overview")}
            onUpdateName={(name) => setUser({ ...user, displayName: name })}
          />
        )}
      </main>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-slate-800 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {t("personnel.add")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label
                htmlFor="personnel-code-input"
                className="text-slate-300 mb-1.5 block text-sm"
              >
                {t("personnel.code")}
              </Label>
              <Input
                id="personnel-code-input"
                value={newPersonnelCode}
                onChange={(e) => setNewPersonnelCode(e.target.value)}
                placeholder="XXXXXXXXXXXX"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 tracking-widest font-mono"
                data-ocid="personnel.code_input"
              />
            </div>
            <div>
              <p className="text-slate-300 mb-2 text-sm">
                {t("personnel.role")}
              </p>
              <div className="space-y-2">
                {ROLES.map((role) => (
                  <div key={role.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`role-${role.key}`}
                      checked={newRoles.includes(role.key)}
                      onCheckedChange={(checked) => {
                        setNewRoles((prev) =>
                          checked
                            ? [...prev, role.key]
                            : prev.filter((r) => r !== role.key),
                        );
                      }}
                      className="border-slate-600"
                    />
                    <Label
                      htmlFor={`role-${role.key}`}
                      className="text-white text-sm cursor-pointer"
                    >
                      {t(role.labelKey)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-slate-300 mb-2 text-sm">
                {t("personnel.modules")}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {ALL_MODULES.map((mod) => (
                  <div key={mod} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`mod-${mod}`}
                      checked={newModules.includes(mod)}
                      onCheckedChange={(checked) => {
                        setNewModules((prev) =>
                          checked
                            ? [...prev, mod]
                            : prev.filter((m) => m !== mod),
                        );
                      }}
                      className="border-slate-600"
                    />
                    <Label
                      htmlFor={`mod-${mod}`}
                      className="text-white text-xs cursor-pointer"
                    >
                      {t(`modules.${mod}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {addError && (
              <p
                className="text-red-400 text-sm"
                data-ocid="personnel.error_state"
              >
                {addError}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-slate-300"
                onClick={() => setShowAddDialog(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleAddPersonnel}
                disabled={addLoading || !newPersonnelCode.trim()}
                data-ocid="personnel.submit_button"
              >
                {addLoading ? "..." : t("personnel.add")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
