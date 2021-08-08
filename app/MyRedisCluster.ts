import { Constants } from './Constants';
import * as ioRedis from 'ioredis';
import * as appInsight from 'applicationinsights'
let nodes: ioRedis.ClusterNode[] = [
  {
    port: Constants.PORT,
    host: Constants.HOSTNAME,
  },
];

export class MyRedisCluster {

  private myRedisInstance: ioRedis.Cluster;
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
          servername: Constants.HOSTNAME,
        },
        showFriendlyErrorStack: true,
        maxRetriesPerRequest: 3,
        enableAutoPipelining: true,
        connectTimeout: 20000,
        password: process.env.REDIS_KEY,
        enableOfflineQueue: false,
        enableReadyCheck: false,
      },
    })
    this.setupClientListeners(this.myRedisInstance);
  }

  getRedisConnection(): ioRedis.Cluster {
    return this.myRedisInstance;
  }

  protected setupClientListeners(client: ioRedis.Cluster): void {

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