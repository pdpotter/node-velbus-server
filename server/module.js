(function() {
  var Module, Packet;

  Packet = require('./packet');

  Module = (function() {
    function Module(write_to_serial, address) {
      this.write_to_serial = write_to_serial;
      this.address = address;
      this.initialized = false;
      this.module_type_request();
    }

    Module.encode_channel = function(channel) {
      return 1 << (channel - 1);
    };

    Module.decode_channel = function(channel) {
      return Math.log2(channel) + 1;
    };

    Module.prototype.send_packet = function(data) {
      var buffer;
      data.address = this.address;
      buffer = new Packet(data).get_buffer();
      this.write_to_serial(buffer);
    };

    Module.prototype.module_type_request = function() {
      return this.send_packet({
        priority: 0xFB,
        rtr_data_size: 0x40
      });
    };

    return Module;

  })();

  module.exports = Module;

}).call(this);
