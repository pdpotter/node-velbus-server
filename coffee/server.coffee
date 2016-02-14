# load configuration settings
Config = require './config'

# load Velbus module
Velbus = require './velbus'
velbus = new Velbus()

# create websocket server to listen for clients
ws = require 'nodejs-websocket'

# listen for clients and accept commands
server = ws.createServer((conn) ->
  # listen for commands
  conn.on 'text', (json) ->
    velbus.process_request json
  return
).listen Config.websocket.port

# send responses back to clients
velbus.on 'response', (message) ->
  # send message to clients
  server.connections.forEach (conn) ->
    conn.sendText JSON.stringify message
