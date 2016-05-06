# http://www.velleman.eu/downloads/0/velbus/manuals/protocol/protocol_vmb1ts.pdf
Module = require '../module'
class VMB1TS extends Module
  @module_type = 0x0C

  constructor: (velbus, address) ->
    super
    @initialized = true

    # Request the temperature to be sent every 10 seconds
    @sensor_temperature_request 10

    # Create db table if not existing
    @velbus.db.serialize () =>
      stmt = @velbus.db.prepare('CREATE TABLE IF NOT EXISTS ? (datetime, temp)')

  sensor_temperature_request: (interval) ->
    @send_packet {
      priority: 0xF8
      rtr_data_size: 0x02
      data: [
        0xE5 # COMMAND_SENSOR_TEMP_REQUEST
        interval # autosend time interval in seconds
      ]
    }

  decode: (data) ->
    # COMMAND_DIMMERCONTROLLER_STATUS
    if data[0] == 0xE6
      temp = @decode_temperature(data[1], data[2])

    return

  decode_temperature: (high, low) ->
    negative = high & 0x80

    integer_part = (high & 0x7e) >> 1

    fractional_part = ((high & 0x01) << 3) + (low >> 5)
    fractional_part = fractional_part * 0.0625

    total = integer_part + fractional_part

    if !negative
      return total
    else
      return 64 - total

module.exports = VMB1TS
