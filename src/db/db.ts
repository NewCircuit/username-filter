import { GuildMember } from 'discord.js';
import { Pool, PoolClient } from 'pg';
import config from '../config/config.json';
import { BannedUserDb, MutedUserDb, InappropriateWordsDb } from '../models/types';
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
  const membersParsed = new Array<MutedUserDb>(0);

  if (members !== undefined) {
    members.rows.forEach(async (row: any) => {
      membersParsed.push(parseUserMuted(row));
    });

    return membersParsed;
  } else {
    return undefined;
  }
}

// Get the active muted member from the database and parse data to the
// defined type. If no user is found, return undefined
export async function getActiveMutedMember (member: GuildMember):
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
  const membersParsed = new Array<BannedUserDb>(0);

  if (members !== undefined) {
    members.rows.forEach(async (row: any) => {
      membersParsed.push(parseUserBanned(row));
    });

    return membersParsed;
  } else {
    return undefined;
  }
}

// Get all the inappropriate words from the database and parse them to the
// defined type. If no words are found, return undefined
export async function getAllInappropriateWords ():
  Promise<Array<InappropriateWordsDb> | undefined> {
  const words = await poolMute.query('SELECT * FROM inappropriate_words.words');
  const wordsParsed = new Array<InappropriateWordsDb>(0);

  if (words !== undefined) {
    words.rows.forEach(async (row: any) => {
      wordsParsed.push(parseInappropriateWords(row));
    });

    return wordsParsed;
  } else {
    return undefined;
  }
}

// Get all the inappropriate words from the database and parse them to the
// defined type. If no words are found, return undefined
export async function getMuteableWords ():
  Promise<Array<InappropriateWordsDb> | undefined> {
  const words = await poolMute.query(
    'SELECT * FROM inappropriate_words.words WHERE bannable = false');
  const wordsParsed = new Array<InappropriateWordsDb>(0);

  if (words !== undefined) {
    words.rows.forEach(async (row: any) => {
      wordsParsed.push(parseInappropriateWords(row));
    });

    return wordsParsed;
  } else {
    return undefined;
  }
}

// Get all the inappropriate words from the database and parse them to the
// defined type. If no words are found, return undefined
export async function getBannableWords ():
  Promise<Array<InappropriateWordsDb> | undefined> {
  const words = await poolMute.query(
    'SELECT * FROM inappropriate_words.words WHERE bannable = true');
  const wordsParsed = new Array<InappropriateWordsDb>(0);

  if (words !== undefined) {
    words.rows.forEach(async (row: any) => {
      wordsParsed.push(parseInappropriateWords(row));
    });

    return wordsParsed;
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

// Parse the data from database into the BannedUserDb type
export function parseInappropriateWords (data: any): InappropriateWordsDb {
  return {
    word: data.word,
    bannable: data.bannable
  };
}

// database query functions
export async function insertInapproppriateWord (word: string,
  bannable: boolean) {
  poolInaproppriateWords.query(
    'INSERT INTO inappropriate_words.words(' +
      'word,' +
      'bannable)' +
      'VALUES ($1, $2)',
    [word, bannable]);
}

export async function deleteInapproppriateWord (word: string) {
  poolInaproppriateWords.query(
    'DELETE FROM inappropriate_words.words WHERE word = $1', [word]);
}
