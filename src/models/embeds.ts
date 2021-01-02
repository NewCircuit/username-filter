/* eslint-disable arrow-body-style */
import {
  MessageEmbed, GuildMember, MessageReaction, Message, CollectorFilter, User, TextChannel, MessageCollector,
} from 'discord.js';
import { CommandoMessage } from 'discord.js-commando';
import { promises } from 'fs';
import * as utils from '../bot/utils';
import { InappropriateWords } from './types';

/**
 * Reactions used for deciding the fate of tier member with inappropriate
 * username
 */
const tierEmbedReactions = ['🔇', '👢', '1⃣', '2⃣', '3⃣', '🔨', '❌'];

const listEmbedReactions = ['⬅️', '➡️', '🔢'];

/* *********************************************************
 * ****************** embed creations **********************
 * ********************************************************* */

/**
 * return an embed notifying the unmute of a user
 * @param {GuildMember} member
 * @param {GuildMember | null} reactMember
 * @returns {MessageEmbed}
 */
export function createEmbedForUnmute(member: GuildMember,
  reactMember: GuildMember | null): MessageEmbed {
  const memberAvatar = member.user.avatarURL();

  const muteEmbed = new MessageEmbed()
    .setColor('#74B72E')
    .setTitle(`**Inappropriate username ${(reactMember === null)
      ? 'auto unmute**'
      : 'unmute**'}`)
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    muteEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return muteEmbed;
}

/**
 * return an embed notifying banning of a user
 * @param {GuildMember} member
 * @param {GuildMember | null} reactMember
 * @param {string} reason
 * @param {number | null} duration
 * @returns {MessageEmbed}
 */
export function createEmbedForBan(member: GuildMember,
  reactMember: GuildMember | null, reason: string, duration: number | null):
  MessageEmbed {
  const memberAvatar = member.user.avatarURL();

  const banEmbed = new MessageEmbed()
    .setColor('#B90E0A')
    .setTitle(`**Inappropriate username ${(reactMember === null)
      ? 'autoban**'
      : 'ban**'}`)
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason:', value: reason },
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    banEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  banEmbed.addField('Banned for:', ((duration !== null)
    ? `${duration}d`
    : 'Permanently banned'));

  return banEmbed;
}

/**
 * return an embed notifying kicking a user
 * @param {GuildMember} member
 * @param {GuildMember | null} reactMember
 * @param {string} reason
 * @returns {MessageEmbed}
 */
export function createEmbedForKick(member: GuildMember,
  reactMember: GuildMember | null, reason: string): MessageEmbed {
  const memberAvatar = member.user.avatarURL();

  const kickEmbed = new MessageEmbed()
    .setColor('#FCE205')
    .setTitle('**Inappropriate username kick**')
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason:', value: reason },
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    kickEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return kickEmbed;
}

/**
 * return an embed notifying muting a user
 * @param {GuildMember} member
 * @param {GuildMember | null} reactMember
 * @param {string} reason
 * @returns {MessageEmbed}
 */
export function createEmbedForMute(member: GuildMember,
  reactMember: GuildMember | null, reason: string): MessageEmbed {
  const memberAvatar = member.user.avatarURL();

  const muteEmbed = new MessageEmbed()
    .setColor('#FF7F50')
    .setTitle(`**Inappropriate username ${(reactMember === null)
      ? 'automute**'
      : 'mute**'}`)
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason:', value: `${reason}` },
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    muteEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return muteEmbed;
}

/**
 * return an embed notifying that muted user updated username to another
 * inappropriate username
 * @param {GuildMember} member
 * @param {GuildMember | null} reactMember
 * @param {string} oldReason
 * @param {string} newReason
 * @returns {MessageEmbed}
 */
export function createEmbedForUpdateMute(member: GuildMember,
  reactMember: GuildMember | null, oldReason: string, newReason: string):
  MessageEmbed {
  const memberAvatar = member.user.avatarURL();

  const muteEmbed = new MessageEmbed()
    .setColor('#FF7F50')
    .setTitle(`**Inappropriate username ${(reactMember === null)
      ? 'autoupdate**'
      : 'update**'}`)
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Old reason:', value: `${oldReason}` },
      { name: 'New reason:', value: `${newReason}` },
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    muteEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return muteEmbed;
}

/**
 * return an embed notifying unbanning a user
 * @param {GuildMember} member
 * @param {GuildMember | null} reactMember
 * @param {string} reason
 * @returns {MessageEmbed}
 */
