const httpProxy = require('http-proxy');
const http = require('http');
const url = require('url');
const net = require('net');
const { stopper } = require('./util.js');

function setupServer({ port, host = '127.0.0.1', httpsOnly, whiteListHostsMap }) {
  const server = httpsOnly
    ? http.createServer()
    : http.createServer((request, response) => {
        const fromURL = url.parse(request.url);
        const target = fromURL.protocol + '//' + fromURL.host;

        console.log('Proxy HTTP request for:', target);

        const proxy = httpProxy.createProxyServer({});
        proxy.on('error', (err, req, res) => {
          console.log('proxy error', err);
          res.end();
        });

        proxy.web(request, response, { target });
      });

  server.on('connect', (request, clientToProxySocket, head) => {
    const fromURL = url.parse('http://' + request.url);

    if (whiteListHostsMap !== undefined && !whiteListHostsMap.has(fromURL.hostname)) {
      console.log('IGNORING HTTPS requests for:', fromURL.hostname, fromURL.port);
      return;
    }

    console.log('Proxying HTTPS requests for:', hostDomain, port);

    const proxyToServerSocket = net.connect(fromURL.port, fromURL.hostname, () => {
      stopper().then(() => {
        // send head to the server
        proxyToServerSocket.write(head);
        // tell client the tunnel is set up
        clientToProxySocket.write(
          'HTTP/' + request.httpVersion + ' 200 Connection established\r\n\r\n',
        );
      });
    });

    // Tunnel from proxy to server
    proxyToServerSocket.on('data', (chunk) => {
      stopper().then(() => {
        clientToProxySocket.write(chunk);
      });
    });
    proxyToServerSocket.on('end', () => {
      stopper().then(() => {
        clientToProxySocket.end();
      });
    });
    proxyToServerSocket.on('error', () => {
      stopper().then(() => {
        clientToProxySocket.write('HTTP/' + request.httpVersion + ' 500 Connection error\r\n\r\n');
        clientToProxySocket.end();
      });
    });

    // Tunnel from proxy to client
    clientToProxySocket.on('data', (chunk) => {
      stopper().then(() => {
        proxyToServerSocket.write(chunk);
      });
    });
    clientToProxySocket.on('end', () => {
      stopper().then(() => {
        proxyToServerSocket.end();
      });
    });
    clientToProxySocket.on('error', () => {
      stopper().then(() => {
        proxyToServerSocket.end();
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

  server.listen(port, host);
}

module.exports = {
  setupServer,
};
