const { readFileSync } = require('fs');
const { prompt } = require('inquirer');
const { setupServer } = require('./setupServer');
const { switchStopperValue, getStopperValue } = require('./util');

process.on('uncaughtException', (e) => {
  console.log(e);
});
process.on('unhandledRejection', (e) => {
  console.log(e);
});

async function index() {
  const hosts = readFileSync('./hosts.txt', 'utf-8').split('\n').filter(Boolean);
  const whiteListHostsMap = new Map(hosts.map((e) => [e, true]));

  setupServer({ port: 8888, httpsOnly: false });

  while (1) {
    await prompt({
      message: `Current status for pausing req: ${getStopperValue()} | Change?`,
      type: 'confirm',
      name: 'name',
    }).then(switchStopperValue);
  }
}

index();
