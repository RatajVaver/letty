const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const calendar = require('../../workers/calendar');

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('agenda')
		.setDescription('Lists your planned events.')
        .addBooleanOption(option => 
            option.setName('secret').setDescription('Show only to myself').setRequired(false)),
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: interaction.options.getBoolean('secret') ?? false });

        const events = await calendar.getAgenda(interaction.user.id);

        const embed = new EmbedBuilder().setColor(0x0099FF);
        if(events.length > 0){
            events.forEach(entry => {
                embed.addFields(
                    { name: 'ID', value: entry.id.toString(), inline: true },
                    { name: 'Title', value: entry.title.length > 53 ? entry.title.substring(0, 50) + '..' : entry.title, inline: true },
                    { name: '⏰', value: `<t:${entry.timestamp}:R>`, inline: true },
                );
            });
        }else{
            embed.setDescription("You have no planned events!");
        }

        await interaction.editReply({
            content: `Sending planned events for ${interaction.user}`,
            embeds: [ embed ]
        });
	}
};
