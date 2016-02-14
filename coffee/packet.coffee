# http://www.velleman.eu/downloads/Velbus_ProtocolSummary.pdf

class Packet
  constructor: (input) ->
    # construct from data
    if 'priority' of input && 'address' of input && 'rtr_data_size' of input
      @start = 0x0F
      @priority = input.priority
      @address = input.address
      @rtr_data_size = input.rtr_data_size
      if input.rtr_data_size & 0x0f && 'data' of input
        @data = input.data
      @checksum = @calculate_checksum()
      @stop = 0x04
    # construct from bytes_array
    else
      if 'length' of input && input.length >= 6
        @start = input[0]
        @priority = input[1]
        @address = input[2]
        @rtr_data_size = input[3]
        if @rtr_data_size & 0x0f && input.length >= 7
          @data = []
          for index in [4 .. (input.length - 3)]
            @data.push input[index]
        @checksum = input[input.length - 2]
        @stop = input[input.length - 1]
    return

  calculate_checksum: ->
    checksum = null
    bytes_array = [@start, @priority, @address, @rtr_data_size]
    if @data
      bytes_array = bytes_array.concat @data

    # sum
    for i in [0...bytes_array.length]
      checksum += bytes_array[i]

    # discard overflow
    checksum &= 0xFF

    # invert bits
    checksum ^= 0xFF

    # add 1
    checksum += 0x01

    return checksum

  check: ->
    # check if packet was initialized correctly (length >= 6)
    for item in [
      @start, @priority, @address, @rtr_data_size, @checksum, @stop
    ]
      if not item?
        return false

    # check start and stop bits
    if @start != 0x0f
      return false

    if @stop != 0x04
      return false

    # check if data length is correct
    if @rtr_data_size & 0x0f
    # if data length is not 0, data should be provided
      if not @data?
        return false
      if @rtr_data_size != @data.length
        return false
    # if data length is 0, no data should be provided
    else
      if @data?
        return false

    # check checksum
    if not @checksum == @calculate_checksum()
      return false
    return true

  get_buffer: ->
    bytes_array = [@start, @priority, @address, @rtr_data_size]
    if @data
      bytes_array = bytes_array.concat @data
    bytes_array = bytes_array.concat @checksum, @stop
    return new Buffer bytes_array

  @split: (data) ->
    # check if length is too large
    # check if there is a stop and start byte in the middle
    if data[3] & 0x0f && data.length >= 4 + data[3] + 2 &&
        data[4 + data[3] + 1] == 0x04 &&
        data[4 + data[3] + 2] == 0x0f
      first = new Buffer(4 + data[3] + 2)
      data.copy(first, 0, 0, first.length)
      second = new Buffer(data.length - (4 + data[3] + 2))
      data.copy(second, 0, first.length)
      return [first, second]
    else
      return false

module.exports = Packet
