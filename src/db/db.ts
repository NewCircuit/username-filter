import { Pool, PoolClient } from 'pg';
import config from '../config/config.json';

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
                'uid text, reason text, guild_id text, is_active boolean,' +
                'created_at timestamp, modified_at timestamp,' +
                'kick_timer boolean, ban_count integer);',
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
                'uid text, reason text, guild_id text, time bigint,' +
                'is_active boolean, created_at timestamp,' +
                'modified_at timestamp);',
  (err) => {
    if (err) {
      return console.error('Error executing query', err.stack);
    }
  });
});

// Function that gets the latest row count in the user muted database. This
// value is used for automatic nickname given by the bot when the username is
// inappropriate.
export async function getNextDbRowID () {
  const rows = await poolMute.query('SELECT * FROM users_muted.users');

  return rows.rowCount;
}
