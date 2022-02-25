const { readFileSync, existsSync } = require('fs');
const { setupServer } = require('./setupServer');
const { monkeyPatchConsole } = require('./util');

const { host, port, useWhiteList, disableLogging } = JSON.parse(
  readFileSync('./config.json', 'utf-8'),
);

monkeyPatchConsole({ disableLogging });

process.on('uncaughtException', (e) => {
  console.log(null, e);
});
process.on('unhandledRejection', (e) => {
  console.log(null, e);
});

async function index() {
  let whiteListHostsMap;
  if (useWhiteList) {
    if (!existsSync('./hosts.txt')) {
      console.log('No hosts.txt file found');
      return undefined;
    }

    const hosts = readFileSync('./hosts.txt', 'utf-8').split('\n').filter(Boolean);
    whiteListHostsMap = new Map(hosts.map((e) => [e, true]));
  }

  setupServer({
    httpsOnly: false,
    silentWhiteList: false,
    useWhiteList,
    port,
    host,
    whiteListHostsMap,
  });
}

index();
