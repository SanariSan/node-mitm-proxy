const { readFileSync } = require('fs');
const { setupServer } = require('./setupServer');
const { Throttler } = require('./throttler');
const { monkeyPatchConsole } = require('./util');

monkeyPatchConsole();

process.on('uncaughtException', (e) => {
  console.log(null, e);
});
process.on('unhandledRejection', (e) => {
  console.log(null, e);
});

async function index() {
  const { dateEdge, extraDelay, host, port, useWhiteList } = JSON.parse(
    readFileSync('./config.json', 'utf-8'),
  );
  const hosts = readFileSync('./hosts.txt', 'utf-8').split('\n').filter(Boolean);
  const whiteListHostsMap = new Map(hosts.map((e) => [e, true]));
  const throttler = new Throttler({
    dateEdge: new Date(dateEdge),
    extraDelay,
  });

  console.log(`Time limit at: ${throttler.dateEdge}`);
  console.log(`<- Now`);
  console.log(`Ping delay: ${throttler.extraDelay}`);

  throttler.promptSwitchState();

  setupServer({
    httpsOnly: false,
    silentWhiteList: false,
    useWhiteList,
    port,
    host,
    whiteListHostsMap,
    throttler,
  });
}

index();
