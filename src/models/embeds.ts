import { MessageEmbed, GuildMember } from 'discord.js';

export async function createEmbedForUnmute (member: GuildMember,
  reactMember: GuildMember | null): Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const muteEmbed = new MessageEmbed()
    .setColor('#FF7F50')
    .setTitle('**Inappropriate username ' + ((reactMember === null)
      ? 'autounmute**'
      : 'unmute**'))
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender', value: `${member.user.tag} <@${member.id}>` }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    muteEmbed.addField('Action performed by: ',
        `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return muteEmbed;
}

export async function createEmbedForBan (member: GuildMember,
  reactMember: GuildMember | null, reason: string): Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const banEmbed = new MessageEmbed()
    .setColor('#FF7F50')
    .setTitle('**Inappropriate username ' + ((reactMember === null)
      ? 'autoban**'
      : 'ban**'))
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason', value: reason }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    banEmbed.addField('Action performed by: ',
    `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return banEmbed;
}

export async function createEmbedForKick (member: GuildMember,
  reactMember: GuildMember | null, reason: string): Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const kickEmbed = new MessageEmbed()
    .setColor('#FF7F50')
    .setTitle('**Inappropriate username kick**')
    .setThumbnail(memberAvatar !== null ? memberAvatar : '')
    .addFields(
      { name: 'Offender', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason', value: reason }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    kickEmbed.addField('Action performed by: ',
        `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return kickEmbed;
}

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
      { name: 'Offender', value: `${member.user.tag} <@${member.id}>` },
      { name: 'Reason', value: `${reason}` }
    )
    .setTimestamp()
    .setFooter(`ID: ${member.user.id}`);

  if (reactMember !== null) {
    muteEmbed.addField('Action performed by: ',
      `${reactMember.user.tag} <@${reactMember.id}>`);
  }

  return muteEmbed;
}

export async function createEmbedForTierMemberAction (member: GuildMember)
  : Promise<MessageEmbed> {
  const memberAvatar = member.user.avatarURL();

  const tierMemberActionEmbed = new MessageEmbed()
    .setColor('#FFF700')
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
