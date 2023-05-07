'use strict';

const fsp = require('node:fs').promises;
const path = require('node:path');
const pg = require('pg');
const metasql = require('metasql');
const { loadDir } = require('../server/src/loader');

const DB_MSG = path.join(process.cwd(), './db/msg');
// const DB_UHB = path.join(process.cwd(), './db/uhb');
const SCHEMAS_MSG = path.join(process.cwd(), './schemas/msg');
const entitys = ['msg'];
const configPath = path.join(process.cwd(), './config');

const read = (name, pathTo) => fsp.readFile(path.join(pathTo, name), 'utf8');

const execute = async (client, sql) => {
  try {
    await client.query(sql);
  } catch (err) {
    console.error(err);
  }
};

const notEmpty = (s) => s.trim() !== '';

const executeFile = async (client, name, pathTo) => {
  console.log(`Execute file: ${name}`);
  const sql = await read(name, pathTo);
  const commands = sql.split(';\n').filter(notEmpty);
  for (const command of commands) {
    await execute(client, command);
  }
};

const generateFilesFromSchemas = async ({ pathToDB, pathToSchema }) => {
  console.log('Generate SQL and Typings from Schemas');
  await metasql.create(pathToSchema, pathToDB);
  console.log('Rename database.sql => structure.sql');
  const databaseFile = path.join(pathToDB, 'database.sql');
  const structureFile = path.join(pathToDB, 'structure.sql');
  await fsp.rename(databaseFile, structureFile);
  console.log('Rename database.d.ts => domain.d.ts');
  const typesFile = path.join(pathToDB, 'database.d.ts');
  const domainTypes = path.join(pathToDB, 'domain.d.ts');
  await fsp.rename(typesFile, domainTypes);
};

const generateDBFromSQLFileList = async (connection, pathDB, fileList) => {
  const instAdmin = new pg.Client(connection);
  await instAdmin.connect();
  for await (const file of fileList) {
    await executeFile(instAdmin, file, pathDB);
  }
  await instAdmin.end();
};

(async () => {
  const { userDB, adminDB } = await loadDir(configPath, {});
  entitys.forEach((entity) => {
    const paths = {
      pathToDB: path.join(process.cwd(), `./db/${entity}`),
      pathToSchema: path.join(process.cwd(), `./schemas/${entity}`),
    };

    generateFilesFromSchemas(paths);

    generateDBFromSQLFileList({ ...userDB, ...adminDB }, paths.pathToDB, [
      'install.sql',
    ]);
    generateDBFromSQLFileList(userDB, paths.pathToDB, [
      'structure.sql',
      'data.sql',
    ]);
    console.log('Environment is ready');
  });
})().catch((err) => {
  console.error(err);
});
