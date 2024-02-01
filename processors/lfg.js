const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');
const discord = require('../util/discord');
const { sendPushover } = require('../util/pushover');

const wtbConfig = JSON5.parse(fs.readFileSync(path.join(__dirname, '../config/wtb.jsonc'))).filter(c => c.enabled);

const processLine = async (originalLine) => {
  let line = `${originalLine}`;
  if (!line.startsWith('[3.LFG] ')) { return; }
  line = line.substring(8);

  let msg = `[<t:${Math.floor(Date.now() / 1000)}:T>] ${line}`;
  msg = parseWtbNotif(msg);
  const resp = await discord.sendChannelMessage(process.env.THREAD_ID, {
    content: msg,
  });

  return resp;
};

const parseWtbNotif = (line) => {
  let prefix = '';
  for (const config of wtbConfig) {
    const foundItems = config.items.filter(item => line.includes(`aioncodex.com/usc/item/${item}`));
    if (foundItems.length > 0) {
      prefix = `${prefix}<@${config.userId}>`;
      if (config.push) {
        sendPushover({
          title: 'Aion LFG Item Notification',
          message: line,
        });
      }
    }
  }
  if (prefix.length > 0) {
    return `${prefix}\n${line}`;
  }
  return line;
};

module.exports = processLine;