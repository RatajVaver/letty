const { Events, ActivityType } = require('discord.js');
const calendar = require('../workers/calendar.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		console.log(`Ready! Logged in as ${client.user.tag}`);

		calendar.client = client;
		calendar.init();

		client.user.setPresence({
			activities: [{ name: 'your commands 🧐', type: ActivityType.Listening }],
			status: 'online',
		});
	},
};
