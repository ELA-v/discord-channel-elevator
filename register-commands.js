"use strict";
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
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// could do better than hardcoding this
// but i don't feel like fighting typescript's json imports
const commandDefs = [
    {
        "name": "elevator",
        "description": "Configures the elevator channel for this server",
        "dm_permission": false,
        "default_member_permissions": "16",
        "options": [
            {
                "type": 1,
                "name": "on",
                "description": "Turns the elevator on",
                "options": [
                    {
                        "type": 7,
                        "name": "channel",
                        "description": "The channel to move around",
                        "required": true
                    }
                ]
            },
            {
                "type": 1,
                "name": "off",
                "description": "Turns the elevator off",
                "options": []
            }
        ]
    }
];
const rest = new discord_js_1.REST().setToken(process.env.BOT_TOKEN);
(() => __awaiter(void 0, void 0, void 0, function* () {
    const myself = yield rest.get(discord_js_1.Routes.currentApplication());
    if (myself === null || typeof myself !== "object")
        throw Error("expected object on /applications/@me");
    if (!("id" in myself))
        throw Error("expected property 'id' on /applications/@me");
    const myId = myself.id;
    if (typeof myId !== "string")
        throw Error("expected property 'id' to be of type string on /applications/@me");
    yield rest.put(discord_js_1.Routes.applicationCommands(myId), { body: commandDefs });
}))();
