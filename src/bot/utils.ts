/* eslint-disable arrow-body-style */
import {
  Guild, GuildMember, TextChannel,
} from 'discord.js';
import {
  getMemberKickTimer,
  getActiveMutedMember,
  getNextMuteDbRowID,
  insertUserIntoMutedDb,
  insertUserIntoBannedDb,
  updateMutedUserToInactive,
  updateMutedUserBanCounter,
  updateBannedUserInactive,
  getBannableWords,
  getMuteableWords,
  updateKickTimerUser,
} from '../db/db';
import { MutedUser, UsernameCheck } from '../models/types';
import * as embeds from '../models/embeds';
import * as config from '../config/config.json';

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
 * Constant value for miliseconds
 */
export const MILIS = 1000;

/**
 * Constant value for max embeds fields shown:
 */
export const MAX_EMBED_FIELDS = 25;

/**
 * Parse uid given on command based on if the user was tagged, or only id was
 * provided.
 * @param {string} uid
 * @param {Guild} guild
 */
export async function getMember(uid: string, guild: Guild):
  Promise<GuildMember | null> {
  let uidParsed = uid;
  // Check if user was tagged or not. If the user was tagged remove the
  // tag from id.
  if (uid.startsWith('<@') && uid.endsWith('>')) {
    uidParsed = uid.replace(/[<@!>]g/, '');
  }

  // Try recovering the user and report if it was successful or not.
  try {
    const member = await guild.members.fetch(uidParsed);
    return member;
  } catch (e) {
    console.error(`User not found because ${e}`);
    return null;
  }
}

/**
 * Check if the username is muteable and/or bannable
 * @param {string} username
 * @returns {Promise<UsernameCheck | undefined>}
 */
export async function checkUsername(username: string):
  Promise<UsernameCheck | undefined> {
  const muteableWords = await getMuteableWords();
  const bannableWords = await getBannableWords();
  if ((muteableWords !== undefined) && (bannableWords !== undefined)) {
    for (let index = 0; index < bannableWords.length; index += 1) {
      if (username.includes(bannableWords[index].word)) {
        return { shouldMute: true, kickTimer: bannableWords[index].bannable };
      }
    }
    for (let index = 0; index < muteableWords.length; index += 1) {
      if (username.includes(muteableWords[index].word)) {
        return { shouldMute: true, kickTimer: muteableWords[index].bannable };
      }
    }
    return { shouldMute: false, kickTimer: false };
  }
  console.error("Couldn't fetch one (or both) of the lists!");
  return undefined;
}

/**
 * Check if the member is muted already in the db
 * @param {GuildMember} member
 * @returns {Promise<boolean>}
 */
export async function checkIfMemberMuted(member: GuildMember):
  Promise<boolean> {
  if ((await getActiveMutedMember(member)) !== undefined) {
    return true;
  }

  return false;
}

/**
 * check if user has any of the Floor Gang roles
 * @param {GuildMember} member
 * @returns {boolean}
 */
export function checkIfUserFloorGang(member: GuildMember): boolean {
  const tierRoles = member.guild.roles.cache
    .filter((role) => config.tier_member_role_ids.includes(role.id));

  const memberRoles = member.roles.cache
    .filter((role) => config.tier_member_role_ids.includes(role.id));

  if ((tierRoles.size > 0)
        && (memberRoles.size > 0)) {
    return true;
  }

  return false;
}

/**
 * check if user has any of the Discord mod roles
 * @param {GuildMember | null} member
 * @returns {boolean}
 */
export function checkIfUserDiscordMod(member: GuildMember | null):
  boolean {
  if (member === null) {
    return false;
  }

  const tierRoles = member.guild.roles.cache
    .filter((role) => config.discord_mod_role_ids.includes(role.id));

  const memberRoles = member.roles.cache
    .filter((role) => config.discord_mod_role_ids.includes(role.id));

  if ((tierRoles.size > 0)
        && (memberRoles.size > 0)) {
    return true;
  }

  return false;
}

/**
 * update muted member, in a case when the user changed inappropriate username
 * to another inappropriate one
 * @param {GuildMember} member
 * @param {boolean} kickTimer
 * @param {GuildMember | null} reactMember
 * @param {string} oldReason
 * @returns {Promise<void>}
 */
export async function mutedMemberUpdate(member: GuildMember,
  kickTimerDb: boolean, reactMember: GuildMember | null,
  oldReason: string): Promise<void> {
  // username still inapproptiate but it was changed
  // set current as non active
  // and insert the newest username
  await updateMutedUserToInactive(
    {
      uid: member.id,
      guildId: member.guild.id,
      isActive: false,
      kickTimer: kickTimerDb,
    },
  );

  const newReason = `Inappropriate username: ${
    member.user.username}`;

  // insert user id and guild id into a database.
  await insertUserIntoMutedDb({
    uid: member.id,
    guildId: member.guild.id,
    reason: newReason,
    kickTimer: kickTimerDb,
    banCount: 0,
  });

  let userDMMsg = 'Your changed username is still inappropriate. '
    + 'Please change your username to something appropriate!';

  if (kickTimerDb) {
    userDMMsg += ' Since your username contains really offensive words, '
      + "you will be kicked within two hours if you don't "
      + 'change it.';
  }

  member.send(userDMMsg).catch(console.error);

  const punishChannel = member.guild.channels.cache
    .get(config.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const updateMuteEmbed = embeds.createEmbedForUpdateMute(member, reactMember,
      oldReason, newReason);
    punishChannel.send(updateMuteEmbed);
  }
}

