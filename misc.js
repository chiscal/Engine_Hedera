"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Misc = exports.Network = void 0;
var hedera_mirror_node_ts_1 = require("@tikz/hedera-mirror-node-ts");
var sdk_1 = require("@hashgraph/sdk");
var axios = require('axios')["default"];
require("dotenv").config();
var myAccountId = process.env.MY_ACCOUNT_ID;
var myAccountKey = process.env.MY_TESTNET_PRIVATE_KEY;
var Network;
(function (Network) {
    Network["MAINNET"] = "MAINNET";
    Network["TESTNET"] = "TESTNET";
})(Network = exports.Network || (exports.Network = {}));
var Misc = /** @class */ (function () {
    function Misc(id, key, d_network) {
        if (id === void 0) { id = myAccountId; }
        if (key === void 0) { key = myAccountKey; }
        if (d_network === void 0) { d_network = Network.TESTNET; }
        this.ID = id;
        this.Key = key;
        this.d_network = d_network;
    }
    Misc.prototype.network = function (net, ID, Key) {
        if (net === void 0) { net = this.d_network; }
        if (ID === void 0) { ID = this.ID; }
        if (Key === void 0) { Key = this.Key; }
        if (net == Network.MAINNET) {
            this.client = sdk_1.Client.forMainnet().setOperator(ID, Key);
            this.link = "https://mainnet-public.mirrornode.hedera.com/";
            this.explorer = "https://app.dragonglass.me/";
        }
        if (net == Network.TESTNET) {
            this.client = sdk_1.Client.forTestnet().setOperator(ID, Key);
            this.link = "https://testnet.mirrornode.hedera.com/";
            this.explorer = "https://testnet.dragonglass.me/";
        }
    };
    Misc.prototype.coin_price = function (coin) {
        if (coin === void 0) { coin = "hbar"; }
        return __awaiter(this, void 0, void 0, function () {
            var info, res, price;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios.get("https://data.messari.io/api/v1/assets/".concat(coin, "/metrics"))];
                    case 1:
                        info = _a.sent();
                        res = info.data.data.market_data.price_usd;
                        price = res.toFixed(3);
                        return [2 /*return*/, price];
                }
            });
        });
    };
    Misc.prototype.getstamp = function (y, m, d, hour, min, sec) {
        var stamp = new Date(y, m - 1, d, hour, min, sec);
        return stamp;
    };
    Misc.prototype.toDateTime = function (secs) {
        var t = new Date(1970, 0, 1);
        t.setSeconds(secs);
        return t.toLocaleString();
    };
    Misc.prototype.nftSerial = function (nftid) {
        return __awaiter(this, void 0, void 0, function () {
            var info, serial, e_1, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios.get("https://testnet.mirrornode.hedera.com/api/v1/tokens/".concat(nftid, "/nfts"))];
                    case 1:
                        info = _a.sent();
                        serial = info.data.nfts[0].serial_number;
                        return [2 /*return*/, serial];
                    case 2:
                        e_1 = _a.sent();
                        if (e_1 == "TypeError: Cannot read properties of undefined (reading 'serial_number')") {
                            res = null;
                            return [2 /*return*/, res];
                        }
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Misc.prototype.TokenReturnInfo = function (tokenid) {
        return __awaiter(this, void 0, void 0, function () {
            var info, query, id, name, symbol, dec, token_type, custom_fees, freeze_status, kyc_status, pause_status, deleted, max_supply, supply_type, token_memo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        info = new sdk_1.TokenInfoQuery()
                            .setTokenId(tokenid);
                        return [4 /*yield*/, info.execute(this.client)];
                    case 1:
                        query = _a.sent();
                        id = query.tokenId.toString();
                        name = query.name;
                        symbol = query.symbol;
                        dec = query.decimals;
                        token_type = query.tokenType.toString();
                        custom_fees = query.customFees;
                        freeze_status = query.defaultFreezeStatus;
                        kyc_status = query.defaultKycStatus;
                        pause_status = query.pauseStatus;
                        deleted = query.isDeleted;
                        max_supply = query.maxSupply.toString();
                        supply_type = query.supplyType.toString();
                        token_memo = query.tokenMemo;
                        return [2 /*return*/, { id: id, name: name, symbol: symbol, dec: dec, token_type: token_type, custom_fees: custom_fees, freeze_status: freeze_status, kyc_status: kyc_status, pause_status: pause_status, deleted: deleted, max_supply: max_supply, supply_type: supply_type, token_memo: token_memo }];
                }
            });
        });
    };
    Misc.prototype.Tokens_issued = function (accountid, link) {
        return __awaiter(this, void 0, void 0, function () {
            var getter, transactionCursor, txns;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        getter = new hedera_mirror_node_ts_1.Client(link);
                        transactionCursor = (0, hedera_mirror_node_ts_1.transactions)(getter)
                            .setAccountId(accountid)
                            .setLimit(1000)
                            .setTransactionType(hedera_mirror_node_ts_1.TransactionType.TOKENCREATION)
                            .setResult('success');
                        return [4 /*yield*/, transactionCursor.get()];
                    case 1:
                        txns = _a.sent();
                        return [2 /*return*/, txns];
                }
            });
        });
    };
    Misc.prototype.Txn_details = function (accountid, link) {
        return __awaiter(this, void 0, void 0, function () {
            var getter, transactionCursor, txns;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        getter = new hedera_mirror_node_ts_1.Client(link);
                        transactionCursor = (0, hedera_mirror_node_ts_1.transactions)(getter)
                            .setAccountId(accountid)
                            .setLimit(1000)
                            .setTransactionType(hedera_mirror_node_ts_1.TransactionType.CRYPTOTRANSFER)
                            .setResult('success');
                        return [4 /*yield*/, transactionCursor.get()];
                    case 1:
                        txns = _a.sent();
                        return [2 /*return*/, txns];
                }
            });
        });
    };
    return Misc;
}());
exports.Misc = Misc;
