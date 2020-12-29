import { Pool, PoolClient } from 'pg';
import config from '../config/config.json';
import { getAllInappropriateWords, insertInapproppriateWord } from './db';
import { bannableWords } from '../config/bannable-words.json';
import { muteableWords } from '../config/muteable-words.json';

// Create a new pool for muted users db access.
// Database information is given in the config file.
// Export pool so it can be used in other files
export const poolMute = new Pool({
  host: config.db_host,
  port: config.db_port,
  user: config.db_user,
  password: config.db_pass,
  max: 20
});

// Create a new pool for banned users db access.
// Database information is given in the config file.
// Export pool so it can be used in other files
export const poolBan = new Pool({
  host: config.db_host,
  port: config.db_port,
  user: config.db_user,
  password: config.db_pass,
  max: 20
});

// Create a new pool for inappropriate words db access.
// Database information is given in the config file.
// Export pool so it can be used in other files
export const poolInaproppriateWords = new Pool({
  host: config.db_host,
  port: config.db_port,
  user: config.db_user,
  password: config.db_pass,
  max: 20
});

// Create a connection for the pool so schema and table can be created and used
// by the bot.
poolMute.connect((err?: Error, client?: PoolClient, rel?: (_?: any) => void) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  // if error is undefiend then client is not.
  client = client as PoolClient;

  client.query('CREATE SCHEMA IF NOT EXISTS users_muted;', (err) => {
    if (err) {
      return console.error('Error executing query', err.stack);
    }
  });

  client.query('CREATE TABLE IF NOT EXISTS users_muted.users (' +
                  'uid text, guild_id text, reason text,' +
                  'is_active boolean, kick_timer boolean,' +
                  'ban_count integer, created_at timestamp,' +
                  'modified_at timestamp);',
  (err) => {
    if (err) {
      return console.error('Error executing query', err.stack);
    }
  });
});

// Create a connection for the pool so schema and table can be created and used
// by the bot.
poolBan.connect((err?: Error, client?: PoolClient, rel?: (_?: any) => void) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  // if error is undefined then client is not.
  client = client as PoolClient;

  client.query('CREATE SCHEMA IF NOT EXISTS users_banned;', (err) => {
    if (err) {
      return console.error('Error executing query', err.stack);
    }
  });

  client.query('CREATE TABLE IF NOT EXISTS users_banned.users (' +
                  'uid text, guild_id text, reason text, time bigint,' +
                  'is_active boolean, created_at timestamp,' +
                  'modified_at timestamp);',
  (err) => {
    if (err) {
      return console.error('Error executing query', err.stack);
    }
  });
});

// Create a connection for the pool so schema and table can be created and used
// by the bot.
poolInaproppriateWords.connect((err?: Error,
  client?: PoolClient, rel?: (_?: any) => void) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  // if error is undefined then client is not.
  client = client as PoolClient;

  client.query('CREATE SCHEMA IF NOT EXISTS inappropriate_words;', (err) => {
    if (err) {
      return console.error('Error executing query', err.stack);
    }
  });

  client.query('CREATE TABLE IF NOT EXISTS inappropriate_words.words (' +
      'word text, bannable boolean);',
  (err) => {
    if (err) {
      return console.error('Error executing query', err.stack);
    } else {
      // if table created, check if we have inappropriate words
      getAllInappropriateWords().then(async (words) => {
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
    }
  });
});
