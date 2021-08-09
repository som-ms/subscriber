# subscriber
APPINSIGHTS_INSTRUMENTATION_KEY=<AppInsightKey> REDIS_KEY=<RedisPWD>  node ./dist/Trigger.js <startFileNumber> 
  
  Command line argument:
  startFileNumber is the numerical value attached with the files present inside files/ folder. A single process will be processing 8 files starting from the startFileNumber.

  This application will be responsible for subscribing multiple channels defined inside the files/ folder in accordance with the startFileNumber provided. After subscribing for those channels it will be processing messages for those channels and find out if there are any lost messages based upon the configuration defined.
