/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 930:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SortOrder = exports.Role = exports.QueryMode = exports.EnumWorkspaceMemberType = exports.EnumSubscriptionStatus = exports.EnumSubscriptionPlan = exports.EnumResourceType = exports.EnumPendingChangeOriginType = exports.EnumPendingChangeAction = exports.EnumMessagePatternConnectionOptions = exports.EnumGitProvider = exports.EnumGitOrganizationType = exports.EnumEntityPermissionType = exports.EnumEntityAction = exports.EnumDataType = exports.EnumBuildStatus = exports.EnumBlockType = exports.EnumAuthProviderType = exports.EnumActionStepStatus = exports.EnumActionLogLevel = void 0;
var EnumActionLogLevel;
(function (EnumActionLogLevel) {
    EnumActionLogLevel["Debug"] = "Debug";
    EnumActionLogLevel["Error"] = "Error";
    EnumActionLogLevel["Info"] = "Info";
    EnumActionLogLevel["Warning"] = "Warning";
})(EnumActionLogLevel = exports.EnumActionLogLevel || (exports.EnumActionLogLevel = {}));
var EnumActionStepStatus;
(function (EnumActionStepStatus) {
    EnumActionStepStatus["Failed"] = "Failed";
    EnumActionStepStatus["Running"] = "Running";
    EnumActionStepStatus["Success"] = "Success";
    EnumActionStepStatus["Waiting"] = "Waiting";
})(EnumActionStepStatus = exports.EnumActionStepStatus || (exports.EnumActionStepStatus = {}));
var EnumAuthProviderType;
(function (EnumAuthProviderType) {
    EnumAuthProviderType["Http"] = "Http";
    EnumAuthProviderType["Jwt"] = "Jwt";
})(EnumAuthProviderType = exports.EnumAuthProviderType || (exports.EnumAuthProviderType = {}));
var EnumBlockType;
(function (EnumBlockType) {
    EnumBlockType["CanvasPage"] = "CanvasPage";
    EnumBlockType["ConnectorFile"] = "ConnectorFile";
    EnumBlockType["ConnectorRestApi"] = "ConnectorRestApi";
    EnumBlockType["ConnectorRestApiCall"] = "ConnectorRestApiCall";
    EnumBlockType["ConnectorSoapApi"] = "ConnectorSoapApi";
    EnumBlockType["Document"] = "Document";
    EnumBlockType["EntityApi"] = "EntityApi";
    EnumBlockType["EntityApiEndpoint"] = "EntityApiEndpoint";
    EnumBlockType["EntityPage"] = "EntityPage";
    EnumBlockType["Flow"] = "Flow";
    EnumBlockType["FlowApi"] = "FlowApi";
    EnumBlockType["Layout"] = "Layout";
    EnumBlockType["PluginInstallation"] = "PluginInstallation";
    EnumBlockType["PluginOrder"] = "PluginOrder";
    EnumBlockType["ProjectConfigurationSettings"] = "ProjectConfigurationSettings";
    EnumBlockType["ServiceSettings"] = "ServiceSettings";
    EnumBlockType["ServiceTopics"] = "ServiceTopics";
    EnumBlockType["Topic"] = "Topic";
})(EnumBlockType = exports.EnumBlockType || (exports.EnumBlockType = {}));
var EnumBuildStatus;
(function (EnumBuildStatus) {
    EnumBuildStatus["Completed"] = "Completed";
    EnumBuildStatus["Failed"] = "Failed";
    EnumBuildStatus["Invalid"] = "Invalid";
    EnumBuildStatus["Running"] = "Running";
})(EnumBuildStatus = exports.EnumBuildStatus || (exports.EnumBuildStatus = {}));
var EnumDataType;
(function (EnumDataType) {
    EnumDataType["Boolean"] = "Boolean";
    EnumDataType["CreatedAt"] = "CreatedAt";
    EnumDataType["DateTime"] = "DateTime";
    EnumDataType["DecimalNumber"] = "DecimalNumber";
    EnumDataType["Email"] = "Email";
    EnumDataType["GeographicLocation"] = "GeographicLocation";
    EnumDataType["Id"] = "Id";
    EnumDataType["Json"] = "Json";
    EnumDataType["Lookup"] = "Lookup";
    EnumDataType["MultiLineText"] = "MultiLineText";
    EnumDataType["MultiSelectOptionSet"] = "MultiSelectOptionSet";
    EnumDataType["OptionSet"] = "OptionSet";
    EnumDataType["Password"] = "Password";
    EnumDataType["Roles"] = "Roles";
    EnumDataType["SingleLineText"] = "SingleLineText";
    EnumDataType["UpdatedAt"] = "UpdatedAt";
    EnumDataType["Username"] = "Username";
    EnumDataType["WholeNumber"] = "WholeNumber";
})(EnumDataType = exports.EnumDataType || (exports.EnumDataType = {}));
var EnumEntityAction;
(function (EnumEntityAction) {
    EnumEntityAction["Create"] = "Create";
    EnumEntityAction["Delete"] = "Delete";
    EnumEntityAction["Search"] = "Search";
    EnumEntityAction["Update"] = "Update";
    EnumEntityAction["View"] = "View";
})(EnumEntityAction = exports.EnumEntityAction || (exports.EnumEntityAction = {}));
var EnumEntityPermissionType;
(function (EnumEntityPermissionType) {
    EnumEntityPermissionType["AllRoles"] = "AllRoles";
    EnumEntityPermissionType["Disabled"] = "Disabled";
    EnumEntityPermissionType["Granular"] = "Granular";
    EnumEntityPermissionType["Public"] = "Public";
})(EnumEntityPermissionType = exports.EnumEntityPermissionType || (exports.EnumEntityPermissionType = {}));
var EnumGitOrganizationType;
(function (EnumGitOrganizationType) {
    EnumGitOrganizationType["Organization"] = "Organization";
    EnumGitOrganizationType["User"] = "User";
})(EnumGitOrganizationType = exports.EnumGitOrganizationType || (exports.EnumGitOrganizationType = {}));
var EnumGitProvider;
(function (EnumGitProvider) {
    EnumGitProvider["Github"] = "Github";
})(EnumGitProvider = exports.EnumGitProvider || (exports.EnumGitProvider = {}));
var EnumMessagePatternConnectionOptions;
(function (EnumMessagePatternConnectionOptions) {
    EnumMessagePatternConnectionOptions["None"] = "None";
    EnumMessagePatternConnectionOptions["Receive"] = "Receive";
    EnumMessagePatternConnectionOptions["Send"] = "Send";
})(EnumMessagePatternConnectionOptions = exports.EnumMessagePatternConnectionOptions || (exports.EnumMessagePatternConnectionOptions = {}));
var EnumPendingChangeAction;
(function (EnumPendingChangeAction) {
    EnumPendingChangeAction["Create"] = "Create";
    EnumPendingChangeAction["Delete"] = "Delete";
    EnumPendingChangeAction["Update"] = "Update";
})(EnumPendingChangeAction = exports.EnumPendingChangeAction || (exports.EnumPendingChangeAction = {}));
var EnumPendingChangeOriginType;
(function (EnumPendingChangeOriginType) {
    EnumPendingChangeOriginType["Block"] = "Block";
    EnumPendingChangeOriginType["Entity"] = "Entity";
})(EnumPendingChangeOriginType = exports.EnumPendingChangeOriginType || (exports.EnumPendingChangeOriginType = {}));
var EnumResourceType;
(function (EnumResourceType) {
    EnumResourceType["MessageBroker"] = "MessageBroker";
    EnumResourceType["ProjectConfiguration"] = "ProjectConfiguration";
    EnumResourceType["Service"] = "Service";
})(EnumResourceType = exports.EnumResourceType || (exports.EnumResourceType = {}));
var EnumSubscriptionPlan;
(function (EnumSubscriptionPlan) {
    EnumSubscriptionPlan["Business"] = "Business";
    EnumSubscriptionPlan["Enterprise"] = "Enterprise";
    EnumSubscriptionPlan["Pro"] = "Pro";
})(EnumSubscriptionPlan = exports.EnumSubscriptionPlan || (exports.EnumSubscriptionPlan = {}));
var EnumSubscriptionStatus;
(function (EnumSubscriptionStatus) {
    EnumSubscriptionStatus["Active"] = "Active";
    EnumSubscriptionStatus["Deleted"] = "Deleted";
    EnumSubscriptionStatus["PastDue"] = "PastDue";
    EnumSubscriptionStatus["Paused"] = "Paused";
    EnumSubscriptionStatus["Trailing"] = "Trailing";
})(EnumSubscriptionStatus = exports.EnumSubscriptionStatus || (exports.EnumSubscriptionStatus = {}));
var EnumWorkspaceMemberType;
(function (EnumWorkspaceMemberType) {
    EnumWorkspaceMemberType["Invitation"] = "Invitation";
    EnumWorkspaceMemberType["User"] = "User";
})(EnumWorkspaceMemberType = exports.EnumWorkspaceMemberType || (exports.EnumWorkspaceMemberType = {}));
var QueryMode;
(function (QueryMode) {
    QueryMode["Default"] = "Default";
    QueryMode["Insensitive"] = "Insensitive";
})(QueryMode = exports.QueryMode || (exports.QueryMode = {}));
var Role;
(function (Role) {
    Role["Admin"] = "Admin";
    Role["OrganizationAdmin"] = "OrganizationAdmin";
    Role["ProjectAdmin"] = "ProjectAdmin";
    Role["User"] = "User";
})(Role = exports.Role || (exports.Role = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["Asc"] = "Asc";
    SortOrder["Desc"] = "Desc";
})(SortOrder = exports.SortOrder || (exports.SortOrder = {}));
//# sourceMappingURL=models.js.map

