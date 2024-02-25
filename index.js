"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
const node_fs_1 = __importDefault(require("node:fs"));
dotenv.config();
let persistentStore = { guildElevators: {} };
function loadPersistentStore() {
    persistentStore = JSON.parse(node_fs_1.default.readFileSync("storage.json", "utf-8"));
}
function savePersistentStore() {
    node_fs_1.default.writeFileSync("storage.json", JSON.stringify(persistentStore));
}
if (node_fs_1.default.existsSync("storage.json")) {
    loadPersistentStore();
    console.log("Loaded persistent store from file");
}
else {
    savePersistentStore();
    console.log("Created new persistent store");
}
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
// this isn't persisted because that would mean a disk write every few seconds
// that's excessive, and having elevators "forget" their direction of travel
// when the bot restarts is fine
const elevatorDirections = new Map();
function tickElevators() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        for (const [guildId, channelId] of Object.entries(persistentStore.guildElevators)) {
            const guild = client.guilds.cache.get(guildId);
            if (guild === undefined)
                continue;
            const elevatorChannel = guild.channels.cache.get(channelId);
            if (elevatorChannel === undefined)
                continue;
            // the channel must be parented to a category
            if (((_a = elevatorChannel.parent) === null || _a === void 0 ? void 0 : _a.type) !== discord_js_1.ChannelType.GuildCategory)
                continue;
            // and the channel needs to be of a type that supports position
            if ("position" in elevatorChannel) {
                //console.log(elevatorChannel.position, elevatorChannel.rawPosition);
                const oldPos = elevatorChannel.position;
                const direction = (_b = elevatorDirections.get(elevatorChannel.id)) !== null && _b !== void 0 ? _b : 1;
                const newPos = (yield elevatorChannel.setPosition(oldPos + direction)).position;
                // easy (but a little messy) way to detect when a channel has reached the end of the category
                // position updates past the end don't change the actual pos, so we can check if it hasn't changed
                if (newPos == 0 || oldPos == newPos) {
                    elevatorDirections.set(elevatorChannel.id, direction * -1);
                }
            }
        }
    });
}
function handleElevatorCommand(interaction) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (interaction.guild === null) {
            yield interaction.reply({ content: ":x: This command must be run in a guild.", ephemeral: true });
            return;
        }
        const subcommand = interaction.options.getSubcommand(true);
        if (subcommand === "on") {
            const channelId = interaction.options.getChannel("channel", true).id;
            // we can't narrow this object for unknown
            // just fetch the channel directly from the cache
            const channel = interaction.guild.channels.cache.get(channelId);
            if (channel === undefined) {
                yield interaction.reply({ content: ":x: Unknown channel.", ephemeral: true });
                return;
            }
            if (((_a = channel.parent) === null || _a === void 0 ? void 0 : _a.type) !== discord_js_1.ChannelType.GuildCategory) {
                yield interaction.reply({ content: ":x: Channel must be part of a category.", ephemeral: true });
                return;
            }
            if (!("position" in channel)) {
                yield interaction.reply({ content: ":x: Channel doesn't support positioning.", ephemeral: true });
                return;
            }
            persistentStore.guildElevators[interaction.guild.id] = channel.id;
            savePersistentStore();
            yield interaction.reply({ content: ":white_check_mark: Turned on the elevator.", ephemeral: true });
        }
        else {
            delete persistentStore.guildElevators[interaction.guild.id];
            savePersistentStore();
            yield interaction.reply({ content: ":white_check_mark: Turned off the elevator.", ephemeral: true });
        }
    });
}
client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    if (!interaction.isChatInputCommand())
        return;
    try {
        switch (interaction.commandName) {
            case "elevator": {
                yield handleElevatorCommand(interaction);
                break;
            }
            default: {
                console.warn(`Unable to find command hanlder for ${interaction.commandName}`);
                break;
            }
        }
    }
    catch (e) {
        console.error(e);
        if (interaction.replied || interaction.deferred) {
            yield interaction.followUp({ content: ":warning: An error occurred while running this command!", ephemeral: true });
        }
        else {
            yield interaction.reply({ content: ":warning: An error occurred while running this command!", ephemeral: true });
        }
    }
}));
let isTickRunning = false;
client.on(discord_js_1.Events.ClientReady, () => {
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        if (isTickRunning)
            return;
        isTickRunning = true;
        try {
            yield tickElevators();
        }
        finally {
            isTickRunning = false;
        }
    }), 4000);
});
client.login(process.env.BOT_TOKEN);
