const Pushover = require('pushover-notifications');
const pushoverToken = {
  user: process.env.PUSHOVER_USER,
  token: process.env.PUSHOVER_TOKEN,
};
const push = pushoverToken ? new Pushover(pushoverToken) : null;

const sendPushover = (msg, callback) => {
  if (!push) {
    console.error('No pushover secrets set.');
    return;
  }

  let message = {
    message: 'Notification relating to Aion!',
    title: 'Aion Notification',
    sound: 'peace',
    // sound: 'bigadventure',
    priority: 2,
    retry: 45,
    expire: 60 * 5,
  };

  if (msg) { message = { ...message, ...msg }; }

  push.send(message, callback ? callback : (err, result) => {
    if (err) { console.error(err); }
    console.log(result);
  });
  console.log('Sent Pushover: ' + JSON.stringify(message));
};

module.exports = {
  sendPushover,
};