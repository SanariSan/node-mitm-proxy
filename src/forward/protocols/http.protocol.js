const httpProxy = require('http-proxy');
const { whiteListCheck } = require('../util.js');

// PROXY HTTP
function setupHttp({ server, useWhiteList, whiteListHostsMap, silentWhiteList, httpsOnly }) {
  server.on(
    'request',
    httpsOnly
      ? (req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('No http allowed');
        }
      : (request, response) => {
          const { protocol, port, hostname, pathname } = new URL(request.url);

          if (useWhiteList && !whiteListCheck(whiteListHostsMap, hostname) && !silentWhiteList) {
            console.log(`[-] HTTP: ${hostname}:${port || '80'}/${pathname || ''}`);
            return;
          }
          console.log(`[+] HTTP: ${hostname}:${port || '80'}/${pathname || ''}`);

          const proxy = httpProxy.createProxyServer({});

          proxy.on('end', (err, req, res) => {
            response.end();
            proxy.close();
          });
          proxy.on('error', (err, req, res) => {
            console.log('HTTP error' + err);
            res.end();
            response.end();
            proxy.close();
          });

          proxy.web(request, response, {
            target: `${protocol}//${hostname}:${port || '80'}`,
          });
        },
  );
}

module.exports = setupHttp;
