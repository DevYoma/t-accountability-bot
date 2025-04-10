const express = require('express');
const router = express.Router();
const supabase = require('../supabase/client');
const { DateTime } = require('luxon');

// POST /wins
router.post('/wins', async (req, res) => {
  //  console.log('Received data:', req.body);   
  const { telegram_id, wins } = req.body;
  const today = DateTime.now().toISODate();
  console.log(req.body.wins.length);

  if (!wins || !Array.isArray(wins) || wins.length === 0 || wins.length > 5) {
    return res.status(400).json({
      error: 'Please submit between 1 to 5 wins only.',
    });
  }

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegram_id)
    .single();

  if (!user) return res.status(404).json({ error: 'User not found' });

  const { data: existing, error: winErr } = await supabase
    .from('wins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .single();

  if (existing) return res.status(400).json({ error: 'Wins already submitted today' });

  // Check streak
  const yesterday = DateTime.now().minus({ days: 1 }).toISODate();
  const { data: yesterdayWin } = await supabase
    .from('wins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', yesterday)
    .single();

  const newStreak = yesterdayWin ? user.streak + 1 : 1;
  const newPoints = user.points + 10; // 10 marks for streak

  const { error: insertErr } = await supabase.from('wins').insert([
    { user_id: user.id, wins, date: today, completed: true },
  ]);

  if (insertErr) return res.status(500).json({ error: insertErr.message });

  await supabase
    .from('users')
    .update({ streak: newStreak, points: newPoints })
    .eq('id', user.id);

  res.status(200).json({ message: 'Wins submitted and streak updated' });
});

module.exports = router;