/**
 * Check if timer for kicking has expired, and perform the needed action
 * @param {GuildMember} member
 * @param {MutedUser} dbData
 */
export async function checkIfMemberNeedsKick(member: GuildMember,
  dbData: MutedUser): Promise<void> {
  const now = Date.now();
  if (dbData.createdAt !== undefined) {
    const createdAt = new Date(dbData.createdAt).getTime();

    if ((now - createdAt) >= (2 * HOUR * MILIS)) {
      await updateMutedUserToInactive(
        {
          uid: dbData.uid,
          guildId: dbData.guildId,
          isActive: false,
          kickTimer: dbData.kickTimer,
        },
      );

      await member.send('You have been kicked from the '
                        + `server for: ${dbData.reason}. `
                        + 'Please change your username before '
                        + 'joining again!').catch(console.error);

      member.kick(dbData.reason);
    }
  }
}

/**
 * Insert the user data into database, mute them and send the embed
 * @param {GuildMember} member
 * @param {boolean} kickTimer
 * @param {GuildMember | null} reactMember
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function muteMemberAndSendEmbed(member: GuildMember,
  kickTimer: boolean, reactMember: GuildMember | null, reason: string):
  Promise<void> {
  // try getting the mute and vc mute role
  const mutedRole = member.guild.roles.cache
    .find((role) => role.id === config.mute_role_ids.muted_id);
  const vcMutedRole = member.guild.roles.cache
    .find((role) => role.id === config.mute_role_ids.vc_muted_id);

  // if there are no muted roles return. Should not happen.
  if (!mutedRole || !vcMutedRole) {
    return;
  }

  // check if user is already muted
  if (member.roles.cache.has(mutedRole.id.toString())
      && member.roles.cache.has(vcMutedRole.id.toString())
      && (await checkIfMemberMuted(member))) {
    return;
  }

  // add mute role to the user
  await member.roles.add([mutedRole.id.toString(),
    vcMutedRole.id.toString()]);
  // insert user id and guild id into a database.
  await insertUserIntoMutedDb({
    uid: member.id,
    guildId: member.guild.id,
    reason,
    kickTimer,
    banCount: 0,
  });

  const nextId = await getNextMuteDbRowID();

  let userDMMsg = 'You have been muted for having an inappropriate '
      + 'username. We have changed your nickname for you. '
      + 'Please change your username as soon as possible!';

  if (kickTimer) {
    userDMMsg += ' Since your username contains really offensive words, '
        + "you will be kicked within two hours if you don't "
        + 'change it.';
  }

  member.send(userDMMsg).catch(console.error);

  member.setNickname(`Automute [User${nextId}]`);

  const punishChannel = member.guild.channels.cache
    .get(config.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const muteEmbed = embeds.createEmbedForMute(member, reactMember, reason);
    punishChannel.send(muteEmbed);
  }
}

/**
 * Update the user data into database, unmute them and send the embed
 * @param {GuildMember} member
 * @param {MutedUser} dbData
 * @param {GuildMember | null} reactMember
 * @returns {Promise<void>}
 */
export async function unmuteMemberAndSendEmbed(member: GuildMember,
  dbData: MutedUser | null, reactMember: GuildMember | null):
  Promise<void> {
  // try getting the mute and vc mute role
  const mutedRole = member.guild.roles.cache
    .find((role) => role.id === config.mute_role_ids.muted_id);
  const vcMutedRole = member.guild.roles.cache
    .find((role) => role.id === config.mute_role_ids.vc_muted_id);

  if (!mutedRole || !vcMutedRole) {
    // should not happen
    return;
  }

  if (!member.roles.cache.has(mutedRole.id)
    && !member.roles.cache.has(vcMutedRole.id)) {
    // member already unmuted
    return;
  }

  await member.roles.remove([mutedRole.id.toString(),
    vcMutedRole.id.toString()]);

  await updateMutedUserToInactive({
    uid: (dbData === null ? member.id : dbData.uid),
    guildId: (dbData === null ? member.guild.id : dbData.guildId),
    isActive: false,
    kickTimer: false,
  });

  member.send('You have been unmuted. Your new '
        + 'username is your nickname for now.')
    .catch(console.error);

  member.setNickname(`${member.user.username}`);

  const punishChannel = member.guild.channels.cache
    .get(config.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const unmuteEmbed = embeds.createEmbedForUnmute(member, reactMember);
    await punishChannel.send(unmuteEmbed);
  }
}

