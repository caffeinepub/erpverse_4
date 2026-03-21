import {
  AlertCircle,
  ArrowLeftRight,
  BarChart3,
  Barcode,
  Building2,
  CalendarDays,
  CheckSquare,
  Clock,
  DollarSign,
  Factory,
  FileText,
  FolderKanban,
  Globe,
  GraduationCap,
  Handshake,
  HardDrive,
  Headphones,
  Link2,
  LogOut,
  Package,
  PiggyBank,
  Receipt,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Target,
  User,
  UserCheck,
  Users,
  Warehouse as WarehouseIcon,
  Workflow,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

import GlobalSearch from "../components/GlobalSearch";
import NotificationBell from "../components/NotificationBell";
import { useAuth } from "../contexts/AuthContext";
import type {
  Company,
  CompanyMembership,
  UserProfile,
} from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import AbonelikYonetimi from "../modules/AbonelikYonetimi";
import AccountingModule from "../modules/AccountingModule";
import AssetModule from "../modules/AssetModule";
import BIModule from "../modules/BIModule";
import BarcodeModule from "../modules/BarcodeModule";
import BudgetModule from "../modules/BudgetModule";
import CRMModule from "../modules/CRMModule";
import CalendarModule from "../modules/CalendarModule";
import ContractModule from "../modules/ContractModule";
import CustomerServiceModule from "../modules/CustomerServiceModule";
import DocumentModule from "../modules/DocumentModule";
import ExpenseModule from "../modules/ExpenseModule";
import HRModule from "../modules/HRModule";
import InventoryModule from "../modules/InventoryModule";
import KPIModule from "../modules/KPIModule";
import MaintenanceModule from "../modules/MaintenanceModule";
import PayrollModule from "../modules/PayrollModule";
import PersonnelSelfServiceModule from "../modules/PersonnelSelfServiceModule";
import ProductCatalogModule from "../modules/ProductCatalogModule";
import ProductionModule from "../modules/ProductionModule";
import ProjectCostModule from "../modules/ProjectCostModule";
import ProjectsModule from "../modules/ProjectsModule";
import PurchasingModule from "../modules/PurchasingModule";
import QualityModule from "../modules/QualityModule";
import ReportingModule from "../modules/ReportingModule";
import SalesModule from "../modules/SalesModule";
import ShiftModule from "../modules/ShiftModule";
import SupplyChainModule from "../modules/SupplyChainModule";
import TaskModule from "../modules/TaskModule";
import TimesheetModule from "../modules/TimesheetModule";
import TradeModule from "../modules/TradeModule";
import TrainingModule from "../modules/TrainingModule";
import WarehouseModule from "../modules/WarehouseModule";
import WarehouseTransferModule from "../modules/WarehouseTransferModule";
import WorkflowModule from "../modules/WorkflowModule";
import UserProfilePage from "./UserProfilePage";

interface Props {
  user: UserProfile;
  company: Company | null;
  membership: CompanyMembership | null;
  onLogout: () => void;
  onSwitchCompany?: () => void;
}

const MODULE_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  HR: {
    icon: <Users className="w-7 h-7" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  Accounting: {
    icon: <DollarSign className="w-7 h-7" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  CRM: {
    icon: <Handshake className="w-7 h-7" />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  Inventory: {
    icon: <Package className="w-7 h-7" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  Projects: {
    icon: <FolderKanban className="w-7 h-7" />,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  Purchasing: {
    icon: <ShoppingCart className="w-7 h-7" />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  Production: {
    icon: <Factory className="w-7 h-7" />,
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
  Workflow: {
    icon: <Workflow className="w-7 h-7" />,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  Quality: {
    icon: <ShieldAlert className="w-7 h-7" />,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  Warehouse: {
    icon: <WarehouseIcon className="w-7 h-7" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  Budget: {
    icon: <PiggyBank className="w-7 h-7" />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  Reporting: {
    icon: <BarChart3 className="w-7 h-7" />,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  Assets: {
    icon: <HardDrive className="w-7 h-7" />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  CustomerService: {
    icon: <Headphones className="w-7 h-7" />,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  SalesManagement: {
    icon: <ShoppingBag className="w-7 h-7" />,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
  SupplyChain: {
    icon: <Link2 className="w-7 h-7" />,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  Maintenance: {
    icon: <Wrench className="w-7 h-7" />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  Payroll: {
    icon: <DollarSign className="w-7 h-7" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  Trade: {
    icon: <Globe className="w-7 h-7" />,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  Contracts: {
    icon: <FileText className="w-7 h-7" />,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  Tasks: {
    icon: <CheckSquare className="w-7 h-7" />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  Calendar: {
    icon: <CalendarDays className="w-7 h-7" />,
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  Training: {
    icon: <GraduationCap className="w-7 h-7" />,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  ProductCatalog: {
    icon: <Tags className="w-7 h-7" />,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
  Shifts: {
    icon: <Clock className="w-7 h-7" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  Barcode: {
    icon: <Barcode className="w-7 h-7" />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  SelfService: {
    icon: <UserCheck className="w-7 h-7" />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  Timesheet: {
    icon: <Clock className="w-7 h-7" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  WarehouseTransfer: {
    icon: <ArrowLeftRight className="w-7 h-7" />,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  Expense: {
    icon: <Receipt className="w-7 h-7" />,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  KPI: {
    icon: <Target className="w-7 h-7" />,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
};

export default function PersonnelDashboard({
  user,
  company,
  membership,
  onLogout,
  onSwitchCompany,
}: Props) {
  const { t } = useLanguage();
  const { setUser } = useAuth();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const grantedModules = membership?.grantedModules ?? [];
  const isManager =
    membership?.roles?.some((r) => "CompanyManager" in r) ?? false;

  const getRoleLabel = () => {
    if (!membership) return "";
    const role = membership.roles[0];
    if (!role) return "";
    if ("CompanyManager" in role) return t("role.manager");
    if ("CompanyAdmin" in role) return t("role.admin");
    return t("role.employee");
  };

  if (!company || !membership) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <span className="text-white font-bold">ERPVerse</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="text-slate-400 hover:text-white flex items-center gap-1.5"
            data-ocid="nav.logout_button"
          >
            <LogOut className="w-4 h-4" />
            {t("nav.logout")}
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold mb-2">
              {user.displayName}
            </p>
            <p className="text-slate-400">{t("auth.noCompany")}</p>
            <div className="mt-6 p-4 bg-slate-800 rounded-xl border border-white/5">
              <p className="text-sm text-slate-400 mb-1">
                {t("auth.personnelCode")}
              </p>
              <code className="text-purple-300 font-mono text-lg tracking-widest">
                {user.personnelCode}
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{company.name}</p>
            <p className="text-xs text-slate-400">{company.sector}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-white text-sm font-medium">{user.displayName}</p>
            <Badge
              variant="outline"
              className="text-xs border-purple-500/30 text-purple-300"
            >
              {getRoleLabel()}
            </Badge>
          </div>
          <NotificationBell />
          <GlobalSearch
            companyId={company?.id ?? ""}
            onNavigate={(tab) => setActiveModule(tab)}
          />
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
            data-ocid="nav.profile_link"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">{t("nav.profile")}</span>
          </button>
          {onSwitchCompany && (
            <button
              type="button"
              onClick={onSwitchCompany}
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
              data-ocid="nav.switch_company_button"
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">{t("nav.switchCompany")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
            data-ocid="nav.logout_button"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t("nav.logout")}</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {t("dashboard.overview")}
        </h2>
        <p className="text-slate-400 mb-8">
          {grantedModules.length} {t("dashboard.activeModules").toLowerCase()}
        </p>

        {/* Always-visible Self Service card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          <button
            type="button"
            onClick={() => setActiveModule("SelfService")}
            className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5 text-left hover:scale-[1.02] transition-all"
            data-ocid="self-service.open_modal_button"
          >
            <div className="text-violet-400 mb-3">
              <UserCheck className="w-7 h-7" />
            </div>
            <p className="text-white font-semibold text-sm">
              {t("selfService.title")}
            </p>
          </button>
          {isManager && (
            <button
              type="button"
              onClick={() => setActiveModule("Subscription")}
              className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-5 text-left hover:scale-[1.02] transition-all"
              data-ocid="subscription.open_modal_button"
            >
              <div className="text-violet-400 mb-3">
                <RefreshCw className="w-7 h-7" />
              </div>
              <p className="text-white font-semibold text-sm">
                {t("subscription.title")}
              </p>
            </button>
          )}
        </div>

        {grantedModules.length === 0 ? (
          <div className="text-center py-16" data-ocid="modules.empty_state">
            <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">{t("auth.noCompany")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {grantedModules.map((mod) => {
              const config = MODULE_CONFIG[mod] || MODULE_CONFIG.HR;
              return (
                <button
                  type="button"
                  key={mod}
                  onClick={() => setActiveModule(mod)}
                  className={`${config.bg} border rounded-xl p-5 text-left hover:scale-[1.02] transition-all`}
                  data-ocid={`module.${mod.toLowerCase()}_button`}
                >
                  <div className={`${config.color} mb-3`}>{config.icon}</div>
                  <p className="text-white font-semibold text-sm">
                    {t(`modules.${mod}`)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {activeModule && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-auto">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm sticky top-0">
            <button
              type="button"
              onClick={() => setActiveModule(null)}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm transition-colors"
              data-ocid="module.back_button"
            >
              ← {t("nav.back")}
            </button>
            <span className="text-slate-600">|</span>
            {MODULE_CONFIG[activeModule] && (
              <span
                className={`${MODULE_CONFIG[activeModule].color} flex items-center gap-2 font-semibold text-white`}
              >
                {MODULE_CONFIG[activeModule].icon}
                {t(`modules.${activeModule}`)}
              </span>
            )}
          </div>
          {activeModule === "HR" && <HRModule />}
          {activeModule === "Accounting" && <AccountingModule />}
          {activeModule === "CRM" && <CRMModule />}
          {activeModule === "Inventory" && <InventoryModule />}
          {activeModule === "Projects" && <ProjectsModule />}
          {activeModule === "Purchasing" && <PurchasingModule />}
          {activeModule === "Production" && <ProductionModule />}
          {activeModule === "Workflow" && <WorkflowModule />}
          {activeModule === "Reporting" && <ReportingModule />}
          {activeModule === "Quality" && <QualityModule />}
          {activeModule === "Warehouse" && <WarehouseModule />}
          {activeModule === "Budget" && <BudgetModule />}
          {activeModule === "Assets" && <AssetModule />}
          {activeModule === "CustomerService" && <CustomerServiceModule />}
          {activeModule === "SalesManagement" && <SalesModule />}
          {activeModule === "SupplyChain" && <SupplyChainModule />}
          {activeModule === "Maintenance" && <MaintenanceModule />}
          {activeModule === "Payroll" && <PayrollModule />}
          {activeModule === "BI" && <BIModule />}
          {activeModule === "Documents" && <DocumentModule />}
          {activeModule === "Trade" && <TradeModule />}
          {activeModule === "Contracts" && <ContractModule />}
          {activeModule === "Tasks" && <TaskModule />}
          {activeModule === "Calendar" && <CalendarModule />}
          {activeModule === "Training" && <TrainingModule />}
          {activeModule === "ProductCatalog" && <ProductCatalogModule />}
          {activeModule === "Shifts" && <ShiftModule />}
          {activeModule === "Barcode" && <BarcodeModule />}
          {activeModule === "Timesheet" && <TimesheetModule />}
          {activeModule === "KPI" && <KPIModule />}
          {activeModule === "SelfService" && (
            <PersonnelSelfServiceModule
              user={user}
              companyId={company?.id ?? ""}
            />
          )}
          {activeModule === "ProjectCost" && <ProjectCostModule />}
          {activeModule === "WarehouseTransfer" && <WarehouseTransferModule />}
          {activeModule === "Expense" && <ExpenseModule mode="employee" />}
          {activeModule === "Subscription" && company && (
            <AbonelikYonetimi companyId={company.id} />
          )}
          {![
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
            "Trade",
            "Contracts",
            "Tasks",
            "Calendar",
            "Training",
            "ProductCatalog",
            "Shifts",
            "Barcode",
            "Timesheet",
            "KPI",
            "SelfService",
            "ProjectCost",
            "WarehouseTransfer",
            "Expense",
            "Subscription",
          ].includes(activeModule) && (
            <div className="flex items-center justify-center h-64">
              <p className="text-slate-400">{t("module.comingSoon")}</p>
            </div>
          )}
        </div>
      )}
      {showProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-auto">
          <UserProfilePage
            user={user}
            onBack={() => setShowProfile(false)}
            onUpdateName={(name) => setUser({ ...user, displayName: name })}
          />
        </div>
      )}
    </div>
  );
}
