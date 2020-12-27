import { GuildMember } from 'discord.js';
import { Pool, PoolClient } from 'pg';
import config from '../config/config.json';
import { BannedUserDb, MutedUserDb } from '../models/types';

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

// Function that gets the latest row count in the user muted database. This
// value is used for automatic nickname given by the bot when the username is
// inappropriate.
export async function getNextDbRowID () {
  const rows = await poolMute.query('SELECT * FROM users_muted.users');

  return rows.rowCount;
}

// Get all the muted members from the database and parse them to the defined
// type. If no users are found, return undefined
export async function getMutedMembers ():
  Promise<Array<MutedUserDb> | undefined> {
  const members = await poolMute.query('SELECT * FROM users_muted.users');
  const membersParsed = new Array<MutedUserDb>(members.rowCount);

  if (members !== undefined) {
    members.rows.forEach(async (row: any) => {
      membersParsed.push(parseUserMuted(row));
    });

    return membersParsed;
  } else {
    return undefined;
  }
}

// Get the muted member from the database and parse data to the
// defined type. If no user is found, return undefined
export async function getMutedMember (member: GuildMember):
  Promise<MutedUserDb | undefined> {
  const members = await poolMute.query('SELECT * FROM users_muted.users ' +
    `WHERE uid = ${member.id} AND is_active = true`);

  if (members !== undefined) {
    return members.rows[0];
  } else {
    return undefined;
  }
}

// Get the muted member with kick timer from the database and parse data to the
// defined type. If no user is found, return undefined
export async function getMemberKickTimer (member: GuildMember):
  Promise<MutedUserDb | undefined> {
  const members = await poolMute.query('SELECT * FROM users_muted.users ' +
    `WHERE uid = ${member.id} AND kick_timer = true`);

  if (members !== undefined) {
    return members.rows[0];
  } else {
    return undefined;
  }
}

// Get the banned members from the database and parse data to the
// defined type. If no users are found, return undefined
export async function getBannedMembers ():
  Promise<Array<BannedUserDb> | undefined> {
  const members = await poolBan.query('SELECT * FROM users_banned.users');
  const membersParsed = new Array<BannedUserDb>(members.rowCount);

  if (members !== undefined) {
    members.rows.forEach(async (row: any) => {
      membersParsed.push(parseUserBanned(row));
    });

    return membersParsed;
  } else {
    return undefined;
  }
}

// Parse the data from database into the MutedUserDb type
export function parseUserMuted (data: any): MutedUserDb {
  return {
    uid: data.uid,
    guildId: data.guild_id,
    reason: data.reason,
    isActive: data.is_active,
    kickTimer: data.kickTimer,
    banCount: data.ban_count,
    createdAt: data.created_at,
    modifiedAt: data.modified_at
  };
}

// Parse the data from database into the BannedUserDb type
export function parseUserBanned (data: any): BannedUserDb {
  return {
    uid: data.uid,
    guildId: data.guild_id,
    reason: data.reason,
    time: data.time,
    isActive: data.is_active,
    createdAt: data.created_at,
    modifiedAt: data.modified_at
  };
}