/**
 * Kick the member out of the server.
 * @param {GuildMember} member
 * @param {GuildMember | null} reactMember
 * @param {string} reason
 * @returns {Promise<void>}
 */
export async function kickMemberAndSendEmbed(member: GuildMember,
  reactMember: GuildMember, reason: string):
  Promise<void> {
  await member.send('You will be kicked for having an inappropriate username!');

  const punishChannel = member.guild.channels.cache
    .get(config.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const kickEmbed = embeds.createEmbedForKick(member, reactMember, reason);
    punishChannel.send(kickEmbed);
  }

  await member.kick();
}

/**
 * Insert the user data into ban database, ban them and send the embed
 * @param {GuildMember} member
 * @param {GuildMember | null} reactMember
 * @param {number | null} duration
 * @param {string} banReason
 * @returns {Promise<void>}
 */
export async function banMemberAndSendEmbed(member: GuildMember,
  reactMember: GuildMember | null, duration: number | null, banReason: string):
  Promise<void> {
  // create a ban response
  let banResponse = 'You will be';
  banResponse += (duration === null) ? ' permanently '
    : ` temporarily (${duration.toString()}) `;
  banResponse += 'banned for having an inappropriate username.';
  // inform the user about the ban
  await member.send(banResponse);

  let time: bigint = 0n;

  if (duration !== null) {
    // calculate number of milliseconds needed for the ban to end
    time = BigInt(Math.round(Date.now() / MILIS) + duration * DAY);
  } else {
    time = BAN_INDEFINITE;
  }

  // insert the user into the db tracking banned users
  await insertUserIntoBannedDb(
    {
      uid: member.id,
      reason: banReason,
      guildId: member.guild.id,
      time,
    },
  ).catch(console.error);

  const punishChannel = member.guild.channels.cache
    .get(config.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const banEmbed = embeds.createEmbedForBan(member, reactMember,
      banReason, duration);
    punishChannel.send(banEmbed);
  }

  // ban the user
  await member.ban({ reason: banReason });
}

/**
 * Update the banned user to inactive since the user was unbanned
 * @param {GuildMember} member
 * @param {GuildMember | null} reactMember
 * @param {string} banReason
 * @returns {Promise<void>}
 */
export async function unbanMemberAndSendEmbed(member: GuildMember,
  reactMember: GuildMember | null, banReason: string):
  Promise<void> {
  // set user as inactive (because unban happened)
  await updateBannedUserInactive(
    {
      uid: member.id,
      reason: banReason,
      guildId: member.guild.id,
    },
  );

  const punishChannel = member.guild.channels.cache
    .get(config.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const unBanEmbed = embeds.createEmbedForUnban(member,
      reactMember, banReason);
    punishChannel.send(unBanEmbed);
  }
}

/**
 * Try fetching the new user and see if the user has the kick timer still
 * active. This means the user was kicked before for having a bad username.
 * If the user rejoined with the same bad username again, tempban them.
 * @param {GuildMember} member
 * @returns {Promise<boolean>}
 */
export async function checkTempBan(member: GuildMember):
  Promise<boolean> {
  const tempBanUser = await getMemberKickTimer(member);

  if (tempBanUser && (tempBanUser.reason !== undefined)) {
    // get the old username from the reason message (offset is 24)
    const oldUserName = tempBanUser.reason.substring(24,
      tempBanUser.reason.length);
    if (tempBanUser.banCount !== undefined) {
      if (!oldUserName.localeCompare(member.user.username)) {
        // increment the ban counter indicating how long the user will be
        // banned
        tempBanUser.banCount += 1;
        const banDuration = (tempBanUser.banCount) * DAYS_IN_MONTH;

        // update the data in the db for muted users
        await updateMutedUserBanCounter(
          {
            uid: member.user.id,
            guildId: member.guild.id,
            banCount: tempBanUser.banCount,
          },
        ).catch(console.error);

        // ban the member and send embed to the channel
        banMemberAndSendEmbed(member, null, banDuration,
          tempBanUser.reason);

        return true;
      }
      // user joined the server back but not with the same bad username
      // set kick timer to false
      await updateKickTimerUser(
        {
          uid: member.user.id,
          guildId: member.guild.id,
          kickTimer: false,
        },
      );
    }
  }

  return false;
}

/**
 * Check if changed username is still muteable
 * @param {GuildMember} member
 * @param {MutedUser} dbData
 */
export async function checkIfStillMuteable(member: GuildMember,
  dbData: MutedUser): Promise<void> {
  // check if username is still inappropriate
  const userNameCheck = await checkUsername(member.user.username);
  if ((userNameCheck) !== undefined && (dbData.reason !== undefined)) {
    if (!userNameCheck.shouldMute) {
      await unmuteMemberAndSendEmbed(member, dbData, null);
    } else {
      await mutedMemberUpdate(member, userNameCheck.kickTimer,
        null, dbData.reason);
    }
  }
}
