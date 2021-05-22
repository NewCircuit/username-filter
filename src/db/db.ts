import { GuildMember } from 'discord.js';
import { QueryResult } from 'pg';
import {
  BannedUser,
  BannedUserDb,
  MutedUser,
  MutedUserDb,
  InappropriateWord,
} from '../models/types';
import { poolDb } from './tables';
import * as utils from '../bot/utils';

/* *********************************************************
 * *********** Parsing database data into types ************
 * ********************************************************* */

/**
 * Parse the data from database into the MutedUser type
 * @param {MutedUserDb} data
 * @returns {MutedUser}
 */
export function parseUserMuted(data: MutedUserDb): MutedUser {
  return {
    uid: data.uid,
    guildId: data.guild_id,
    reason: data.reason,
    isActive: data.is_active,
    kickTimer: data.kick_timer,
    createdAt: data.created_at,
    modifiedAt: data.modified_at,
  };
}

/**
 * Parse the data from database into the BannedUser type
 * @param {BannedUserDb} data
 * @returns {BannedUser}
 */
export function parseUserBanned(data: BannedUserDb): BannedUser {
  return {
    uid: data.uid,
    guildId: data.guild_id,
    reason: data.reason,
    time: data.time,
    isActive: data.is_active,
    createdAt: data.created_at,
    modifiedAt: data.modified_at,
  };
}

/**
 * Parse the data from database into the BannedUserDb type
 * @param {InappropriateWord} data
 * @returns {InappropriateWord}
 */
export function parseInappropriateWord(data: InappropriateWord):
  InappropriateWord {
  return {
    word: data.word,
    bannable: data.bannable,
  };
}

/* *********************************************************
 * ******************* SELECT queries **********************
 * ********************************************************* */

/**
 * Function that gets the latest row count in the user muted database. This
 * value is used for automatic nickname given by the bot when the username is
 * inappropriate.
 * @returns {Promise<number>}
 */
export async function getNextMuteDbRowID(): Promise<number> {
  const rows = await poolDb.query('SELECT * FROM username_check.muted_users');

  return rows.rowCount;
}

/**
 * Get all the muted members from the database and parse them to the defined
 * type. If no users are found, return undefined
 * @returns {Promise<Array<MutedUser> | undefined>}
 */
export async function getMutedMembers():
  Promise<Array<MutedUser> | undefined> {
  const members = await poolDb
    .query('SELECT * FROM username_check.muted_users');
  const membersParsed = new Array<MutedUser>(0);

  if (members !== undefined) {
    members.rows.forEach((row: MutedUserDb) => {
      membersParsed.push(parseUserMuted(row));
    });

    return membersParsed;
  }
  return undefined;
}

/**
 * Get the active muted member from the database and parse data to the
 * defined type. If no user is found, return undefined
 * @param {GuildMember} member
 * @returns {Promise<MutedUser | undefined>}
 */
export async function getActiveMutedMember(member: GuildMember):
  Promise<MutedUser | undefined> {
  const members = await poolDb.query('SELECT * FROM username_check.muted_users '
    + 'WHERE uid = $1 AND is_active = true', [member.id]);

  if ((members !== undefined) && (members.rows.length > 0)) {
    return parseUserMuted(members.rows[0]);
  }
  return undefined;
}

/**
 * Get the muted member with kick timer from the database and parse data to the
 * defined type. If no user is found, return undefined
 * @param {GuildMember} member
 * @returns {Promise<MutedUser | undefined>}
 */
export async function getMemberKickTimer(member: GuildMember):
  Promise<MutedUser | undefined> {
  const members = await poolDb.query('SELECT * FROM username_check.muted_users '
    + 'WHERE uid = $1 AND kick_timer = true', [member.id]);

  if ((members !== undefined) && (members.rows.length > 0)) {
    return parseUserMuted(members.rows[0]);
  }
  return undefined;
}

/**
 * Get the banned members from the database and parse data to the
 * defined type. If no users are found, return undefined
 * @returns {Promise<Array<BannedUser> | undefined>}
 */