/***/ }),

/***/ 601:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.templatesPath = exports.staticsPath = void 0;
const path_1 = __webpack_require__(17);
exports.staticsPath = (0, path_1.join)(__dirname, "static");
exports.templatesPath = (0, path_1.join)(__dirname, "templates");


/***/ }),

/***/ 17:
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const models_1 = __webpack_require__(930);
const constants_1 = __webpack_require__(601);
class JwtAuthPlugin {
    register() {
        return {
            CreateAdminUI: {
                before: this.beforeCreateAdminModules,
            },
            CreateServerAuth: {
                before: this.beforeCreateAuthModules,
                after: this.afterCreateAuthModules,
            },
        };
    }
    beforeCreateAdminModules(context, eventParams) {
        if (context.resourceInfo) {
            context.resourceInfo.settings.authProvider = models_1.EnumAuthProviderType.Jwt;
        }
        return eventParams;
    }
    beforeCreateAuthModules(context, eventParams) {
        context.utils.skipDefaultBehavior = true;
        return eventParams;
    }
    async afterCreateAuthModules(context, eventParams) {
        const staticsFiles = await context.utils.importStaticModules(constants_1.staticsPath, context.serverDirectories.srcDirectory);
        return staticsFiles;
    }
}
exports["default"] = JwtAuthPlugin;

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=main.js.map