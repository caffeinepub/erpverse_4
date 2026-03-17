import { GitBranch, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";

interface HRPerson {
  id: string;
  name: string;
  role: string;
  department?: string;
  position?: string;
}

export default function OrgChartPanel() {
  const { t } = useLanguage();
  const { company, user } = useAuth();

  const companyId = company?.id || "";
  const hrData: HRPerson[] = JSON.parse(
    localStorage.getItem(`erpverse_hr_${companyId}`) || "[]",
  );

  const managers = hrData.filter((p) => p.role === "CompanyManager");
  const admins = hrData.filter((p) => p.role === "CompanyAdmin");
  const employees = hrData.filter((p) => p.role === "CompanyEmployee");

  const roleBadge = (role: string) => {
    switch (role) {
      case "CompanyManager":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "CompanyAdmin":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "CompanyEmployee":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-purple-100 text-purple-700 border-purple-200";
    }
  };

  const PersonCard = ({
    name,
    department,
    roleClass,
    roleLabel,
  }: {
    name: string;
    department?: string;
    roleClass: string;
    roleLabel: string;
  }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white border-2 border-border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow min-w-[130px] max-w-[160px] text-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center mx-auto mb-2">
          <span className="text-white font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <p className="font-semibold text-sm text-foreground truncate">{name}</p>
        {department && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {department}
          </p>
        )}
        <span
          className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${roleClass}`}
        >
          {roleLabel}
        </span>
      </div>
    </div>
  );

  const LevelRow = ({
    people,
    roleClass,
    roleLabel,
    levelTitle,
  }: {
    people: HRPerson[];
    roleClass: string;
    roleLabel: string;
    levelTitle: string;
  }) => (
    <div className="flex flex-col items-center gap-2">
      {/* Connector line from above */}
      <div className="w-0.5 h-8 bg-border" />
      {/* Level label */}
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {levelTitle}
      </div>
      {people.length === 0 ? (
        <div className="text-xs text-muted-foreground italic px-4 py-2 border border-dashed border-border rounded-lg">
          —
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4">
          {people.map((person) => (
            <PersonCard
              key={person.id}
              name={person.name}
              department={person.department}
              roleClass={roleClass}
              roleLabel={roleLabel}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="w-5 h-5 text-violet-500" />
        <h2 className="text-xl font-bold text-foreground">
          {t("orgchart.title")}
        </h2>
      </div>

      {!companyId ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">{t("orgchart.noPersonnel")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center overflow-x-auto pb-4">
          {/* Level 1: Owner */}
          <div className="flex flex-col items-center">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("orgchart.owner")}
            </div>
            <PersonCard
              name={user?.displayName || t("orgchart.owner")}
              roleClass={roleBadge("Owner")}
              roleLabel={t("orgchart.owner")}
            />
          </div>

          {/* Level 2: Managers */}
          <LevelRow
            people={managers}
            roleClass={roleBadge("CompanyManager")}
            roleLabel={t("orgchart.manager")}
            levelTitle={t("orgchart.manager")}
          />

          {/* Level 3: Admins */}
          <LevelRow
            people={admins}
            roleClass={roleBadge("CompanyAdmin")}
            roleLabel={t("orgchart.admin")}
            levelTitle={t("orgchart.admin")}
          />

          {/* Level 4: Employees */}
          <LevelRow
            people={employees}
            roleClass={roleBadge("CompanyEmployee")}
            roleLabel={t("orgchart.employee")}
            levelTitle={t("orgchart.employee")}
          />

          {hrData.length === 0 && (
            <div className="mt-6 text-sm text-muted-foreground text-center max-w-sm">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
              {t("orgchart.noPersonnel")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
