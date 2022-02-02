const { readFileSync } = require('fs');
const { setupServer } = require('./setupServer');
const { Throttler } = require('./throttler');
const { monkeyPatchConsole } = require('./util');

monkeyPatchConsole({ disableLogging: false });

process.on('uncaughtException', (e) => {
  console.log(null, e);
});
process.on('unhandledRejection', (e) => {
  console.log(null, e);
});

async function index() {
  const { dateEdge, constDelay, host, port, useWhiteList } = JSON.parse(
    readFileSync('./config.json', 'utf-8'),
  );

  let whiteListHostsMap;
  if (useWhiteList) {
    const hosts = readFileSync('./hosts.txt', 'utf-8').split('\n').filter(Boolean);
    whiteListHostsMap = new Map(hosts.map((e) => [e, true]));
  }

  const throttler = new Throttler({
    dateEdge: new Date(dateEdge),
    constDelay,
  });

  console.log(`Time limit at: ${throttler.dateEdge}`);
  console.log(`<- Now`);
  console.log(`Delay: ${throttler.correctedDelay}`);

  throttler.promptAutoCorrectDelay().then(() => throttler.promptSwitchThrottlerState());

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
