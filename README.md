# Bot for muting/banning people with inappropriate usernames

This bot checks the user's username on joining a guild, or changing the username
in the guild. If the username is inappropriate, the user will be muted, kicked
or banned.
The bot is written in TypeScript.

## Prerequisites

Install Node.js:
* https://nodejs.org/en/

Postgresql setup:
* https://www.postgresql.org/download/

TypeScript Setup:
 * Open your command line

 * Let's install TypeScript:
```
# if you're on linux or mac you'll need to use sudo
npm i --global typescript @types/node
```

*note: @types/node is the type safety for Node.js, it's not something you really have to look into just make sure you install it*

## How to start
Clone the repo with:

```
git clone https://github.com/Floor-Gang/username_auto_mute.git
```

Populate the config.json file in the config directory (**fields after the :**):

```
{
    "db_host": "localhost",
    "db_port": 8000,
    "db_user": "db_user",
    "db_pass": "db_pass",
    "token"  : "bot_token",
    "prefix" : "-",
    "guild_id": "guild_id",
    "automod_ch_id": "automod_ch_id",
    "punishment_ch_id": "punishment_ch_id",
    "mute_role_ids": {
        "muted_id": "muted_id",
        "vc_muted_id": "vc_muted_id"
    },
    "discord_mod_role_ids": [
        "discord_mod_role_id1",
        "discord_mod_role_id2",
        ...,
        "discord_mod_role_idn",
    ],
    "tier_member_role_ids": [
        "tier_member_role_id1",
        "tier_member_role_id2",
        ...,
        "tier_member_role_idn",
    ]
}
```

*note: all data except "db_port" value has to be a value between the quotes ("") as shown in the example*

<br/>

Get all needed dependencies:
```
npm install
```

Run following command to build project:

```
tsc
```

After the project has been built run it with:

```
node .\build\bot.js
```

*note: POSTGRES database needs to be up and running for the application to work.*
