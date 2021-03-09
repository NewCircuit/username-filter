/* eslint-disable arrow-body-style */
import {
  Guild, GuildMember, Role, TextChannel, User,
} from 'discord.js';
import { Logger, getLogger } from 'log4js';
import {
  getMemberKickTimer,
  getActiveMutedMember,
  getNextMuteDbRowID,
  insertUserIntoMutedDb,
  insertUserIntoBannedDb,
  updateMutedUserToInactive,
  updateBannedUserInactive,
  getBannableWords,
  getMuteableWords,
  updateKickTimerUser,
} from '../db/db';
import { MutedUser, UsernameCheck } from '../models/types';
import * as embeds from '../models/embeds';
import * as globals from './globals';

/**
 * Get a logger instance for a certain module.
 * @param {string} module
 * @returns {Logger}
 */
export function getLoggerModule(module: string): Logger {
  const logger = getLogger(module);
  logger.level = globals.CONFIG.log_level;
  return logger;
}

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
    getLoggerModule('get member').error(`User not found because ${e}`);
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
      if (username.toLowerCase()
        .includes(bannableWords[index].word.toLowerCase())) {
        return { shouldMute: true, kickTimer: bannableWords[index].bannable };
      }
    }
    for (let index = 0; index < muteableWords.length; index += 1) {
      if (username.toLowerCase()
        .includes(muteableWords[index].word.toLowerCase())) {
        return { shouldMute: true, kickTimer: muteableWords[index].bannable };
      }
    }
    return { shouldMute: false, kickTimer: false };
  }
  getLoggerModule('check name')
    .error("Couldn't fetch one (or both) of the lists!");
  return undefined;
}

/**
 * Check if the given role position is lower than the members highest role!
 * @param {GuildMember} member
 * @param {Role} role
 * @returns {boolean}
 */
export function checkRolePositionMember(member: GuildMember, role: Role):
  boolean {
  return ((role.position < member.roles.highest.position));
}

/**
 * Check if the member can be muted or not
 * @param {GuildMember} member
 * @returns {Promise<boolean>}
 */
export async function checkIfCanMute(member: GuildMember):
  Promise<boolean | undefined> {
  // try getting the mute and vc mute role
  const mutedRole = member.guild.roles.cache
    .find((role) => role.id === globals.CONFIG.mute_role_ids.muted_id);
  const vcMutedRole = member.guild.roles.cache
    .find((role) => role.id === globals.CONFIG.mute_role_ids.vc_muted_id);

  // if there are no muted roles return. Should not happen.
  if (!mutedRole || !vcMutedRole) {
    return undefined;
  }

  // check if user is already muted or has higher role
  if ((member.roles.cache.has(mutedRole.id)
      && member.roles.cache.has(vcMutedRole.id)
      && ((await getActiveMutedMember(member)) !== undefined))
      || (checkRolePositionMember(member, mutedRole)
      && checkRolePositionMember(member, vcMutedRole))) {
    return false;
  }

  return true;
}

/**
 * check if user has any of the whitelisted roles
 * @param {GuildMember} member
 * @returns {boolean}
 */
