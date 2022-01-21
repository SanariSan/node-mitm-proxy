const httpProxy = require('http-proxy');
const { whiteListCheck } = require('../util.js');

// PROXY WS
function setupWs({ server, useWhiteList, whiteListHostsMap, silentWhiteList }) {
  server.on('upgrade', function (request, socket, head) {
    const { port, hostname } = new URL(request.url);

    if (useWhiteList && !whiteListCheck(whiteListHostsMap, hostname) && !silentWhiteList) {
      !silentWhiteList && console.log(`[-] WS: ${hostname}:${port || '80'}`);
      return;
    }
    console.log(`[+] WS: ${hostname}:${port || '80'}`);

    const proxy = httpProxy.createProxyServer();

    proxy.on('error', (err, req, res) => {
      console.log('WS error', err);
      res.end();
    });

    proxy.ws(request, socket, head, { target: `${hostname}:${port || '80'}`, ws: true });
  });
}

module.exports = setupWs;
