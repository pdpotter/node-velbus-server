(function() {
  var Module, VMB4RYNO,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Module = require('../module');

  VMB4RYNO = (function(superClass) {
    extend(VMB4RYNO, superClass);

    VMB4RYNO.module_type = 0x11;

    function VMB4RYNO(velbus, address) {
      VMB4RYNO.__super__.constructor.apply(this, arguments);
      this.initialized = true;
    }

    VMB4RYNO.prototype.decode = function(data) {
      var message;
      message = {
        address: this.address.toString(16).toUpperCase()
      };
      if (data[0] === 0xFB) {
        message.channel = this.constructor.decode_channel(data[1]);
        if (data[3] === 0x00) {
          message.message = 'relay_channel_off';
          this.velbus.emit('response', message);
        }
        if (data[3] === 0x01) {
          message.message = 'relay_channel_on';
          this.velbus.emit('response', message);
        }
      }
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
