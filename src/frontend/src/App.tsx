import { useCallback, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import type { PortalType } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { useActor } from "./hooks/useActor";
import AuthPage from "./pages/AuthPage";
import CodeShownPage from "./pages/CodeShownPage";
import CompanySelectPage from "./pages/CompanySelectPage";
import CompanySetupPage from "./pages/CompanySetupPage";
import LandingPage from "./pages/LandingPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import PersonnelDashboard from "./pages/PersonnelDashboard";

export type AppView =
  | "landing"
  | "register"
  | "login"
  | "code-shown"
  | "company-select"
  | "company-setup"
  | "owner-dashboard"
  | "personnel-dashboard";

interface NewUserData {
  loginCode: string;
  personnelCode: string;
  displayName: string;
}

function AppContent() {
  const {
    user,
    company,
    membership,
    setUser,
    setCompany,
    setMembership,
    logout,
  } = useAuth();
  const { actor } = useActor();
  const [view, setView] = useState<AppView>("landing");
  const [portalType, setPortalType] = useState<PortalType>("employee");
  const [newUserData, setNewUserData] = useState<NewUserData | null>(null);
  const [sessionVerified, setSessionVerified] = useState(false);

  const handleCompanySelected = useCallback(
    async (companyId: string) => {
      if (!actor || !user) return;
      const companyData = await actor.getCompany(companyId);
      if (!companyData || companyData.length === 0) return;
      const memberships = await actor.getCompanyMemberships(user.id);
      const m = memberships.find((ms) => ms.companyId === companyId);
      if (!m) return;
      const c = companyData[0];
      setCompany({
        id: c.id,
        name: c.name,
        sector: c.sector,
        address: c.address,
        contactEmail: c.contactEmail,
        phone: c.phone,
        foundedYear: c.foundedYear,
        ownerId: c.ownerId,
        createdAt: c.createdAt.toString(),
      });
      setMembership({
        companyId: m.companyId,
        userId: m.userId,
        // biome-ignore lint/suspicious/noExplicitAny: type conversion
        roles: m.roles as any,
        grantedModules: m.grantedModules,
        addedAt: m.addedAt.toString(),
      });
      const hasOwner = m.roles.some((r) => "CompanyOwner" in r);
      setView(hasOwner ? "owner-dashboard" : "personnel-dashboard");
    },
    [actor, user, setCompany, setMembership],
  );

  // Verify that the cached user still exists in the canister.
  // If not (e.g. canister was redeployed and state was reset), clear stale session.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional – only run once when actor becomes ready
  useEffect(() => {
    if (!actor) return;
    if (!user) {
      setSessionVerified(true);
      return;
    }
    actor
      .getUserProfile(user.id)
      .then((result) => {
        if (!result || result.length === 0) {
          logout();
          setView("landing");
        }
        setSessionVerified(true);
      })
      .catch(() => {
        setSessionVerified(true);
      });
  }, [actor]);

  useEffect(() => {
    if (!sessionVerified) return;
    if (user && company && membership) {
      const hasOwner = membership.roles.some((r) => "CompanyOwner" in r);
      setView(hasOwner ? "owner-dashboard" : "personnel-dashboard");
    } else if (user && !company && actor) {
      actor
        .getUserCompanies(user.id)
        .then((companies) => {
          if (companies.length === 0) {
            setView(portalType === "owner" ? "company-setup" : "landing");
          } else if (companies.length === 1) {
            handleCompanySelected(companies[0].id);
          } else {
            setView("company-select");
          }
        })
        .catch(() => {});
    }
  }, [
    user,
    company,
    membership,
    actor,
    portalType,
    handleCompanySelected,
    sessionVerified,
  ]);

  const handleLogout = () => {
    logout();
    setView("landing");
    setNewUserData(null);
  };

  // Show spinner while verifying stored session against the canister
  if (!sessionVerified && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {view === "landing" && (
        <LandingPage
          onLogin={(portal) => {
            setPortalType(portal);
            setView("login");
          }}
          onRegister={(portal) => {
            setPortalType(portal);
            setView("register");
          }}
        />
      )}
      {(view === "register" || view === "login") && (
        <AuthPage
          mode={view === "register" ? "register" : "login"}
          portalType={portalType}
          onBack={() => setView("landing")}
          onRegistered={(data) => {
            setNewUserData(data);
            setView("code-shown");
          }}
          onLoggedIn={async (userId) => {
            if (!actor) return;
            const profileArr = await actor.getUserProfile(userId);
            if (!profileArr || profileArr.length === 0) return;
            const profile = profileArr[0];
            setUser({
              id: profile.id,
              displayName: profile.displayName,
              loginCode: profile.loginCode,
              personnelCode: profile.personnelCode,
              createdAt: profile.createdAt.toString(),
            });
            const companies = await actor.getUserCompanies(profile.id);
            if (companies.length === 0) {
              setView(
                portalType === "owner"
                  ? "company-setup"
                  : "personnel-dashboard",
              );
            } else if (companies.length === 1) {
              await handleCompanySelected(companies[0].id);
            } else {
              setView("company-select");
            }
          }}
        />
      )}
      {view === "code-shown" && newUserData && (
        <CodeShownPage
          loginCode={newUserData.loginCode}
          personnelCode={newUserData.personnelCode}
          onContinue={() => setView("login")}
        />
      )}
      {view === "company-setup" && user && (
        <CompanySetupPage
          userId={user.id}
          onCreated={handleCompanySelected}
          onBack={() => setView("landing")}
        />
      )}
      {view === "company-select" && user && (
        <CompanySelectPage
          userId={user.id}
          onSelect={handleCompanySelected}
          onBack={handleLogout}
        />
      )}
      {view === "owner-dashboard" && user && company && membership && (
        <OwnerDashboard
          user={user}
          company={company}
          membership={membership}
          onLogout={handleLogout}
        />
      )}
      {view === "personnel-dashboard" && user && (
        <PersonnelDashboard
          user={user}
          company={company}
          membership={membership}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
