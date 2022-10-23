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
let trackQueue = [];
const player = Voice.createAudioPlayer();
let trackPlayingNow = false;
const getytlp_info = async (url, isSearch) => {
    let info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        defaultSearch: isSearch ? "ytsearch" : null,
        preferFreeFormats: true,
        addHeader: ["referer:youtube.com", "user-agent:googlebot"],
        format: "bestaudio",
    });
    return info
};

FFMPEG_OPTIONS = {
    before_options: "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
    options: "-vn",
};

const leave_channel = async (guild_id) => {
    let voiceConnection = Voice.getVoiceConnection(guild_id);
    if (!voiceConnection) return;
    player.stop();
    voiceConnection.destroy()
    trackQueue = []
    trackPlayingNow = false;
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
const getQueueAsText = () => {
    let out = `Track queue: \n`
    trackQueue.forEach((value, index) => {
        out += `${index + 1}) ${value.source} \n`
    })
    return out;
}

const queueTrack = async (message, source) => {
    if(trackQueue.length == 0 && !trackPlayingNow){
        trackQueue.push({message, source})
        dequeueTrack()
    }
    else{
        trackQueue.push({message, source})
    }
    
    
};

const popTrackQueue = () => {
    if(trackQueue.length == 0) return null;
    let poppedTrack = trackQueue[0];
    trackQueue = trackQueue.slice(1, trackQueue.length)
    return poppedTrack
}

const dequeueTrack = async () => {
    let poppedTrack = popTrackQueue()
    if(!poppedTrack) return
    playYoutubeAudio(poppedTrack.message, poppedTrack.source)
}

const isLink = (text) => {
    return /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/.test(text)
}

const playYoutubeAudio = async (message, source) => {
    let voice_connection = Voice.getVoiceConnection(message.guildId);
    if(!voice_connection){
        voice_connection = await join_channel(message)
    }
    
    if (!source) return;
    const srch = !isLink(source)
    let inf = await getytlp_info(source, srch);
    // let file_info = await downloadFile(url)
    if (srch){
        inf = inf.entries[0]
    }
    let url = inf.url;
    const map = new Map();
    const stream = got.stream(url, {
        cache: map
    });
    const type = Voice.StreamType.WebmOpus
    // const stream = fs.createReadStream(file_info.filename)
    const resource = Voice.createAudioResource(stream, {
        inputType: type
    })
    player.play(resource);
    const subscription = voice_connection.subscribe(player);
    // if (subscription) {
    //     // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
    //     setTimeout(() => subscription.unsubscribe(), 5_000);
    // }
    player.once(Voice.AudioPlayerStatus.Playing, () => {
        trackPlayingNow = true;
    })
    player.once(Voice.AudioPlayerStatus.Idle, () => {
        trackPlayingNow = false;
        dequeueTrack()
    })
    
};

module.exports = {
    playYoutubeAudio,
    leave_channel,
    queueTrack,
    getQueueAsText,
    dequeueTrack
};
