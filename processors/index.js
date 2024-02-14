const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const lfgProcessor = require('./lfg');
const items = require('../data/items.json');
const itemsOverride = require('../data/items-custom.json');

Object.keys(itemsOverride).forEach(key => items[key] = itemsOverride[key]);
const git = simpleGit();

const REG = {
  COMMON: [
    { regex: /\[cmd:(?<charname>[^;\]]+)[^\]]*\]/g, replace: '<Recruit Group>' },
    // { regex: /\[item: ?(?<itemId>[^;\]]+)[^\]]*\]/g, replace: '<https://aioncodex.com/usc/item/$1/>' },
  ],
  ITEM: /(?<item>\[item: ?(?<itemId>[^;\]]+)[^\]]*\])/g,
};

const processLine = async (line) => {
  const parsedLine = await parseAionMessage(line);
  lfgProcessor(parsedLine);
};

const parseAionMessage = async (msg) => {
  let ret = msg.substring(22);
  REG.COMMON.forEach(r => {
    ret = ret.replaceAll(r.regex, r.replace);
  });
  for (const match of ret.matchAll(REG.ITEM)) {
    const id = match?.groups?.itemId;
    if (!items[id]?.markupLink) {
      await parseUnknownItem(id);
    }
    const markup = items[id]?.markupLink ?? `[<UnknownItem ${id}>](https://aioncodex.com/usc/item/${id}/)`;
    ret = ret.replaceAll(match?.groups?.item, markup);
  }
  return ret;
};

const parseUnknownItem = async itemId => {
  const ret = {
    id: Number.parseInt(itemId),
    url: `https://aioncodex.com/usc/item/${itemId}/`,
    name: `UnknownItem ${itemId}`,
    markupLink: `[<UnknownItem ${itemId}>](https://aioncodex.com/usc/item/${itemId}/)`,
  };

  try {
    await fetch(`https://aioncodex.com/usc/item/${itemId}/`)
      .then(res => res.text())
      .then(body => {
        const match = body.match(/<title>(?<title>[^<]*)<\/title>/);
        if (typeof match?.groups?.title !== 'string')
          return;

        ret.name = match.groups.title.replace(" - Aion Codex", "").trim();
        ret.markupLink = `[<${ret.name}>](https://aioncodex.com/usc/item/${itemId}/)`;
        updateItem(itemId, ret);

        return;
      });
  } catch (e) {
    console.error(e);
  }

  return ret;
};

const updateItem = (itemId, data) => {
  itemsOverride[`${itemId}`] = data;
  items[`${itemId}`] = data;

  const filePath = path.join(__dirname, '../data/items-custom.json');
  fs.writeFileSync(filePath, JSON.stringify(itemsOverride, null, 2));
  git.add(filePath)
    .then(() => git.commit(`Add ${data.name}`))
    .then(() => git.pull({ '--rebase': 'true' }))
    .then(() => git.push());
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