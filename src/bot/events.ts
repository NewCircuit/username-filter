import {
  TextChannel, GuildMember, MessageReaction, User,
} from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import * as utils from './utils';
import {
  getMutedMembers,
  getBannedMembers,
  updateMutedUserToInactive,
} from '../db/db';
import { BannedUser, MutedUser } from '../models/types';
import * as embeds from '../models/embeds';
import * as config from '../config/config.json';

/**
 * Function that periodically (every second) checks if there are banned users
 * in a database. If a user is found, we check if the required time elapsed. If
 * it did, unban the user.
 * @param {CommandoClient} client
 * @returns {Promise<void>}
 */
export async function checkBanned(client: CommandoClient): Promise<void> {
  const bannedUsers = await getBannedMembers();

  if (bannedUsers !== undefined) {
    bannedUsers.forEach(async (row: BannedUser) => {
      const now = Math.round(Date.now() / utils.MILIS);
      if ((row.time !== undefined) && (now >= row.time) && row.isActive) {
        const guild = await client.guilds.fetch(row.guildId);
        // guild does not exist (should not happen)
        if (!guild) {
          return;
        }
        // member does not exist in guild
        const member = await guild.members.fetch(row.uid);
        if (!member) {
          return;
        }

        // unban the user
        const user = guild.members.unban(member.user);

        if (user) {
          await utils.unbanMemberAndSendEmbed(member, null, row.reason);
        }
      }
    });
  }
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

  if (mutedUsers !== undefined) {
    mutedUsers.forEach(async (row: MutedUser) => {
      const guild = await client.guilds.fetch(row.guildId);
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

          // check if username was changed
          if (member.user.username.localeCompare(oldUserName)) {
            utils.checkIfStillMuteable(member, row);
          } else if ((row.kickTimer === true)) {
            // check if 2 hours has passed and user has to be kicked
            utils.checkIfMemberNeedsKick(member, row);
          }
        } catch (e) {
          if (e.message === 'Unknown Member') {
            console.error(`User not found because ${e}`);
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
  if ((userNameCheck !== undefined) && userNameCheck.shouldMute) {
    const reason = `Inappropriate username: ${member.user.username}`;

    // If user is a YT member, ask Moderators for next steps using reaction
    // embeds.
    if (utils.checkIfUserFloorGang(member)) {
      const tierMemberEmbed = embeds.createEmbedForTierMemberAction(member);
      const automodChannel = member.guild.channels.cache
        .get(config.automod_ch_id) as TextChannel;

      if (automodChannel !== undefined) {
        const channelEmbed = await automodChannel.send(tierMemberEmbed);
        await embeds.reactToTierEmbed(channelEmbed);

        const collector = channelEmbed.createReactionCollector(
          embeds.filterTierEmbedReaction(),
          { time: utils.DAY * utils.MILIS },
        );

        collector.on('collect', async (reaction: MessageReaction,
          reactUser: User) => {
          const actionDone = await embeds
            .performActionOnTierEmbedReaction(member, reactUser, reaction,
              reason);
          if (actionDone) {
            collector.stop();
          }
        });

        collector.on('end', () => {
          channelEmbed.delete();
        });
      }
    } else {
      utils.muteMemberAndSendEmbed(member, userNameCheck.kickTimer, null,
        reason);
    }
  }
}
