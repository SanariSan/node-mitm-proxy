const httpProxy = require('http-proxy');
const http = require('http');
const net = require('net');
const { whiteListCheck } = require('./util.js');
const { Throttler } = require('./throttler.js');

// TODO: add throttler to http and ws

function setupServer({
  port = 3000,
  host = '127.0.0.1',
  httpsOnly,
  useWhiteList,
  whiteListHostsMap,
  silentWhiteList,
}) {
  if (useWhiteList) console.log(`Whitelist mode enabled, hosts:\n${whiteListHostsMap}`);
  let dropedBeats = 0;
  let dropBeatsCap = 20;
  // PROXY HTTP
  const server = httpsOnly
    ? http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('No http allowed');
      })
    : http.createServer((request, response) => {
        const { protocol, port, hostname, pathname } = new URL(request.url);

        if (useWhiteList && !whiteListCheck(whiteListHostsMap, hostname) && !silentWhiteList) {
          console.log(`[-] HTTP: ${hostname} | ${port || '80'} | ${pathname || ''}`);
          return;
        }
        console.log(`[+] HTTP: ${hostname} | ${port || '80'} | ${pathname || ''}`);

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
      });

  // PROXY WS
  server.on('upgrade', function (request, socket, head) {
    const { port, hostname } = new URL(request.url);

    if (useWhiteList && !whiteListCheck(whiteListHostsMap, hostname) && !silentWhiteList) {
      !silentWhiteList && console.log(`[-] WS: ${hostname} | ${port || '80'}`);
      return;
    }
    console.log(`[+] WS: ${hostname} | ${port || '80'}`);

    const proxy = httpProxy.createProxyServer();

    proxy.on('error', (err, req, res) => {
      console.log('WS error', err);
      res.end();
    });

    proxy.ws(request, socket, head, { target: `${hostname}:${port || '80'}`, ws: true });
  });

  // PROXY HTTPS
  server.on('connect', (request, clientSocket, head) => {
    const { port, hostname } = new URL(`http://${request.url}`);

    if (useWhiteList && !whiteListCheck(whiteListHostsMap, hostname) && !silentWhiteList) {
      console.log(`[-] HTTPS: ${hostname} || ${port || '443'}`);
      return;
    }
    console.log(`[+] HTTPS: ${hostname} || ${port || '443'}`);

    const serverSocket = net.connect(port || 443, hostname, () => {
      Throttler.passGate()
        .then(() => {
          // send head to the server
          serverSocket.write(head);
          // tell client the tunnel is set up
          clientSocket.write('HTTP/' + request.httpVersion + ' 200 Connection established\r\n\r\n');
        })
        .then(() => Throttler.closeGate());
    });

    // Tunnel from proxy to server
    serverSocket.on('data', (chunk) => {
      Throttler.passGate()
        .then(() => {
          // TODO:
          // KEEP ONLY FIRST 44 BYTES PACKET, DROP ALL THE OTHERS UNTIL TIME LIMIT

          if (chunk.length === 44) {
            if (dropedBeats < dropBeatsCap) {
              return;
            }
            console.dir('Passing');
            dropedBeats = 0;
          }

          clientSocket.write(chunk);
        })
        .then(() => Throttler.closeGate());
    });
    serverSocket.on('end', () => {
      Throttler.passGate()
        .then(() => {
          clientSocket.end();
        })
        .then(() => Throttler.closeGate());
    });
    serverSocket.on('error', () => {
      Throttler.passGate()
        .then(() => {
          clientSocket.write('HTTP/' + request.httpVersion + ' 500 Connection error\r\n\r\n');
          clientSocket.end();
        })
        .then(() => Throttler.closeGate());
    });

    // Tunnel from proxy to client
    clientSocket.on('data', (chunk) => {
      Throttler.passGate()
        .then(() => {
          serverSocket.write(chunk);
        })
        .then(() => Throttler.closeGate());
    });
    clientSocket.on('end', () => {
      Throttler.passGate()
        .then(() => {
          serverSocket.end();
        })
        .then(() => Throttler.closeGate());
    });
    clientSocket.on('error', () => {
      Throttler.passGate()
        .then(() => {
          serverSocket.end();
        })
        .then(() => Throttler.closeGate());
    });
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log('Address in use, retrying...');
      setTimeout(() => {
        server.close();
        server.listen(port, host);
      }, 1000);
    }
  });

  server.listen(port, host, () => {
    console.log(`Listening: ${host}:${port}`);
  });
}

module.exports = {
  setupServer,
};
