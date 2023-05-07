'use strict';

const fsp = require('node:fs').promises;
const path = require('node:path');
const pg = require('pg');
const metasql = require('metasql');
const { loadDir } = require('../server/src/loader');

const entity = 'msg';
const configPath = path.join(process.cwd(), './config');

const read = (filePath) => fsp.readFile(filePath, 'utf8');

const execute = async (client, sql) => {
  try {
    await client.query(sql);
  } catch (err) {
    console.error(err);
  }
};

const notEmpty = (s) => s.trim() !== '';
const toBool = [() => true, () => false];
const executeFile = async (client, name, pathTo) => {
  const filePath = path.join(pathTo, name);
  const exists = await fsp.access(filePath).then(...toBool);
  if (!exists) {
    console.log('----file is not exists---');
    return;
  }
  let counter = 0;
  console.log(`Execute file: ${name}`);
  const sql = await read(filePath);
  const commands = sql.split(';\n').filter(notEmpty);
  for (const command of commands) {
    await execute(client, command);
    counter++;
  }
  console.log(`Total command: ${counter} executed from file ${name}`);
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

const executeSQLFileList = async (connection, pathDB, fileList) => {
  const inst = new pg.Client(connection);
  await inst.connect();
  for await (const file of fileList) {
    console.log('file: ', file);
    await executeFile(inst, file, pathDB);
  }
  await inst.end();
};

(async () => {
  const { userDB, adminDB } = await loadDir(configPath, {});
  const paths = {
    pathToDB: path.join(process.cwd(), `./db/${entity}`),
    pathToSchema: path.join(process.cwd(), `./schemas/${entity}`),
  };

  await generateFilesFromSchemas(paths);

  await executeSQLFileList({ ...userDB, ...adminDB }, paths.pathToDB, [
    'install.sql',
  ]);

  await executeSQLFileList(userDB, paths.pathToDB, [
    'structure.sql',
    'data.sql',
  ]);
  console.log('Environment is ready');
})().catch((err) => {
  console.error(err);
});
