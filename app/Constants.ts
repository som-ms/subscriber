export class Constants {
    static NUM_OF_MESSAGES: number = 5;
    static MESSAGE_PUBLISH_INTERVAL: number = 200;
    static METRIC_SENT_INTERVAL: number = 60000;
    static MESSAGE_EXPIRY_INTERVAL: number = 300000;
    static TOTAL_CHANNELS_PER_CONNECTION: number = 75;
    static TOTAL_NUMBER_OF_PROCESS_PER_VM: number = 8;
    static PORT: number = 6380;
    static HOSTNAME: string = "p5redis.redis.cache.windows.net";
}