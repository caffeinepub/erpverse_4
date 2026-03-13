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

  // ─── State

  var _nextUserId : Nat = 0;
  var _nextCompanyId : Nat = 0;
  var _counter : Int = 0;

  let _usersByLoginCode = Map.empty<Text, UserProfile>();
  let _usersByPersonnelCode = Map.empty<Text, UserProfile>();
  let _usersById = Map.empty<UserId, UserProfile>();
  let _companiesById = Map.empty<CompanyId, Company>();
  let _memberships = Map.empty<Text, CompanyMembership>();
  let _userCompanies = Map.empty<UserId, [CompanyId]>();
  let _companyMembers = Map.empty<CompanyId, [UserId]>();

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

  // Update call (not query) so it always reads from committed state after registration
  public func loginWithCode(loginCode : Text) : async ?UserProfile {
    _usersByLoginCode.get(loginCode)
  };

  // Update call (not query) for consistent reads after state changes
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

  // Update call for consistent reads after addPersonnelToCompany
  public func getCompanyMemberships(userId : UserId) : async [CompanyMembership] {
    let companyIds = switch (_userCompanies.get(userId)) {
      case (?arr) arr;
      case null [];
    };
    companyIds.filterMap(func(cid : CompanyId) : ?CompanyMembership {
      _memberships.get(_memberKey(userId, cid))
    })
  };

  // Update call for consistent reads after company registration
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
    let memberCount = switch (_companyMembers.get(companyId)) {
      case (?arr) arr.size();
      case null 0;
    };
    ?{
      employeeCount = memberCount;
      activeModules = 9;
      companyName = company.name;
    }
  };

  public query func getUserByPersonnelCode(code : Text) : async ?UserProfile {
    _usersByPersonnelCode.get(code)
  };

};
