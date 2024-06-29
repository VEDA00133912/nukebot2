const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require(path.join(__dirname, '..',　'..', 'config.json')); 
const token = process.env.token;

const commands = [];

const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, '..', 'commands', file));
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(config.clientId),  
            { body: commands },
        );

        console.log(`${commands.length} 個のコマンドを登録しました`);
    } catch (error) {
        console.error(error);
    }
})();