# http://www.velleman.eu/downloads/0/velbus/manuals/protocol/protocol_vmb1usb.pdf

# load library to emit events
{EventEmitter} = require 'events'

# load library to encod / decode packets
Packet = require './packet'

class Module
  constructor: (velbus, address) ->
    @velbus = velbus
    @address = address
    @initialized = false

    # detect modules (and their types) connected to the Velbus
    do @module_type_request

  @encode_channel: (channel) ->
    return 1 << (channel - 1)

  @decode_channel: (channel) ->
    return Math.log2(channel) + 1

  send_packet: (data) ->
    data.address = @address
    buffer = new Packet(data).get_buffer()

    @velbus.write_to_serial buffer
    return

  module_type_request: ->
    @send_packet {
      priority: 0xFB,
      rtr_data_size: 0x40
    }

module.exports = Module
