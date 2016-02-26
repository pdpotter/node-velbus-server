(function() {
  var Config, EventEmitter, Packet, Velbus, fs, i, len, module_file, module_files, module_name, path, protocols, serialport,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Config = require('./config');

  serialport = require('serialport');

  protocols = {
    Module: require('./module')
  };

  fs = require('fs');

  path = require('path');

  module_files = fs.readdirSync(path.resolve(__dirname, 'modules'));

  for (i = 0, len = module_files.length; i < len; i++) {
    module_file = module_files[i];
    module_name = module_file.substr(0, module_file.lastIndexOf('.'));
    protocols[module_name] = require('./modules/' + module_name);
  }

  Packet = require('./packet');

  EventEmitter = require('events').EventEmitter;

  Velbus = (function(superClass) {
    extend(Velbus, superClass);

    function Velbus() {
      this.write_to_serial = bind(this.write_to_serial, this);
      this.modules = {};
      this.ready_to_send = false;
      this.last_send = Date.now();
      this.queue_length = 0;
      this.serialport = new serialport.SerialPort(Config.velbus.device, {
        baudrate: 38400
      });
      this.serialport.on('open', (function(_this) {
        return function() {
          _this.serialport.on('data', function(data) {
            return _this.process_response(data);
          });
          return _this.initialize_modules();
        };
      })(this));
      return;
    }

    Velbus.prototype.initialize_modules = function() {
      var address, j;
      for (address = j = 1; j < 255; address = ++j) {
        this.modules[address] = new protocols.Module(this.write_to_serial, address);
      }
    };

    Velbus.prototype.write_to_serial_helper = function(data) {
      return this.serialport.write(data, (function(_this) {
        return function(error) {
          if (error) {
            console.log('Error writing to serial port ' + data.toString('hex'));
            console.log(error);
            return;
          }
          _this.serialport.drain(function(error) {
            if (error) {
              console.log('Error draining serial port.' + data.toString('hex'));
              console.log(error);
            }
          });
          _this.last_send = Date.now();
        };
      })(this));
    };

    Velbus.prototype.write_to_serial = function(data, repeated) {
      var ready_to_send, request, wait;
      if (repeated == null) {
        repeated = false;
      }
      if ((wait = Date.now() - this.last_send - 30) < 0) {
        setTimeout(((function(_this) {
          return function() {
            _this.write_to_serial(data, repeated);
          };
        })(this)), -1 * wait);
        return;
      }
      if (this.ready_to_send) {
        ready_to_send = false;
        if (repeated) {
          this.queue_length -= 1;
        }
        this.write_to_serial_helper(data);
      } else {
        if (!repeated) {
          this.queue_length += 1;
        }
        request = {
          address: 0x00,
          priority: 0xF8,
          rtr_data_size: 0x01,
          data: [0x0e]
        };
        this.write_to_serial_helper(new Packet(request).get_buffer());
        setTimeout(((function(_this) {
          return function() {
            _this.write_to_serial(data, true);
          };
        })(this)), 30 * this.queue_length);
      }
    };

    Velbus.prototype.process_request = function(json) {
      var address, channel, object;
      object = JSON.parse(json);
      address = parseInt(object.address, 16);
      channel = parseInt(object.channel, 16);
      if (!address in this.modules) {
        console.log('Module does not exist.');
        return;
      }
      if (!this.modules[address].initialized) {
        console.log('Module not ready.');
        return;
      }
      if (!object.command in this.modules[address]) {
        console.log('Command does not exist.');
      }
      this.modules[address][object.command](object);
    };

    Velbus.prototype.process_response = function(data) {
      var j, len1, message, module, multiple, name, packet, single;
      multiple = Packet.split(data);
      if (multiple) {
        for (j = 0, len1 = multiple.length; j < len1; j++) {
          single = multiple[j];
          this.process_response(single);
        }
        return;
      }
      packet = new Packet(data);
      if (!packet.check()) {
        console.log('Invalid data received from Velbus ' + data.toString('hex'));
        return;
      }
      if (packet.address === 0x00 && packet.data && packet.data[0] === 0x0a) {
        return;
      }
      if (packet.address === 0x00 && packet.data && packet.data[0] === 0x0b) {
        this.ready_to_send = false;
        console.log('Velbus buffer full.');
        return;
      }
      if (packet.address === 0x00 && packet.data && packet.data[0] === 0x0c) {
        this.ready_to_send = true;
        return;
      }
      if (packet.address in this.modules) {
        if (this.modules[packet.address].initialized) {
          message = this.modules[packet.address].decode(packet.data);
          this.emit('response', message);
          return;
        } else {
          if (packet.data && packet.data[0] === 0xFF) {
            for (name in protocols) {
              module = protocols[name];
              if (module.module_type === packet.data[1]) {
                this.modules[packet.address] = new protocols[name](this.write_to_serial, packet.address);
                break;
              }
            }
            return;
          } else {
            console.log('Module has not yet been initialized.');
          }
        }
      } else {
        console.log('Unexpected data received from Velbus ' + data.toString('hex'));
        return;
      }
    };

    return Velbus;

  })(EventEmitter);

  module.exports = Velbus;

}).call(this);
