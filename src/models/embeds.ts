import { MessageEmbed, GuildMember } from 'discord.js';

// create an embed notifying the unmute of a user
export async function createEmbedForUnmute (member: GuildMember,
  reactMember: GuildMember | null): Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const muteEmbed = new MessageEmbed()
    .setColor('#74B72E')
    .setTitle('**Inappropriate username ' + ((reactMember === null)
      ? 'auto unmute**'
      : 'unmute**'))
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    muteEmbed.addField('Action performed by: ',
        `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return muteEmbed;
}

// create an embed notifying banning of a user
export async function createEmbedForBan (member: GuildMember,
  reactMember: GuildMember | null, reason: string, duration: number | null):
  Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const banEmbed = new MessageEmbed()
    .setColor('#B90E0A')
    .setTitle('**Inappropriate username ' + ((reactMember === null)
      ? 'autoban**'
      : 'ban**'))
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason:', value: reason }
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

// create an embed notifying kicking a user
export async function createEmbedForKick (member: GuildMember,
  reactMember: GuildMember | null, reason: string): Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const kickEmbed = new MessageEmbed()
    .setColor('#FCE205')
    .setTitle('**Inappropriate username kick**')
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason:', value: reason }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    kickEmbed.addField('Action performed by: ',
        `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return kickEmbed;
}

// create an embed notifying muting a user
export async function createEmbedForMute (member: GuildMember,
  reactMember: GuildMember | null, reason: string): Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const muteEmbed = new MessageEmbed()
    .setColor('#FF7F50')
    .setTitle('**Inappropriate username ' + ((reactMember === null)
      ? 'automute**'
      : 'mute**'))
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason:', value: `${reason}` }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    muteEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return muteEmbed;
}

// create an embed notifying that muted user updated username to another
// inappropriate username
export async function createEmbedForUpdateMute (member: GuildMember,
  reactMember: GuildMember | null, oldReason: string, newReason: string):
  Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const muteEmbed = new MessageEmbed()
    .setColor('#FF7F50')
    .setTitle('**Inappropriate username ' + ((reactMember === null)
      ? 'autoupdate**'
      : 'update**'))
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Old reason:', value: `${oldReason}` },
      { name: 'New reason:', value: `${newReason}` }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    muteEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return muteEmbed;
}

// create an embed notifying unbanning a user
export async function createEmbedForUnban (member: GuildMember,
  reactMember: GuildMember | null, reason: string): Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const banEmbed = new MessageEmbed()
    .setColor('#74B72E')
    .setTitle('**Inappropriate username ' + ((reactMember === null)
      ? 'auto unban**'
      : 'mute**'))
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender:', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason:', value: `${reason}` }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    banEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return banEmbed;
}

// create an embed for Tier Members which will "prompt" a moderator reaction
// and based on that, will perform one of the actions
export async function createEmbedForTierMemberAction (member: GuildMember)
  : Promise<MessageEmbed> {
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
            `${member.roles.cache.map(r => `${r}`).join(' , ')}`
      },
      { name: 'Mute user:', value: '🔇', inline: true },
      { name: 'Kick user:', value: '👢', inline: true },
      { name: 'Tempban user for 7 days:', value: '1⃣', inline: true },
      { name: 'Tempban user for 15 days:', value: '2⃣', inline: true },
      { name: 'Tempban user for 30 days:', value: '3⃣', inline: true },
      { name: 'Permaban the user:', value: '🔨', inline: true },
      { name: 'Abort action:', value: '❌', inline: true }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  return tierMemberActionEmbed;
}
