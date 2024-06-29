const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('ping'),
  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setColor('ff0000')
      .setTitle('ping :ping_pong:')
      .setDescription('Ping値')
      .setTimestamp()
      .setFooter({ text:'BOT | Ping'})
      .addFields(
        { name: 'WebSocket Ping', value: `${interaction.client.ws.ping}ms`, inline: true },
        { name: 'API-Endpoint Ping', value: `${Date.now() - interaction.createdTimestamp}ms`, inline: true },
        );

    try {
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.log("ping error");
      await interaction.reply('エラーが発生しました')
    }
  },
};