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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const fs_1 = __importDefault(require("fs"));
const appInsight = __importStar(require("applicationinsights"));
const MyRedisCluster_1 = require("./MyRedisCluster");
const MessageProcessor_1 = require("./MessageProcessor");
const Constants_1 = require("./Constants");
class Server {
    constructor() {
        appInsight.setup().start();
        this.redisClient = new MyRedisCluster_1.MyRedisCluster().getRedisConnection();
        this.channelList = new Set();
        this.channelProcessorMap = new Map();
    }
    initiateTask(fileNumber) {
        console.log("before file: " + fileNumber);
        this.redisClient.on("ready", () => {
            console.log("file: " + fileNumber);
            var propertySet = {
                errorMessage: "null",
                descriptiveMessage: "Redis Connection ready. Starting execution"
            };
            appInsight.defaultClient.trackEvent({ name: "redisSubConnMsg", properties: propertySet });
            console.log("ready");
            this.subscribeAllChannels(fileNumber);
        });
        this.redisClient.on('message', (channel, message) => {
            let messageObject = JSON.parse(message);
            // call process for respective object
            this.processMessageForChannel(channel, messageObject);
        });
        setInterval(this.sendMetric.bind(this), Number(Constants_1.Constants.METRIC_SENT_INTERVAL));
        process.on('SIGINT', function () {
            console.log("shutting down gracefully.");
            appInsight.defaultClient.flush();
            console.log("done flushing insights");
            process.exit();
        });
    }
    processMessageForChannel(channel, messageObject) {
        let messageProcessor = this.channelProcessorMap.get(channel);
        messageProcessor.processMessage(messageObject);
    }
    subscribeAllChannels(fileNumber) {
        try {
            const data = fs_1.default.readFileSync('./files/file' + fileNumber + '.txt', 'utf-8');
            var subArray = data.split(',');
            subArray.forEach(element => {
                this.channelList.add(element);
                this.executeAfterReady(element);
            });
            // this.executeAfterReady(Array.from(this.channelList.values()))
        }
        catch (err) {
            console.error(err);
        }
    }
    executeAfterReady(channelName) {
        this.redisClient.subscribe(channelName, (err, count) => {
            if (err) {
                var propertySet = {
                    errorMessage: "couldn't subscribe to channel",
                    descriptiveMessage: err.message,
                    channelId: channelName,
                };
                appInsight.defaultClient.trackEvent({ name: "redisSubConnError", properties: propertySet });
            }
            else {
                var propertySet = {
                    errorMessage: "null",
                    descriptiveMessage: "subscribed to channel",
                    channelId: channelName
                };
                appInsight.defaultClient.trackEvent({ name: "redisSubConn", properties: propertySet });
                let messageProcessor = new MessageProcessor_1.MessageProcessor(channelName);
                this.channelProcessorMap.set(channelName, messageProcessor);
                console.log("channel subscribed: " + channelName);
            }
        });
    }
    sendMetric() {
        this.channelList.forEach(element => {
            let messageProcessor = this.channelProcessorMap.get(element);
            messageProcessor.sendMetric();
        });
        appInsight.defaultClient.flush();
    }
}
exports.Server = Server;
//# sourceMappingURL=Server.js.map