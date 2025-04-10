const express = require('express');
const router = express.Router();
const supabase  = require('../supabase/client');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users') // or 'leaderboard' if you're using a separate table
      .select('fullname, points')
      .order('points', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
