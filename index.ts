import { CacheType, ChannelType, ChatInputCommandInteraction, Client, Events, GatewayIntentBits } from "discord.js"
import * as dotenv from "dotenv";
import fs from "node:fs";

dotenv.config();

interface PersistentStore {
  guildElevators: Record<string, string>
}

let persistentStore: PersistentStore = {guildElevators: {}};

function loadPersistentStore() {
  persistentStore = JSON.parse(fs.readFileSync("storage.json", "utf-8"));
}

function savePersistentStore() {
  fs.writeFileSync("storage.json", JSON.stringify(persistentStore));
}

if (fs.existsSync("storage.json")) {
  loadPersistentStore();
  console.log("Loaded persistent store from file");
} else {
  savePersistentStore();
  console.log("Created new persistent store");
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
// this isn't persisted because that would mean a disk write every few seconds
// that's excessive, and having elevators "forget" their direction of travel
// when the bot restarts is fine
const elevatorDirections: Map<string, number> = new Map();

async function tickElevators() {
  for (const [guildId, channelId] of Object.entries(persistentStore.guildElevators)) {
    const guild = client.guilds.cache.get(guildId);

    if (guild === undefined) continue;

    const elevatorChannel = guild.channels.cache.get(channelId);

    if (elevatorChannel === undefined) continue;

    // the channel must be parented to a category

    if (elevatorChannel.parent?.type !== ChannelType.GuildCategory) continue;

    // and the channel needs to be of a type that supports position

    if ("position" in elevatorChannel) {
      //console.log(elevatorChannel.position, elevatorChannel.rawPosition);

      const oldPos = elevatorChannel.position;
      const direction = elevatorDirections.get(elevatorChannel.id) ?? 1

      const newPos = (await elevatorChannel.setPosition(oldPos + direction)).position;

      // easy (but a little messy) way to detect when a channel has reached the end of the category
      // position updates past the end don't change the actual pos, so we can check if it hasn't changed

      if (newPos == 0 || oldPos == newPos) {
        elevatorDirections.set(elevatorChannel.id, direction * -1);
      }
    }
  }
}

async function handleElevatorCommand(interaction: ChatInputCommandInteraction<CacheType>) {
  if (interaction.guild === null) {
    await interaction.reply({ content: ":x: This command must be run in a guild.", ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand(true);

  if (subcommand === "on") {
    const channelId = interaction.options.getChannel("channel", true).id;
    // we can't narrow this object for unknown
    // just fetch the channel directly from the cache
    const channel = interaction.guild.channels.cache.get(channelId);

    if (channel === undefined) {
      await interaction.reply({ content: ":x: Unknown channel.", ephemeral: true });
      return;
    }

    if (channel.parent?.type !== ChannelType.GuildCategory) {
      await interaction.reply({ content: ":x: Channel must be part of a category.", ephemeral: true });
      return;
    }

    if (!("position" in channel)) {
      await interaction.reply({ content: ":x: Channel doesn't support positioning.", ephemeral: true });
      return;
    }

    persistentStore.guildElevators[interaction.guild.id] = channel.id;
    savePersistentStore();
    
    await interaction.reply({ content: ":white_check_mark: Turned on the elevator.", ephemeral: true });
  } else {
    delete persistentStore.guildElevators[interaction.guild.id];
    savePersistentStore();

    await interaction.reply({ content: ":white_check_mark: Turned off the elevator.", ephemeral: true });
  }
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

  try {
    switch (interaction.commandName) {
      case "elevator": {
        await handleElevatorCommand(interaction);
        break;
      }
  
      default: {
        console.warn(`Unable to find command hanlder for ${interaction.commandName}`);
        break;
      }
    }
  } catch (e) {
    console.error(e);
    if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: ":warning: An error occurred while running this command!", ephemeral: true });
		} else {
			await interaction.reply({ content: ":warning: An error occurred while running this command!", ephemeral: true });
		}
  }
});

let isTickRunning = false;

client.on(Events.ClientReady, () => {  
  setInterval(async () => {
    if (isTickRunning) return;
  
    isTickRunning = true;

    try {
      await tickElevators();
    } finally {
      isTickRunning = false;
    }
  }, 4000);
});

client.login(process.env.BOT_TOKEN!);
