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

let servers = {}

const initialize = (guildIds) => {
    guildIds.forEach(id => {
        servers[id] = {
            trackQueue: [],
            trackPlayingNow: false,
            player: Voice.createAudioPlayer(),
        }
    })
    Object.keys(servers).forEach(guildId => {
        let server = servers[guildId]
        server.player.on(Voice.AudioPlayerStatus.Playing, () => {
            server.trackPlayingNow = true
        })
        server.player.on(Voice.AudioPlayerStatus.Idle, () => {
            server.trackPlayingNow = false
            console.log("dequed")
            dequeueTrack(guildId)
        })
    })
    
}

const getytlp_info = async (url, isSearch) => {
    let info = await youtubedl(url, {
        dumpSingleJson: true,
        download:false,
        noCheckCertificates: true,
        noWarnings: true,
        defaultSearch: isSearch ? "ytsearch" : null,
        preferFreeFormats: true,
        lazyPlaylist: true,
        addHeader: ["referer:youtube.com", "user-agent:googlebot"],
        format: "bestaudio",
    });
    return info
};

FFMPEG_OPTIONS = {'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5', 'options': '-vn'}

const leave_channel = async (guildId) => {
    let voiceConnection = Voice.getVoiceConnection(guildId);
    if (!voiceConnection) return;
    servers[guildId].player.stop();
    voiceConnection.destroy()
    servers[guildId].trackPlayingNow = false;
    servers[guildId].trackQueue = []
};

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

const getQueueAsText = (guild_id) => {
    Voice.createAudioPlayer()
    servers[guild_id].player
    let out = `Track queue: \n`
    const trackQueue = servers[guild_id].trackQueue
    trackQueue.forEach((value, index) => {
        const trackInfo = value.trackInfo
        out += `${index + 1}) ${trackInfo.fulltitle}    ${trackInfo.duration_string}    ${index === 0 ? "<--|" : ""}\n`
    })
    return out;
}

const queueTrack = async (message, source) => {
    let trackQueue = servers[message.guildId].trackQueue
    let trackPlayingNow = servers[message.guildId].trackPlayingNow
    const lnk = isLink(source)
    let trackInfo = await getytlp_info(source, !lnk)
    if (!lnk){
        trackInfo = trackInfo.entries[0]
    }
    if(trackQueue.length === 0 && !trackPlayingNow){
        trackQueue.push({message, trackInfo: trackInfo})
        let track = trackQueue[0]
        servers[message.guildId].trackPlayingNow = true
        await playYoutubeAudio(track.message, track.trackInfo)
    }
    else{
        trackQueue.push({message, trackInfo: trackInfo})
    }
    
    
};

const popTrackQueue = (guildId) => {
    const server = servers[guildId]
    let trackQueue = server.trackQueue
    if(trackQueue.length == 0) return null;
    let poppedTrack = trackQueue[0]
    server.trackQueue = trackQueue.slice(1)
    return poppedTrack
}

const dequeueTrack = async (guildId) => {
    popTrackQueue(guildId)
    let server = servers[guildId]
    server.trackPlayingNow = false
    if(server.trackQueue.length === 0){
        leave_channel(guildId)
        return
    }
    let track = server.trackQueue[0]
    server.trackPlayingNow = true
    playYoutubeAudio(track.message, track.trackInfo)
}

const isLink = (text) => {
    return /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/.test(text)
}

async function probeAndCreateResource(readableStream) {
	const { stream, type } = await Voice.demuxProbe(readableStream);
    console.log(type);
	return createAudioResource(stream, { inputType: type });
}

const playYoutubeAudio = async (message, trackInfo) => {
    const guildId = message.guildId
    let voice_connection = Voice.getVoiceConnection(guildId);
    if(!voice_connection){
        voice_connection = await join_channel(message)
    }
    let source = trackInfo.original_url
    if (!source) return;
    const srch = !isLink(source)
    let inf = await getytlp_info(source, srch);
    // let file_info = await downloadFile(url)
    if (srch){
        inf = inf.entries[0]
    }
    let url = inf.url;
    const resource = Voice.createAudioResource(url, {
    })
    servers[guildId].player.play(resource);
    const sub = voice_connection.subscribe(servers[guildId].player);
    
    
    
};

module.exports = {
    playYoutubeAudio,
    initialize,
    leave_channel,
    queueTrack,
    getQueueAsText,
    dequeueTrack
};
