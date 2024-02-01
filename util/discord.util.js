const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const sendChannelMessage = async (channelId, body) => {
  try {
    const response = await rest.post(Routes.channelMessages(channelId), { body });
    // fastify.log.info(`Sent content to channel <#${channelId}>`, body, response);
    return response;
  } catch (error) {
    // fastify.log.error(`Error sending content to channel <#${channelId}>`, body);
    return null;
  }
};

module.exports = {
  sendChannelMessage,
};
