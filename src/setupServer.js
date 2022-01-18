const httpProxy = require('http-proxy');
const http = require('http');
const net = require('net');
const { stopper } = require('./util.js');

function setupServer({ port, host = '127.0.0.1', httpsOnly, whiteListHostsMap }) {
  // PROXY HTTP
  const server = httpsOnly
    ? http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('No http allowed');
      })
    : http.createServer((request, response) => {
        const { origin, pathname } = new URL(request.url);

        console.log(`[+] HTTP: ${origin} | ${pathname || ''}`);

        const proxy = httpProxy.createProxyServer({});

        proxy.on('end', (err, req, res) => {
          response.end();
          proxy.close();
        });
        proxy.on('error', (err, req, res) => {
          console.log('proxy error' + err);
          res.end();
          response.end();
          proxy.close();
        });

        proxy.web(request, response, { target: origin, selfHandleResponse: false });
      });

  // PROXY WS
  server.on('upgrade', function (request, socket, head) {
    const { origin } = new URL(request.url);

    console.log('[+] WS:', origin);

    const proxy = httpProxy.createProxyServer();

    // intercept req after calling ws()
    proxy.on('proxyReqWs', function (proxyReq, req, res, options) {
      // proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
    });
    proxy.on('proxyRes', function (proxyReq, req, res, options) {
      // proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
    });
    proxy.on('error', (err, req, res) => {
      console.log('proxy error', err);
      res.end();
    });

    proxy.ws(req, socket, head, { target: origin, ws: true });
  });

  // PROXY HTTPS
  server.on('connect', (request, clientSocket, head) => {
    const { port, hostname } = new URL(`http://${request.url}`);

    if (whiteListHostsMap !== undefined && !whiteListHostsMap.has(hostname)) {
      console.log('[-] HTTPS:', hostname, port);
      return;
    }

    console.log('[+] HTTPS:', hostname, port);

    const serverSocket = net.connect(port || 443, hostname, () => {
      stopper().then(() => {
        // send head to the server
        serverSocket.write(head);
        // tell client the tunnel is set up
        clientSocket.write('HTTP/' + request.httpVersion + ' 200 Connection established\r\n\r\n');
      });
    });

    // Tunnel from proxy to server
    serverSocket.on('data', (chunk) => {
      stopper().then(() => {
        clientSocket.write(chunk);
      });
    });
    serverSocket.on('end', () => {
      stopper().then(() => {
        clientSocket.end();
      });
    });
    serverSocket.on('error', () => {
      stopper().then(() => {
        clientSocket.write('HTTP/' + request.httpVersion + ' 500 Connection error\r\n\r\n');
        clientSocket.end();
      });
    });

    // Tunnel from proxy to client
    clientSocket.on('data', (chunk) => {
      stopper().then(() => {
        serverSocket.write(chunk);
      });
    });
    clientSocket.on('end', () => {
      stopper().then(() => {
        serverSocket.end();
      });
    });
    clientSocket.on('error', () => {
      stopper().then(() => {
        serverSocket.end();
      });
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
