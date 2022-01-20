const { readFileSync } = require('fs');
const { setupServer } = require('./setupServer');
const { Throttler } = require('./throttler');

process.on('uncaughtException', (e) => {
  console.log(e);
});
process.on('unhandledRejection', (e) => {
  console.log(e);
});

async function index() {
  const hosts = readFileSync('./hosts.txt', 'utf-8').split('\n').filter(Boolean);
  const whiteListHostsMap = new Map(hosts.map((e) => [e, true]));

  setupServer({
    port: 8888,
    host: '192.168.31.197',
    httpsOnly: false,
    useWhiteList: false,
    whiteListHostsMap,
    silentWhiteList: false,
  });

  console.log(`Time limit at: ${Throttler.dateEdge}`);
  console.log(`Ping delay: ${Throttler.extraDelay}`);
  Throttler.promptSwitchState();
}

index();