export function createEmbedForUnban(member: GuildMember,
  reactMember: GuildMember | null, reason: string): MessageEmbed {
  const memberAvatar = member.user.avatarURL();

  const banEmbed = new MessageEmbed()
    .setColor('#74B72E')
    .setTitle(`**Inappropriate username ${(reactMember === null)
      ? 'auto unban**'
      : 'unban**'}`)
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason:', value: `${reason}` },
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    banEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return banEmbed;
}

/**
 * return an embed for Tier Members which will "prompt" a moderator reaction
 * and based on that, will perform one of the actions
 * @param {GuildMember} member
 */
export function createEmbedForTierMemberAction(member: GuildMember)
  : MessageEmbed {
  const memberAvatar = member.user.avatarURL();

  const tierMemberActionEmbed = new MessageEmbed()
    .setColor('#0492C2')
    .setTitle('**Inappropriate username**')
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      {
        name: 'User roles:',
        value:
            `${member.roles.cache.map((r) => `${r}`).join(' , ')}`,
      },
      { name: 'Mute user:', value: '🔇', inline: true },
      { name: 'Kick user:', value: '👢', inline: true },
      { name: 'Tempban user for 7 days:', value: '1⃣', inline: true },
      { name: 'Tempban user for 15 days:', value: '2⃣', inline: true },
      { name: 'Tempban user for 30 days:', value: '3⃣', inline: true },
      { name: 'Permaban the user:', value: '🔨', inline: true },
      { name: 'Abort action:', value: '❌', inline: true },
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  return tierMemberActionEmbed;
}

/**
 * Creates an embed for the list command.
 * @param {number} start
 * @param {InappropriateWords[]} array
 * @returns {MessageEmbed}
 */
export function createListEmbed(start: number,
  array: InappropriateWords[]): MessageEmbed {
  const current = array.slice(start,
    start + utils.MAX_EMBED_FIELDS);
  const maxPages = (Math.ceil(array.length
      / utils.MAX_EMBED_FIELDS));
  const page = (start + utils.MAX_EMBED_FIELDS)
      / utils.MAX_EMBED_FIELDS;

  // create the embed for showing the words
  const embed = new MessageEmbed()
    .setTitle('Showing inappropriate words '
        + `${start + 1}-${start + current.length}`
        + ` out of ${array.length}`);
  current.forEach((dbWord) => {
    embed.addField(`Word #${array.indexOf(dbWord) + 1}`,
      dbWord.word);
  });
  embed.setFooter(`Page ${page} out of ${maxPages}`);
  return embed;
}

/* *********************************************************
 * ****************** embed reactions **********************
 * ********************************************************* */

/**
 * Add all reactions for the tier embed
 * @param {Message} embed
 */
export async function reactToTierEmbed(embed: Message): Promise<void> {
  tierEmbedReactions.forEach(async (reaction) => {
    await embed.react(reaction);
  });
}

/**
 * Add all reactions for the list embed
 * @param {Message} embed
 */
export async function reactToListEmbed(embed: Message): Promise<void> {
  listEmbedReactions.forEach(async (reaction) => {
    await embed.react(reaction);
  });
}

/* *********************************************************
 * *************** embed filters and utils *****************
 * ********************************************************* */

/**
 * Create a collector filter for the tier embed. Only collect the reactions
 * from tierEmbedReactions.
 * @return {CollectorFilter}
 */
export function filterTierEmbedReaction(): CollectorFilter {
  return ((reaction: MessageReaction) => {
    return (tierEmbedReactions.includes(reaction.emoji.name));
  });
}

/**
 * Create a collector filter for the list embed. Only collect the reactions
 * from listEmbedReactions.
 * @return {CollectorFilter}
 */
export function filterListEmbedReaction(authorId: string): CollectorFilter {
  return ((reaction: MessageReaction, user: User) => {
    return (listEmbedReactions.includes(reaction.emoji.name)
      && (user.id === authorId));
  });
}

/**
 * Calculate needed index to display one of the pages (with max 25 embeds)
 * @param {Message} pageMsg message that prompts for page
 * @param {Message} userMsg message containing page number
 * @param {Message} maxPage
 * @returns {Promise<number | null>}
 */
async function listEmbedHandlePages(pageMsg: Message, userMsg: Message,
  maxPage: number): Promise<number | null> {
  const page = parseInt(userMsg.content, 10) - 1;
  if (page >= 0 && page < maxPage) {
    // show the desired page containing
    // inappropriate words
    await pageMsg.delete();
    await userMsg.delete();
    return utils.MAX_EMBED_FIELDS * page;
  }
  // Delete the message after 1 second
  const deleteMsg = await pageMsg.channel
    .send('Wrong page number!');
  await deleteMsg.delete({ timeout: 1000 });
  await userMsg.delete();

  return null;
}

