import { TextChannel, GuildMember, MessageReaction, User } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import * as utils from './utils';
import { getMutedMembers, poolMute, poolBan, getBannedMembers } from '../db/db';
import { BannedUserDb, MutedUserDb } from '../models/types';
import * as embeds from '../models/embeds';

// Function that periodically (every second) checks if there are banned users
// in a database. If a user is found, we check if the required time elapsed. If
// it did, unban the user.
export async function checkBanned (client: CommandoClient) {
  const bannedUsers = await getBannedMembers();

  if (bannedUsers !== undefined) {
    bannedUsers.forEach(async (row: BannedUserDb) => {
      const now = Math.round(Date.now() / utils.MILIS);
      if (now >= row.time && row.isActive) {
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
        guild.members.unban(member.user).then(async () => {
          await poolBan.query(
            'UPDATE users_banned.users SET ' +
                        'is_active = false,' +
                        'modified_at = now() ' +
                        'WHERE ' +
                        'uid = $1 ' +
                        'AND guild_id = $2' +
                        'AND time = $3' +
                        'AND is_active = true',
            [row.uid, row.guildId, row.time]
          );
        }).catch(console.error);
      }
    });
  }

  setTimeout(() => {
    checkBanned(client);
  }, 1000);
}

// Function that periodically (every second) checks if there are muted users
// with inappropriate username in a database. If a user is found, we check if
// the user has changed his username. If that is the case, remove the muted
// roles from the user.
export async function checkMuted (client: CommandoClient) {
  const mutedUsers = await getMutedMembers();

  if (mutedUsers !== undefined) {
    mutedUsers.forEach(async (row: MutedUserDb) => {
      const guild = await client.guilds.fetch(row.guildId);
      // guild does not exist (should not happen)
      if (!guild) {
        return;
      }

      // check if member exists in guild and perform unmute if username
      // changed to appropriate
      if (row.isActive === true) {
        try {
          const member = await guild.members.fetch(row.uid);

          // get the old username from the reason message (offset is 24)
          const oldUserName = row.reason.substring(24, row.reason.length);

          // check if 2 hours has passed and user has to be
          // kicked
          if ((row.kickTimer === true)) {
            const now = Date.now();
            const createdAt = new Date(row.createdAt).getTime();

            if ((now - createdAt) >= (2 * utils.HOUR * utils.MILIS)) {
              // update the db and kick the user
              await poolMute.query(
                'UPDATE users_muted.users SET ' +
                  'is_active = false,' +
                  'modified_at = now() ' +
                  'WHERE ' +
                  'uid = $1 ' +
                  'AND guild_id = $2' +
                  'AND is_active = true',
                [row.uid, row.guildId]
              );

              await member.send('You have been kicked from the ' +
                                `server for: ${row.reason}. ` +
                                'Please change your username before ' +
                                'joining again!').catch(console.log);

              member.kick(`${row.reason}`);
            }
          // check if username was changed
          } else if (member.user.username.localeCompare(oldUserName)) {
            // check if username is still inappropriate
            const userNameCheck = utils
              .checkUsername(member.user.username);
            if (!userNameCheck.shouldMute) {
              utils.unmuteMemberAndSendEmbed(member, row, null);
            } else {
              // username still inapproptiate but it was changed
              // set current as non active
              // and insert the newest username
              await poolMute.query(
                'UPDATE users_muted.users SET ' +
                  'is_active = false,' +
                  'kick_timer = false,' +
                  'modified_at = now() ' +
                  'WHERE ' +
                  'uid = $1 ' +
                  'AND guild_id = $2' +
                  'AND is_active = true',
                [row.uid, row.guildId]
              );

              const reason = 'Inappropriate username: ' +
                member.user.username;

              // insert user id and guild id into a database.
              poolMute.query(
                'INSERT INTO users_muted.users (' +
                  'uid,' +
                  'reason,' +
                  'guild_id,' +
                  'is_active,' +
                  'kick_timer,' +
                  'ban_count,' +
                  'created_at,' +
                  'modified_at)' +
                  'VALUES ($1, $2, $3, true, $4, $5, now(), now())',
                [
                  member.id,
                  reason,
                  member.guild.id,
                  userNameCheck.kickTimer,
                  row.banCount
                ]
              );

              // notify the user that the username is still inappropriate
              member.send('Your changed username is still inappropriate. ' +
                'Please change your username to something appropriate!');
            }
          }
        } catch (e) {
          if (e.message === 'Unknown Member') {
            console.log(`User not found because ${e}`);
            // user was not found because the user has left
            // the server set is_active field to false to
            // not poll this log anymore
            await poolMute.query(
              'UPDATE users_muted.users SET ' +
                            'is_active = false,' +
                            'modified_at = now() ' +
                            'WHERE ' +
                            'uid = $1 ' +
                            'AND guild_id = $2' +
                            'AND is_active = true',
              [row.uid, row.guildId]
            );
          }
        }
      }
    });
  }

  setTimeout(() => {
    checkMuted(client);
  }, 1000);
}

