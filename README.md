# node-velbus-server

This project should be used in combination with a client, such as
[node-velbus-client](https://github.com/pdpotter/node-velbus-client).

## Supported modules
* [VMB4RYNO](http://www.velbus.eu/products/view/?id=383130)

## Installation on Raspberry Pi

Using Raspbian Jessie Lite
([download](https://www.raspberrypi.org/downloads/raspbian/),
[installation](https://www.raspberrypi.org/documentation/installation/installing-images/README.md),
[expand filesystem](https://www.raspberrypi.org/documentation/configuration/raspi-config.md),
[update](https://www.raspberrypi.org/documentation/raspbian/updating.md),
[static IP address](https://pi-hole.net/faq/how-do-i-set-a-static-ip-address-in-raspbian-jessie-using-etcdhcpcd-conf/))

### Install node (LTS version)
```bash
# add nodejs repository
sudo echo 'deb https://deb.nodesource.com/node_4.x jessie main' > /etc/apt/sources.list.d/nodesource.list
# add nodejs repository key
wget -qO- https://deb.nodesource.com/gpgkey/nodesource.gpg.key | sudo apt-key add -
# enable https repositories
sudo apt-get install apt-transport-https
# update installation sources
sudo apt-get update
# install nodejs
sudo apt-get install nodejs
```

### Install node-velbus-server
```bash
# update installation sources
sudo apt-get update
# install git
sudo apt-get install git
# clone this project
git clone https://github.com/pdpotter/node-velbus-server.git
# install dependencies
$(cd node-velbus-server; npm install)
# install initial config
$(cd node-velbus-server/server; cp config.sample.js config.js)
```

### Update node-velbus-server
If node-velbus-server is running as a daemon (see below), stop the daemon before
updating and start it again after updating.

```bash
# update node-velbus-server
$(cd node-velbus-server; git pull)
# update dependencies
$(cd node-velbus-server; npm install)
```

### Configure node-velbus-server
The server can be configured by editing the settings in
`node-velbus-server/server/config.js`. The default settings are:
```javascript
(function() {
  exports.velbus = {
    device: '/dev/ttyACM0'
  };

  exports.websocket = {
    port: '8001'
  };

}).call(this);

```

#### Device
Check which device the Velbus is connected to by checking the results of
```bash
ls /dev/ | grep ttyACM
```
If necessary, edit the `velbus.device` setting (the default value is `ttyACM0`).

#### Websocket port
The port on which node-velbus-server is reachable using a websocket can be
changed by editing the `websocket.port` setting (the default value is `8001`).

### Run node-velbus-server as a daemon
(based on [init-script-template](https://github.com/fhd/init-script-template/))

If node-velbus-server was not installed in the home directory of the pi user,
update the `dir` setting on line 12 in
`node-velbus-server/daemon/node-velbus-server` accordingly.

```bash
# copy daemon file
sudo cp node-velbus-server/daemon/node-velbus-server /etc/init.d
# make it executable
sudo chmod 755 /etc/init.d/node-velbus-server
```

To start the daemon, execute
```bash
sudo /etc/init.d/node-velbus-server start
```

To stop the daemon, execute
```bash
sudo /etc/init.d/node-velbus-server stop
```

To run the daemon on startup, execute
```bash
sudo update-rc.d node-velbus-server defaults
```
