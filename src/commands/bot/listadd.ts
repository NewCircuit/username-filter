import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import * as utils from '../../bot/utils';
import { ListArgs } from '../../models/types';
import {
  getBannableWords,
  getMuteableWords,
  insertInapproppriateWord,
} from '../../db/db';
import * as globals from '../../bot/globals';

export default class ListAddCommand extends Command {
  constructor(bot: CommandoClient) {
    super(bot, {
      name: 'listadd',
      aliases: ['la'],
      group: 'bot',
      memberName: 'listadd',
      description: 'Adds a word to the lists of inappropriate usernames.',
      args: [
        {
          key: 'listType',
          prompt: 'List type in which to add the word (bannable or muteable)',
          type: 'string',
        },
        {
          key: 'listWord',
          prompt: 'Word that will be added to the list',
          type: 'string',
        },
      ],
      argsPromptLimit: 2,
      argsCount: 2,
      argsType: 'multiple',
    });
  }

  public async run(msg: CommandoMessage, { listType, listWord }: ListArgs)
    : Promise<Message | Message[] | null> {
    let returnPromise = null;

    // check if we got a message from a bot and exit if so
    if (!msg.author.bot) {
      const guild = this.client.guilds.cache.get(globals.CONFIG.guild_id);

      if (guild !== undefined) {
        const member = await utils.getMember(msg.author.id, guild);
        if (utils.checkIfUserDiscordMod(member)) {
          switch (listType) {
            case 'muteable':
              {
              // fetch the muteable words from database
                const muteableWords = await getMuteableWords();

                if (muteableWords !== undefined) {
                  if (!(muteableWords.some(({ word }) => listWord === word))) {
                    insertInapproppriateWord(listWord, false);
                    returnPromise = msg.say(`Added ${listWord} `
                     + 'to the muteable list!');
                  } else {
                    returnPromise = msg.say('Word already exists in '
                    + 'the muteable list!');
                  }
                }
              }
              break;
            case 'bannable':
              {
                // fetch the bannable words from database
                const bannableWords = await getBannableWords();

                if (bannableWords !== undefined) {
                  if (!(bannableWords.some(({ word }) => listWord === word))) {
                    insertInapproppriateWord(listWord, true);
                    returnPromise = msg.say(`Added ${listWord} `
                      + 'to the bannable list!');
                  } else {
                    returnPromise = msg.say('Word already exists in '
                    + 'the bannable list!');
                  }
                }
              }
              break;
            default:
              returnPromise = msg.say('Wrong list name provided!');
          }
        }
      }
    }
    return returnPromise;
  }
}