export async function getBannedMembers():
  Promise<Array<BannedUser> | undefined> {
  const members = await poolDb
    .query('SELECT * FROM username_check.banned_users');
  const membersParsed = new Array<BannedUser>(0);

  if (members !== undefined) {
    members.rows.forEach((row: BannedUserDb) => {
      membersParsed.push(parseUserBanned(row));
    });

    return membersParsed;
  }
  return undefined;
}

/**
 * Get all the inappropriate words (bannable and non bannable) from
 * the database and parse them to the defined type. If no words are found,
 * return undefined
 * @returns {Promise<Array<InappropriateWord> | undefined>}
 */
export async function getAllInappropriateWord():
  Promise<Array<InappropriateWord> | undefined> {
  const words = await poolDb
    .query('SELECT * FROM username_check.inappropriate_words');
  const wordsParsed = new Array<InappropriateWord>(0);

  if (words !== undefined) {
    words.rows.forEach((row: InappropriateWord) => {
      wordsParsed.push(parseInappropriateWord(row));
    });

    return wordsParsed;
  }
  return undefined;
}

/**
 * Get all the inappropriate words from the database and parse them to the
 * defined type. If no words are found, return undefined
 * @returns {Promise<Array<InappropriateWord> | undefined>}
 */
export async function getMuteableWords():
  Promise<Array<InappropriateWord> | undefined> {
  const words = await poolDb.query(
    'SELECT * FROM username_check.inappropriate_words WHERE bannable = false',
  );
  const wordsParsed = new Array<InappropriateWord>(0);

  if (words !== undefined) {
    words.rows.forEach((row: InappropriateWord) => {
      wordsParsed.push(parseInappropriateWord(row));
    });

    return wordsParsed;
  }
  return undefined;
}

/**
 * Get all the inappropriate bannable words from the database and parse them to
 * the defined type. If no words are found, return undefined
 * @returns {Promise<Array<InappropriateWord> | undefined>}
 */
export async function getBannableWords():
  Promise<Array<InappropriateWord> | undefined> {
  const words = await poolDb.query(
    'SELECT * FROM username_check.inappropriate_words WHERE bannable = true',
  );
  const wordsParsed = new Array<InappropriateWord>(0);

  if (words !== undefined) {
    words.rows.forEach((row: InappropriateWord) => {
      wordsParsed.push(parseInappropriateWord(row));
    });

    return wordsParsed;
  }
  return undefined;
}

/* *********************************************************
 * ******************* INSERT queries **********************
 * ********************************************************* */

/**
 * Inserts the given inappropriate word into database as well as the indication
 * if it is bannable or not.
 * @param {string} word to be inserted
 * @param {boolean} bannable if word is bannable or not
 * @returns {Promise<Boolean>}
 */
export async function insertInapproppriateWord(word: string,
  bannable: boolean): Promise<Boolean> {
  // We expect that query will be sucessful
  let dbQueryResult = true;
  await poolDb.query(
    'INSERT INTO username_check.inappropriate_words('
        + 'word,'
        + 'bannable)'
        + 'VALUES ($1, $2)',
    [word, bannable],
  ).catch((err) => {
    if (err) {
      // Error in executing query
      dbQueryResult = true;
    }
  });
  return dbQueryResult;
}

/**
 * Inserts the given member into muted database of type MutedUser.
 * @param {MutedUser} user
 * @returns {Promise<Boolean>}
 */
export async function insertUserIntoMutedDb(user: MutedUser):
  Promise<Boolean> {
  // We expect that query will be sucessful
  let dbQueryResult = true;
  await poolDb.query(
    'INSERT INTO username_check.muted_users ('
                + 'uid,'
                + 'guild_id,'
                + 'reason,'
                + 'is_active,'
                + 'kick_timer,'
                + 'created_at,'
                + 'modified_at)'
                + 'VALUES ($1, $2, $3, true, $4, now(), now())',
    [
      user.uid,
      user.guildId,
      user.reason,
      user.kickTimer,
    ],
  ).catch((err) => {
    if (err) {
      // Error in executing query
      dbQueryResult = true;
    }
  });
  return dbQueryResult;
}

