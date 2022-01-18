const zlib = require('zlib');

// intercept req after calling web()
// proxy.on('proxyReq', function (proxyReq, req, res, options) {
//   // proxyReq.setHeader('Accept-Encoding', '');
// });

// proxy.on('proxyRes', function (proxyRes, req, res) {
//     let compressedBody = [];
//     proxyRes.on('data', function (chunk) {
//       compressedBody.push(chunk);
//                            proxyRes.pipe(res);// !!!!!! not tested yet, try piping and modifying on-the-fly
//                            also possible solution https://github.com/http-party/node-http-proxy/issues/1263
//     });
//     proxyRes.on('end', function () {
//       decompress(proxyRes, Buffer.concat(compressedBody), (err, decompressedBody) => {
//         console.dir(proxyRes, { depth: 10 });
//         res.write(decompressedBody);
//         res.end();
//       });
//     });
//   });

function decompress(res, compressedWebStream, decompressedOutputCb) {
  console.log(`Encoding: ${res.headers['content-encoding']}`);
  switch (res.headers['content-encoding']) {
    case 'br':
      zlib.brotliDecompress(compressedWebStream, decompressedOutputCb);
      break;
    case 'gzip':
      zlib.gunzip(compressedWebStream, decompressedOutputCb);
      break;
    case 'deflate':
      zlib.deflate(compressedWebStream, decompressedOutputCb);
      break;
    default:
      decompressedOutputCb(null, compressedWebStream);
      break;
  }
}

module.exports = { decompress };
