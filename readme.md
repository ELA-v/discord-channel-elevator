This piece of code was commissioned from saghetti on Discord.
it's written in typescript, compiled javascript files are included to make it easier to run.

#instructions:#
-make a copy of example.env and rename it to .env
-edit .env and replace <discord token here> with your bot token (between quotes)
-run npm i to install required packages
-run node register-commands.js to register the slash commands with discord. this only needs to be done once
-run node index.js to run the bot
-the bot registers two slash commands, /elevator on <channel> and /elevator off. these are all you need to set it up

By default the command response is set to be silent, you can change it if you want.
