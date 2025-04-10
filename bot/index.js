require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
// console.log(bot);
console.log("Bot started. use the /start command to get started")

const userStates = {}; 

bot.onText(/\/start/, async (msg) => {
  const { id: telegram_id, first_name, username } = msg.from;

  try {
    await axios.post('http://localhost:3000/api/users/register', {
      telegram_id,
      fullname: first_name,
      username,
    });
  
    // Set state to "awaiting_wins"
    userStates[telegram_id] = { step: 'awaiting_wins' };
  
     bot.sendMessage(msg.chat.id, `Welcome, ${first_name}! Let's start tracking your wins 🎉`);
    bot.sendMessage(
      msg.chat.id,
      `To begin, please submit your wins for today by typing /win.`
    );
  } catch (error) {
    const message = error.response?.data?.error || "Something went wrong";    
    bot.sendMessage(msg.chat.id, `❌ ${message}`)
  }
});

// bot.onText(/\/win (.+)/, async (msg, match) => {
//   const { id: telegram_id } = msg.from;
//   const winsText = match[1];
//   const wins = winsText.split(',').map(w => w.trim());

//   console.log('Sending to backend:', { telegram_id, wins });

//   try {
//     await axios.post('http://localhost:3000/api/wins/wins', { // change this to "/" on routeController handler
//       telegram_id,
//       wins,
//     });
//     bot.sendMessage(msg.chat.id, `✅ Wins logged! Streak and points updated.`);
//   } catch (err) {
//     const message = err.response?.data?.error || 'Something went wrong.';
//     bot.sendMessage(msg.chat.id, `❌ ${message}`);
//   }
// });

bot.onText(/\/win/, (msg) => {
  const { id: telegram_id } = msg.from;

  // Set state to waiting_for_win_text
  userStates[telegram_id] = { step: 'waiting_for_win_text' };

  bot.sendMessage(
    msg.chat.id,
    `Great! What did you accomplish today? List your wins separated by commas.\n\nFor example: "Completed a task, Finished my workout, Read a chapter of a book"`
  );
});

// --- Handle free text messages (for logging wins) ---
bot.on('message', async (msg, match) => {
  const { id: telegram_id } = msg.from;
  const text = msg.text;

  // If user is in win-logging step and this isn't a command
  if (userStates[telegram_id]?.step === 'waiting_for_win_text' && !text.startsWith('/')) {
    const wins = text.split(',').map(w => w.trim());
     const winsText = match[1];

  // Early exit if empty
  if (!winsText || winsText.trim() === '') {
    return bot.sendMessage(msg.chat.id, `❌ Please provide at least one win.`);
  }

  // const wins = winsText.split(',').map(w => w.trim()).filter(w => w.length > 0);

  if (wins.length === 0) {
    return bot.sendMessage(msg.chat.id, `❌ Please provide valid wins.`);
  }

  if (wins.length > 5) {
    return bot.sendMessage(msg.chat.id, `❌ You can only submit up to 5 wins at a time.`);
  }



    try {
      await axios.post('http://localhost:3000/api/wins/wins', {
        telegram_id,
        wins,
      });

      bot.sendMessage(msg.chat.id, `✅ Wins logged! Streak and points updated.`);
    } catch (err) {
      const message = err.response?.data?.error || 'Something went wrong.';
      bot.sendMessage(msg.chat.id, `❌ ${message}`);
    }

    // Reset state after handling
    delete userStates[telegram_id];
  }
});