/**
 * Inserts the given member into banned database of type BannedUser
 * @param {BannedUser} user
 * @returns {Promise<Boolean>}
 */
export async function insertUserIntoBannedDb(user: BannedUser):
  Promise<Boolean> {
  // We expect that query will be sucessful
  let dbQueryResult = true;
  await poolDb.query('INSERT INTO username_check.banned_users ('
    + 'uid,'
    + 'guild_id,'
    + 'reason,'
    + 'time,'
    + 'is_active,'
    + 'created_at,'
    + 'modified_at)'
    + 'VALUES ($1, $2, $3, $4, true, now(), now())',
  [
    user.uid,
    user.guildId,
    user.reason,
    user.time,
  ]).catch((err) => {
    if (err) {
      // Error in executing query
      dbQueryResult = false;
    }
  });
  return dbQueryResult;
}

/* *********************************************************
 * ******************* UPDATE queries **********************
 * ********************************************************* */

/**
 * Sets the active and kick timer fields of muted user to false
 * @param {MutedUser} user
 * @returns {Promise<Boolean>}
 */
export async function updateMutedUserToInactive(user: MutedUser):
  Promise<Boolean> {
  // We expect that query will be sucessful
  let dbQueryResult = true;
  await poolDb.query(
    'UPDATE username_check.muted_users SET '
        + 'is_active = $3,'
        + 'kick_timer = $4,'
        + 'modified_at = now() '
        + 'WHERE '
        + 'uid = $1 '
        + 'AND guild_id = $2'
        + 'AND is_active = true',
    [user.uid, user.guildId, user.isActive, user.kickTimer],
  ).catch((err) => {
    if (err) {
      // Error in executing query
      dbQueryResult = false;
    }
  });
  return dbQueryResult;
}

/**
 * Sets the kick timer fields of muted inactive user to false
 * happens when user was kicked after having an inappropriate username
 * @param {MutedUser} user
 * @returns {Promise<Boolean>}
 */
export async function updateKickTimerUser(user: MutedUser):
  Promise<Boolean> {
  // We expect that query will be sucessful
  let dbQueryResult = true;
  await poolDb.query(
    'UPDATE username_check.muted_users SET '
        + 'kick_timer = $3,'
        + 'modified_at = now() '
        + 'WHERE '
        + 'uid = $1 '
        + 'AND guild_id = $2'
        + 'AND kick_timer = true',
    [user.uid, user.guildId, user.kickTimer],
  ).catch((err) => {
    if (err) {
      // Error in executing query
      dbQueryResult = false;
    }
  });
  return dbQueryResult;
}

/**
 * Sets the banned user to non active (when unbanned)
 * @param {BannedUser} user
 * @returns {Promise<Boolean>}
 */
export async function updateBannedUserInactive(user: BannedUser):
  Promise<Boolean> {
  // We expect that query will be sucessful
  let dbQueryResult = true;
  await poolDb.query(
    'UPDATE username_check.banned_users SET '
                  + 'is_active = false,'
                  + 'modified_at = now() '
                  + 'WHERE '
                  + 'uid = $1 '
                  + 'AND guild_id = $2'
                  + 'AND reason = $3'
                  + 'AND is_active = true',
    [user.uid, user.guildId, user.reason],
  ).catch((err) => {
    if (err) {
      // Error in executing query
      dbQueryResult = false;
    }
  });
  return dbQueryResult;
}

/* *********************************************************
 * ******************* DELETE queries **********************
 * ********************************************************* */

/**
 * Delete the given word from the database of inappropriate words
 * @param {string} word
 * @returns {Promise<void>}
 */
export async function deleteInapproppriateWord(word: string): Promise<void> {
  poolDb.query(
    'DELETE FROM username_check.inappropriate_words WHERE word = $1', [word],
  ).catch((err) => utils.getLoggerModule('delete word db').error(err));
}
