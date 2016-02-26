# http://www.velleman.eu/downloads/0/velbus/manuals/protocol/protocol_vmb4ryno.pdf
Module = require '../module'
class VMB4RYNO extends Module
  @module_type = 0x11

  constructor: (write_to_serial, address) ->
    @write_to_serial = write_to_serial
    @address = address
    @initialized = true

  decode: (data) ->
    message =
      address: data[2].toString(16).toUpperCase()
    # COMMAND_RELAY_STATUS
    if data[4] == 0xFB
      message.channel = @constructor.decode_channel data[5]
      if data[7] == 0x00
        message.message = 'relay_channel_off'
      if data[7] == 0x01
        message.message = 'relay_channel_on'
    return message

  switch_relay_off: (data) ->
    @send_packet {
      priority: 0xF8
      rtr_data_size: 0x02
      data: [
        0x01 # COMMAND_SWITCH_RELAY_OFF
        @constructor.encode_channel data.channel
      ]
    }

  switch_relay_on: (data) ->
    @send_packet {
      priority: 0xF8
      rtr_data_size: 0x02
      data: [
        0x02 # COMMAND_SWITCH_RELAY_ON
        @constructor.encode_channel data.channel
      ]
    }

  relay_status_request: (data) ->
    @send_packet {
      priority: 0xFB
      rtr_data_size: 0x02
      data: [
        0xFA # COMMAND_RELAY_STATUS_REQUEST
        @constructor.encode_channel data.channel
      ]
    }

module.exports = VMB4RYNO
