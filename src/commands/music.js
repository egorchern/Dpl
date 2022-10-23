const {SlashCommandBuilder} = require("discord.js");
const Voice = require("@discordjs/voice");
const youtubedl = require("youtube-dl-exec");
const got = require("got");
const download = require("download");
const fs = require("fs");
let counter = 0;
const downloadFile = async (url) => {
    let filename = `music/music_${counter}.webm`;
    let tmp = await download(url, "music");
    return new Promise((resolve) => {
        fs.writeFile(filename, tmp, (err) => {
            resolve({filename, err});
        });
    });
};
const fetchYoutubeAudioUrl = async (url) => {
    let info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ["referer:youtube.com", "user-agent:googlebot"],
        format: "bestaudio",
    });
    let full_url = info.url
    return full_url;
};

FFMPEG_OPTIONS = {
    before_options: "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
    options: "-vn",
};

const leave_channel = async (guild_id) => {
    let voiceConnection = Voice.getVoiceConnection(guild_id)
    if (!voiceConnection) return
    voiceConnection.disconnect();
}

const join_channel = async (message) => {
    const voiceChannel = message.member.voice.channel;
    // Member not in a voice channel
    if (!voiceChannel) {
        return false;
    }
    const connection = Voice.joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
    });
    return connection;
};

const playYoutubeAudio = async (message, youtube_url) => {
    const channel_info = await join_channel(message);
    if (channel_info) {
        if (!youtube_url) return;
        let url = await fetchYoutubeAudioUrl(youtube_url);
        // let file_info = await downloadFile(url)
        const stream = got.stream(url);
        // const stream = fs.createReadStream(file_info.filename)
        const player = Voice.createAudioPlayer();
        const resource = Voice.createAudioResource(stream, {
            inputType: Voice.StreamType.WebmOpus,
        });
        player.play(resource);
        channel_info.subscribe(player);
    }
    return
};

module.exports = {
    playYoutubeAudio,
    fetchYoutubeAudioUrl,
    leave_channel
};
