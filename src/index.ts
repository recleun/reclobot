import { Client, GatewayIntentBits, Events, Collection, SlashCommandBuilder, Routes, REST, EmbedBuilder } from 'discord.js';
import { Sequelize } from 'sequelize';
import fs from 'node:fs';
import path from 'node:path';
import url from 'url'
import { Reclient, Recmodal, Recommand, Reconfig, Recamodel } from './types';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const configPath = path.join(process.cwd(), 'config.json');
const config: Reconfig = JSON.parse(fs.readFileSync(configPath).toString());
const resetCommands = process.argv[2] == config.options.resetCommandName;

const rest = new REST().setToken(config.token);
const client: Reclient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
client.commands = new Collection();
client.modals = new Collection();
client.sequelize = new Sequelize({ dialect: 'sqlite', storage: 'data/database.sqlite', logging: console.log });

//#region database loading
const datamodelsFolderPath = path.join(__dirname, 'datamodels');
const datamodelFiles = fs.readdirSync(datamodelsFolderPath);
let totalMissedDatamodels = 0;

for (const [i, file] of Object.entries(datamodelFiles)) {
    console.log(`[DB] Loading ${file} (${parseInt(i)+1}/${datamodelFiles.length})`);
    try {
        const datamodel: Recamodel = (await import(`./datamodels/${file}`)).default;
        await datamodel.run(client);
    } catch (error) {
        totalMissedDatamodels += 1;
        console.warn(`[DB-ERR] Failed to load ${file}`);
        console.error(error);
    }
}
//#endregion

//#region command loading
let commands: Array<SlashCommandBuilder> = [];
const commandsFolderPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsFolderPath);
let totalMissedCommands = 0;

for (const folder of commandFolders) {
    const folderPath = path.join(commandsFolderPath, folder)
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    for (const [i, file] of Object.entries(commandFiles)) {
        console.log(`[CMD] Loading ${file} (${parseInt(i)+1}/${commandFiles.length})`);
        try {
            const command: Recommand = (await import(`./commands/${folder}/${file}`)).default;
            if (resetCommands) commands.push(command.data);
            client.commands.set(command.data.name, command);
        } catch (error) {
            totalMissedCommands += 1;
            console.log(`[CMD-ERR] Failed to load ${file}`);
            console.error(error);
        }
    }
}

console.log(`[CMD] Finished loading all commands (Total missed commands: ${totalMissedCommands})`);
//#endregion

//#region modal loading
const modalsFolderPath = path.join(__dirname, 'modals');
const modalFiles = fs.readdirSync(modalsFolderPath);
let totalMissedModals = 0;

for (const [i, file] of Object.entries(modalFiles)) {
    console.log(`[MODAL] Loading ${file} (${parseInt(i)+1}/${modalFiles.length})`);
    try {
        const modal: Recmodal = (await import(`./modals/${file}`)).default;
        client.modals.set(modal.name, modal);
    } catch (error) {
        totalMissedModals += 1;
        console.warn(`[MODAL-ERR] Failed to load ${file}`);
        console.error(error);
    }
}

console.log(`[MODAL] Finished loading all modals (Total missed modals: ${totalMissedModals})`);
//#endregion

//#region resetting commands
if (resetCommands) {
    try {
        if (config.options.developmentMode) {
            rest.put(Routes.applicationGuildCommands(config.appId, config.guilds.developmentGuildId), { body: [] })
                .then(() => { console.log('Emptied current test commands.') });
            rest.put(Routes.applicationGuildCommands(config.appId, config.guilds.developmentGuildId), { body: commands })
                .then(() => { console.log('Registered current test commands.') });
        } else {
            rest.put(Routes.applicationCommands(config.appId), { body: [] })
                .then(() => { console.log('Emptied current global commands.') });
            rest.put(Routes.applicationCommands(config.appId), { body: commands })
                .then(() => { console.log('Registered current global commands.') });
        }
    } catch (error) {
        console.error(error);
    }
}
//#endregion

//#region discord.js events
client.once(Events.ClientReady, async () => {
    const developmentGuild = await client.guilds.fetch(config.guilds.developmentGuildId);
    const logChannel = await developmentGuild.channels.cache.get(config.channels.logs);
    if (logChannel.isTextBased()) await logChannel.send({
        embeds: [ new EmbedBuilder()
            .setTitle('Testing Session Started')
            .setDescription(`Started at: <t:${Math.round(Date.now() / 1000)}:f>`)
            .setColor(0x5a81dd) ]
    });
    console.log('[STATUS] Online as:', client.user.tag);
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
        try {
            const command = client.commands.get(interaction.commandName);
            if (command) {
                await command.execute(client, interaction);
            } else {
                await interaction.reply({ content: '`[Error: 404]:` Command couldn\'t be executed.', ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occured while processing your command. Please contact server owner or <@781580532131299360>', ephemeral: true });
        }
    } else if (interaction.isModalSubmit()) {
        try {
            const customId = interaction.customId.split('_');
            console.log(customId);
            const modal = client.modals.get(customId[0]);
            if (modal) {
                await modal.execute(client, interaction, customId[1]);
            } else {
                await interaction.reply({ content: '`[Error: 404]:` Modal couldn\'t be submitted.', ephemeral: true });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occured while processing your submission. Please contact server owner or <@781580532131299360>', ephemeral: true });
        }
    } else {
        console.warn('Unknown interaction occured: ', interaction);
    }
});
//#endregion

//#region error handling
process.on("unhandledRejection", async (error: Error | any, p: Promise<any>) => {
    console.error(error, p);
    const developmentGuild = await client.guilds.fetch(config.guilds.developmentGuildId);
    const errorChannel = await developmentGuild.channels.fetch(config.channels.errors);
    if (errorChannel.isTextBased()) await errorChannel.send({
        embeds: [ new EmbedBuilder()
            .setTitle('Testing Session Ended')
            .setDescription('An unhandled rejection has occured.')
            .setColor(0x5a81dd) ]
    });
    process.exit(7);
});

process.on("uncaughtException", async (error) => {
    console.error('Exiting due to uncaught exception: ', error);
    const developmentGuild = client.guilds.cache.get(config.guilds.developmentGuildId);
    const errorChannel = developmentGuild.channels.cache.get(config.channels.errors);
    if (errorChannel.isTextBased()) await errorChannel.send({
        embeds: [ new EmbedBuilder()
            .setTitle('Testing Session Ended')
            .setDescription('An uncaught exception has occured.')
            .setColor(0x5a81dd) ]
    });
    process.exit(7);
});
//#endregion

client.login(config.token);
