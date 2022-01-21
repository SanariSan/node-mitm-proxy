const net = require('net');
const { whiteListCheck } = require('../util.js');

// PROXY HTTPS
function setupHttps({ server, useWhiteList, whiteListHostsMap, silentWhiteList, throttler }) {
  server.on('connect', (request, clientSocket, head) => {
    const { port, hostname } = new URL(`http://${request.url}`);

    if (useWhiteList && !whiteListCheck(whiteListHostsMap, hostname) && !silentWhiteList) {
      console.log(`[-] HTTPS: ${hostname}:${port || '443'}`);
      return;
    }
    console.log(`[+] HTTPS: ${hostname}:${port || '443'}`);

    const serverSocket = net.connect(port || 443, hostname, () => {
      throttler
        .passGate()
        .then(() => {
          // send head to the server
          serverSocket.write(head);
          // tell client the tunnel is set up
          clientSocket.write('HTTP/' + request.httpVersion + ' 200 Connection established\r\n\r\n');
        })
        .then(() => throttler.closeGate());
    });

    // Tunnel from proxy to server
    serverSocket.on('data', (chunk) => {
      throttler
        .passGate(chunk)
        .then(() => {
          clientSocket.write(chunk);
        })
        .then(() => throttler.closeGate())
        .catch((e) => {});
    });
    serverSocket.on('end', () => {
      throttler
        .passGate()
        .then(() => {
          clientSocket.end();
        })
        .then(() => throttler.closeGate());
    });
    serverSocket.on('error', () => {
      throttler
        .passGate()
        .then(() => {
          clientSocket.write('HTTP/' + request.httpVersion + ' 500 Connection error\r\n\r\n');
          clientSocket.end();
        })
        .then(() => throttler.closeGate());
    });

    // Tunnel from proxy to client
    clientSocket.on('data', (chunk) => {
      throttler
        .passGate()
        .then(() => {
          serverSocket.write(chunk);
        })
        .then(() => throttler.closeGate());
    });
    clientSocket.on('end', () => {
      throttler
        .passGate()
        .then(() => {
          serverSocket.end();
        })
        .then(() => throttler.closeGate());
    });
    clientSocket.on('error', () => {
      throttler
        .passGate()
        .then(() => {
          serverSocket.end();
        })
        .then(() => throttler.closeGate());
    });
  });
}

module.exports = setupHttps;