export async function muteInappropriateUsername (member: GuildMember) {
  const userNameCheck = utils.checkUsername(member.user.username);
  if (userNameCheck.shouldMute) {
    const reason = 'Inappropriate username: ' + member.user.username;

    // If user is a YT member, ask Moderators for next steps using reaction
    // embeds.
    if (utils.checkIfUserFloorGang(member)) {
      embeds.createEmbedForTierMemberAction(member).then((embed) => {
        const ch = member.guild.channels.cache
          .find(ch => ch.name === 'automod') as TextChannel;

        ch.send(embed).then(async (channelEmbed) => {
          await channelEmbed.react('🔇');
          await channelEmbed.react('👢');
          await channelEmbed.react('1⃣');
          await channelEmbed.react('2⃣');
          await channelEmbed.react('3⃣');
          await channelEmbed.react('🔨');
          await channelEmbed.react('❌');

          const filter = (reaction: MessageReaction) => {
            return ((reaction.emoji.name === '🔇') ||
                (reaction.emoji.name === '👢') ||
                (reaction.emoji.name === '1⃣') ||
                (reaction.emoji.name === '2⃣') ||
                (reaction.emoji.name === '3⃣') ||
                (reaction.emoji.name === '🔨') ||
                (reaction.emoji.name === '❌'));
          };

          const collector = channelEmbed.createReactionCollector(filter,
            { time: utils.DAY * utils.MILIS });

          collector.on('collect', async (reaction: MessageReaction,
            reactUser: User) => {
            const reactMember = await utils.getMember(reactUser.id,
              member.guild);

            if (reactMember) {
              if (utils.checkIfUserDiscordMod(reactMember)) {
                switch (reaction.emoji.name) {
                  case '🔇':
                    utils.muteMemberAndSendEmbed(member, false, reactMember,
                      reason);
                    break;
                  case '👢':
                    utils.kickMemberAndSendEmbed(member, reactMember, reason);
                    collector.stop();
                    break;
                  case '1⃣':
                    utils.banMemberAndSendEmbed(member, reactMember,
                      utils.DAYS_IN_WEEK, reason);
                    collector.stop();
                    break;
                  case '2⃣':
                    utils.banMemberAndSendEmbed(member, reactMember,
                      utils.DAYS_HALF_A_MONTH, reason);
                    collector.stop();
                    break;
                  case '3⃣':
                    utils.banMemberAndSendEmbed(member, reactMember,
                      utils.DAYS_IN_MONTH, reason);
                    collector.stop();
                    break;
                  case '🔨':
                    utils.banMemberAndSendEmbed(member, reactMember, null,
                      reason);
                    break;
                  case '❌':
                    collector.stop();
                    break;
                  default:
                    console.error('Something weird happened!');
                    break;
                }
              }
            }

            reaction.users.remove(reactUser);
          });

          collector.on('end', () => {
            channelEmbed.delete();
          });
        });
      });
    } else {
      utils.muteMemberAndSendEmbed(member, userNameCheck.kickTimer, null,
        reason);
    }
  }
}
