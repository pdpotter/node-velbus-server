(function() {
  var Module, VMB4RYNO,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Module = require('../module');

  VMB4RYNO = (function(superClass) {
    extend(VMB4RYNO, superClass);

    VMB4RYNO.module_type = 0x11;

    function VMB4RYNO(write_to_serial, address) {
      this.write_to_serial = write_to_serial;
      this.address = address;
      this.initialized = true;
    }

    VMB4RYNO.prototype.decode = function(data) {
      var message;
      message = {
        address: data[2].toString(16).toUpperCase()
      };
      if (data[4] === 0xFB) {
        message.channel = this.constructor.decode_channel(data[5]);
        if (data[7] === 0x00) {
          message.message = 'relay_channel_off';
        }
        if (data[7] === 0x01) {
          message.message = 'relay_channel_on';
        }
      }
      return message;
    };

    VMB4RYNO.prototype.switch_relay_off = function(data) {
      return this.send_packet({
        priority: 0xF8,
        rtr_data_size: 0x02,
        data: [0x01, this.constructor.encode_channel(data.channel)]
      });
    };

    VMB4RYNO.prototype.switch_relay_on = function(data) {
      return this.send_packet({
        priority: 0xF8,
        rtr_data_size: 0x02,
        data: [0x02, this.constructor.encode_channel(data.channel)]
      });
    };

    VMB4RYNO.prototype.relay_status_request = function(data) {
      return this.send_packet({
        priority: 0xFB,
        rtr_data_size: 0x02,
        data: [0xFA, this.constructor.encode_channel(data.channel)]
      });
    };

    return VMB4RYNO;

  })(Module);

  module.exports = VMB4RYNO;

}).call(this);
