# subscriber
APPINSIGHTS_INSTRUMENTATION_KEY=<AppInsightKey> REDIS_KEY=<RedisPWD>  node ./dist/Trigger.js <startFileNumber> 
  
  Command line argument:
  startFileNumber is the numerical value attached with the files present inside files/ folder. A single process will be processing 8 files starting from the startFileNumber.
