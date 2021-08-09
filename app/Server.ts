import IORedis from 'ioredis';
import fs from 'fs';
import * as appInsight from 'applicationinsights'
import { MyRedisCluster } from './MyRedisCluster';
import { MessageProcessor } from './MessageProcessor';
import { Constants } from './Constants';
export class Server {
    redisClient: IORedis.Cluster;
    channelList: Set<string>;
    channelProcessorMap: Map<string, MessageProcessor>;
    constructor() {
        appInsight.setup().start();
        this.redisClient = new MyRedisCluster().getRedisConnection();
        this.channelList = new Set();
        this.channelProcessorMap = new Map();
    }

    public initiateTask(fileNumber: number): void {
        console.log("before file: " + fileNumber)
        this.redisClient.on("ready", () => {
            console.log("file: " + fileNumber)
            var propertySet = {
                errorMessage: "null",
                descriptiveMessage: "Redis Connection ready. Starting execution"
            };
            appInsight.defaultClient.trackEvent({ name: "redisSubConnMsg", properties: propertySet });
            console.log("ready");
            this.subscribeAllChannels(fileNumber);
        });

        this.redisClient.on('message', (channel, message) => {
            let messageObject: Message = JSON.parse(message);
            // call process for respective object
            this.processMessageForChannel(channel, messageObject);
        });

        setInterval(this.sendMetric.bind(this), Number(Constants.METRIC_SENT_INTERVAL));

        process.on('SIGINT', function () {
            console.log("shutting down gracefully.")
            appInsight.defaultClient.flush();
            console.log("done flushing insights")
            process.exit();
        });

    }

    public processMessageForChannel(channel: string, messageObject: Message): void {
        let messageProcessor: MessageProcessor = <MessageProcessor>this.channelProcessorMap.get(channel);
        messageProcessor.processMessage(messageObject);
    }

    public subscribeAllChannels(fileNumber: number): void {
        try {
            const data = fs.readFileSync('./files/file' + fileNumber + '.txt', 'utf-8');
            var subArray = data.split(',');
            subArray.forEach(element => {
                this.channelList.add(element);
                this.executeAfterReady(element);
            })
            // this.executeAfterReady(Array.from(this.channelList.values()))
        } catch (err) {
            console.error(err)
        }
    }

    protected executeAfterReady(channelName: string): void {
        this.redisClient.subscribe(channelName, (err, count) => {
            if (err) {
                var propertySet = {
                    errorMessage: "couldn't subscribe to channel",
                    descriptiveMessage: err.message,
                    channelId: channelName,
                };
                appInsight.defaultClient.trackEvent({ name: "redisSubConnError", properties: propertySet });
            } else {
                var propertySet = {
                    errorMessage: "null",
                    descriptiveMessage: "subscribed to channel",
                    channelId: channelName
                };
                appInsight.defaultClient.trackEvent({ name: "redisSubConn", properties: propertySet });
                let messageProcessor: MessageProcessor = new MessageProcessor(channelName);
                this.channelProcessorMap.set(channelName, messageProcessor);
                console.log("channel subscribed: " + channelName);
            }
        });
    }

    private sendMetric(): void {
        this.channelList.forEach(element => {
            let messageProcessor: MessageProcessor = <MessageProcessor>this.channelProcessorMap.get(element);
            messageProcessor.sendMetric();
        })
        appInsight.defaultClient.flush();
    }

}

