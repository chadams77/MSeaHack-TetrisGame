var connect = require('connect');
var serveStatic = require('serve-static');
var port = 8081;

connect().use(serveStatic(__dirname)).listen(port);
console.log('Running on 127.0.0.1:' + port);