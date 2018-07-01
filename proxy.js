/*
Copyright (c) 2016-2018 rtrdprgrmr

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

var net = require('net')
var http = require('http')
var url = require('url')
var net = require('net')

var local_port = process.argv[2] || 8080

var server = http.createServer(handle_normal)
server.on('connect', handle_connect)
server.listen(local_port)

function handle_normal(req, res) {
    console.log(`HTTP ${req.method} ${req.url}`);
    var obj = url.parse(req.url);
    var req2 = http.request({
            method: req.method,
            path: obj.path,
            host: obj.hostname,
            port: obj.port || 80,
            headers: req.headers,
        },
        res2 => {
            console.log(`RESP ${res2.statusCode} ${res2.statusMessage}`);
            res.writeHead(res2.statusCode, res2.statusMessage, res2.headers);
            res2.pipe(res);
        }
    );
    req.pipe(req2);
    req2.on('error', e => { res.writeHead(400);
        res.end(); })
}

function handle_connect(req, sock, head) {
    console.log('CONNECT ' + req.url);
    var obj = url.parse('http://' + req.url);
    sock.pause();
    var sock2 = net.connect(obj.port || 80, obj.hostname, () => {
        if (head && head.length) {
            sock2.write(head);
        }
        sock.write("HTTP/1.1 200 Connection established\r\n\r\n");
        sock2.pipe(sock);
        sock.pipe(sock2);
    });
    sock.on('error', e => { sock2.end(); });
    sock2.on('error', e => { sock.end(); });
}
