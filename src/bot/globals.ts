import { getConfig, getConfigBannable, getConfigMuteable } from './config';

/**
 * Define some constants used in the app
 */
export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const DAYS_IN_MONTH = 30;
export const DAYS_HALF_A_MONTH = 15;
export const DAYS_IN_WEEK = 7;

/**
 * Mute "forever"
 */
export const MUTE_INDEFINITE = 0x7FFFFFFFFFFFFFFFn;

/**
 * Ban "forever"
 */
export const BAN_INDEFINITE = 0x7FFFFFFFFFFFFFFFn;

/**
 * Constant value for milliseconds
 */
export const MILLIS = 1000;

/**
 * Constant value for max embeds fields shown
 */
export const MAX_EMBED_FIELDS = 25;

/**
 * Constant value for intervals function (in milliseconds)
 */
export const CHECK_INTERVAL = 1000;

/**
 * Constant value for timeout used in guildMemberAdd event (in milliseconds)
 */
export const EVENT_OFFSET = 100;

/**
 * Reason offset for getting the username from db reason.
 */
export const REASON_OFFSET = 24;

/**
 * Constant value for the config file
 */
export const CONFIG = getConfig();

/**
 * Constant value for the bannable words from JSON
 */
export const BANNABLE_WORDS = getConfigBannable();

/**
 * Constant value for the muteable words from JSON
 */
export const MUTEABLE_WORDS = getConfigMuteable();
