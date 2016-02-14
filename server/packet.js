(function() {
  var Packet;

  Packet = (function() {
    function Packet(input) {
      var index, j, ref;
      if ('priority' in input && 'address' in input && 'rtr_data_size' in input) {
        this.start = 0x0F;
        this.priority = input.priority;
        this.address = input.address;
        this.rtr_data_size = input.rtr_data_size;
        if (input.rtr_data_size & 0x0f && 'data' in input) {
          this.data = input.data;
        }
        this.checksum = this.calculate_checksum();
        this.stop = 0x04;
      } else {
        if ('length' in input && input.length >= 6) {
          this.start = input[0];
          this.priority = input[1];
          this.address = input[2];
          this.rtr_data_size = input[3];
          if (this.rtr_data_size & 0x0f && input.length >= 7) {
            this.data = [];
            for (index = j = 4, ref = input.length - 3; 4 <= ref ? j <= ref : j >= ref; index = 4 <= ref ? ++j : --j) {
              this.data.push(input[index]);
            }
          }
          this.checksum = input[input.length - 2];
          this.stop = input[input.length - 1];
        }
      }
      return;
    }

    Packet.prototype.calculate_checksum = function() {
      var bytes_array, checksum, i, j, ref;
      checksum = null;
      bytes_array = [this.start, this.priority, this.address, this.rtr_data_size];
      if (this.data) {
        bytes_array = bytes_array.concat(this.data);
      }
      for (i = j = 0, ref = bytes_array.length; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
        checksum += bytes_array[i];
      }
      checksum &= 0xFF;
      checksum ^= 0xFF;
      checksum += 0x01;
      return checksum;
    };

    Packet.prototype.check = function() {
      var item, j, len, ref;
      ref = [this.start, this.priority, this.address, this.rtr_data_size, this.checksum, this.stop];
      for (j = 0, len = ref.length; j < len; j++) {
        item = ref[j];
        if (item == null) {
          return false;
        }
      }
      if (this.start !== 0x0f) {
        return false;
      }
      if (this.stop !== 0x04) {
        return false;
      }
      if (this.rtr_data_size & 0x0f) {
        if (this.data == null) {
          return false;
        }
        if (this.rtr_data_size !== this.data.length) {
          return false;
        }
      } else {
        if (this.data != null) {
          return false;
        }
      }
      if (!this.checksum === this.calculate_checksum()) {
        return false;
      }
      return true;
    };

    Packet.prototype.get_buffer = function() {
      var bytes_array;
      bytes_array = [this.start, this.priority, this.address, this.rtr_data_size];
      if (this.data) {
        bytes_array = bytes_array.concat(this.data);
      }
      bytes_array = bytes_array.concat(this.checksum, this.stop);
      return new Buffer(bytes_array);
    };

    Packet.split = function(data) {
      var first, second;
      if (data[3] & 0x0f && data.length >= 4 + data[3] + 2 && data[4 + data[3] + 1] === 0x04 && data[4 + data[3] + 2] === 0x0f) {
        first = new Buffer(4 + data[3] + 2);
        data.copy(first, 0, 0, first.length);
        second = new Buffer(data.length - (4 + data[3] + 2));
        data.copy(second, 0, first.length);
        return [first, second];
      } else {
        return false;
      }
    };

    return Packet;

  })();

  module.exports = Packet;

}).call(this);
