/* eslint-disable camelcase */

/**
 * @type MutedUser
 * @property {string} list type
 * @property {string} inappropriate word
 */
export type ListArgs = {
  listType: string,
  listWord: string
}

/**
 * @type UsernameCheck
 * @property {boolean |undefined} shouldMute
 * @property {boolean |undefined} kickTimer
 */
export type UsernameCheck = {
  shouldMute: boolean,
  kickTimer: boolean
}

/**
 * @type MutedUser
 * @property {string} uid
 * @property {string} guild id
 * @property {string | undefined} reason for mute
 * @property {boolean | undefined} is it still active
 * @property {boolean | undefined} is the kick timer on
 * @property {number | undefined} number of temporary bans
 * @property {Date | undefined} timestamp for creation
 * @property {Date | undefined} timestamp for modification
 */
export type MutedUser = {
  uid: string,
  guildId: string,
  reason?: string,
  isActive?: boolean,
  kickTimer?: boolean,
  banCount?: number,
  createdAt?: Date,
  modifiedAt?: Date
}

/**
 * @type MutedUserDb
 * @property {string} uid
 * @property {string} guild id
 * @property {string} reason for mute
 * @property {boolean} is it still active
 * @property {boolean} is the kick timer on
 * @property {number} number of temporary bans
 * @property {Date} timestamp for creation
 * @property {Date} timestamp for modification
 */
export type MutedUserDb = {
  uid: string,
  guild_id: string,
  reason: string,
  is_active: boolean,
  kick_timer: boolean,
  ban_count: number,
  created_at: Date,
  modified_at: Date
}

/**
 * @type BannedUser
 * @property {string} uid
 * @property {string} guild id
 * @property {string} reason for ban
 * @property {bigint | undefined} duration
 * @property {boolean | undefined}  is it still active
 * @property {Date | undefined} timestamp for creation
 * @property {Date | undefined} timestamp for modification
 */
export type BannedUser = {
  uid: string,
  guildId: string,
  reason: string,
  time?: bigint,
  isActive?: boolean,
  createdAt?: Date,
  modifiedAt?: Date,
}

/**
 * @type BannedUserDb
 * @property {string} uid
 * @property {string} guild id
 * @property {string} reason for ban
 * @property {bigint} duration
 * @property {boolean}  is it still active
 * @property {Date} timestamp for creation
 * @property {Date} timestamp for modification
 */
export type BannedUserDb = {
  uid: string,
  guild_id: string,
  reason: string,
  time: bigint,
  is_active: boolean,
  created_at: Date,
  modified_at: Date,
}

/**
 * @type InappropriateWords
 * @property {string} inappropriate word
 * @property {boolean} marks if the word is bannable or not
 */
export type InappropriateWords = {
  word: string,
  bannable: boolean
}
