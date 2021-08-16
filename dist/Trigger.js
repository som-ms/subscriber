"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("./Server");
const Constants_1 = require("./Constants");
class Trigger {
    runMultipleProcess() {
        let cmdArgs = process.argv.slice(2);
        let start = Number(cmdArgs[0]);
        for (var fileNumber = start; fileNumber < (start + Constants_1.Constants.TOTAL_NUMBER_OF_PROCESS_PER_VM); fileNumber++) {
            (new Server_1.Server()).initiateTask(fileNumber);
        }
    }
}
let abc = new Trigger();
abc.runMultipleProcess();
//# sourceMappingURL=Trigger.js.map