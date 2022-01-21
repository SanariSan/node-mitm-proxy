// from stackoverflow

function requestHandler(req, res) {
  var writeHead = res.writeHead,
    write = res.write,
    end = res.end;

  res.writeHead = function (status, reason, headers) {
    if (res.headersSent) return req.socket.destroy(); // something went wrong; abort
    if (typeof reason == 'object') headers = reason;
    headers = headers || {};
    res.headers = headers;
    if (headers['content-type'] && headers['content-type'].substr(0, 9) == 'text/html') {
      // we should only fiddle with HTML responses
      delete headers['transfer-encoding']; // since we buffer the entire response, we'll send a proper Content-Length later with no Transfer-Encoding.

      var buf = new Buffer();
      res.write = function (data, encoding) {
        if (Buffer.isBuffer(data)) buf = Buffer.concat([buf, data]);
        // append raw buffer
        else buf = Buffer.concat([buf, new Buffer(data, encoding)]); // append string with optional character encoding (default utf8)

        if (buf.length > 10 * 1024 * 1024) error('Document too large'); // sanity check: if the response is huge, bail.
        // ...we don't want to let someone bring down the server by filling up all our RAM.
      };

      res.end = function (data, encoding) {
        if (data) res.write(data, encoding);

        var $ = cheerio.load(buf.toString());

        // This is where we can modify the response.  For example,
        $('body').append('<p>Hi mom!</p>');

        buf = new Buffer($.html()); // we have to convert back to a buffer so that we can get the *byte count* (rather than character count) of the body

        res.headers['content-type'] = 'text/html; charset=utf-8'; // JS always deals in UTF-8.
        res.headers['content-length'] = buf.length;

        // Finally, send the modified response out using the real `writeHead`/`end`:
        writeHead.call(res, status, res.headers);
        end.call(res, buf);
      };
    } else {
      writeHead.call(res, status, headers); // if it's not HTML, let the response go through normally
    }
  };

  proxy.web(req, res, {
    target: req.url,
  });

  function error(msg) {
    // utility function to report errors
    if (res.headersSent) end.call(res, msg);
    else {
      msg = new Buffer(msg);
      writeHead.call(res, 502, { 'Content-Type': 'text/plain', 'Content-Length': msg.length });
      end.call(res, msg);
    }
  }
}
