import { Pool, PoolClient } from 'pg';
import config from '../config/config.json';
import { getAllInappropriateWords, insertInapproppriateWord } from './db';
import { bannableWords } from '../config/bannable-words.json';
import { muteableWords } from '../config/muteable-words.json';

/**
 * Create a new pool for muted users db access.
 * Database information is given in the config file.
 * Export pool so it can be used in other files.
 */
export const poolDb = new Pool({
  host: config.db_host,
  port: config.db_port,
  user: config.db_user,
  password: config.db_pass,
  max: 20,
});

/**
 * Connect to the pool and create all the schemas and tables if needed
 */
poolDb.connect(async (err: Error, client: PoolClient) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  await client.query('CREATE SCHEMA IF NOT EXISTS users_muted;');
  await client.query('CREATE SCHEMA IF NOT EXISTS users_banned;');
  await client.query('CREATE SCHEMA IF NOT EXISTS inappropriate_words;');

  await client.query('CREATE TABLE IF NOT EXISTS users_muted.users ('
                  + 'uid text, guild_id text, reason text,'
                  + 'is_active boolean, kick_timer boolean,'
                  + 'ban_count integer, created_at timestamp,'
                  + 'modified_at timestamp);');

  await client.query('CREATE TABLE IF NOT EXISTS users_banned.users ('
                  + 'uid text, guild_id text, reason text, time bigint,'
                  + 'is_active boolean, created_at timestamp,'
                  + 'modified_at timestamp);');

  client.query('CREATE TABLE IF NOT EXISTS inappropriate_words.words ('
      + 'word text, bannable boolean);',
  async (queryErr) => {
    if (queryErr) {
      return console.error('Error executing query', queryErr.stack);
    }
    // if table created, check if we have inappropriate words
    const words = await getAllInappropriateWords();
    // there are no words written in database, populate it
    if ((words !== undefined) && (words.length === 0)) {
      bannableWords.forEach((word: string) => {
        insertInapproppriateWord(word, true);
      });
      muteableWords.forEach((word: string) => {
        insertInapproppriateWord(word, false);
      });
    }
  });
});
