const httpProxy = require('http-proxy');
const http = require('http');
const url = require('url');
const net = require('net');
const { stopper, getHostPortFromString } = require('./util.js');

function setupServer({ port, host = '127.0.0.1', httpsOnly, whiteListHostsMap }) {
  const server = httpsOnly
    ? http.createServer()
    : http.createServer(function (req, res) {
        const urlObj = url.parse(req.url);
        const target = urlObj.protocol + '//' + urlObj.host;

        console.log('Proxy HTTP request for:', target);

        const proxy = httpProxy.createProxyServer({});
        proxy.on('error', function (err, req, res) {
          console.log('proxy error', err);
          res.end();
        });

        proxy.web(req, res, { target: target });
      });

  server.addListener('connect', function (req, clientToProxySocket, bodyhead) {
    const hostPort = getHostPortFromString(req.url, 443);
    const hostDomain = hostPort[0];
    const port = parseInt(hostPort[1]);

    if (whiteListHostsMap !== undefined && !whiteListHostsMap.has(hostDomain)) {
      console.log('IGNORING HTTPS requests for:', hostDomain, port);
      return;
    }

    console.log('Proxying HTTPS requests for:', hostDomain, port);

    const proxyToClientSocket = new net.Socket();
    proxyToClientSocket.connect(port, hostDomain, function () {
      stopper().then(() => {
        proxyToClientSocket.write(bodyhead);
        clientToProxySocket.write(
          'HTTP/' + req.httpVersion + ' 200 Connection established\r\n\r\n',
        );
      });
    });

    proxyToClientSocket.on('data', function (chunk) {
      stopper().then(() => {
        clientToProxySocket.write(chunk);
      });
    });

    proxyToClientSocket.on('end', function () {
      stopper().then(() => {
        clientToProxySocket.end();
      });
    });

    proxyToClientSocket.on('error', function () {
      stopper().then(() => {
        clientToProxySocket.write('HTTP/' + req.httpVersion + ' 500 Connection error\r\n\r\n');
        clientToProxySocket.end();
      });
    });

    clientToProxySocket.on('data', function (chunk) {
      stopper().then(() => {
        console.time(`${hostDomain}`);
        proxyToClientSocket.write(chunk);
        console.timeEnd(`${hostDomain}`);
      });
    });

    clientToProxySocket.on('end', function () {
      stopper().then(() => {
        console.time(`${hostDomain} End`);
        proxyToClientSocket.end();
        console.timeEnd(`${hostDomain} End`);
      });
    });

    clientToProxySocket.on('error', function () {
      stopper().then(() => {
        proxyToClientSocket.end();
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
