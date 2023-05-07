'use strict';

const path = require('node:path');

const console = require('./lib/logger.js');
const common = require('./lib/common.js');

const { loadDir } = require('./src/loader.js');
const { Server } = require('./src/server.js');

(async () => {
  const appPath = path.join(process.cwd(), '../app'); // TODO to config
  // const apiEndpoint = await loadDir(process.cwd(), '../api');
  // console.log('api in', apiEndpoint);
  const api = Object.freeze({});
  const sandbox = { console, common, api, db: null };
  const configPath = path.join(appPath, './config');

  const config = await loadDir(configPath, sandbox);

  const db = require('./lib/db.js')(config.db);
  sandbox.db = Object.freeze(db);

  const apiPath = path.join(appPath, './api');
  const routing = await loadDir(apiPath, sandbox, true);

  const application = { path: appPath, sandbox, console, config, routing };
  application.server = new Server(application);
})();
