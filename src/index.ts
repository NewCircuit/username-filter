import { CommandoClient } from 'discord.js-commando';
import path from 'path';
import * as events from './bot/events';
import config from './config/config.json';
import * as utils from './bot/utils';

// Create a new commando client with provided attributes
const bot = new CommandoClient({
  commandPrefix: config.prefix,
  commandEditableDuration: 10,
  nonCommandEditable: false
});

// Register bot commands
bot.registry
  .registerGroups([
    ['bot']
  ])
  .registerDefaults()
  .registerCommandsIn(path.join(__dirname, 'commands'));

// Function that executes when bot is running. Calls the periodic function
// to check if there are any muted users.
bot.on('ready', async () => {
  console.log(`${bot?.user?.username} is online!`);

  setTimeout(() => {
    events.checkMuted(bot);
  }, 1000);

  setTimeout(() => {
    events.checkBanned(bot);
  }, 1000);
});

// When a member joins the guild, check if they should be tempbanned and
// if they have an inappropriate username
bot.on('guildMemberAdd', async (member) => {
  const tempBan = await utils.checkTempBan(member);
  if (!tempBan) {
    events.muteInappropriateUsername(member);
  }
});

// When a user changes their username, check if it is inappropriate
bot.on('userUpdate', async (oldUser, newUser) => {
  const guild = bot.guilds.cache.get(config.guild_id);

  if (guild !== undefined) {
    const member = await utils.getMember(newUser.id, guild);

    if (member) {
      if (oldUser.username.toLowerCase()
        .localeCompare(newUser.username.toLowerCase())) {
        events.muteInappropriateUsername(member);
      }
    }
  }
});

// login bot for given token
bot.login(config.token).catch(console.error);
