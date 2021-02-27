import { CommandoClient } from 'discord.js-commando';
import path from 'path';
import * as events from './bot/events';
import * as utils from './bot/utils';
import * as globals from './bot/globals';

/**
 * Create a new commando client with provided attributes
 */
const bot = new CommandoClient({
  commandPrefix: globals.CONFIG.prefix,
});

/**
 * Register bot commands
 */
bot.registry
  .registerGroups([
    ['bot'],
  ])
  .registerDefaults()
  .registerCommandsIn(path.join(__dirname, 'commands'));

/**
 * Function that executes when bot is running. Calls the periodic function
 * to check if there are any muted or banned users.
 */
bot.once('ready', async () => {
  utils.getLoggerModule('ready event')
    .info(`${bot?.user?.username} is online!`);

  setInterval(() => {
    events.checkMuted(bot);
  }, globals.CHECK_INTERVAL);

  setInterval(() => {
    events.checkBanned(bot);
  }, globals.CHECK_INTERVAL);
});

/**
 * When a member joins the guild, check if they should be tempbanned and
 * if they have an inappropriate username
 */
bot.on('guildMemberAdd', async (member) => {
  // Add a delay to give other bots chance to first assign a roles to new
  // members. Might be increased to bigger value!
  utils.getLoggerModule('member join').info(`User ${member.user.tag}`
    + ` (ID:${member.id}) joined the server`);
  setTimeout(async () => {
    const userBan = await utils.checkPermaBan(member);
    if (!userBan) {
      events.muteInappropriateUsername(member);
    }
  }, globals.EVENT_OFFSET);
});

/**
 * When a user changes their username, check if it is inappropriate
 */
bot.on('userUpdate', async (oldUser, newUser) => {
  const guild = bot.guilds.cache.get(globals.CONFIG.guild_id);

  if ((guild !== undefined) && (oldUser.username !== null)) {
    const member = await utils.getMember(newUser.id, guild);
    if ((member !== null) && oldUser.username.toLowerCase()
      .localeCompare(newUser.username.toLowerCase())) {
      utils.getLoggerModule('user update').info(`User ${newUser.tag}`
        + ` (ID:${newUser.id}) has updated the username!`);
      events.muteInappropriateUsername(member);
    }
  }
});

/**
 * login the bot for given token
 */
bot.login(globals.CONFIG.token).catch((err) => {
  utils.getLoggerModule('login').error(err);
});
