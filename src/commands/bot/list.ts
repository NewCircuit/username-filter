import { Message, MessageEmbed } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import * as utils from '../../bot/utils';
import * as config from '../../config/config.json';
import { InappropriateWordsDb, ListArgs } from '../../models/types';
import { getBannableWords, getMuteableWords } from '../../db/db';

export default class ListCommand extends Command {
  constructor (bot: CommandoClient) {
    super(bot, {
      name: 'list',
      aliases: [],
      group: 'bot',
      memberName: 'list',
      guildOnly: true,
      description: 'DMs a list of inappropriate bannable words for usernames.' +
        ' Sends the list of inappropriate muteable words into the channel!',
      args: [
        {
          key: 'listType',
          prompt: 'List type to be shown (bannable, muteable, all)',
          type: 'string'
        }
      ],
      argsCount: 1,
      argsPromptLimit: 1
    });
  }

  public async run (msg: CommandoMessage, { listType }: ListArgs):
  Promise<Message | Message[] | null> {
    let returnPromise = null;
    // check if we got a message from DM
    if (!msg.author.bot) {
      const guild = this.client.guilds.cache.get(config.guild_id);

      if (guild !== undefined) {
        const member = await utils.getMember(msg.author.id, guild);
        if (utils.checkIfUserDiscordMod(member)) {
          if (listType.localeCompare('bannable') &&
              listType.localeCompare('muteable') &&
              listType.localeCompare('all')) {
            return msg.say('Wrong argument provided!');
          }
          if (!listType.localeCompare('bannable') ||
              !listType.localeCompare('all')) {
            // fetch the bannable words from database
            const bannableWords = await getBannableWords();

            if (bannableWords !== undefined) {
              let listResponse = '\n**List of inappropriate bannable ' +
               'words**:\n';

              bannableWords.forEach((dbWord) => {
                if (listResponse.length > 1900) {
                  msg.author.send(listResponse);
                  listResponse = '';
                }

                listResponse += (bannableWords.indexOf(dbWord) + 1) + '.) ' +
                  dbWord.word + '\n';
              });

              listResponse += '\n**To add or remove one of ' +
                'the words use the following:**\n';

              listResponse += 'listadd muteable <word> or ' +
                'listadd bannable <word> to add\n';

              listResponse += '\nlistdel muteable <word> or ' +
                'listdel bannable <word> to delete a word\n';

              msg.author.send(listResponse).catch(console.error);

              returnPromise = msg.say('Sent you a list of inapproppriate ' +
              'bannable words in DMs.');
            }
          }

          if (!listType.localeCompare('muteable') ||
              !listType.localeCompare('all')) {
            // fetch the muteable words from database
            const muteableWords = await getMuteableWords();

            if (muteableWords !== undefined) {
            // Function to generate an embed
              const generateEmbed = (start: number,
                array: InappropriateWordsDb[]) => {
                const current = array.slice(start,
                  start + utils.MAX_EMBED_FIELDS);
                const maxPages = (Math.ceil(muteableWords.length /
                  utils.MAX_EMBED_FIELDS));
                const page = (start + utils.MAX_EMBED_FIELDS) /
                  utils.MAX_EMBED_FIELDS;

                // create the embed for showing the words
                const embed = new MessageEmbed()
                  .setTitle('Showing inappropriate words ' +
                    `${start + 1}-${start + current.length}` +
                    ` out of ${array.length}`);
                current.forEach((dbWord) => {
                  embed.addField(`Word #${array.indexOf(dbWord) + 1}`,
                    dbWord.word);
                });
                embed.setFooter(`Page ${page} out of ${maxPages}`);
                return embed;
              };

              // send the embed with the first 25 inappropriate words
              msg.channel.send(generateEmbed(0, muteableWords))
                .then(async message => {
                  // add all reacts
                  await message.react('⬅️');
                  await message.react('➡️');
                  await message.react('🔢');
                  const collector = message.createReactionCollector(
                    (reaction, user) =>
                      ['⬅️', '➡️', '🔢'].includes(reaction.emoji.name) &&
                  (user.id === msg.author.id),
                    // time out after a minute
                    { time: utils.MINUTE * utils.MILIS }
                  );

                  let currentIndex = 0;
                  collector.on('collect', async (reaction, user) => {
                  // remove the existing reaction
                    reaction.users.remove(user).then(async () => {
                      if (reaction.emoji.name === '🔢') {
                        const maxPages = (Math.ceil(muteableWords.length /
                      utils.MAX_EMBED_FIELDS));
                        message.channel.send(
                      `Please input the page (1-${maxPages}) ` +
                      'on which you want to go to:').then(async (pageMsg) => {
                          const messageCollector = message.channel
                            .createMessageCollector(
                              // only collect messages from the author
                              (m) => m.author.id === msg.author.id,
                              // time out after 10 seconds
                              { time: 10 * utils.MILIS }
                            );
                          messageCollector.on('collect',
                            async (userMsg: CommandoMessage) => {
                              const page = parseInt(userMsg.content) - 1;
                              if (page >= 0 && page <= maxPages) {
                                // show the desired page containing
                                // inappropriate words
                                currentIndex = utils.MAX_EMBED_FIELDS * page;
                                await pageMsg.delete();
                                await userMsg.delete();
                                // edit message with new embed
                                message.edit(generateEmbed(currentIndex,
                                  muteableWords));
                              } else {
                                // Delete the message after 2 seconds
                                (await message.channel
                                  .send('Wrong page number!'))
                                  .delete({ timeout: 2000 });
                                await userMsg.delete();
                              }
                            });

                          messageCollector.on('end', async () => {
                            if (pageMsg.deletable) {
                              await pageMsg.delete();
                            }
                          });
                        });
                      } else {
                        // show previous page
                        if (reaction.emoji.name === '⬅️' &&
                          currentIndex !== 0) {
                          currentIndex -= utils.MAX_EMBED_FIELDS;
                        } else if (reaction.emoji.name === '➡️') {
                          // show next page
                          currentIndex += utils.MAX_EMBED_FIELDS;
                        }

                        // edit message with new embed
                        message.edit(generateEmbed(currentIndex,
                          muteableWords));
                      }
                    });
                  });

                  collector.on('end', async () => {
                    if (message.deletable) {
                      await message.delete();
                    }
                  });
                });
            }
          }
        }
      }
    }

    return returnPromise;
  }
}
