(function() {
  var Module, VMB4DC,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Module = require('../module');

  VMB4DC = (function(superClass) {
    extend(VMB4DC, superClass);

    VMB4DC.module_type = 0x12;

    function VMB4DC(write_to_serial, address) {
      this.write_to_serial = write_to_serial;
      this.address = address;
      this.initialized = true;
    }

    VMB4DC.prototype.decode = function(data) {
      var message;
      message = {
        address: this.address.toString(16).toUpperCase()
      };
      if (data[0] === 0xB8) {
        message.channel = this.constructor.decode_channel(data[1]);
        message.message = 'dimmercontroller_status';
        message.value = data[3];
        message.led_status = data[4];
      } else if (data[0] === 0x0F) {
        message.channel = this.constructor.decode_channel(data[1]);
        message.message = 'slider_status';
        message.value = data[2];
      }
      return message;
    };

    VMB4DC.prototype.set_dim_channel_value = function(data) {
      return this.send_packet({
        priority: 0xF8,
        rtr_data_size: 0x05,
        data: [0x07, this.constructor.encode_channel(data.channel), data.value, Math.floor(data.speed / 256), data.speed % 256]
      });
    };

    VMB4DC.prototype.dimmer_channel_status_request = function(data) {
      return this.send_packet({
        priority: 0xFB,
        rtr_data_size: 0x02,
        data: [0xFA, this.constructor.encode_channel(data.channel)]
      });
    };

    return VMB4DC;

  })(Module);

  module.exports = VMB4DC;

}).call(this);
