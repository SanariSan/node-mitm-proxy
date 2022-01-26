const net = require('net');
const { whiteListCheck, now } = require('../util.js');

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
      throttler.passGate().then(() => {
        // send head to the server
        serverSocket.write(head);
        // tell client the tunnel is set up
        clientSocket.write('HTTP/' + request.httpVersion + ' 200 Connection established\r\n\r\n');
      });
    });

    // Tunnel from proxy to server, forwarding data to client
    serverSocket.on('data', (chunk) => {
      // hb appers here
      clientSocket.write(chunk);
    });
    serverSocket.on('end', () => {
      clientSocket.end();
    });
    serverSocket.on('error', () => {
      clientSocket.write('HTTP/' + request.httpVersion + ' 500 Connection error\r\n\r\n');
      clientSocket.end();
    });

    // Tunnel from proxy to client, forwarding data to server
    clientSocket.on('data', (chunk) => {
      throttler.passGate(chunk).then(() => {
        serverSocket.write(chunk);
      });
    });
    clientSocket.on('end', (chunk) => {
      throttler.passGate(chunk).then(() => {
        serverSocket.end();
      });
    });
    clientSocket.on('error', (chunk) => {
      throttler.passGate(chunk).then(() => {
        serverSocket.end();
      });
    });
  });
}

module.exports = setupHttps;
