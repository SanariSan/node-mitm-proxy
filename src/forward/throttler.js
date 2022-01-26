const { prompt } = require('inquirer');
const { sleep, now, makeTimeHR } = require('./util');

class Throttler {
  shouldThrottle;
  dateEdge;
  timestampEdge;
  extraDelay;
  internalLoggingDelay;

  constructor({ dateEdge, extraDelay }) {
    this.dateEdge = dateEdge;
    this.extraDelay = extraDelay;
    this.internalLoggingDelay = 3;

    this.timestampEdge = dateEdge.getTime();
    this.shouldThrottle = false;
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

  async passGate(chunk) {
    // throttle all requests until this.dateEdge
    // not exactly throttling, but needed exactly this

    // not needed, seems like hb packets coming from server, so won't throttle those
    // if (chunk !== undefined && chunk.length === 44) {
    //   console.log(`[!] Passing hb packet`);
    //   return Promise.resolve();
    // }

    if (this.shouldThrottle) {
      const sleepFor = this.timestampEdge - new Date(now()) + this.extraDelay;

      if (sleepFor > 0) {
        console.log(`Sleeping for: ${Math.floor(sleepFor / 1000)}:${sleepFor % 1000}`);
        await sleep(sleepFor);
        console.log(
          `Throttled packet sent at ${makeTimeHR(now() - this.internalLoggingDelay)} +-1ms`,
        );
        return;
      }

      this.shouldThrottle = false;
      console.log(
        `Current status for throttling dropped to default, time limit reached, status: ${this.shouldThrottle}`,
      );
    }

    return Promise.resolve();
  }
}

module.exports = { Throttler };
