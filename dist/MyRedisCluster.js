"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRedisCluster = void 0;
const Constants_1 = require("./Constants");
const ioRedis = __importStar(require("ioredis"));
const appInsight = __importStar(require("applicationinsights"));
let nodes = [
    {
        port: Constants_1.Constants.PORT,
        host: Constants_1.Constants.HOSTNAME,
    },
];
class MyRedisCluster {
    constructor() {
        appInsight.setup().start();
        this.myRedisInstance = new ioRedis.Cluster(nodes, {
            slotsRefreshTimeout: 5000,
            enableOfflineQueue: false,
            enableReadyCheck: false,
            dnsLookup: (address, callback) => callback(null, address),
            redisOptions: {
                family: 4,
                tls: {
                    servername: Constants_1.Constants.HOSTNAME,
                },
                showFriendlyErrorStack: true,
                maxRetriesPerRequest: 3,
                enableAutoPipelining: true,
                connectTimeout: 20000,
                password: process.env.REDIS_KEY,
                enableOfflineQueue: false,
                enableReadyCheck: false,
            },
        });
        this.setupClientListeners(this.myRedisInstance);
    }
    getRedisConnection() {
        return this.myRedisInstance;
    }
    setupClientListeners(client) {
        client.on("reconnecting", function () {
            var propertySet = {
                errorMessage: "Reconnecting redis",
                descriptiveMessage: "Redis reconnection event called"
            };
            appInsight.defaultClient.trackEvent({ name: "redisSubConnMsg", properties: propertySet });
            appInsight.defaultClient.trackMetric({ name: "redisSubReconnect", value: 1.0 });
        });
        client.on("connect", function () {
            var propertySet = {
                errorMessage: "null",
                descriptiveMessage: "Redis Connection established"
            };
            appInsight.defaultClient.trackEvent({ name: "redisSubConnMsg", properties: propertySet });
        });
        client.on("error", (err) => {
            var propertySet = {
                errorMessage: "Something went wrong connecting redis",
                descriptiveMessage: err.message
            };
            appInsight.defaultClient.trackEvent({ name: "redisSubConnError", properties: propertySet });
        });
        client.on("close", function () {
            var propertySet = {
                errorMessage: "Redis server connection closed"
            };
            appInsight.defaultClient.trackEvent({ name: "redisSubConnClosed", properties: propertySet });
            appInsight.defaultClient.trackMetric({ name: "redisSubConnClosed", value: 1.0 });
        });
    }
}
exports.MyRedisCluster = MyRedisCluster;
//# sourceMappingURL=MyRedisCluster.js.map