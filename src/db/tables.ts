import { Pool, PoolClient } from 'pg';
import { getAllInappropriateWord, insertInapproppriateWord } from './db';
import * as globals from '../bot/globals';
import * as utils from '../bot/utils';

/**
 * Create a new pool for muted users db access.
 * Database information is given in the config file.
 * Export pool so it can be used in other files.
 */
export const poolDb = new Pool({
  host: globals.CONFIG.db_host,
  port: globals.CONFIG.db_port,
  user: globals.CONFIG.db_user,
  password: globals.CONFIG.db_pass,
  database: globals.CONFIG.db_name,
  max: 20,
});

/**
 * Connect to the pool and create all the schemas and tables if needed
 */
poolDb.connect(async (error: Error, client: PoolClient) => {
  if (error) {
    utils.getLoggerModule('pool')
      .error('Error acquiring client', error.stack);
    return;
  }
  await client.query('CREATE SCHEMA IF NOT EXISTS username_check;')
    .catch((err) => utils.getLoggerModule('pool').error(err));

  await client.query('CREATE TABLE IF NOT EXISTS username_check.muted_users ('
                  + 'uid text, guild_id text, reason text,'
                  + 'is_active boolean, kick_timer boolean,'
                  + 'created_at timestamp, modified_at timestamp);')
    .catch((err) => utils.getLoggerModule('pool').error(err));

  await client.query('CREATE TABLE IF NOT EXISTS username_check.banned_users ('
                  + 'uid text, guild_id text, reason text, time bigint,'
                  + 'is_active boolean, created_at timestamp,'
                  + 'modified_at timestamp);')
    .catch((err) => utils.getLoggerModule('pool').error(err));

  client.query('CREATE TABLE IF NOT EXISTS username_check.inappropriate_words ('
      + 'word text, bannable boolean);',
  async (queryErr) => {
    if (queryErr) {
      utils.getLoggerModule('pool')
        .error('Error executing query', queryErr.stack);
      return;
    }
    // if table created, check if we have inappropriate words
    const words = await getAllInappropriateWord();
    // there are no words written in database, populate it
    if ((words !== undefined) && (words.length === 0)) {
      globals.BANNABLE_WORDS.bannableWords.forEach((word: string) => {
        insertInapproppriateWord(word, true);
      });
      globals.MUTEABLE_WORDS.muteableWords.forEach((word: string) => {
        insertInapproppriateWord(word, false);
      });
    }
  });
});
