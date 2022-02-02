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

  constructor({ dateEdge, constDelay }) {
    this.dateEdge = dateEdge;
    this.constDelay = constDelay;
    this.correctedDelay = constDelay;
    this.internalLoggingDelay = 1;
    this.delayAirbag = 0;

    this.timestampEdge = dateEdge.getTime();
    this.shouldPing = false;
    this.shouldThrottle = false;
  }

  async promptAutoCorrectDelay() {
    await prompt({
      message: `Current status for PINGING: off | Change?`,
      type: 'confirm',
      name: 'name',
    });

    this.shouldPing = true;

    this.autoCorrectDelay();
  }

  async autoCorrectDelay() {
    if (!this.shouldPing) return;

    let res = await ping.promise.probe(process.env.PING_HOST, {
      timeout: 5,
      extra: ['-i', '1', '-c', '2'],
    });

    const minPing = Math.floor(res.min);

    if (!isNaN(res.min)) {
      this.correctedDelay = Math.round(this.constDelay - minPing + this.delayAirbag);
      console.log(
        `Min ping: ${minPing}ms; Airbag: ${this.delayAirbag}; Corrected delay ${this.correctedDelay}`,
      );
    }

    await sleep(3000);
    this.autoCorrectDelay();
  }

  async promptSwitchThrottlerState() {
    await prompt({
      message: `Current status for throttling req: ${this.shouldThrottle} | Change?`,
      type: 'confirm',
      name: 'name',
    });

    this.shouldThrottle = true;
  }

  async passGate() {
    if (this.shouldThrottle) {
      const sleepFor = this.timestampEdge - new Date(now()) + this.correctedDelay;

      if (sleepFor > 0) {
        await sleep(sleepFor);
        console.log(
          `Throttled packet sent at ${makeTimeHR(now() - this.internalLoggingDelay)} +-1ms`,
        );
        return;
      }

      this.shouldPing = false;
      this.shouldThrottle = false;

      console.log(`Current status for throttling and pinging is OFF, time reached`);
    }

    return Promise.resolve();
  }
}

module.exports = { Throttler };
