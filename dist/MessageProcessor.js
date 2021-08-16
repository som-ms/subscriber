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
exports.MessageProcessor = void 0;
const Constants_1 = require("./Constants");
const appInsight = __importStar(require("applicationinsights"));
const MessageReceived_1 = require("./MessageReceived");
class MessageProcessor {
    constructor(channelName) {
        this.channelName = channelName;
        appInsight.setup().start();
        this.totalMessagesReceived = 0;
        this.messageBatchReceived = 0;
        this.messageReceiveStarted = false;
        this.lostMessages = 0;
        this.sequence = -1;
        this.mySet = new Set();
        this.myMap = new Map();
    }
    isNumberInSequence(content) {
        if (content - this.sequence == 1) {
            return true;
        }
        return false;
    }
    processMessage(messageObject) {
        this.messageReceiveStarted = true;
        this.totalMessagesReceived++;
        this.messageBatchReceived++;
        if (this.isNumberInSequence(messageObject.content)) {
            var currentTime = Date.now();
            if (currentTime - messageObject.timestamp >
                Constants_1.Constants.MESSAGE_EXPIRY_INTERVAL) {
                this.lostMessages++;
            }
            this.sequence++;
        }
        else {
            if (messageObject.content < this.sequence) {
                // it is present in set
                var storedMessage = this.myMap.get(messageObject.content);
                var currentTime = Date.now();
                if (currentTime - messageObject.timestamp >
                    Constants_1.Constants.MESSAGE_EXPIRY_INTERVAL) {
                    // currentTimestamp -
                    this.lostMessages++;
                }
                this.mySet.delete(storedMessage);
                this.myMap.delete(storedMessage.content);
            }
            else {
                for (var i = this.sequence + 1; i <= messageObject.content; i++) {
                    // add all missing elements in set and map
                    var receivedMessage = new MessageReceived_1.MessageReceived(i, messageObject.timestamp);
                    this.mySet.add(receivedMessage);
                    this.myMap.set(receivedMessage.content, receivedMessage);
                }
                this.sequence = messageObject.content; // update sequence
            }
        }
    }
    sendMetric() {
        if (this.messageReceiveStarted) {
            let currentTime = Date.now();
            this.processStoredElements(currentTime);
            var propertySet = {
                totalMessageReceived: this.totalMessagesReceived,
                lostMessages: this.lostMessages,
                messageBatchReceived: this.messageBatchReceived,
                channelId: this.channelName
            };
            var metrics = {
                lostMessages: this.lostMessages,
                MessageBatchReceived: this.messageBatchReceived,
            };
            appInsight.defaultClient.trackEvent({
                name: "subEvents",
                properties: propertySet,
                measurements: metrics,
            });
            appInsight.defaultClient.flush();
            this.resetValues();
        }
    }
    processStoredElements(currentTime) {
        this.mySet.forEach((item) => {
            if (currentTime - item.timestamp > Constants_1.Constants.MESSAGE_EXPIRY_INTERVAL) {
                this.lostMessages++;
                let messageSaved = this.myMap.get(item.content);
                this.mySet.delete(messageSaved);
                this.myMap.delete(item.content);
            }
        });
    }
    resetValues() {
        this.lostMessages = 0;
        this.messageBatchReceived = 0;
    }
}
exports.MessageProcessor = MessageProcessor;
//# sourceMappingURL=MessageProcessor.js.map