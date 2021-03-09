/* eslint-disable arrow-body-style */
import {
  TextChannel, GuildMember, MessageReaction, User,
} from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import * as utils from './utils';
import {
  getMutedMembers,
  getBannedMembers,
  updateMutedUserToInactive,
  updateBannedUserInactive,
} from '../db/db';
import { BannedUser, MutedUser } from '../models/types';
import * as embeds from '../models/embeds';
import * as globals from '../bot/globals';

/**
 * Function that periodically (every second) checks if there are banned users
 * in a database. If a user is found, we check if the required time elapsed. If
 * it did, unban the user.
 * @param {CommandoClient} client
 * @returns {Promise<void>}
 */
export async function checkBanned(client: CommandoClient): Promise<void> {
  const bannedUsers = await getBannedMembers();

  if (bannedUsers === undefined) {
    // if there are no users return
    return;
  }
  bannedUsers.forEach(async (row: BannedUser) => {
    if ((row.time !== undefined) && row.isActive) {
      const guild = await client.guilds.fetch(row.guildId).catch((err) => {
        utils.getLoggerModule('check banned').error(err);
      });
      // guild does not exist (should not happen)
      if (!guild) {
        return;
      }

      const banList = await guild.fetchBans();
      const bannedUser = banList.find((banData) => {
        return (banData.user.id === row.uid);
      });

      if (!bannedUser) {
        // member already unbanned
        utils.getLoggerModule('unban member')
          .error(`Member with ID ${row.uid} already unbanned!`);
        // set user as inactive (because already unbanned)
        await updateBannedUserInactive(
          {
            uid: row.uid,
            reason: row.reason,
            guildId: guild.id,
          },
        );
      } else {
        await utils.unbanMemberAndSendEmbed(bannedUser.user,
          guild, row.time, null, row.reason);
      }
    }
  });
}

/**
 * Function that periodically (every second) checks if there are muted users
 * with inappropriate username in a database. If a user is found, we check if
 * the user has changed his username. If that is the case, remove the muted
 * roles from the user.
 * @param {CommandoClient} client
 * @returns {Promise<void>}
 */
export async function checkMuted(client: CommandoClient): Promise<void> {
  const mutedUsers = await getMutedMembers();

  if (mutedUsers === undefined) {
    // if there are no users return
    return;
  }
  mutedUsers.forEach(async (row: MutedUser) => {
    const guild = await client.guilds.fetch(row.guildId).catch((err) => {
      utils.getLoggerModule('check muted').error(err);
    });

    // guild does not exist (should not happen)
    if (!guild) {
      return;
    }

    // check if member exists in guild and perform unmute if username
    // changed to appropriate
    if ((row.isActive === true) && (row.reason !== undefined)) {
      try {
        const member = await guild.members.fetch(row.uid);

        // get the old username from the reason message (offset is 24)
        const oldUserName = row.reason.substring(24, row.reason.length);

        // if user already unmuted skip the rest
        if (await utils.checkIfAlreadyUnmuted(member, row)) {
          return;
        }

        // check if username was changed
        if (member.user.username.localeCompare(oldUserName)) {
          utils.checkIfStillMuteable(member, row);
        } else if ((row.kickTimer === true)) {
          // check if enough time has passed and user has to be kicked
          utils.checkIfMemberNeedsKick(member, row);
        }
      } catch (e) {
        if (e.message === 'Unknown Member') {
          utils.getLoggerModule('check muted')
            .error(`User not found because ${e}`);
          // user was not found because the user has left
          // the server set is_active field to false to
          // not poll this log anymore
          updateMutedUserToInactive({
            uid: row.uid,
            guildId: row.guildId,
            isActive: false,
            kickTimer: row.kickTimer,
          });
        }
      }
    }
  });
}

/**
 * If a user has an inapproprirate username, either ask for action for Tier
 * Members, or mute them for non-members.
 * @param {GuildMember} member
 * @returns {Promise<void>}
 */
export async function muteInappropriateUsername(member: GuildMember):
  Promise<void> {
  const userNameCheck = await utils.checkUsername(member.user.username);
  if ((userNameCheck === undefined) || !userNameCheck.shouldMute) {
    utils.getLoggerModule('mute user')
      .error("Username couldn't be checked or is appropriate!");
    // if we couldn't check username, or the username is appropriate, return
    return;
  }

  const checkMemberMute = await utils.checkIfCanMute(member);

  if (checkMemberMute === undefined) {
    utils.getLoggerModule('mute user').error("Couldn't fetch muted roles!");
    return;
  }

  if (checkMemberMute === false) {
    utils.getLoggerModule('mute user')
      .error(`Cannot mute member ${member.id}.`);
    return;
  }

  const reason = `Inappropriate username: ${member.user.username}`;

  // If user is a YT member and not a mod, ask moderators for next steps
  // using reaction embeds.
  if (utils.checkIfWhitelisted(member)) {
    utils.getLoggerModule('mute user')
      .info('User is a YouTube member. Wait for embed reaction!');
    const tierMemberEmbed = embeds.createEmbedForTierMemberAction(member);
    const automodChannel = member.guild.channels.cache
      .get(globals.CONFIG.automod_ch_id) as TextChannel;

    if (automodChannel !== undefined) {
      const channelEmbed = await automodChannel.send(tierMemberEmbed);
      await embeds.reactToTierEmbed(channelEmbed);

      const collector = channelEmbed.createReactionCollector(
        embeds.filterTierEmbedReaction(),
        { time: globals.DAY * globals.MILLIS },
      );

      collector.on('collect', async (reaction: MessageReaction,
        reactUser: User) => {
        if (!reactUser.bot) {
          const actionDone = await embeds
            .performActionOnTierEmbedReaction(member, reactUser, reaction,
              reason);

          if (actionDone) {
            collector.stop();
          }
        }
      });

      collector.on('end', () => {
        channelEmbed.delete();
      });
    }
  } else {
    utils.getLoggerModule('mute user')
      .info(`Muting member ${member.user.tag}`);
    utils.muteMemberAndSendEmbed(member, userNameCheck.kickTimer, null,
      reason);
  }
}
