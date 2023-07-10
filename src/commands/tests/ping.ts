import { ChatInputCommandInteraction, Client, SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s ping.'),

    execute: async (client: Client, interaction: ChatInputCommandInteraction) => {
        await interaction.reply(`${client.ws.ping}ms`);
    }
}
