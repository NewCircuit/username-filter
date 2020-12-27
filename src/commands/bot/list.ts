import { Message, MessageEmbed } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import * as utils from '../../bot/utils';
import * as config from '../../config/config.json';
import { bannableWords } from '../../config/bannable-words.json';
import { muteableWords } from '../../config/muteable-words.json';

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
      args: [],
      argsCount: 0,
      argsPromptLimit: 0
    });
  }

  public async run (msg: CommandoMessage): Promise<Message | Message[] | null> {
    // check if we got a message from DM
    if (!msg.author.bot) {
      const guild = this.client.guilds.cache.get(config.guild_id);

      if (guild !== undefined) {
        const member = await utils.getMember(msg.author.id, guild);
        if (utils.checkIfUserDiscordMod(member)) {
          let listResponse = '\n**List of inappropriate bannable words**:\n';

          bannableWords.forEach((word) => {
            if (listResponse.length > 1900) {
              msg.author.send(listResponse);
              listResponse = '';
            }

            listResponse += (bannableWords.indexOf(word) + 1) + '.) ' +
                      word + '\n';
          });

          listResponse += '\n**To add or remove one of ' +
              'the words use the following:**\n';

          listResponse += 'listadd muteable <word> or ' +
              'listadd bannable <word> to add\n';

          listResponse += '\nlistdel muteable <index of word> or ' +
              'listdel bannable <index of word> to delete a word\n';

          msg.author.send(listResponse);

          // Function to generate an embed
          const generateEmbed = (start: number, array: string[]) => {
            const current = array.slice(start, start + utils.MAX_EMBED_FIELDS);
            const maxPages = (Math.ceil(muteableWords.length /
              utils.MAX_EMBED_FIELDS));
            const page = (start + utils.MAX_EMBED_FIELDS) /
              utils.MAX_EMBED_FIELDS;

            // you can of course customise this embed however you want
            const embed = new MessageEmbed()
              .setTitle('Showing inappropriate words ' +
               `${start + 1}-${start + current.length} out of ${array.length}`);
            current.forEach((word) => {
              embed.addField(`Word #${array.indexOf(word) + 1}`, word);
            });
            embed.setFooter(`Page ${page} out of ${maxPages}`);
            return embed;
          };

          // send the embed with the first 20 guilds
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
                            // show the desired page containing inappropriate
                            // words
                            currentIndex = utils.MAX_EMBED_FIELDS * page;
                            await pageMsg.delete();
                            await userMsg.delete();
                            // edit message with new embed
                            message.edit(generateEmbed(currentIndex,
                              muteableWords));
                          } else {
                            // Delete the message after 2 seconds
                            (await message.channel.send('Wrong page number!'))
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
                    if (reaction.emoji.name === '⬅️' && currentIndex !== 0) {
                      currentIndex -= utils.MAX_EMBED_FIELDS;
                    } else if (reaction.emoji.name === '➡️') {
                      // show next page
                      currentIndex += utils.MAX_EMBED_FIELDS;
                    }

                    // edit message with new embed
                    message.edit(generateEmbed(currentIndex, muteableWords));
                  }
                });
              });

              collector.on('end', async () => {
                if (message.deletable) {
                  await message.delete();
                }
              });
            });

          return msg.say('Sent you a list of inapproppriate ' +
            'bannable words in DMs.');
        }
      }
    }

    return null;
  }
}
