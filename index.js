require('json5/lib/register');
const dotenv = require('dotenv');
dotenv.config();

const readline = require('readline');
const TailFile = require('@logdna/tail-file');
readline.emitKeypressEvents(process.stdin);

const { processLine } = require('./processors');

async function startTail() {
  const tail = new TailFile(process.env.LOG_FILE)
    .on('tail_error', (err) => {
      console.error('TailFile had an error!', err);
    });

  try {
    await tail.start();
    const linesplitter = readline.createInterface({
      input: tail,
    });

    let last = '';
    const charNameRegExp = /\[charname:(?<charname>[^;\]]+)[^\]]*\]/g;
    linesplitter.on('line', (line) => {
      line = line.replaceAll(charNameRegExp, '$1');
      if (line === last) {
        return;
      }
      last = line;

      console.log(line);
      processLine(line);
    });
  } catch (err) {
    console.error('Cannot start.  Does the file exist?', err);
  }
}

startTail().catch((err) => {
  process.nextTick(() => {
    throw err;
  });
});

process.stdin.on('keypress', (_ch, key) => {
  if (key && key.ctrl && key.name == 'c') {
    console.log('Closing...');
    process.exit(0);
  }
});

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
}