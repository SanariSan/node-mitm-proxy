const { readFileSync } = require('fs');
const { prompt } = require('inquirer');
const { setupServer } = require('./setupServer');
const { switchStopperValue, getStopperValue } = require('./util');

async function index() {
  const hosts = readFileSync('./hosts.txt', 'utf-8').split('\n').filter(Boolean);
  const whiteListHostsMap = new Map(hosts.map((e) => [e, true]));
  console.log(whiteListHostsMap);

  setupServer({ port: 8888, whiteListHostsMap, httpsOnly: false });

  while (1) {
    await prompt({
      message: `Current status for pausing req: ${getStopperValue()} | Change?`,
      type: 'confirm',
      name: 'name',
    }).then(switchStopperValue);
  }
}

index();
