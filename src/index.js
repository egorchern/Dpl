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
});

// const commandsPath = path.join(__dirname, "commands");
// const commandFiles = fs
//     .readdirSync(commandsPath)
//     .filter((file) => file.endsWith(".js"));
// client.commands = new Discord.Collection();

// for (const file of commandFiles) {
//     const filePath = path.join(commandsPath, file);
//     const command = require(filePath);
//     // Set a new item in the Collection with the key as the command name and the value as the exported module
//     if ("data" in command && "execute" in command) {
//         client.commands.set(command.data.name, command);
//     } else {
//         console.log(
//             `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
//         );
//     }
// }
// client.on(Events.InteractionCreate, async (interaction) => {
//     if (!interaction.isChatInputCommand()) return;
//     const command = interaction.client.commands.get(interaction.commandName);

//     if (!command) {
//         console.error(
//             `No command matching ${interaction.commandName} was found.`
//         );
//         return;
//     }

//     try {
//         await command.execute(interaction);
//     } catch (error) {
//         console.error(error);
//         await interaction.reply({
//             content: "There was an error while executing this command!",
//             ephemeral: true,
//         });
//     }
// });
const sendReply = async (messageObj, text) => {
    messageObj.channel.send({
        content: text,
        reply: messageObj
    });
    
    console.log("sent");
};

client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(command_prefix)) return;
    let localMsg = message.content.slice(1, message.content.length);
    let parts = localMsg.split(" ");
    switch (parts[0]) {
        case "play": {
            try {
                let youtube_url = parts[1];
                Music.playYoutubeAudio(message, youtube_url);
                sendReply(message, `Playing ${youtube_url}`)
            } catch {}
            break;
        }
        case "stop": {
            try{
                Music.leave_channel(message.guildId);
            }
            catch {

            }
        }
    }
});
client.login(config.token);
