# load configuration settings
Config = require './config'

# load library to communicate with the Velbus (over the serial port)
serialport = require 'serialport'

# load general module protocols
protocols =
  Module: require './module'

# load module specific protocols (located in modules folder)
fs = require 'fs'
path = require 'path'
module_files = fs.readdirSync path.resolve __dirname, 'modules'
for module_file in module_files
  module_name = module_file.substr 0, module_file.lastIndexOf '.'
  protocols[module_name] = require './modules/' + module_name

Packet = require './packet'

# load library to emit events
{EventEmitter} = require 'events'

class Velbus extends EventEmitter

  constructor: ->
    @modules = {}
    @ready_to_send = false
    @last_send = Date.now()
    @queue_length = 0

    # create serialport instance to send to the Velbus
    @serialport = new serialport.SerialPort(
      Config.velbus.device,
      {baudrate: 38400}
    )
    # listen to serial port for data
    @serialport.on 'open', =>
      @serialport.on 'data', (data) =>
        @process_response data

      # initialize array of modules connected to the Velbus
      do @initialize_modules
    return

  initialize_modules: ->
    # 0x00 and 0xFF are reserved
    for address in [1...255]
      @modules[address]\
        = new protocols.Module(@write_to_serial, address)
    return

  write_to_serial_helper: (data) ->
    @serialport.write data, (error) =>
      if error
        console.log 'Error writing to serial port ' + data.toString 'hex'
        console.log error
        return

      @serialport.drain (error) ->
        if error
          console.log 'Error draining serial port.' + data.toString 'hex'
          console.log error
          return
      @last_send = Date.now()
      return

  write_to_serial: (data, repeated = false) =>
    # make sure there is at least 30 ms between each two packets sent
    if (wait = (Date.now() - @last_send - 30)) < 0
      setTimeout (
        =>
          @write_to_serial data, repeated
          return
      ), (-1 * wait)
      return
    # check if Velbus is ready to receive
    if @ready_to_send
      ready_to_send = false
      if repeated
        @queue_length -= 1
      @write_to_serial_helper data
    # send Interface status request package
    else
      if not repeated
        @queue_length += 1
      request = {
        address: 0x00
        priority: 0xF8,
        rtr_data_size: 0x01
        data: [
          0x0e # CMD_INTERFACE_STATUS_REQUEST
        ]
      }
      @write_to_serial_helper new Packet(request).get_buffer()
      setTimeout (
        =>
          @write_to_serial data, true
          return
      ), 30 * @queue_length
    return

  process_request: (json) ->
    object = JSON.parse json

    address = parseInt object.address, 16
    channel = parseInt object.channel, 16

    # check if module in list with available modules
    if not address of @modules
      console.log 'Module does not exist.'
      return

    # check if module has been initialized
    if not @modules[address].initialized
      console.log 'Module not ready.'
      return

    # check if the command exists for the given module
    if not object.command of @modules[address]
      console.log 'Command does not exist.'

    # send to Velbus
    @modules[address][object.command](object)
    return

  process_response: (data) ->
    # check if multiple concatenated packages were received
    multiple = Packet.split(data)
    if multiple
      for single in multiple
        @process_response single
      return

    # check data correctness
    packet = new Packet (data)
    if not packet.check()
      #TODO: emit error + message to client
      console.log 'Invalid data received from Velbus ' + data.toString 'hex'
      return

    # check if packet is COMMAND_BUS_ACTIVE
    if packet.address == 0x00 && packet.data && packet.data[0] == 0x0a
      return

    # check if packet is COMMAND_RX_BUFFER_FULL
    if packet.address == 0x00 && packet.data && packet.data[0] == 0x0b
      @ready_to_send = false
      #TODO: emit error + message to client
      console.log 'Velbus buffer full.'
      return

    # check if packet is COMMAND_RECEIVE_READY
    if packet.address == 0x00 && packet.data && packet.data[0] == 0x0c
      @ready_to_send = true
      return

    # check if module in list with available modules
    if packet.address of @modules
      # check if module is initialized
      if @modules[packet.address].initialized
        message = @modules[packet.address].decode packet.data
        @emit 'response', message
        return
      else
        # filter out module type requests
        # COMMAND_MODULE_TYPE
        if packet.data && packet.data[0] == 0xFF
          for name, module of protocols
            if module.module_type == packet.data[1]
              @modules[packet.address]\
                = new protocols[name](@write_to_serial, packet.address)
              break
          return
        else
          #TODO: emit error + message to client
          console.log 'Module has not yet been initialized.'
    else
      console.log 'Unexpected data received from Velbus ' + data.toString 'hex'
      return
    return

module.exports = Velbus
