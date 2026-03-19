import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

actor ERPVerse {

  // ─── Types

  type UserId = Text;
  type CompanyId = Text;
  type ModuleName = Text;

  type CompanyRole = {
    #CompanyOwner;
    #CompanyManager;
    #CompanyAdmin;
    #CompanyEmployee;
  };

  type UserProfile = {
    id : UserId;
    displayName : Text;
    loginCode : Text;
    personnelCode : Text;
    createdAt : Int;
  };

  type CompanyMembership = {
    companyId : CompanyId;
    userId : UserId;
    roles : [CompanyRole];
    grantedModules : [ModuleName];
    addedAt : Int;
  };

  type Company = {
    id : CompanyId;
    name : Text;
    sector : Text;
    address : Text;
    contactEmail : Text;
    phone : Text;
    foundedYear : Text;
    ownerId : UserId;
    createdAt : Int;
  };

  type DashboardSummary = {
    employeeCount : Nat;
    activeModules : Nat;
    companyName : Text;
  };

  type EmployeeStatus = {
    #active;
    #onLeave;
    #terminated;
  };

  type Employee = {
    id : Text;
    companyId : CompanyId;
    name : Text;
    position : Text;
    department : Text;
    status : EmployeeStatus;
    email : Text;
    salary : Nat;
    createdAt : Int;
  };

  type CustomerStatus = {
    #lead;
    #active;
    #closed;
  };

  type Customer = {
    id : Text;
    companyId : CompanyId;
    name : Text;
    email : Text;
    phone : Text;
    company : Text;
    status : CustomerStatus;
    createdAt : Int;
  };

  type PipelineStage = {
    #new_;
    #contact;
    #proposal;
    #negotiation;
    #won;
    #lost;
  };

  type Opportunity = {
    id : Text;
    companyId : CompanyId;
    name : Text;
    company : Text;
    value : Nat;
    assignee : Text;
    stage : PipelineStage;
    createdAt : Text;
  };

  // ─── State

  var _nextUserId : Nat = 0;
  var _nextCompanyId : Nat = 0;
  var _nextEmployeeId : Nat = 0;
  var _nextCustomerId : Nat = 0;
  var _nextOpportunityId : Nat = 0;
  var _counter : Int = 0;

  let _usersByLoginCode = Map.empty<Text, UserProfile>();
  let _usersByPersonnelCode = Map.empty<Text, UserProfile>();
  let _usersById = Map.empty<UserId, UserProfile>();
  let _companiesById = Map.empty<CompanyId, Company>();
  let _memberships = Map.empty<Text, CompanyMembership>();
  let _userCompanies = Map.empty<UserId, [CompanyId]>();
  let _companyMembers = Map.empty<CompanyId, [UserId]>();
  let _employeesById = Map.empty<Text, Employee>();
  let _companyEmployees = Map.empty<CompanyId, [Text]>();
  let _customersById = Map.empty<Text, Customer>();
  let _companyCustomers = Map.empty<CompanyId, [Text]>();
  let _opportunitiesById = Map.empty<Text, Opportunity>();
  let _companyOpportunities = Map.empty<CompanyId, [Text]>();

  // ─── Helpers

  func _memberKey(userId : UserId, companyId : CompanyId) : Text {
    userId # ":" # companyId
  };

  func _tick() : Int {
    _counter += 1;
    _counter
  };

  func _genCode(seed : Nat, length : Nat) : Text {
    let chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let charsArr = chars.toArray();
    var code = "";
    var s = seed;
    var i = 0;
    while (i < length) {
      let idx = s % 32;
      code := code # Text.fromChar(charsArr[idx]);
      s := (s * 1664525 + 1013904223) % 4294967296;
      i += 1;
    };
    code
  };

  func _genLoginCode() : Text {
    _nextUserId += 1;
    _genCode(_nextUserId * 7919 + 31337, 8)
  };

  func _genPersonnelCode() : Text {
    _genCode(_nextUserId * 104729 + 99991, 12)
  };

  func _genCompanyId() : CompanyId {
    _nextCompanyId += 1;
    "CMP" # _nextCompanyId.toText()
  };

  func _genEmployeeId() : Text {
    _nextEmployeeId += 1;
    "EMP" # _nextEmployeeId.toText()
  };

  func _genCustomerId() : Text {
    _nextCustomerId += 1;
    "CUS" # _nextCustomerId.toText()
  };

  func _genOpportunityId() : Text {
    _nextOpportunityId += 1;
    "OPP" # _nextOpportunityId.toText()
  };

  func _addUserToCompanyIndex(userId : UserId, companyId : CompanyId) {
    let existing = switch (_userCompanies.get(userId)) {
      case (?arr) arr;
      case null [];
    };
    let newArr = Array.tabulate(
      existing.size() + 1,
      func(i) { if (i < existing.size()) existing[i] else companyId },
    );
    _userCompanies.add(userId, newArr);
  };

  func _addMemberToCompanyIndex(companyId : CompanyId, userId : UserId) {
    let existing = switch (_companyMembers.get(companyId)) {
      case (?arr) arr;
      case null [];
    };
    let newArr = Array.tabulate(
      existing.size() + 1,
      func(i) { if (i < existing.size()) existing[i] else userId },
    );
    _companyMembers.add(companyId, newArr);
  };

  func _addEmployeeToCompanyIndex(companyId : CompanyId, employeeId : Text) {
    let existing = switch (_companyEmployees.get(companyId)) {
      case (?arr) arr;
      case null [];
    };
    let newArr = Array.tabulate(
      existing.size() + 1,
      func(i) { if (i < existing.size()) existing[i] else employeeId },
    );
    _companyEmployees.add(companyId, newArr);
  };

  func _addCustomerToCompanyIndex(companyId : CompanyId, customerId : Text) {
    let existing = switch (_companyCustomers.get(companyId)) {
      case (?arr) arr;
      case null [];
    };
    let newArr = Array.tabulate(
      existing.size() + 1,
      func(i) { if (i < existing.size()) existing[i] else customerId },
    );
    _companyCustomers.add(companyId, newArr);
  };

  func _addOpportunityToCompanyIndex(companyId : CompanyId, oppId : Text) {
    let existing = switch (_companyOpportunities.get(companyId)) {
      case (?arr) arr;
      case null [];
    };
    let newArr = Array.tabulate(
      existing.size() + 1,
      func(i) { if (i < existing.size()) existing[i] else oppId },
    );
    _companyOpportunities.add(companyId, newArr);
  };

  func _hasManagerRole(roles : [CompanyRole]) : Bool {
    var found = false;
    var i = 0;
    while (i < roles.size()) {
      switch (roles[i]) {
        case (#CompanyOwner) { found := true };
        case (#CompanyManager) { found := true };
        case (_) {};
      };
      i += 1;
    };
    found
  };

  func _isMember(userId : UserId, companyId : CompanyId) : Bool {
    _memberships.get(_memberKey(userId, companyId)) != null
  };

  // ─── Public API

  public func registerUser(displayName : Text) : async ?UserProfile {
    let loginCode = _genLoginCode();
    let personnelCode = _genPersonnelCode();
    let userId = "USR" # _nextUserId.toText();
    if (_usersByLoginCode.get(loginCode) != null) return null;
    let profile : UserProfile = {
      id = userId;
      displayName = displayName;
      loginCode = loginCode;
      personnelCode = personnelCode;
      createdAt = _tick();
    };
    _usersById.add(userId, profile);
    _usersByLoginCode.add(loginCode, profile);
    _usersByPersonnelCode.add(personnelCode, profile);
    ?profile
  };

  public func loginWithCode(loginCode : Text) : async ?UserProfile {
    _usersByLoginCode.get(loginCode)
  };

  public func getUserProfile(userId : UserId) : async ?UserProfile {
    _usersById.get(userId)
  };

  public func registerCompany(
    ownerId : UserId,
    name : Text,
    sector : Text,
    address : Text,
    contactEmail : Text,
    phone : Text,
    foundedYear : Text,
  ) : async ?Company {
    switch (_usersById.get(ownerId)) {
      case null return null;
      case (?_) {};
    };
    let companyId = _genCompanyId();
    let company : Company = {
      id = companyId;
      name = name;
      sector = sector;
      address = address;
      contactEmail = contactEmail;
      phone = phone;
      foundedYear = foundedYear;
      ownerId = ownerId;
      createdAt = _tick();
    };
    _companiesById.add(companyId, company);
    _memberships.add(_memberKey(ownerId, companyId), {
      companyId = companyId;
      userId = ownerId;
      roles = [#CompanyOwner];
      grantedModules = ["HR", "Accounting", "CRM", "Inventory", "Projects", "Purchasing", "Production", "Workflow", "Reporting"];
      addedAt = _tick();
    });
    _addUserToCompanyIndex(ownerId, companyId);
    _addMemberToCompanyIndex(companyId, ownerId);
    ?company
  };

  public query func getCompany(companyId : CompanyId) : async ?Company {
    _companiesById.get(companyId)
  };

  public func getCompanyMemberships(userId : UserId) : async [CompanyMembership] {
    let companyIds = switch (_userCompanies.get(userId)) {
      case (?arr) arr;
      case null [];
    };
    companyIds.filterMap(func(cid : CompanyId) : ?CompanyMembership {
      _memberships.get(_memberKey(userId, cid))
    })
  };

  public func getUserCompanies(userId : UserId) : async [Company] {
    let companyIds = switch (_userCompanies.get(userId)) {
      case (?arr) arr;
      case null [];
    };
    companyIds.filterMap(func(cid : CompanyId) : ?Company {
      _companiesById.get(cid)
    })
  };

  public func addPersonnelToCompany(
    requesterId : UserId,
    personnelCode : Text,
    companyId : CompanyId,
    roles : [CompanyRole],
    modules : [ModuleName],
  ) : async Bool {
    let canAdd = switch (_memberships.get(_memberKey(requesterId, companyId))) {
      case null false;
      case (?m) _hasManagerRole(m.roles);
    };
    if (not canAdd) return false;

    let personnel = switch (_usersByPersonnelCode.get(personnelCode)) {
      case null return false;
      case (?p) p;
    };

    let key = _memberKey(personnel.id, companyId);
    let isNew = _memberships.get(key) == null;
    _memberships.add(key, {
      companyId = companyId;
      userId = personnel.id;
      roles = roles;
      grantedModules = modules;
      addedAt = _tick();
    });
    if (isNew) {
      _addUserToCompanyIndex(personnel.id, companyId);
      _addMemberToCompanyIndex(companyId, personnel.id);
    };
    true
  };

  public query func getCompanyMembers(companyId : CompanyId) : async [CompanyMembership] {
    let memberIds = switch (_companyMembers.get(companyId)) {
      case (?arr) arr;
      case null [];
    };
    memberIds.filterMap(func(uid : UserId) : ?CompanyMembership {
      _memberships.get(_memberKey(uid, companyId))
    })
  };

  public func removePersonnelFromCompany(
    requesterId : UserId,
    targetUserId : UserId,
    companyId : CompanyId,
  ) : async Bool {
    let canRemove = switch (_memberships.get(_memberKey(requesterId, companyId))) {
      case null false;
      case (?m) _hasManagerRole(m.roles);
    };
    if (not canRemove) return false;

    _memberships.remove(_memberKey(targetUserId, companyId));

    let members = switch (_companyMembers.get(companyId)) {
      case (?arr) arr;
      case null [];
    };
    _companyMembers.add(companyId, members.filter(func(uid : UserId) : Bool { uid != targetUserId }));

    let userCos = switch (_userCompanies.get(targetUserId)) {
      case (?arr) arr;
      case null [];
    };
    _userCompanies.add(targetUserId, userCos.filter(func(cid : CompanyId) : Bool { cid != companyId }));

    true
  };

  public query func getGrantedModules(userId : UserId, companyId : CompanyId) : async [ModuleName] {
    switch (_memberships.get(_memberKey(userId, companyId))) {
      case null [];
      case (?m) m.grantedModules;
    }
  };

  public func updateModulePermissions(
    requesterId : UserId,
    targetUserId : UserId,
    companyId : CompanyId,
    modules : [ModuleName],
  ) : async Bool {
    let canUpdate = switch (_memberships.get(_memberKey(requesterId, companyId))) {
      case null false;
      case (?m) _hasManagerRole(m.roles);
    };
    if (not canUpdate) return false;

    let key = _memberKey(targetUserId, companyId);
    switch (_memberships.get(key)) {
      case null return false;
      case (?existing) {
        _memberships.add(key, {
          companyId = existing.companyId;
          userId = existing.userId;
          roles = existing.roles;
          grantedModules = modules;
          addedAt = existing.addedAt;
        });
        true
      };
    }
  };

  public query func getDashboardSummary(userId : UserId, companyId : CompanyId) : async ?DashboardSummary {
    switch (_memberships.get(_memberKey(userId, companyId))) {
      case null return null;
      case (?_) {};
    };
    let company = switch (_companiesById.get(companyId)) {
      case null return null;
      case (?c) c;
    };
    let empCount = switch (_companyEmployees.get(companyId)) {
      case (?arr) arr.size();
      case null 0;
    };
    ?{
      employeeCount = empCount;
      activeModules = 9;
      companyName = company.name;
    }
  };

  public query func getUserByPersonnelCode(code : Text) : async ?UserProfile {
    _usersByPersonnelCode.get(code)
  };

  // ─── HR Employee API

  public func addEmployee(
    companyId : CompanyId,
    requesterId : UserId,
    name : Text,
    position : Text,
    department : Text,
    email : Text,
    salary : Nat,
  ) : async ?Employee {
    if (not _isMember(requesterId, companyId)) return null;
    let empId = _genEmployeeId();
    let emp : Employee = {
      id = empId;
      companyId = companyId;
      name = name;
      position = position;
      department = department;
      status = #active;
      email = email;
      salary = salary;
      createdAt = _tick();
    };
    _employeesById.add(empId, emp);
    _addEmployeeToCompanyIndex(companyId, empId);
    ?emp
  };

  public func updateEmployee(
    companyId : CompanyId,
    requesterId : UserId,
    employeeId : Text,
    name : Text,
    position : Text,
    department : Text,
    status : EmployeeStatus,
    email : Text,
    salary : Nat,
  ) : async Bool {
    if (not _isMember(requesterId, companyId)) return false;
    switch (_employeesById.get(employeeId)) {
      case null return false;
      case (?existing) {
        if (existing.companyId != companyId) return false;
        _employeesById.add(employeeId, {
          id = existing.id;
          companyId = existing.companyId;
          name = name;
          position = position;
          department = department;
          status = status;
          email = email;
          salary = salary;
          createdAt = existing.createdAt;
        });
        true
      };
    }
  };

  public func removeEmployee(
    companyId : CompanyId,
    requesterId : UserId,
    employeeId : Text,
  ) : async Bool {
    if (not _isMember(requesterId, companyId)) return false;
    switch (_employeesById.get(employeeId)) {
      case null return false;
      case (?existing) {
        if (existing.companyId != companyId) return false;
        _employeesById.remove(employeeId);
        let empIds = switch (_companyEmployees.get(companyId)) {
          case (?arr) arr;
          case null [];
        };
        _companyEmployees.add(companyId, empIds.filter(func(eid : Text) : Bool { eid != employeeId }));
        true
      };
    }
  };

  public query func getEmployees(companyId : CompanyId) : async [Employee] {
    let empIds = switch (_companyEmployees.get(companyId)) {
      case (?arr) arr;
      case null [];
    };
    empIds.filterMap(func(eid : Text) : ?Employee {
      _employeesById.get(eid)
    })
  };

  // ─── CRM Customer API

  public func addCustomer(
    companyId : CompanyId,
    requesterId : UserId,
    name : Text,
    email : Text,
    phone : Text,
    company : Text,
    status : CustomerStatus,
  ) : async ?Customer {
    if (not _isMember(requesterId, companyId)) return null;
    let cusId = _genCustomerId();
    let cus : Customer = {
      id = cusId;
      companyId = companyId;
      name = name;
      email = email;
      phone = phone;
      company = company;
      status = status;
      createdAt = _tick();
    };
    _customersById.add(cusId, cus);
    _addCustomerToCompanyIndex(companyId, cusId);
    ?cus
  };

  public func updateCustomerStatus(
    companyId : CompanyId,
    requesterId : UserId,
    customerId : Text,
    status : CustomerStatus,
  ) : async Bool {
    if (not _isMember(requesterId, companyId)) return false;
    switch (_customersById.get(customerId)) {
      case null return false;
      case (?existing) {
        if (existing.companyId != companyId) return false;
        _customersById.add(customerId, {
          id = existing.id;
          companyId = existing.companyId;
          name = existing.name;
          email = existing.email;
          phone = existing.phone;
          company = existing.company;
          status = status;
          createdAt = existing.createdAt;
        });
        true
      };
    }
  };

  public func removeCustomer(
    companyId : CompanyId,
    requesterId : UserId,
    customerId : Text,
  ) : async Bool {
    if (not _isMember(requesterId, companyId)) return false;
    switch (_customersById.get(customerId)) {
      case null return false;
      case (?existing) {
        if (existing.companyId != companyId) return false;
        _customersById.remove(customerId);
        let cusIds = switch (_companyCustomers.get(companyId)) {
          case (?arr) arr;
          case null [];
        };
        _companyCustomers.add(companyId, cusIds.filter(func(cid : Text) : Bool { cid != customerId }));
        true
      };
    }
  };

  public query func getCustomers(companyId : CompanyId) : async [Customer] {
    let cusIds = switch (_companyCustomers.get(companyId)) {
      case (?arr) arr;
      case null [];
    };
    cusIds.filterMap(func(cid : Text) : ?Customer {
      _customersById.get(cid)
    })
  };

  // ─── CRM Opportunity API

  public func addOpportunity(
    companyId : CompanyId,
    requesterId : UserId,
    name : Text,
    company : Text,
    value : Nat,
    assignee : Text,
    stage : PipelineStage,
    createdAt : Text,
  ) : async ?Opportunity {
    if (not _isMember(requesterId, companyId)) return null;
    let oppId = _genOpportunityId();
    let opp : Opportunity = {
      id = oppId;
      companyId = companyId;
      name = name;
      company = company;
      value = value;
      assignee = assignee;
      stage = stage;
      createdAt = createdAt;
    };
    _opportunitiesById.add(oppId, opp);
    _addOpportunityToCompanyIndex(companyId, oppId);
    ?opp
  };

  public func updateOpportunityStage(
    companyId : CompanyId,
    requesterId : UserId,
    opportunityId : Text,
    stage : PipelineStage,
  ) : async Bool {
    if (not _isMember(requesterId, companyId)) return false;
    switch (_opportunitiesById.get(opportunityId)) {
      case null return false;
      case (?existing) {
        if (existing.companyId != companyId) return false;
        _opportunitiesById.add(opportunityId, {
          id = existing.id;
          companyId = existing.companyId;
          name = existing.name;
          company = existing.company;
          value = existing.value;
          assignee = existing.assignee;
          stage = stage;
          createdAt = existing.createdAt;
        });
        true
      };
    }
  };

  public func removeOpportunity(
    companyId : CompanyId,
    requesterId : UserId,
    opportunityId : Text,
  ) : async Bool {
    if (not _isMember(requesterId, companyId)) return false;
    switch (_opportunitiesById.get(opportunityId)) {
      case null return false;
      case (?existing) {
        if (existing.companyId != companyId) return false;
        _opportunitiesById.remove(opportunityId);
        let oppIds = switch (_companyOpportunities.get(companyId)) {
          case (?arr) arr;
          case null [];
        };
        _companyOpportunities.add(companyId, oppIds.filter(func(oid : Text) : Bool { oid != opportunityId }));
        true
      };
    }
  };

  public query func getOpportunities(companyId : CompanyId) : async [Opportunity] {
    let oppIds = switch (_companyOpportunities.get(companyId)) {
      case (?arr) arr;
      case null [];
    };
    oppIds.filterMap(func(oid : Text) : ?Opportunity {
      _opportunitiesById.get(oid)
    })
  };

};
