import type { IDL } from "@icp-sdk/core/candid";

export const idlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const UserProfile = IDL.Record({
    id: IDL.Text,
    displayName: IDL.Text,
    loginCode: IDL.Text,
    personnelCode: IDL.Text,
    createdAt: IDL.Int,
  });

  const CompanyRole = IDL.Variant({
    CompanyOwner: IDL.Null,
    CompanyManager: IDL.Null,
    CompanyAdmin: IDL.Null,
    CompanyEmployee: IDL.Null,
  });

  const CompanyMembership = IDL.Record({
    companyId: IDL.Text,
    userId: IDL.Text,
    roles: IDL.Vec(CompanyRole),
    grantedModules: IDL.Vec(IDL.Text),
    addedAt: IDL.Int,
  });

  const Company = IDL.Record({
    id: IDL.Text,
    name: IDL.Text,
    sector: IDL.Text,
    address: IDL.Text,
    contactEmail: IDL.Text,
    phone: IDL.Text,
    foundedYear: IDL.Text,
    ownerId: IDL.Text,
    createdAt: IDL.Int,
  });

  const DashboardSummary = IDL.Record({
    employeeCount: IDL.Nat,
    activeModules: IDL.Nat,
    companyName: IDL.Text,
  });

  return IDL.Service({
    _initializeAccessControlWithSecret: IDL.Func([IDL.Text], [], []),
    registerUser: IDL.Func([IDL.Text], [IDL.Opt(UserProfile)], []),
    loginWithCode: IDL.Func([IDL.Text], [IDL.Opt(UserProfile)], []),
    getUserProfile: IDL.Func([IDL.Text], [IDL.Opt(UserProfile)], []),
    registerCompany: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text],
      [IDL.Opt(Company)],
      [],
    ),
    getCompany: IDL.Func([IDL.Text], [IDL.Opt(Company)], ["query"]),
    getCompanyMemberships: IDL.Func(
      [IDL.Text],
      [IDL.Vec(CompanyMembership)],
      [],
    ),
    getUserCompanies: IDL.Func([IDL.Text], [IDL.Vec(Company)], []),
    addPersonnelToCompany: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Vec(CompanyRole), IDL.Vec(IDL.Text)],
      [IDL.Bool],
      [],
    ),
    getCompanyMembers: IDL.Func(
      [IDL.Text],
      [IDL.Vec(CompanyMembership)],
      ["query"],
    ),
    removePersonnelFromCompany: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text],
      [IDL.Bool],
      [],
    ),
    getGrantedModules: IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Vec(IDL.Text)],
      ["query"],
    ),
    updateModulePermissions: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Text)],
      [IDL.Bool],
      [],
    ),
    getDashboardSummary: IDL.Func(
      [IDL.Text, IDL.Text],
      [IDL.Opt(DashboardSummary)],
      ["query"],
    ),
    getUserByPersonnelCode: IDL.Func(
      [IDL.Text],
      [IDL.Opt(UserProfile)],
      ["query"],
    ),
  });
};
