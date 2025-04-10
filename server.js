require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const usersRoute = require('./routes/users');
const winsRoute = require('./routes/wins');

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', usersRoute);
app.use('/api/wins', winsRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start the bot
require('./bot');
