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

  const EmployeeStatus = IDL.Variant({
    active: IDL.Null,
    onLeave: IDL.Null,
    terminated: IDL.Null,
  });

  const Employee = IDL.Record({
    id: IDL.Text,
    companyId: IDL.Text,
    name: IDL.Text,
    position: IDL.Text,
    department: IDL.Text,
    status: EmployeeStatus,
    email: IDL.Text,
    salary: IDL.Nat,
    createdAt: IDL.Int,
  });

  const CustomerStatus = IDL.Variant({
    lead: IDL.Null,
    active: IDL.Null,
    closed: IDL.Null,
  });

  const Customer = IDL.Record({
    id: IDL.Text,
    companyId: IDL.Text,
    name: IDL.Text,
    email: IDL.Text,
    phone: IDL.Text,
    company: IDL.Text,
    status: CustomerStatus,
    createdAt: IDL.Int,
  });

  const PipelineStage = IDL.Variant({
    new_: IDL.Null,
    contact: IDL.Null,
    proposal: IDL.Null,
    negotiation: IDL.Null,
    won: IDL.Null,
    lost: IDL.Null,
  });

  const Opportunity = IDL.Record({
    id: IDL.Text,
    companyId: IDL.Text,
    name: IDL.Text,
    company: IDL.Text,
    value: IDL.Nat,
    assignee: IDL.Text,
    stage: PipelineStage,
    createdAt: IDL.Text,
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
    // HR Employee API
    addEmployee: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat],
      [IDL.Opt(Employee)],
      [],
    ),
    updateEmployee: IDL.Func(
      [
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Text,
        EmployeeStatus,
        IDL.Text,
        IDL.Nat,
      ],
      [IDL.Bool],
      [],
    ),
    removeEmployee: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
    getEmployees: IDL.Func([IDL.Text], [IDL.Vec(Employee)], ["query"]),
    // CRM Customer API
    addCustomer: IDL.Func(
      [
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Text,
        CustomerStatus,
      ],
      [IDL.Opt(Customer)],
      [],
    ),
    updateCustomerStatus: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, CustomerStatus],
      [IDL.Bool],
      [],
    ),
    removeCustomer: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
    getCustomers: IDL.Func([IDL.Text], [IDL.Vec(Customer)], ["query"]),
    // CRM Opportunity API
    addOpportunity: IDL.Func(
      [
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Text,
        IDL.Nat,
        IDL.Text,
        PipelineStage,
        IDL.Text,
      ],
      [IDL.Opt(Opportunity)],
      [],
    ),
    updateOpportunityStage: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, PipelineStage],
      [IDL.Bool],
      [],
    ),
    removeOpportunity: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Bool], []),
    getOpportunities: IDL.Func([IDL.Text], [IDL.Vec(Opportunity)], ["query"]),
  });
};
