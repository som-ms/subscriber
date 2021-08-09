import { Server } from './Server';
import { Constants } from './Constants';

class Trigger {

    runMultipleProcess(): void {
        let cmdArgs = process.argv.slice(2);
        let start: number = Number(cmdArgs[0]);
        for (var fileNumber = start; fileNumber < (start + Constants.TOTAL_NUMBER_OF_PROCESS_PER_VM); fileNumber++) {
            (new Server()).initiateTask(fileNumber);
        }
    }
}

let abc = new Trigger();
abc.runMultipleProcess();