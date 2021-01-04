import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import * as utils from '../../bot/utils';
import { InappropriateWord, ListArgs } from '../../models/types';
import { getBannableWords, getMuteableWords } from '../../db/db';
import {
  createListEmbed,
  performActionOnListEmbedReaction,
  reactToListEmbed,
} from '../../models/embeds';
import * as globals from '../../bot/globals';

export default class ListCommand extends Command {
  constructor(bot: CommandoClient) {
    super(bot, {
      name: 'list',
      aliases: [],
      group: 'bot',
      memberName: 'list',
      guildOnly: true,
      description: 'DMs a list of inappropriate bannable words for usernames.'
        + ' Sends the list of inappropriate muteable words into the channel!',
      args: [
        {
          key: 'listType',
          prompt: 'List type to be shown (bannable, muteable, all)',
          type: 'string',
        },
      ],
      argsCount: 1,
      argsPromptLimit: 1,
    });
  }

  public async run(msg: CommandoMessage, { listType }: ListArgs):
  Promise<Message | Message[] | null> {
    let returnPromise = null;
    // check if we got a message from DM
    if (!msg.author.bot) {
      const guild = this.client.guilds.cache.get(globals.CONFIG.guild_id);

      if (guild !== undefined) {
        const member = await utils.getMember(msg.author.id, guild);
        if (utils.checkIfUserDiscordMod(member)) {
          if (listType.localeCompare('bannable')
              && listType.localeCompare('muteable')
              && listType.localeCompare('all')) {
            return msg.say('Wrong argument provided!');
          }
          if (!listType.localeCompare('bannable')
              || !listType.localeCompare('all')) {
            // fetch the bannable words from database
            const bannableWords = await getBannableWords();

            if (bannableWords !== undefined) {
              await ListCommand.sendListResponse(bannableWords, msg);

              returnPromise = msg.say('Sent you a list of inapproppriate '
              + 'bannable words in DMs.');
            }
          }

          if (!listType.localeCompare('muteable')
              || !listType.localeCompare('all')) {
            // fetch the muteable words from database
            const muteableWords = await getMuteableWords();

            if (muteableWords !== undefined) {
              // send the embed with the first 25 inappropriate words
              const messageSent = await msg.channel
                .send(createListEmbed(0, muteableWords));
              // add all reacts
              await reactToListEmbed(messageSent);

              await performActionOnListEmbedReaction(messageSent, muteableWords,
                msg.author.id);
            }
          }
        }
      }
    }

    return returnPromise;
  }

  static async sendListResponse(wordList: InappropriateWord[],
    msg: CommandoMessage): Promise<void> {
    let listResponse = '\n**List of inappropriate bannable '
               + 'words**:\n';

    wordList.forEach((dbWord) => {
      if (listResponse.length > 1900) {
        msg.author.send(listResponse);
        listResponse = '';
      }

      listResponse += `${wordList.indexOf(dbWord) + 1}.) ${
        dbWord.word}\n`;
    });

    listResponse += '\n**To add or remove one of '
                + 'the words use the following:**\n';

    listResponse += 'listadd muteable <word> or '
                + 'listadd bannable <word> to add\n';

    listResponse += '\nlistdel muteable <word> or '
                + 'listdel bannable <word> to delete a word\n';

    msg.author.send(listResponse);
  }
}
