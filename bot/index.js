require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const ADMIN_IDS = [484849494, 985564566];

const baseUrl = process.env.BASE_URL;
// const apiUrl = `${baseUrl}/api/endpoint`; // example usage


// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
// console.log(bot);
console.log("Bot started. use the /start command to get started")

const userStates = {}; 

bot.onText(/\/start/, async (msg) => {
  const { id: telegram_id, first_name, username } = msg.from;

  try {
    await axios.post(`${baseUrl}/api/users/register`, {
      telegram_id,
      fullname: first_name,
      username,
    });
  
    // Set state to "awaiting_wins"
    userStates[telegram_id] = { step: 'awaiting_wins' };
  
     bot.sendMessage(msg.chat.id, `Welcome, ${first_name}! Let's start tracking your wins 🎉`);
    bot.sendMessage(
      msg.chat.id,
      `To begin, please submit your wins for today by typing /wins.`
    );
  } catch (error) {
    const message = error.response?.data?.error || "Some  thing went wrong";    
    bot.sendMessage(msg.chat.id, `❌ ${message}`)
  }
});

// getting my TELEGRAM id
bot.onText(/\/id/, (msg) => {
  bot.sendMessage(msg.chat.id, `Your Telegram ID is: ${msg.from.id}`);
}); 

bot.onText(/\/win/, (msg) => {
  const { id: telegram_id } = msg.from;

  // Set state to waiting_for_win_text
  userStates[telegram_id] = { step: 'waiting_for_win_text' };

  // bot.sendMessage(
  //   msg.chat.id,
  //   `Great! What did you accomplish today? List your wins separated by commas.\n\nFor example: Completed a task, Finished my workout, Read a chapter of a book`
  // );

  bot.sendMessage(
    msg.chat.id,
    `Great! What did you accomplish today? List your wins separated by commas.\n\nFor example: *Completed a task*, *Finished my workout*, *Read a chapter of a book*`,
    {
      parse_mode: 'Markdown', // Enables Markdown formatting
    }
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

  if (wins.length === 0) {
    return bot.sendMessage(msg.chat.id, `❌ Please provide valid wins.`);
  }

  if (wins.length > 5) {
    return bot.sendMessage(msg.chat.id, `❌ You can only submit up to 5 wins at a time.`);
  }

    try {
      await axios.post(`${baseUrl}/api/wins/wins`, {
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


// SCORE COMMAND TO USER DM
bot.onText(/\/score/, async (msg) => {
  const { id: telegram_id } = msg.from;

  try {
    // Call your backend to get user stats
    const response = await axios.post(`${baseUrl}/api/score`, {
      telegram_id,
    });

    const { points, streak } = response.data;

    
    const encouragements = [
      "Keep going, you're doing amazing! 💪",
      "You're on fire! 🔥",
      "One day at a time – proud of you! 🌱",
      "Consistency is key, and you’ve got it! 🔑",
      "Small wins make big results! 🚀",
      "Your future self is cheering for you! 🥳",
    ];  

    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

    bot.sendMessage(telegram_id, `🏆 Your current score is *${points}* points.\n🔥 Current streak: *${streak} days*\n\n${randomEncouragement}`, {
    parse_mode: 'Markdown',
  });
  } catch (err) {
    const message = err.response?.data?.error || 'Something went wrong fetching your score.';
    bot.sendMessage(telegram_id, `❌ ${message}`);
  }
});

// ADMIN COMMAND FOR LEADER BOARD
bot.onText(/\/leaderboard/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  // Check if user is an admin
  if (!ADMIN_IDS.includes(userId)) {
    return bot.sendMessage(chatId, '🚫 This command is for admins only.');
  }

  try {
    // Call your backend or Supabase to get top users
    const res = await axios.get(`${baseUrl}/api/leaderboard`);

    const leaderboard = res.data; // assume it's an array of { fullname, points }
    if (!leaderboard.length) {
      return bot.sendMessage(chatId, '🏆 No entries on the leaderboard yet!');
    }

    const formatted = leaderboard
      .map((user, index) => `${index + 1}. ${user.fullname} - ${user.points} pts`)
      .join('\n');

    bot.sendMessage(chatId, `🏆 *Leaderboard:*\n\n${formatted}`, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '❌ Failed to load leaderboard.');
  }
});