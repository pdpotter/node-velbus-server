(function() {
  var Config, Velbus, server, velbus, ws;

  Config = require('./config');

  Velbus = require('./velbus');

  velbus = new Velbus();

  ws = require('nodejs-websocket');

  server = ws.createServer(function(conn) {
    conn.on('text', function(json) {
      return velbus.process_request(json);
    });
  }).listen(Config.websocket.port);

  velbus.on('response', function(message) {
    return server.connections.forEach(function(conn) {
      return conn.sendText(JSON.stringify(message));
    });
  });

}).call(this);
