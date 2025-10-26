"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = exports.EnumRelationTables = exports.VerificationTokenType = exports.Type = exports.ROLE = void 0;
var ROLE;
(function (ROLE) {
    ROLE["USER"] = "USER";
    ROLE["ADMIN"] = "ADMIN";
})(ROLE || (exports.ROLE = ROLE = {}));
var Type;
(function (Type) {
    Type["number"] = "number";
    Type["string"] = "string";
})(Type || (exports.Type = Type = {}));
var VerificationTokenType;
(function (VerificationTokenType) {
    VerificationTokenType["EMAIL_VERIFICATION"] = "EMAIL_VERIFICATION";
    VerificationTokenType["PASSWORD_RESET"] = "PASSWORD_RESET";
})(VerificationTokenType || (exports.VerificationTokenType = VerificationTokenType = {}));
var EnumRelationTables;
(function (EnumRelationTables) {
    EnumRelationTables["PRODUCT"] = "products";
    EnumRelationTables["CATEGORY"] = "categories";
    EnumRelationTables["VARIANT"] = "variants";
    EnumRelationTables["ORDER"] = "orders";
})(EnumRelationTables || (exports.EnumRelationTables = EnumRelationTables = {}));
var Model;
(function (Model) {
    Model["PRODUCT"] = "product";
    Model["CATEGORY"] = "category";
    Model["VARIANT"] = "variant";
    Model["ORDER"] = "order";
})(Model || (exports.Model = Model = {}));
//# sourceMappingURL=enums.js.map