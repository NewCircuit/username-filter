import { Pool, PoolClient } from 'pg';
import { getAllInappropriateWord, insertInapproppriateWord } from './db';
import * as globals from '../bot/globals';

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
  max: 20,
});

/**
 * Connect to the pool and create all the schemas and tables if needed
 */
poolDb.connect(async (err: Error, client: PoolClient) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  await client.query('CREATE SCHEMA IF NOT EXISTS username_check;');

  await client.query('CREATE TABLE IF NOT EXISTS username_check.muted_users ('
                  + 'uid text, guild_id text, reason text,'
                  + 'is_active boolean, kick_timer boolean,'
                  + 'ban_count integer, created_at timestamp,'
                  + 'modified_at timestamp);');

  await client.query('CREATE TABLE IF NOT EXISTS username_check.banned_users ('
                  + 'uid text, guild_id text, reason text, time bigint,'
                  + 'is_active boolean, created_at timestamp,'
                  + 'modified_at timestamp);');

  client.query('CREATE TABLE IF NOT EXISTS username_check.inappropriate_words ('
      + 'word text, bannable boolean);',
  async (queryErr) => {
    if (queryErr) {
      return console.error('Error executing query', queryErr.stack);
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
