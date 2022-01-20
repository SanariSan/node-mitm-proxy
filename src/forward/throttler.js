const { prompt } = require('inquirer');
const { sleep, now } = require('./util');

class Throttler {
  static shouldThrottle = false;
  static dateEdge = new Date(new Date(2022, 0, 20, 19, 42).getTime() + 3600000 * 3);
  static timestampEdge = this.dateEdge.getTime();
  static extraDelay = 60;

  static switchState() {
    this.shouldThrottle = !this.shouldThrottle;
  }

  static async promptSwitchState() {
    await prompt({
      message: `Current status for throttling req: ${this.shouldThrottle} | Change?`,
      type: 'confirm',
      name: 'name',
    });

    this.switchState();
    this.promptSwitchState();
  }

  static passGate() {
    // throttle all requests until this.dateEdge
    // not exactly throttling, but needed exactly this

    if (this.shouldThrottle) {
      const sleepFor = this.timestampEdge - new Date(now()) - this.extraDelay;

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

  static closeGate() {
    if (this.shouldThrottle) {
      const date = new Date(now());
      console.log(
        `Req sent at ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}:${date.getUTCMilliseconds()}`,
      );
    }
  }
}

module.exports = { Throttler };
