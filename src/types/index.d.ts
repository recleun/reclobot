import { ChatInputCommandInteraction, Client, Collection, ModalSubmitInteraction, SlashCommandBuilder } from 'discord.js';
import { Sequelize } from 'sequelize';

export interface Reconfig {
    token: string,
    appId: string,
    guilds: {
        developmentGuildId: string,
        specifiedGuildId?: string
    },
    options: {
        useSpecifiedGuildOnly?: boolean,
        developmentMode?: boolean,
        resetCommandName: string,
    },
    channels: {
        logs: string,
        errors: string
    }
}

export interface Reclient extends Client {
    commands?: Collection<String, Recommand>;
    modals?: Collection<String, Recmodal>;
    sequelize?: Sequelize;
}

export type Recommand = {
    data: SlashCommandBuilder;
    execute(client: Client, interaction: ChatInputCommandInteraction): void;
}

export type Recmodal = {
    name: string;
    execute(client: Client, interaction: ModalSubmitInteraction, data: string): void;
}

export type Recamodel = {
    run(client: Reclient): void;
}
