const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { dbPath } = require('../config.json');

module.exports = {

    async connect() {
        return open({
            filename: dbPath,
            driver: sqlite3.Database
        })
    },

    async addEvent(title, author, timestamp, guild, channel, mentions) {
        const db = await this.connect();
        const result = await db.run("INSERT INTO events (title,author,timestamp,guild,channel,mentions) VALUES (?,?,?,?,?,?)", title, author, timestamp, guild, channel, mentions);
        await db.close();
        return result.lastID;
    },

    async removeEvent(id) {
        const db = await this.connect();
        await db.run("DELETE FROM events WHERE id = ?", id);
        await db.close();
        return true;
    },

    async fetchEvents() {
        const db = await this.connect();
        const result = await db.all('SELECT * FROM events');
        await db.close();
        return result;
    },

}
