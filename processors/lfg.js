const fs = require('fs');
const path = require('path');
const JSON5 = require('json5');
const discord = require('../util/discord');
const { sendPushover } = require('../util/pushover');

let wtbConfig = JSON5.parse(fs.readFileSync(path.join(__dirname, '../config/wtb.jsonc'))).filter(c => c.enabled);
let bannedWords = JSON5.parse(fs.readFileSync(path.join(__dirname, '../config/banned.jsonc'))).filter(c => c.enabled);
bannedWords.forEach(r => r.regexp = new RegExp(r.regex, r.flags));

const processLine = async (originalLine) => {
  let line = `${originalLine}`;
  if (!line.startsWith('[3.LFG] ')) {
    return;
  }
  for (const bannedWord of bannedWords) {
    if (bannedWord.regexp.test(line)) {
      return;
    }
  }
  line = line.substring(8);

  let msg = `[<t:${Math.floor(Date.now() / 1000)}:T>] ${line}`;
  msg = parseWtbNotif(msg);
  const resp = await discord.sendChannelMessage(process.env.LFG_THREAD_ID, {
    content: msg,
  });

  return resp;
};

const parseWtbNotif = (line) => {
  let prefix = '';
  for (const config of wtbConfig) {
    const foundItems = config.items.filter(item => line.includes(`item/${item}`) || line.includes(`item:${item}`));
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

process.stdin.on('keypress', (_ch, key) => {
  if (key && key.name == 'r') {
    console.log('Refreshing WTB items...');
    fetch('https://raw.githubusercontent.com/Makar8000/aion-chat-parser/main/config/wtb.jsonc')
      .then(data => data.text())
      .then(json => {
        wtbConfig = JSON5.parse(json).filter(c => c.enabled);
        console.log('WTB items refreshed.', wtbConfig);
      });
    console.log('Refreshing banned words...');
    fetch('https://raw.githubusercontent.com/Makar8000/aion-chat-parser/main/config/banned.jsonc')
      .then(data => data.text())
      .then(json => {
        bannedWords = JSON5.parse(json).filter(c => c.enabled);
        bannedWords.forEach(r => r.regexp = new RegExp(r.regex, r.flags));
        console.log('Banned words refreshed.', bannedWords);
      });
  }
});

module.exports = processLine;