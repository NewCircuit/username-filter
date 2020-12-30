import { Guild, GuildMember, Role, TextChannel } from 'discord.js';
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
  updateKickTimerUser
} from '../db/db';
import { MutedUser } from '../models/types';
import * as embeds from '../models/embeds';

// Define some constants used in the app
export const MINUTE = 60;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export const DAYS_IN_MONTH = 30;
export const DAYS_HALF_A_MONTH = 15;
export const DAYS_IN_WEEK = 7;

// Mute "forever"
export const MUTE_INDEFINITE = 0x7FFFFFFFFFFFFFFFn;

// Ban "forever"
export const BAN_INDEFINITE = 0x7FFFFFFFFFFFFFFFn;

// Constant value for miliseconds
export const MILIS = 1000;

// Constant value for max embeds fields shown:
export const MAX_EMBED_FIELDS = 25;

// Parse uid given on command based on if the user was tagged, or only id was
// provided.
export async function getMember (uid: string, guild: Guild) {
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
    return undefined;
  }
}

// Check if the username is muteable and/or bannable
// TODO: change it to a type instead of object only
export async function checkUsername (username: String) {
  const muteableWords = await getMuteableWords();
  const bannableWords = await getBannableWords();
  if ((muteableWords !== undefined) && (bannableWords !== undefined)) {
    for (let index = 0; index < bannableWords.length; index++) {
      if (username.includes(bannableWords[index].word)) {
        return { shouldMute: true, kickTimer: bannableWords[index].bannable };
      }
    }
    for (let index = 0; index < muteableWords.length; index++) {
      if (username.includes(muteableWords[index].word)) {
        return { shouldMute: true, kickTimer: muteableWords[index].bannable };
      }
    }
    return { shouldMute: false, kickTimer: false };
  }
  console.error("Couldn't fetch one (or both) of the lists!");
  return { shouldMute: undefined, kickTimer: undefined };
}

// Check if the member is muted already
export async function checkIfMemberMuted (member: GuildMember) {
  const mutedUser = getActiveMutedMember(member);

  if (mutedUser) {
    return true;
  }

  return false;
}

// Try fetching the new user and see if the user has the kick timer still
// active. This means the user was kicked before for having a bad username.
// If the user rejoined with the same bad username again, tempban them.
export async function checkTempBan (member: GuildMember) {
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
        updateMutedUserBanCounter(
          {
            uid: member.user.id,
            guildId: member.guild.id,
            banCount: tempBanUser.banCount
          }
        ).catch(console.error);

        // ban the member and send embed to the channel
        banMemberAndSendEmbed(member, null, banDuration,
          tempBanUser.reason);

        return true;
      } else {
        // user joined the server back but not with the same bad username
        // set kick timer to false
        updateKickTimerUser(
          {
            uid: member.user.id,
            guildId: member.guild.id,
            kickTimer: false
          }
        ).catch(console.error);
      }
    }
  }

  return false;
}

// check if user has any of the Floor Gang roles
export function checkIfUserFloorGang (member: GuildMember) {
  const tierRoles = member.guild.roles.cache.filter((role) => {
    return /Floor Gang - Tier*/.test(role.name);
  });

  const memberRoles = member.roles.cache.filter((role) => {
    return /Floor Gang - Tier*/.test(role.name);
  });

  if ((tierRoles.size > 0) &&
        (memberRoles.size > 0)) {
    return true;
  }

  return false;
}

// check if user has any of the Discord mod roles
export function checkIfUserDiscordMod (member: GuildMember | undefined) {
  if (member === undefined) {
    return false;
  }

  const tierRoles = member.guild.roles.cache.filter((role) => {
    return /Discord mod*/i.test(role.name);
  });

  const memberRoles = member.roles.cache.filter((role) => {
    return /Discord mod*/i.test(role.name);
  });

  if ((tierRoles.size > 0) &&
        (memberRoles.size > 0)) {
    return true;
  }

  return false;
}

