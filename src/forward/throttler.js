const { prompt } = require('inquirer');
const { sleep, now } = require('./util');

class Throttler {
  shouldThrottle;
  dateEdge;
  timestampEdge;
  extraDelay;
  dropedBeats;
  dropBeatsCap;

  constructor({ dateEdge, extraDelay }) {
    this.dateEdge = dateEdge;
    this.extraDelay = extraDelay - 2; // - internal delay

    this.timestampEdge = dateEdge.getTime();
    this.shouldThrottle = false;
    this.dropedBeats = 0;
    this.dropBeatsCap = 5;
  }

  switchState() {
    this.shouldThrottle = !this.shouldThrottle;
  }

  async promptSwitchState() {
    await prompt({
      message: `Current status for throttling req: ${this.shouldThrottle} | Change?`,
      type: 'confirm',
      name: 'name',
    });

    this.switchState();
    this.promptSwitchState();
  }

  passGate(chunk) {
    // throttle all requests until this.dateEdge
    // not exactly throttling, but needed exactly this

    // if (chunk !== undefined) {
    //   if (chunk.length === 44) {
    //     if (this.dropedBeats++ < this.dropBeatsCap) {
    //       return Promise.reject();
    //     }
    //     console.log(`[!] Passing ${this.dropBeatsCap}-th hb packet`);
    //     this.dropedBeats = 0;
    //   }
    // }

    if (this.shouldThrottle) {
      const sleepFor = this.timestampEdge - new Date(now()) + this.extraDelay;

      if (sleepFor > 0) {
        console.log(`Sleeping for: ${Math.floor(sleepFor / 1000)}:${sleepFor % 1000}`);
        return sleep(sleepFor);
      }

      this.shouldThrottle = false;
      console.log(
        `Current status for throttling dropped to default, time limit reached, status: ${this.shouldThrottle}`,
      );
    }

    return Promise.resolve();
  }

  closeGate() {
    if (this.shouldThrottle) {
      console.log(`<- Throttled packet sent at`);
    }
  }
}

module.exports = { Throttler };
