import { Message } from 'discord.js';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import * as utils from '../../bot/utils';
import * as globals from '../../bot/globals';

/**
 * Interface for the loglevel argument
 * @interface LogLevelArgs
 * @param {string} logLevel
*/
interface LogLevelArgs {
    logLevel: string
}

export default class LogLevelCommand extends Command {
  constructor(bot: CommandoClient) {
    super(bot, {
      name: 'loglevel',
      aliases: [],
      group: 'bot',
      memberName: 'loglevel',
      guildOnly: true,
      description: 'Changes the current log level.',
      args: [
        {
          key: 'logLevel',
          prompt: 'Log level to be changed to (debug, info, error, off).',
          type: 'string',
          default: '',
        },
      ],
    });
  }

  public async run(msg: CommandoMessage, args: LogLevelArgs):
  Promise<Message | Message[] | null> {
    const returnPromise = null;
    const logLevels = ['debug', 'info', 'error', 'off'];
    // check if we got a message from DM
    if (!msg.author.bot) {
      const guild = this.client.guilds.cache.get(globals.CONFIG.guild_id);

      if (guild !== undefined) {
        const member = await utils.getMember(msg.author.id, guild);
        if (utils.checkIfUserDiscordMod(member)) {
          if (!logLevels.includes(args.logLevel)) {
            msg.channel.send('Non-valid log level provided. Current log '
                    + `level is ${globals.CONFIG.log_level}.`);
          } else {
            globals.CONFIG.log_level = args.logLevel;
            msg.channel.send('Log level changed.');
          }
        }
      }
    }

    return returnPromise;
  }
}