// Insert the user data into database, mute them and send the embed
export async function muteMemberAndSendEmbed (member: GuildMember,
  kickTimer: boolean, reactMember: GuildMember | null, reason: string) {
  // try getting the mute and vc mute role
  const findRoleMuted = (role: Role) => role.name === 'Muted';
  const findRoleVCMuted = (role: Role) => role.name === 'VCMuted';
  const mutedRole = member.guild.roles.cache.find(findRoleMuted);
  const vcMutedRole = member.guild.roles.cache.find(findRoleVCMuted);

  // if there are no muted roles return. Should not happen.
  if (!mutedRole || !vcMutedRole) {
    return;
  }

  // check if user is already muted
  if (member.roles.cache.has(mutedRole.id.toString()) &&
      member.roles.cache.has(vcMutedRole.id.toString()) &&
      checkIfMemberMuted(member)) {
    return;
  }

  // add mute role to the user
  member.roles.add([mutedRole.id.toString(),
    vcMutedRole.id.toString()]).then(async () => {
    // insert user id and guild id into a database.
    insertUserIntoMutedDb({
      uid: member.id,
      guildId: member.guild.id,
      reason: reason,
      kickTimer: kickTimer,
      banCount: 0
    });

    const nextId = await getNextMuteDbRowID();

    let userDMMsg = 'You have been muted for having an inappropriate ' +
      'username. We have changed your nickname for you. ' +
      'Please change your username as soon as possible!';

    if (kickTimer) {
      userDMMsg += ' Since your username contains really offensive words, ' +
        "you will be kicked within two hours if you don't " +
        'change it.';
    }

    member.send(userDMMsg).catch(console.error);

    member.setNickname(`Automute [User${nextId}]`);

    const ch = member.guild.channels.cache
      .find(ch => ch.name === 'punishment-track') as TextChannel;

    if (ch) {
      embeds.createEmbedForMute(member, reactMember, reason).then((embed) => {
        ch.send(embed);
      });
    }
  }).catch(console.error);
}

// Update the user data into database, unmute them and send the embed
export async function unmuteMemberAndSendEmbed (member: GuildMember,
  dbData: MutedUser | null, reactMember: GuildMember | null) {
  const findRoleMuted = (role: Role) => role.name === 'Muted';
  const findRoleVCMuted = (role: Role) => role.name === 'VCMuted';
  const mutedRole = member.guild.roles.cache.find(findRoleMuted);
  const vcMutedRole = member.guild.roles.cache.find(findRoleVCMuted);

  if (!mutedRole || !vcMutedRole) {
    // should not happen
    return;
  }

  if (!member.roles.cache.has(mutedRole.id) &&
    !member.roles.cache.has(vcMutedRole.id)) {
    // member already unmuted
    return;
  }

  member.roles.remove([mutedRole.id.toString(),
    vcMutedRole.id.toString()]).then(
    async () => {
      updateMutedUserToInactive({
        uid: (dbData === null ? member.id : dbData.uid),
        guildId: (dbData === null ? member.guild.id : dbData.guildId),
        isActive: false,
        kickTimer: false
      });

      member.send('You have been unmuted. Your new ' +
        'username is your nickname for now.')
        .catch(console.error);

      member.setNickname(`${member.user.username}`);

      const ch = member.guild.channels.cache
        .find(ch => ch.name === 'punishment-track') as TextChannel;

      if (ch) {
        embeds.createEmbedForUnmute(member, reactMember).then((embed) => {
          ch.send(embed);
        });
      }
    }).catch(console.error);
}

// Kick the member out of the server.
export async function kickMemberAndSendEmbed (member: GuildMember,
  reactMember: GuildMember, reason: string) {
  await member.send('You will be kicked for having an inappropriate username!');

  const ch = member.guild.channels.cache
    .find(ch => ch.name === 'punishment-track') as TextChannel;

  if (ch) {
    embeds.createEmbedForKick(member, reactMember, reason).then((embed) => {
      ch.send(embed);
    });
  }

  member.kick();
}

// Insert the user data into ban database, ban them and send the embed
export async function banMemberAndSendEmbed (member: GuildMember,
  reactMember: GuildMember | null, duration: number | null, banReason: string) {
  // inform the user about the ban
  await member.send('You will be temporarily banned for not changing ' +
  'your username.').catch(console.error);

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
      time: time
    }
  ).catch(console.error);

  const ch = member.guild.channels.cache
    .find(ch => ch.name === 'punishment-track') as TextChannel;

  if (ch) {
    await embeds.createEmbedForBan(member, reactMember, banReason).then(
      (embed) => {
        ch.send(embed);
      });
  }

  // ban the user
  member.ban({ reason: banReason });
}

// Insert the user data into ban database, ban them and send the embed
export async function unbanMemberAndSendEmbed (member: GuildMember,
  reactMember: GuildMember | null, banReason: string) {
  // inform the user about the ban
  await member.send('You will be temporarily banned for not changing ' +
  'your username.').catch(console.error);

  // insert the user into the db tracking banned users
  await updateBannedUserInactive(
    {
      uid: member.id,
      reason: banReason,
      guildId: member.guild.id
    }
  ).catch(console.error);

  const ch = member.guild.channels.cache
    .find(ch => ch.name === 'punishment-track') as TextChannel;

  if (ch) {
    await embeds.createEmbedForUnban(member, reactMember, banReason).then(
      (embed) => {
        ch.send(embed);
      });
  }

  // ban the user
  member.ban({ reason: banReason });
}
