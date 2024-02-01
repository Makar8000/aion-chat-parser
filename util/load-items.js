const fetch = require('node-fetch');
const he = require('he');
const fs = require('fs');
const path = require('path');

const TYPES = [
  'weapon',
  'armor',
  'accessory',
  'wing',
  'skillrelated',
  'making',
  'consumable',
];

const loadGear = async () => {
  const masterData = {};
  const delay = 4000;

  for (const type of TYPES) {
    const items = await fetchItems(type);
    items.forEach(rec => {
      const data = {
        id: rec[0],
        url: `https://aioncodex.com/usc/item/${rec[0]}/`,
        name: he.decode(rec[2].match(/<b>(?<name>.+)<\/b>/)?.groups?.name),
      };
      data.markupLink = `[<${data.name}>](${data.url})`;
      masterData[`${data.id}`] = data;
    });
    await timeout(delay);
  }

  fs.writeFileSync(path.join(__dirname, '../data/items.json'), JSON.stringify(masterData, null, 2));
  return;
};

const fetchItems = async (type) => {
  const url = new URL('https://aioncodex.com/query.php');
  url.searchParams.set('l', 'usc');
  url.searchParams.set('a', type);
  url.searchParams.set('_', timestamp());

  const response = await fetch(url);
  const json = await response?.json();
  return json?.aaData;
};


const timestamp = () => Math.floor(Date.now() / 1000);
const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

loadGear();