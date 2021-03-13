/* eslint-disable arrow-body-style */
import {
  MessageEmbed,
  GuildMember,
  MessageReaction,
  Message,
  CollectorFilter,
  User,
} from 'discord.js';
import * as utils from '../bot/utils';
import * as globals from '../bot/globals';
import { InappropriateWord } from './types';

/**
 * Reactions used for deciding the fate of selected members with
 * inappropriate username
 */
const memberEmbedReactions = ['🔇', '👢', '1⃣', '2⃣', '3⃣', '🔨', '❌'];

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
 * @param {User} user
 * @param {GuildMember | null} reactMember
 * @param {string} reason
 * @returns {MessageEmbed}
 */
export function createEmbedForUnban(user: User, reactMember: GuildMember | null,
  reason: string): MessageEmbed {
  const memberAvatar = user.avatarURL();

  const banEmbed = new MessageEmbed()
    .setColor('#74B72E')
    .setTitle(`**Inappropriate username ${(reactMember === null)
      ? 'auto unban**'
      : 'unban**'}`)
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${user.tag} <@${user.id}>` },
      { name: 'Reason:', value: `${reason}` },
    )
    .setTimestamp()
    .setFooter(`ID: ${user.id}`);

  if (reactMember !== null) {
    banEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return banEmbed;
}

/**
 * return an embed for members which will "prompt" a moderator reaction
 * and based on that, will perform one of the actions
 * @param {GuildMember} member
 */
export function createEmbedForMemberAction(member: GuildMember)
  : MessageEmbed {
  const memberAvatar = member.user.avatarURL();

  const selectedMemberActionEmbed = new MessageEmbed()
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

  return selectedMemberActionEmbed;
}

/**
 * Creates an embed for the list command.
 * @param {number} start
 * @param {InappropriateWord[]} array
 * @returns {MessageEmbed}
 */
export function createListEmbed(start: number,
  array: InappropriateWord[]): MessageEmbed {
  const current = array.slice(start,
    start + globals.MAX_EMBED_FIELDS);
  const maxPages = (Math.ceil(array.length
      / globals.MAX_EMBED_FIELDS));
  const page = (start + globals.MAX_EMBED_FIELDS)
      / globals.MAX_EMBED_FIELDS;

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
 * Add all reactions for the member embed
 * @param {Message} embed
 */
export async function reactToMemberEmbed(embed: Message): Promise<void> {
  memberEmbedReactions.forEach(async (reaction) => {
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
 * Create a collector filter for the member embed. Only collect the
 * reactions from memberEmbedReactions.
 * @return {CollectorFilter}
 */
export function filterMemberEmbedReaction(): CollectorFilter {
  return ((reaction: MessageReaction) => {
    return (memberEmbedReactions.includes(reaction.emoji.name));
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
    return globals.MAX_EMBED_FIELDS * page;
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
export async function performActionOnMemberEmbedReaction(member: GuildMember,
  reactUser: User, reaction: MessageReaction, reason: string):
  Promise<boolean> {
  const reactMember = await utils.getMember(reactUser.id,
    member.guild);

  if (reactMember !== null) {
    if (utils.checkIfUserDiscordMod(reactMember)) {
      switch (reaction.emoji.name) {
        case '🔇':
          utils.getLoggerModule('embed react')
            .info(`Mute member ${member.user.tag}!`);
          utils.muteMemberAndSendEmbed(member, false, reactMember,
            reason);
          break;
        case '👢':
          utils.getLoggerModule('embed react')
            .info(`Kick member ${member.user.tag}!`);
          utils.kickMemberAndSendEmbed(member, reactMember, reason);
          break;
        case '1⃣':
          utils.getLoggerModule('embed react')
            .info(`Ban member ${member.user.tag} for one week!`);
          utils.banMemberAndSendEmbed(member, reactMember,
            globals.DAYS_IN_WEEK, reason);
          break;
        case '2⃣':
          utils.getLoggerModule('embed react')
            .info(`Ban member ${member.user.tag} for two weeks!`);
          utils.banMemberAndSendEmbed(member, reactMember,
            globals.DAYS_HALF_A_MONTH, reason);
          break;
        case '3⃣':
          utils.getLoggerModule('embed react')
            .info(`Ban member ${member.user.tag} for a month!`);
          utils.banMemberAndSendEmbed(member, reactMember,
            globals.DAYS_IN_MONTH, reason);
          break;
        case '🔨':
          utils.getLoggerModule('embed react')
            .info(`Ban member ${member.user.tag} permanently!`);
          utils.banMemberAndSendEmbed(member, reactMember, null,
            reason);
          break;
        case '❌':
          utils.getLoggerModule('embed react')
            .info('Abort action, delete the embed.');
          break;
        default:
          utils.getLoggerModule('embed react').error('Something unexpected '
            + 'happened while processing reaction!');
      }
      return true;
    }
    utils.getLoggerModule('embed react').error(`Member ${reactMember.user.tag} `
        + 'not high enough in hierarchy to perform action!');
  }
  return false;
}

/**
 * Perform an action on the list embed based on the reaction: show next page,
 * show previous page or choose a numbered page.
 * @param {Message} messageSent
 * @param {InappropriateWord[]} array
 * @param {string} authorId
 */
export async function performActionOnListEmbedReaction(messageSent: Message,
  array: InappropriateWord[], authorId: string):
  Promise<void> {
  // create the reaction collector for muteable list
  const collector = messageSent.createReactionCollector(
    filterListEmbedReaction(authorId),
    // time out after defined value
    { time: 5 * globals.MINUTE * globals.MILLIS },
  );
  let listEmbedCurrentIndex = 0;

  collector.on('collect', async (reaction, user) => {
    // remove the existing reaction
    await reaction.users.remove(user);
    if (reaction.emoji.name === '🔢') {
      const maxPages = (Math.ceil(array.length
        / globals.MAX_EMBED_FIELDS));
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
            { time: 15 * globals.MILLIS },
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
      if ((reaction.emoji.name === '⬅︝')
            && (listEmbedCurrentIndex !== 0)) {
        // show previous page
        listEmbedCurrentIndex -= globals.MAX_EMBED_FIELDS;
      } else if (reaction.emoji.name === '➡︝'
            && (listEmbedCurrentIndex <= (array.length
              - globals.MAX_EMBED_FIELDS))) {
        // show next page
        listEmbedCurrentIndex += globals.MAX_EMBED_FIELDS;
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
