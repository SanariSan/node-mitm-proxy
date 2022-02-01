const { prompt } = require('inquirer');
const { sleep, now, makeTimeHR } = require('./util');
const ping = require('ping');

class Throttler {
  shouldThrottle;
  dateEdge;
  timestampEdge;
  constDelay;
  correctedDelay;
  delayAirbag;
  internalLoggingDelay;
  // sleepers;

  constructor({ dateEdge, constDelay }) {
    this.dateEdge = dateEdge;
    this.constDelay = constDelay;
    this.correctedDelay = constDelay;
    this.internalLoggingDelay = 2;
    this.delayAirbag = 3;
    // this.sleepers = [];

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

  // async addSleeper(cb) {
  //   const sleepChain;
  //   this.sleepers.();
  // }

  // async autoCorrectSleepers() {}

  async autoCorrectDelay() {
    let res = await ping.promise.probe(process.env.PING_HOST, {
      timeout: 5,
      extra: ['-i', '1', '-c', '2'],
    });

    const minPing = Math.floor(res.min);

    if (!isNaN(res.min)) {
      console.log(`Min ping: ${minPing}ms; Airbag: ${this.delayAirbag}; Correcting delay`);
      this.correctedDelay = Math.round(this.constDelay - minPing + this.delayAirbag);
      console.log(`Current delay: ${this.correctedDelay}ms`);
    }

    await sleep(2000);
    // this.autoCorrectDelay().then(() => this.autoCorrectSleepers());
    this.autoCorrectDelay();
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
      const sleepFor = this.timestampEdge - new Date(now()) + this.correctedDelay;

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
