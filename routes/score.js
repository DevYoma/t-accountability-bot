const express = require('express');
const router = express.Router();
const supabase  = require('../supabase/client');

router.post('/', async (req, res) => {
  const { telegram_id } = req.body;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('points, streak')
      .eq('telegram_id', telegram_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ points: data.points, streak: data.streak });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;