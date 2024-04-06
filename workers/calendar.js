const db = require('../server/database');
const quotes = require('../quotes.json');

class Event {

    id;
    author;
    timestamp;
    title;
    guild;
    channel;
    mentions;

    constructor(author, timestamp, title, guild, channel, mentions) {
        this.author = author;
        this.timestamp = timestamp;
        this.title = title;
        this.guild = guild;
        this.channel = channel;
        this.mentions = mentions;
    }

    async Save() {
        const id = await db.addEvent(this.title, this.author, this.timestamp, this.guild, this.channel, this.mentions);
        this.id = id;
    }

    async Cancel() {
        await db.removeEvent(this.id);
        return true;
    }

}

module.exports = {

    client: null,
    events: [],

    async init() {
        await this.loadEvents();
        this.loop();
        setInterval(this.loop.bind(this), 60_000);
    },

    async loop() {
        const now = Math.floor(Date.now() / 1000);
        this.events.forEach(async (entry, index) => {
            if(entry.timestamp < now){
                const channel = await this.client.channels.cache.get(entry.channel);
                await channel.send({
                    content: `⏰ Reminder for <@${entry.author}>${entry.mentions.length > 0 ? ' ' + entry.mentions : ''}\n## ${entry.title}`
                });

                await entry.Cancel();
                this.events.splice(index, 1);
                delete entry;
            }
        });

        if(Math.random() < 0.1){
            const quote = quotes[Math.floor(Math.random() * quotes.length)];
            if(Array.isArray(quote)){
                const types = { playing: 0, streaming: 1, listening: 2, watching: 3, custom: 4, competing: 5 };
                this.client.user.setPresence({
                    activities: [{ name: quote[1], type: types[quote[0]] }],
                    status: 'online',
                });
            }else{
                this.client.user.setPresence({
                    activities: [{ name: quote, type: 4 }],
                    status: 'online',
                });
            }
        }
    },

    async loadEvents() {
        const events = await db.fetchEvents();
        events.forEach(row => {
            const entry = new Event(row.author, row.timestamp, row.title, row.guild, row.channel, row.mentions);
            entry.id = row.id;
            this.events.push(entry);
        })
    },

    async addEvent(author, timestamp, title, guild, channel, mentions) {
        const entry = new Event(author, timestamp, title, guild, channel, mentions);
        await entry.Save();
        this.events.push(entry);
        return entry;
    },

    async cancelEvent(id) {
        this.events.forEach(async (entry, index) => {
            if(entry.id == id){
                await entry.Cancel();
                this.events.splice(index, 1);
                delete entry;
            }
        });
    },

    async getAgenda(author) {
        let agenda = [];
        this.events.forEach(entry => {
            if(entry.author == author){
                agenda.push(entry);
            }
        });
        return agenda;
    }

}