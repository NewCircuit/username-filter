import { GuildMember } from 'discord.js';
import { QueryResult } from 'pg';
import {
  BannedUser,
  BannedUserDb,
  MutedUser,
  MutedUserDb,
  InappropriateWords
} from '../models/types';
import { poolMute, poolBan, poolInaproppriateWords } from './tables';

/* *********************************************************
 * ******************* SELECT queries **********************
 * ********************************************************* */

// Function that gets the latest row count in the user muted database. This
// value is used for automatic nickname given by the bot when the username is
// inappropriate.
export async function getNextMuteDbRowID () {
  const rows = await poolMute.query('SELECT * FROM users_muted.users');

  return rows.rowCount;
}

// Get all the muted members from the database and parse them to the defined
// type. If no users are found, return undefined
export async function getMutedMembers ():
  Promise<Array<MutedUser> | undefined> {
  const members = await poolMute.query('SELECT * FROM users_muted.users');
  const membersParsed = new Array<MutedUser>(0);

  if (members !== undefined) {
    members.rows.forEach(async (row: MutedUserDb) => {
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
  Promise<MutedUser | undefined> {
  const members = await poolMute.query('SELECT * FROM users_muted.users ' +
    `WHERE uid = ${member.id} AND is_active = true`);

  if (members !== undefined) {
    return parseUserMuted(members.rows[0]);
  } else {
    return undefined;
  }
}

// Get the muted member with kick timer from the database and parse data to the
// defined type. If no user is found, return undefined
export async function getMemberKickTimer (member: GuildMember):
  Promise<MutedUser | undefined> {
  const members = await poolMute.query('SELECT * FROM users_muted.users ' +
    `WHERE uid = ${member.id} AND kick_timer = true`);

  if (members !== undefined) {
    return parseUserMuted(members.rows[0]);
  } else {
    return undefined;
  }
}

// Get the banned members from the database and parse data to the
// defined type. If no users are found, return undefined
export async function getBannedMembers ():
  Promise<Array<BannedUser> | undefined> {
  const members = await poolBan.query('SELECT * FROM users_banned.users');
  const membersParsed = new Array<BannedUser>(0);

  if (members !== undefined) {
    members.rows.forEach(async (row: BannedUserDb) => {
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
  Promise<Array<InappropriateWords> | undefined> {
  const words = await poolMute.query('SELECT * FROM inappropriate_words.words');
  const wordsParsed = new Array<InappropriateWords>(0);

  if (words !== undefined) {
    words.rows.forEach(async (row: InappropriateWords) => {
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
  Promise<Array<InappropriateWords> | undefined> {
  const words = await poolMute.query(
    'SELECT * FROM inappropriate_words.words WHERE bannable = false');
  const wordsParsed = new Array<InappropriateWords>(0);

  if (words !== undefined) {
    words.rows.forEach(async (row: InappropriateWords) => {
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
  Promise<Array<InappropriateWords> | undefined> {
  const words = await poolMute.query(
    'SELECT * FROM inappropriate_words.words WHERE bannable = true');
  const wordsParsed = new Array<InappropriateWords>(0);

  if (words !== undefined) {
    words.rows.forEach(async (row: InappropriateWords) => {
      wordsParsed.push(parseInappropriateWords(row));
    });

    return wordsParsed;
  } else {
    return undefined;
  }
}

/* *********************************************************
 * ******************* INSERT queries **********************
 * ********************************************************* */

// inserts the given inappropriate word into database as well as the indication
// if it is bannable or not
export async function insertInapproppriateWord (word: string,
  bannable: boolean) {
  poolInaproppriateWords.query(
    'INSERT INTO inappropriate_words.words(' +
      'word,' +
      'bannable)' +
      'VALUES ($1, $2)',
    [word, bannable]);
}

// inserts the given member into muted database of type MutedUser
export async function insertUserIntoMutedDb (user: MutedUser):
Promise<QueryResult<MutedUserDb>> {
  return poolMute.query(
    'INSERT INTO users_muted.users (' +
              'uid,' +
              'guild_id,' +
              'reason,' +
              'is_active,' +
              'kick_timer,' +
              'ban_count,' +
              'created_at,' +
              'modified_at)' +
              'VALUES ($1, $2, $3, true, $4, $5, now(), now())',
    [
      user.uid,
      user.guildId,
      user.reason,
      user.kickTimer,
      user.banCount
    ]
  );
}

// inserts the given member into banned database of type BannedUser
export async function insertUserIntoBannedDb (user: BannedUser):
  Promise<QueryResult<BannedUserDb>> {
  return poolBan.query('INSERT INTO users_banned.users (' +
    'uid,' +
    'guild_id,' +
    'reason,' +
    'time,' +
    'is_active,' +
    'created_at,' +
    'modified_at)' +
    'VALUES ($1, $2, $3, $4, true, now(), now())',
  [
    user.uid,
    user.guildId,
    user.reason,
    user.time
  ]);
}

/* *********************************************************
 * ******************* UPDATE queries **********************
 * ********************************************************* */

// sets the active and kick timer fields of muted user to false
export async function updateMutedUserToInactive (user: MutedUser):
  Promise<QueryResult<MutedUserDb>> {
  return poolMute.query(
    'UPDATE users_muted.users SET ' +
      'is_active = $3,' +
      'kick_timer = $4,' +
      'modified_at = now() ' +
      'WHERE ' +
      'uid = $1 ' +
      'AND guild_id = $2' +
      'AND is_active = true',
    [user.uid, user.guildId, user.isActive, user.kickTimer]
  );
}

// updates the ban count of a certain user
export async function updateMutedUserBanCounter (user: MutedUser):
Promise<QueryResult<MutedUserDb>> {
  return poolMute.query(
    'UPDATE users_muted.users SET ' +
            'ban_count = $1,' +
            'modified_at = now() ' +
            'WHERE ' +
            'uid = $2 ' +
            'AND guild_id = $3' +
            'AND kick_timer = true',
    [user.banCount,
      user.uid,
      user.guildId]
  );
}

export async function updateBannedUserInactive (user: BannedUser) {
  poolBan.query(
    'UPDATE users_banned.users SET ' +
                'is_active = $4,' +
                'modified_at = now() ' +
                'WHERE ' +
                'uid = $1 ' +
                'AND guild_id = $2' +
                'AND time = $3' +
                'AND is_active = true',
    [user.uid, user.guildId, user.time, user.isActive]
  );
}

/* *********************************************************
 * ******************* DELETE queries **********************
 * ********************************************************* */

// Delete the given word from the database of inappropriate words
export async function deleteInapproppriateWord (word: string) {
  poolInaproppriateWords.query(
    'DELETE FROM inappropriate_words.words WHERE word = $1', [word]);
}

/* *********************************************************
 * *********** Parsing database data into types ************
 * ********************************************************* */

// Parse the data from database into the MutedUser type
export function parseUserMuted (data: MutedUserDb): MutedUser {
  return {
    uid: data.uid,
    guildId: data.guild_id,
    reason: data.reason,
    isActive: data.is_active,
    kickTimer: data.kick_timer,
    banCount: data.ban_count,
    createdAt: data.created_at,
    modifiedAt: data.modified_at
  };
}

// Parse the data from database into the BannedUser type
export function parseUserBanned (data: BannedUserDb): BannedUser {
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
export function parseInappropriateWords (data: InappropriateWords):
  InappropriateWords {
  return {
    word: data.word,
    bannable: data.bannable
  };
}
