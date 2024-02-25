import { REST, Routes } from "discord.js";
import dotenv from "dotenv";
import util from "util";

dotenv.config();

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

const rest = new REST().setToken(process.env.BOT_TOKEN!);

(async () => {
  const myself = await rest.get(Routes.currentApplication());

  if (myself === null || typeof myself !== "object")
    throw Error("expected object on /applications/@me");

  if (!("id" in myself)) 
    throw Error("expected property 'id' on /applications/@me");

  const myId = myself.id;

  if (typeof myId !== "string")
    throw Error("expected property 'id' to be of type string on /applications/@me");

  await rest.put(
    Routes.applicationCommands(myId),
    { body: commandDefs },
  );
})();  
