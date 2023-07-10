import { ModalSubmitInteraction } from "discord.js"
import { Reclient } from "../types"

export default {
    name: 'test-modal',
    execute: async (client: Reclient, interaction: ModalSubmitInteraction, data: string) => {
        await interaction.reply('Test modal recieved successfully.');
    }
}