/* *********************************************************
 * ************** embed actions on reactions ***************
 * ********************************************************* */

/**
 * Based on the reaction on the embed, perform one of the steps: mute, kick,
 * tempban or permaban.
 * @param {GuildMember} member
 * @param {User} reactUser
 * @param {MessageReaction} reaction
 * @param {string} reason
 * @returns {Promise<boolean>} true if can perform action, false otherwise
 */
export async function performActionOnTierEmbedReaction(member: GuildMember,
  reactUser: User, reaction: MessageReaction, reason: string):
  Promise<boolean> {
  const reactMember = await utils.getMember(reactUser.id,
    member.guild);

  if (reactMember !== null) {
    if (utils.checkIfUserDiscordMod(reactMember)) {
      switch (reaction.emoji.name) {
        case '🔇':
          utils.muteMemberAndSendEmbed(member, false, reactMember,
            reason);
          break;
        case '👢':
          utils.kickMemberAndSendEmbed(member, reactMember, reason);
          break;
        case '1⃣':
          utils.banMemberAndSendEmbed(member, reactMember,
            utils.DAYS_IN_WEEK, reason);
          break;
        case '2⃣':
          utils.banMemberAndSendEmbed(member, reactMember,
            utils.DAYS_HALF_A_MONTH, reason);
          break;
        case '3⃣':
          utils.banMemberAndSendEmbed(member, reactMember,
            utils.DAYS_IN_MONTH, reason);
          break;
        case '🔨':
          utils.banMemberAndSendEmbed(member, reactMember, null,
            reason);
          break;
        case '❌':
          break;
        default:
          console.error('Something weird happened!');
      }
      return true;
    }
  }
  return false;
}

/**
 * Perform an action on the list embed based on the reaction: show next page,
 * show previous page or choose a page.
 * @param {Message} messageSent
 * @param {InappropriateWords[]} array
 * @param {string} authorId
 */
export async function performActionOnListEmbedReaction(messageSent: Message,
  array: InappropriateWords[], authorId: string):
  Promise<void> {
  // create the reaction collector for muteable list
  const collector = messageSent.createReactionCollector(
    filterListEmbedReaction(authorId),
    // time out after a minute
    { time: utils.MINUTE * utils.MILIS },
  );
  let listEmbedCurrentIndex = 0;

  collector.on('collect', async (reaction, user) => {
    // remove the existing reaction
    await reaction.users.remove(user);
    if (reaction.emoji.name === '🔢') {
      const maxPages = (Math.ceil(array.length
        / utils.MAX_EMBED_FIELDS));
      const pageMsg = await messageSent.channel.send(
        `Please input the page (1-${maxPages}) `
        + 'on which you want to go to:',
      );
      if (pageMsg) {
        const messageCollector = messageSent.channel
          .createMessageCollector(
            // only collect messages from the author
            (m) => m.author.id === authorId,
            // time out after 15 seconds
            { time: 15 * utils.MILIS },
          );
        messageCollector.on('collect',
          async (userMsg: Message) => {
            const newIndex = await listEmbedHandlePages(pageMsg,
              userMsg, maxPages);
            if (newIndex !== null) {
              listEmbedCurrentIndex = newIndex;
              // edit message with new embed
              messageSent.edit(createListEmbed(listEmbedCurrentIndex, array));
              messageCollector.stop();
            }
          });

        messageCollector.on('end', async () => {
          if (!pageMsg.deleted) {
            await pageMsg.delete();
          }
        });
      }
    } else {
      if ((reaction.emoji.name === '⬅️')
            && (listEmbedCurrentIndex !== 0)) {
        // show previous page
        listEmbedCurrentIndex -= utils.MAX_EMBED_FIELDS;
      } else if (reaction.emoji.name === '➡️'
            && (listEmbedCurrentIndex <= (array.length
              - utils.MAX_EMBED_FIELDS))) {
        // show next page
        listEmbedCurrentIndex += utils.MAX_EMBED_FIELDS;
      }

      // edit message with new embed
      messageSent.edit(createListEmbed(listEmbedCurrentIndex, array));
    }
  });

  collector.on('end', async () => {
    if (!messageSent.deleted) {
      await messageSent.delete();
    }
  });
}
