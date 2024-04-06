const { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const chrono = require('chrono-node');
const calendar = require('../../workers/calendar');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('Sets a reminder for a specific date and time.')
        .addStringOption(option =>
            option.setName('date').setDescription('Date and time (Chrono format)').setRequired(true))
        .addStringOption(option => 
            option.setName('title').setDescription('Title and description of the event').setRequired(true))    
        .addStringOption(option => 
            option.setName('mentions').setDescription('Mentions'))
        .addChannelOption(option =>
            option.setName('channel').setDescription('Channel (uses the current channel if not specified)')),
	async execute(interaction) {
        const response = await interaction.deferReply({ ephemeral: false });

        const date = interaction.options.getString('date');
        const title = interaction.options.getString('title');
        const mentions = interaction.options.getString('mentions') ?? '';
		const channel = interaction.options.getChannel('channel') ?? interaction.channel;

        if(!channel){
            await interaction.editReply({ content: 'This command has to be used in a channel!' });
            return;
        }

        let parsed = chrono.parseDate(date);
        if(!parsed){
            await interaction.editReply({ content: "I don't understand this format, please try again!" });
            return;
        }

        let timestamp = parseInt((parsed.getTime() / 1000).toFixed(0));

        const event = await calendar.addEvent(interaction.user.id, timestamp, title, interaction.guild.id, channel.id, mentions);

        const cancel = new ButtonBuilder()
			.setCustomId('cancel')
			.setLabel('Cancel')
			.setStyle(ButtonStyle.Danger);

		const row = new ActionRowBuilder()
			.addComponents(cancel);

        const eventConfirmation = `⏰ Reminder set for ${interaction.user}${mentions.length > 0 ? ' ' + mentions : ''}!\nI'll remind you \`${title}\` <t:${event.timestamp}:R> in <#${channel.id}>.`;

        await interaction.editReply({
            content: eventConfirmation,
            components: [ row ]
        });

        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
            if (confirmation.customId === 'cancel') {
                await calendar.cancelEvent(event.id);
                await confirmation.update({
                    content: 'Reminder has been cancelled!',
                    components: []
                });
            }
        } catch (e) {
            await interaction.editReply({
                content: eventConfirmation,
                components: []
            });
        }
	}
};
