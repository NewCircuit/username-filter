import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import * as utils from '../../bot/utils';
import * as config from '../../config/config.json';
import { ListArgs } from '../../models/types';
import { bannableWords } from '../../config/bannable-words.json';
import { muteableWords } from '../../config/muteable-words.json';

export default class ListAddCommand extends Command {
  constructor (bot: CommandoClient) {
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
          type: 'string'
        },
        {
          key: 'word',
          prompt: 'Word that will be added to the list',
          type: 'string'
        }
      ],
      argsPromptLimit: 0,
      argsCount: 2,
      argsType: 'multiple'
    });
  }

  public async run (msg: CommandoMessage, { listType, word }: ListArgs)
    : Promise<Message | Message[] | null> {
    let returnPromise = null;

    // check if we got a message from DM
    if (!msg.author.bot) {
      const guild = this.client.guilds.cache.get(config.guild_id);

      if (guild !== undefined) {
        const member = await utils.getMember(msg.author.id, guild);
        if (utils.checkIfUserDiscordMod(member)) {
          switch (listType) {
            case 'muteable':
              if (!muteableWords.includes(word)) {
                muteableWords.push(word);
                returnPromise = msg.say(`Added ${word} to the muteable list!`);
              } else {
                returnPromise = msg.say('Word already exists in ' +
                  'the muteable list!');
              }
              break;
            case 'bannable':
              if ((msg.guild === null)) {
                if (!bannableWords.includes(word)) {
                  bannableWords.push(word);
                  returnPromise = msg.say(`Added ${word} to the bannable list!`);
                } else {
                  returnPromise = msg.say('Word already exists in ' +
                    'the bannable list!');
                }
              } else {
                returnPromise = msg.say('Adding words to bannable list is ' +
                  ' only possible from DMs!');
              }
              break;
            default:
              returnPromise = msg.say('Wrong list name provided!');
              break;
          }
        }
      }
    }
    return returnPromise;
  }
}
