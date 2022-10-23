const Discord = require("discord.js");
const intentsEnum = Discord.GatewayIntentBits;
const Events = Discord.Events;
const config = require("../config.json");
const path = require("path");
const fs = require("fs");
const Music = require("./commands/music");
const command_prefix = "!";

const client = new Discord.Client({
    intents: [
        intentsEnum.Guilds,
        intentsEnum.GuildMessages,
        intentsEnum.MessageContent,
        intentsEnum.GuildVoiceStates,
        intentsEnum.GuildVoiceStates
    ],
});

client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    let ids = c.guilds.cache.map(item => item.id)
    Music.initialize(ids)

});


const sendReply = async (messageObj, text) => {
    messageObj.channel.send({
        content: `\`\`\`${text}\`\`\``,
        
        
    });
    
    console.log(`Message: "${text}" sent`);
};

client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(command_prefix)) return;
    let localMsg = message.content.slice(1, message.content.length);
    let parts = localMsg.split(" ");
    switch (parts[0]) {
        case "play": {
            try {
                let source = parts.slice(1).join(" ");
                await Music.queueTrack(message, source)
                await sendReply(message, Music.getQueueAsText(message.guildId))
            } catch {}
            break;
        }
        case "stop": {
            try{
                await Music.leave_channel(message.guildId);
            }
            catch {

            }
        }
        case "skip": {
            await Music.dequeueTrack(message.guildId)
            await sendReply(message, Music.getQueueAsText(message.guildId))
        }
        case "queue": {
            await sendReply(message, Music.getQueueAsText(message.guildId))
        }
    }
});
client.login(config.token);
