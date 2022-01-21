const http = require('http');
const { setupHttp, setupHttps, setupWs } = require('./protocols/index.js');

function setupServer({
  port = 3000,
  host = '127.0.0.1',
  httpsOnly,
  useWhiteList,
  whiteListHostsMap,
  silentWhiteList,
  throttler,
}) {
  if (useWhiteList)
    console.log(
      `Whitelist mode enabled, hosts:\n${JSON.stringify(
        [...whiteListHostsMap.keys()],
        null,
        '\t',
      )}`,
    );

  const server = http.createServer();
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log('Address in use, retrying...');
      setTimeout(() => {
        server.close();
        server.listen(port, host);
      }, 1000);
    }
  });

  // TODO: add throttler to http and ws

  setupHttp({ server, useWhiteList, whiteListHostsMap, silentWhiteList, httpsOnly });
  setupHttps({ server, useWhiteList, whiteListHostsMap, silentWhiteList, throttler });
  setupWs({ server, useWhiteList, whiteListHostsMap, silentWhiteList });

  server.listen(port, host, () => {
    console.log(`Listening: ${host}:${port}`);
  });
}

module.exports = {
  setupServer,
};
