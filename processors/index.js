const lfgProcessor = require('./lfg');
const items = require('../data/items.json');
const itemsOverride = require('../data/items-custom.json');

Object.keys(itemsOverride).forEach(key => items[key] = itemsOverride[key]);

const REG = {
  COMMON: [
    { regex: /\[cmd:(?<charname>[^;\]]+)[^\]]*\]/g, replace: '<Recruit Group>' },
    // { regex: /\[item: ?(?<itemId>[^;\]]+)[^\]]*\]/g, replace: '<https://aioncodex.com/usc/item/$1/>' },
  ],
  ITEM: /(?<item>\[item: ?(?<itemId>[^;\]]+)[^\]]*\])/g,
};

const processLine = async (line) => {
  const parsedLine = parseAionMessage(line);
  lfgProcessor(parsedLine);
};

const parseAionMessage = msg => {
  let ret = msg.substring(22);
  REG.COMMON.forEach(r => {
    ret = ret.replaceAll(r.regex, r.replace);
  });
  for (const match of ret.matchAll(REG.ITEM)) {
    const id = match?.groups?.itemId;
    const markup = items[id]?.markupLink ?? `[<UnknownItem ${id}>](https://aioncodex.com/usc/item/${id}/)`;
    ret = ret.replaceAll(match?.groups?.item, markup);
  }
  return ret;
};

process.stdin.on('keypress', (_ch, key) => {
  if (key && key.name == 'r') {
    console.log('Refreshing override items...');
    fetch('https://raw.githubusercontent.com/Makar8000/aion-chat-parser/main/data/items-custom.json')
      .then(data => data.json())
      .then(json => {
        Object.keys(json).forEach(k => items[k] = itemsOverride[k]);
        console.log('Override items refreshed.');
      });
  }
});

module.exports = {
  processLine,
  parseAionMessage,
};