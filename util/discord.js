const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const sendChannelMessage = async (channelId, body) => {
  try {
    const response = await rest.post(Routes.channelMessages(channelId), { body });
    return response;
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports = {
  sendChannelMessage,
};
