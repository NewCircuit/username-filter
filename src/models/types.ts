/* eslint-disable camelcase */

/**
 * @type MutedUser
 * @property {string} list type
 * @property {string} inappropriate word
 */
export type ListArgs = {
  listType: string,
  listWord: string,
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
  createdAt?: Date,
  modifiedAt?: Date,
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
  created_at: Date,
  modified_at: Date,
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
 * @type InappropriateWord
 * @property {string} inappropriate word
 * @property {boolean} marks if the word is bannable or not
 */
export type InappropriateWord = {
  word: string,
  bannable: boolean,
}

/**
 * Type for Parsing the result from JSON files
 */
export type ParseResult<T> =
  | { parsed: T; hasError: false; error?: undefined }
  | { parsed?: undefined; hasError: true; error?: unknown }

/**
 * Interface for the MuteRoleId
 * @interface MuteRoleId
 * @param {string} muted_id
 * @param {string} vc_muted_id
 */
export type MuteRoleId = {
  muted_id: string,
  vc_muted_id: string,
}

/**
 * Interface for the MuteableWord
 * @interface MuteableWord
 * @param {string[]} muteableWords
 */
export type MuteableWord = {
  muteableWords: string[],
}

/**
 * Interface for the BannableWord
 * @interface BannableWord
 * @param {string[]} bannableWords
 */
export type BannableWord = {
  bannableWords: string[],
}

/**
 * Interface for Config
 * @interface Config
 * @param {string} db_host
 * @param {number} db_port
 * @param {string} db_user
 * @param {string} db_pass
 * @param {string} db_type
 * @param {string} log_level
 * @param {string} token
 * @param {string} prefix
 * @param {string} guild_id
 * @param {string} automod_ch_id
 * @param {string} punishment_ch_id
 * @param {MuteRoleId} mute_role_ids
 * @param {string[]} discord_mod_role_ids
 * @param {string[]} tier_member_role_ids
 */
export type Config = {
    db_host: string,
    db_port: number,
    db_user: string,
    db_pass: string,
    db_type: string,
    log_level: string,
    token: string,
    prefix: string,
    guild_id: string,
    automod_ch_id: string,
    punishment_ch_id: string,
    mute_role_ids: MuteRoleId,
    discord_mod_role_ids: string[],
    tier_member_role_ids: string[],
}

/**
 * Const value for all the members in interface Config, used to validate the
 * parse from JSON file
 */
export const configGuard = [
  'db_host',
  'db_port',
  'db_user',
  'db_pass',
  'db_type',
  'log_level',
  'token',
  'prefix',
  'guild_id',
  'automod_ch_id',
  'punishment_ch_id',
  'mute_role_ids',
  'discord_mod_role_ids',
  'tier_member_role_ids',
];
