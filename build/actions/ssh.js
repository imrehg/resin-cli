
/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */

(function() {
  var getSubShellCommand;

  getSubShellCommand = function(command) {
    var os;
    os = require('os');
    if (os.platform() === 'win32') {
      return {
        program: 'cmd.exe',
        args: ['/s', '/c', command]
      };
    } else {
      return {
        program: '/bin/sh',
        args: ['-c', command]
      };
    }
  };

  module.exports = {
    signature: 'ssh <uuid>',
    description: '(beta) get a shell into the running app container of a device',
    help: 'WARNING: If you\'re running Windows, this command only supports `cmd.exe`.\n\nUse this command to get a shell into the running application container of\nyour device.\n\nExamples:\n\n	$ resin ssh 7cf02a6\n	$ resin ssh 7cf02a6 --port 8080\n	$ resin ssh 7cf02a6 -v',
    permission: 'user',
    primary: true,
    options: [
      {
        signature: 'port',
        parameter: 'port',
        description: 'ssh gateway port',
        alias: 't'
      }, {
        signature: 'verbose',
        boolean: true,
        description: 'increase verbosity',
        alias: 'v'
      }
    ],
    action: function(params, options, done) {
      var Promise, child_process, resin, settings, verbose;
      child_process = require('child_process');
      Promise = require('bluebird');
      resin = require('resin-sdk');
      settings = require('resin-settings-client');
      if (options.port == null) {
        options.port = 22;
      }
      verbose = options.verbose ? '-vvv' : '';
      console.info("Connecting with: " + params.uuid);
      return Promise.props({
        isOnline: resin.models.device.isOnline(params.uuid),
        username: resin.auth.whoami(),
        uuid: resin.models.device.get(params.uuid).get('uuid'),
        containerId: resin.models.device.getApplicationInfo(params.uuid).get('containerId')
      }).then(function(arg) {
        var containerId, isOnline, username, uuid;
        isOnline = arg.isOnline, username = arg.username, uuid = arg.uuid, containerId = arg.containerId;
        if (!isOnline) {
          throw new Error('Device is not online');
        }
        if (containerId == null) {
          throw new Error('Did not find running application container');
        }
        return Promise["try"](function() {
          var command, spawn, subShellCommand;
          command = "ssh " + verbose + " -t -o LogLevel=ERROR -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p " + options.port + " " + username + "@ssh." + (settings.get('proxyUrl')) + " enter " + uuid + " " + containerId;
          subShellCommand = getSubShellCommand(command);
          return spawn = child_process.spawn(subShellCommand.program, subShellCommand.args, {
            stdio: 'inherit'
          });
        });
      }).nodeify(done);
    }
  };

}).call(this);
