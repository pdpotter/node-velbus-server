# http://www.velleman.eu/downloads/0/velbus/manuals/protocol/protocol_vmb4dc.pdf
Module = require '../module'
class VMB4DC extends Module
  @module_type = 0x12

  constructor: (velbus, address) ->
    super
    @initialized = true

  decode: (data) ->
    message =
      address: @address.toString(16).toUpperCase()
    # COMMAND_DIMMERCONTROLLER_STATUS
    if data[0] == 0xB8
      message.channel = @constructor.decode_channel data[1]
      message.message = 'dimmercontroller_status'
      message.value = data[3]
      message.led_status = data[4]
      @velbus.emit 'response', message
    # COMMAND_SLIDER_STATUS
    else if data[0] == 0x0F
      message.channel = @constructor.decode_channel data[1]
      message.message = 'slider_status'
      message.value = data[2]
      @velbus.emit 'response', message
    return

  set_dim_channel_value: (data) ->
    @send_packet {
      priority: 0xF8
      rtr_data_size: 0x05
      data: [
        0x07 # COMMAND_SET_DIMVALUE
        @constructor.encode_channel data.channel
        data.value
        Math.floor(data.speed / 256) # high byte of speed
        data.speed % 256 # low byte of speed
      ]
    }

  dimmer_channel_status_request: (data) ->
    @send_packet {
      priority: 0xFB
      rtr_data_size: 0x02
      data: [
        0xFA # COMMAND_DIMMER_STATUS_REQUEST
        @constructor.encode_channel data.channel
      ]
    }

module.exports = VMB4DC
