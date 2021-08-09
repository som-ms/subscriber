import { Constants } from "./Constants";
import * as appInsight from 'applicationinsights';
import { MessageReceived } from "./MessageReceived";

export class MessageProcessor {
    totalMessagesReceived: number;
    messageBatchReceived: number;
    messageReceiveStarted: boolean;
    lostMessages: number;
    sequence: number;
    mySet: Set<MessageReceived>;
    myMap: Map<number, MessageReceived>;

    constructor(public channelName: string) {
        appInsight.setup().start();
        this.totalMessagesReceived = 0;
        this.messageBatchReceived = 0;
        this.messageReceiveStarted = false;
        this.lostMessages = 0;
        this.sequence = -1;
        this.mySet = new Set();
        this.myMap = new Map();
    }

    isNumberInSequence(content: number) {
        if (content - this.sequence == 1) {
            return true;
        }
        return false;
    }

    public processMessage(messageObject: Message): void {
        this.messageReceiveStarted = true;
        this.totalMessagesReceived++;
        this.messageBatchReceived++;
        if (this.isNumberInSequence(messageObject.content)) {
            var currentTime = Date.now();
            if (
                currentTime - messageObject.timestamp >
                Constants.MESSAGE_EXPIRY_INTERVAL
            ) {
                this.lostMessages++;
            }
            this.sequence++;
        } else {
            if (messageObject.content < this.sequence) {
                // it is present in set
                var storedMessage = <MessageReceived>this.myMap.get(messageObject.content);
                var currentTime = Date.now();
                if (
                    currentTime - messageObject.timestamp >
                    Constants.MESSAGE_EXPIRY_INTERVAL
                ) {
                    // currentTimestamp -
                    this.lostMessages++;
                }
                this.mySet.delete(storedMessage);
                this.myMap.delete(storedMessage.content);
            } else {
                for (var i = this.sequence + 1; i <= messageObject.content; i++) {
                    // add all missing elements in set and map
                    var receivedMessage = new MessageReceived(i, messageObject.timestamp);
                    this.mySet.add(receivedMessage);
                    this.myMap.set(receivedMessage.content, receivedMessage);
                }
                this.sequence = messageObject.content; // update sequence
            }
        }
    }

    sendMetric(): void {
        if (this.messageReceiveStarted) {
            let currentTime: number = Date.now();
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

    processStoredElements(currentTime: number): void {
        this.mySet.forEach((item) => {
            if (currentTime - item.timestamp > Constants.MESSAGE_EXPIRY_INTERVAL) {
                this.lostMessages++;
                let messageSaved: MessageReceived = <MessageReceived>this.myMap.get(item.content);
                this.mySet.delete(messageSaved);
                this.myMap.delete(item.content);
            }
        });
    }

    resetValues(): void {
        this.lostMessages = 0;
        this.messageBatchReceived = 0;
    }
}