export function checkIfWhitelisted(member: GuildMember): boolean {
  const tierRoles = member.guild.roles.cache
    .filter((role) => globals.CONFIG.tier_member_role_ids.includes(role.id));

  const memberRoles = member.roles.cache
    .filter((role) => globals.CONFIG.tier_member_role_ids.includes(role.id));

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
    .filter((role) => globals.CONFIG.discord_mod_role_ids.includes(role.id));

  const memberRoles = member.roles.cache
    .filter((role) => globals.CONFIG.discord_mod_role_ids.includes(role.id));

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
      kickTimer: false,
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
  });

  let userDMMsg = 'Your changed username is still inappropriate. '
    + 'Please change your username to something appropriate!';

  if (kickTimerDb) {
    userDMMsg += ' Since your username contains really offensive words, '
      + "you will be kicked within two hours if you don't "
      + 'change it.';
  }

  member.send(userDMMsg).catch((err) => getLoggerModule('update muted')
    .error(err));

  const punishChannel = member.guild.channels.cache
    .get(globals.CONFIG.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const updateMuteEmbed = embeds.createEmbedForUpdateMute(member, reactMember,
      oldReason, newReason);
    punishChannel.send(updateMuteEmbed)
      .catch((err) => getLoggerModule('update muted').error(err));
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
  reactMember: GuildMember | null, reason: string):
  Promise<void> {
  await member.send('You have been kicked from the '
                          + `server for: ${reason}. `
                          + 'Please change your username before '
                          + 'joining again!')
    .catch((err) => getLoggerModule('kick member').error(err));

  const punishChannel = member.guild.channels.cache
    .get(globals.CONFIG.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const kickEmbed = embeds.createEmbedForKick(member, reactMember, reason);
    punishChannel.send(kickEmbed);
  }

  await member.kick();
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

    if ((now - createdAt) >= (30 * globals.MINUTE * globals.MILLIS)) {
      await updateMutedUserToInactive(
        {
          uid: dbData.uid,
          guildId: dbData.guildId,
          isActive: false,
          kickTimer: dbData.kickTimer,
        },
      );

      if (dbData.reason !== undefined) {
        getLoggerModule('check kick')
          .info(`Member ${member.user.tag} will be kicked!`);
        kickMemberAndSendEmbed(member, null, dbData.reason);
      } else {
        getLoggerModule('check kick').error('Reason not provided in the db.'
          + 'Someting unexpected happened!');
      }
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
    .find((role) => role.id === globals.CONFIG.mute_role_ids.muted_id);
  const vcMutedRole = member.guild.roles.cache
    .find((role) => role.id === globals.CONFIG.mute_role_ids.vc_muted_id);

  // if there are no muted roles return. Should not happen.
  if (!mutedRole || !vcMutedRole) {
    getLoggerModule('mute member').error('No muted roles found!');
    return;
  }

  // add mute role to the user
  await member.roles.add([mutedRole.id, vcMutedRole.id])
    .catch((err) => getLoggerModule('mute member').error(err));
  // insert user id and guild id into a database.
  await insertUserIntoMutedDb({
    uid: member.id,
    guildId: member.guild.id,
    reason,
    kickTimer,
  }).catch((err) => getLoggerModule('mute member').error(err));

  const nextId = await getNextMuteDbRowID();

  let userDMMsg = 'You have been muted for having an inappropriate '
      + 'username. We have changed your nickname for you. '
      + 'Please change your username as soon as possible!';

  if (kickTimer) {
    userDMMsg += ' Since your username contains really offensive words, '
        + "you will be kicked within 30 minutes if you don't "
        + 'change it.';
  }

  await member.send(userDMMsg).catch((err) => {
    getLoggerModule('mute member').error(err);
  });

  await member.setNickname(`Automute [User${nextId}]`)
    .catch((err) => getLoggerModule('mute member').error(err));

  const punishChannel = member.guild.channels.cache
    .get(globals.CONFIG.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const muteEmbed = embeds.createEmbedForMute(member, reactMember, reason);
    punishChannel.send(muteEmbed).catch((err) => {
      getLoggerModule('mute member').error(err);
    });
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
    .find((role) => role.id === globals.CONFIG.mute_role_ids.muted_id);
  const vcMutedRole = member.guild.roles.cache
    .find((role) => role.id === globals.CONFIG.mute_role_ids.vc_muted_id);

  if (!mutedRole || !vcMutedRole) {
    getLoggerModule('unmute member').error('Muted roles not available!');
    // should not happen
    return;
  }

  await updateMutedUserToInactive({
    uid: (dbData === null ? member.id : dbData.uid),
    guildId: (dbData === null ? member.guild.id : dbData.guildId),
    isActive: false,
    kickTimer: false,
  });

  await member.roles.remove([mutedRole.id, vcMutedRole.id])
    .catch((err) => getLoggerModule('unmute member').error(err));

  member.send('You have been unmuted. Your new '
        + 'username is your nickname for now.')
    .catch((err) => getLoggerModule('unmute member').error(err));

  member.setNickname(`${member.user.username}`)
    .catch((err) => getLoggerModule('unmute member').error(err));

  const punishChannel = member.guild.channels.cache
    .get(globals.CONFIG.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const unmuteEmbed = embeds.createEmbedForUnmute(member, reactMember);
    await punishChannel.send(unmuteEmbed)
      .catch((err) => getLoggerModule('unmute member').error(err));
  }
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
    : ` temporarily (${duration} days) `;
  banResponse += 'banned for having an inappropriate username.';
  // inform the user about the ban
  await member.send(banResponse).catch((err) => {
    getLoggerModule('ban member').error(err);
  });

  let time: bigint = 0n;

  if (duration !== null) {
    // calculate number of milliseconds needed for the ban to end
    time = BigInt(Math.round(Date.now() / globals.MILLIS)
      + duration * globals.DAY);
  } else {
    time = globals.BAN_INDEFINITE;
  }

  // insert the user into the db tracking banned users
  await insertUserIntoBannedDb(
    {
      uid: member.id,
      reason: banReason,
      guildId: member.guild.id,
      time,
    },
  );

  const punishChannel = member.guild.channels.cache
    .get(globals.CONFIG.punishment_ch_id) as TextChannel;

  if (punishChannel !== undefined) {
    const banEmbed = embeds.createEmbedForBan(member, reactMember,
      banReason, duration);
    punishChannel.send(banEmbed).catch((err) => {
      getLoggerModule('ban member').error(err);
    });
  }

  // ban the user
  await member.ban({ reason: banReason })
    .catch((err) => getLoggerModule('ban member').error(err));
}

/**
 * Update the banned user to inactive since the user was unbanned
 * @param {User} bannedUser
 * @param {Guild} guild
 * @param {bigint} time
 * @param {GuildMember | null} reactMember
 * @param {string} banReason
 * @returns {Promise<void>}
 */
export async function unbanMemberAndSendEmbed(bannedUser: User, guild: Guild,
  time: bigint, reactMember: GuildMember | null, banReason: string):
  Promise<void> {
  const now = Math.round(Date.now() / globals.MILLIS);
  if (now >= time) {
    await guild.members.unban(bannedUser);

    const punishChannel = guild.channels.cache
      .get(globals.CONFIG.punishment_ch_id) as TextChannel;

    if (punishChannel !== undefined) {
      const unBanEmbed = embeds.createEmbedForUnban(bannedUser,
        reactMember, banReason);
      punishChannel.send(unBanEmbed).catch((err) => {
        getLoggerModule('unban member').error(err);
      });
    }

    getLoggerModule('unban member')
      .info(`Member ${bannedUser.tag} will be unbanned!`);

    // set user as inactive (because user has been unbanned)
    await updateBannedUserInactive(
      {
        uid: bannedUser.id,
        reason: banReason,
        guildId: guild.id,
      },
    );
  }
}

/**
 * Try fetching the new user and see if the user has the kick timer still
 * active. This means the user was kicked before for having a bad username.
 * If the user rejoined with the same bad username again, permaban them.
 * @param {GuildMember} member
 * @returns {Promise<boolean>}
 */
export async function checkPermaBan(member: GuildMember):
  Promise<boolean> {
  const banUser = await getMemberKickTimer(member);

  if (banUser && (banUser.reason !== undefined)
    && !checkIfWhitelisted(member)) {
    // get the old username from the reason message (offset is 24)
    const oldUserName = banUser.reason.substring(globals.REASON_OFFSET,
      banUser.reason.length);
    if (!oldUserName.localeCompare(member.user.username)) {
      getLoggerModule('check perma')
        .info(`Member ${member.user.tag} will be banned!`);
      // ban the member and send embed to the channel
      banMemberAndSendEmbed(member, null, null, banUser.reason);
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
      getLoggerModule('check muteable')
        .info(`Unmuting member ${member.user.tag}!`);
      await unmuteMemberAndSendEmbed(member, dbData, null);
    } else {
      getLoggerModule('check muteable').info(`Member ${member.user.tag}`
        + 'still has an inappropriate username!');
      await mutedMemberUpdate(member, userNameCheck.kickTimer,
        null, dbData.reason);
    }
  }
}

/**
 * Check if user already unmuted.
 * @param {GuildMember} member
 * @param {MutedUser} dbData
 */
export async function checkIfAlreadyUnmuted(member: GuildMember,
  dbData: MutedUser): Promise<boolean> {
  // try getting the mute and vc mute role
  const mutedRole = member.guild.roles.cache
    .find((role) => role.id === globals.CONFIG.mute_role_ids.muted_id);
  const vcMutedRole = member.guild.roles.cache
    .find((role) => role.id === globals.CONFIG.mute_role_ids.vc_muted_id);

  if (!mutedRole || !vcMutedRole) {
    getLoggerModule('unmute member').error('Muted roles not available!');
    // should not happen, return as if user already unmuted
    return true;
  }

  if (!member.roles.cache.has(mutedRole.id)
    || !member.roles.cache.has(vcMutedRole.id)) {
    getLoggerModule('unmute member')
      .error(`Member ${member.user.tag} already unmuted!`);
    // member already unmuted, set to inactive
    await updateMutedUserToInactive({
      uid: (dbData === null ? member.id : dbData.uid),
      guildId: (dbData === null ? member.guild.id : dbData.guildId),
      isActive: false,
      kickTimer: false,
    });
    return true;
  }

  return false;
}
