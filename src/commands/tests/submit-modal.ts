import { ActionRowBuilder, ChatInputCommandInteraction, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { Reclient } from "../../types";

export default {
    data: new SlashCommandBuilder()
        .setName('submit-modal')
        .setDescription('Submit a test modal.')
        .addStringOption(option => option
            .setName('modal-id')
            .setDescription('The customId of the modal.')
            .setRequired(true)
            .addChoices(
                { name: 'test-modal', value: 'test-modal_' },
                { name: 'undefined-modal', value: 'undefined-modal_' }
            )),

    execute: async (client: Reclient, interaction: ChatInputCommandInteraction) => {

        const textInput = new TextInputBuilder()
            .setCustomId('i1')
            .setLabel('First input')
            .setStyle(TextInputStyle.Short);

        const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(textInput);

        const modal = new ModalBuilder()
            .setCustomId(interaction.options.getString('modal-id'))
            .setTitle('Test Modal')
            .addComponents(actionRow);
        
        interaction.showModal(modal);
    }
}
