require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const usersRoute = require('./routes/users');
const winsRoute = require('./routes/wins');
const leaderboardRoute = require('./routes/leaderboard')
const scoreRoute = require('./routes/score');
const TelegramBot = require('node-telegram-bot-api');

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Set the webhook URL for Telegram to send updates to your Render app
const webhookUrl = `https://t-accountability-bot.onrender.com/bot`;  // Replace with your Render URL
bot.setWebHook(webhookUrl);

// Add this before app.listen()
app.post('/bot', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.use('/api/users', usersRoute);
app.use('/api/wins', winsRoute);
app.use('/api/leaderboard', leaderboardRoute)
app.use('/api/score', scoreRoute)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start the bot
require('./bot');
