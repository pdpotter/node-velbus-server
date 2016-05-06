(function() {
  var Module, VMB1TS,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Module = require('../module');

  VMB1TS = (function(superClass) {
    extend(VMB1TS, superClass);

    VMB1TS.module_type = 0x0C;

    function VMB1TS(velbus, address) {
      VMB1TS.__super__.constructor.apply(this, arguments);
      this.initialized = true;
      this.sensor_temperature_request(10);
      this.velbus.db.serialize((function(_this) {
        return function() {
          var stmt;
          return stmt = _this.velbus.db.prepare('CREATE TABLE IF NOT EXISTS ? (datetime, temp)');
        };
      })(this));
    }

    VMB1TS.prototype.sensor_temperature_request = function(interval) {
      return this.send_packet({
        priority: 0xF8,
        rtr_data_size: 0x02,
        data: [0xE5, interval]
      });
    };

    VMB1TS.prototype.decode = function(data) {
      var temp;
      if (data[0] === 0xE6) {
        temp = this.decode_temperature(data[1], data[2]);
      }
    };

    VMB1TS.prototype.decode_temperature = function(high, low) {
      var fractional_part, integer_part, negative, total;
      negative = high & 0x80;
      integer_part = (high & 0x7e) >> 1;
      fractional_part = ((high & 0x01) << 3) + (low >> 5);
      fractional_part = fractional_part * 0.0625;
      total = integer_part + fractional_part;
      if (!negative) {
        return total;
      } else {
        return 64 - total;
      }
    };

    return VMB1TS;

  })(Module);

  module.exports = VMB1TS;

}).call(this);
