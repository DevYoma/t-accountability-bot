const express = require('express');
const router = express.Router();
const supabase = require('../supabase/client');

// POST /register
router.post('/register', async (req, res) => {
  const { telegram_id, fullname, username } = req.body;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id)
    .single();

  if (data) return res.status(200).json({ message: 'User already exists' });
  // using 200 above because i want to see if re-registration should be optional

  const { error: insertError } = await supabase.from('users').insert([
    { telegram_id, fullname, username, points: 0, streak: 0 },
  ]);

  if (insertError) return res.status(500).json({ error: insertError.message });
  res.status(201).json({ message: 'User registered successfully' });
});

module.exports = router;
