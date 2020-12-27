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
      name: 'listdel',
      aliases: ['ld'],
      group: 'bot',
      memberName: 'listdel',
      description: 'Deletes the word from the lists of inappropriate usernames.',
      args: [
        {
          key: 'listType',
          prompt: 'List type from which to delete the word (bannable or muteable)',
          type: 'string'
        },
        {
          key: 'index',
          prompt: 'Index of the word that will be deleted.',
          type: 'string'
        }
      ],
      argsPromptLimit: 0,
      argsCount: 2,
      argsType: 'multiple'
    });
  }

  public async run (msg: CommandoMessage, { listType, index }: ListArgs)
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
              if ((muteableWords.length >= index) && (index > 0)) {
                const word = muteableWords.splice(index - 1, 1);
                returnPromise = msg.say(`Deleted ${word} from the muteable list!`);
              } else {
                returnPromise = msg.say('Wrong index provided!');
              }
              break;
            case 'bannable':
              if ((msg.guild === null)) {
                if ((bannableWords.length >= index) && (index > 0)) {
                  const word = bannableWords.splice(index - 1, 1);
                  returnPromise = msg.say(`Deleted ${word} from the bannable list!`);
                } else {
                  returnPromise = msg.say('Wrong index provided!');
                }
              } else {
                returnPromise = msg.say('Removing words from bannable list ' +
                  'is only possible from DMs!');
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
