const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const weeklyThemes = [
  'Monday Mirrorfit',
  'Tuesday Street Story',
  'Wednesday Color Clash',
  'Thursday Vintage Flip',
  'Friday Future You',
  'Saturday Duo Pose',
  'Sunday Soft Light',
];

const poseLibrary = [
  {
    id: 'power-stance',
    title: 'Power Stance',
    cameraTip: 'Hold phone chest-high, tilt down 5 degrees.',
    bodyTip: 'One shoulder forward, chin up, weight on back leg.',
    propTip: 'Use a jacket, tote, or coffee cup for movement.',
    difficulty: 'Easy',
  },
  {
    id: 'walk-through',
    title: 'Walk Through Frame',
    cameraTip: 'Set a 2-second timer and burst mode.',
    bodyTip: 'Step through frame naturally and look past camera.',
    propTip: 'Add wind with hair or scarf for dynamic lines.',
    difficulty: 'Medium',
  },
  {
    id: 'candid-laugh',
    title: 'Candid Laugh',
    cameraTip: 'Shoot slightly from below to lengthen posture.',
    bodyTip: 'Turn torso 30 degrees and laugh toward the side.',
    propTip: 'Tap your necklace or sleeve to avoid stiff hands.',
    difficulty: 'Easy',
  },
  {
    id: 'seated-editorial',
    title: 'Seated Editorial',
    cameraTip: 'Back camera with 1x lens keeps proportions clean.',
    bodyTip: 'Sit on edge, long neck, one knee toward lens.',
    propTip: 'Use a chair, stairs, or crate for texture.',
    difficulty: 'Hard',
  },
  {
    id: 'silhouette-pop',
    title: 'Silhouette Pop',
    cameraTip: 'Expose for highlights and shoot against window.',
    bodyTip: 'Arms away from torso to keep shape readable.',
    propTip: 'Hold hat or bag to create recognisable profile.',
    difficulty: 'Medium',
  },
];

const seedCommunityPosts = [
  {
    id: 'seed-1',
    username: 'fitwithria',
    likes: 128,
    theme: 'Tuesday Street Story',
    poseId: 'walk-through',
    caption: 'Tried this pose in rain and it somehow worked.',
    imageUrl: 'https://picsum.photos/seed/pixelmuse-seed-1/540/740',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'seed-2',
    username: 'noahcreates',
    likes: 203,
    theme: 'Tuesday Street Story',
    poseId: 'power-stance',
    caption: 'Camera angle tip made a huge difference.',
    imageUrl: 'https://picsum.photos/seed/pixelmuse-seed-2/540/740',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'seed-3',
    username: 'mayaline',
    likes: 89,
    theme: 'Tuesday Street Story',
    poseId: 'candid-laugh',
    caption: 'Wanted a chill reel cover and got this shot.',
    imageUrl: 'https://picsum.photos/seed/pixelmuse-seed-3/540/740',
    timestamp: new Date().toISOString(),
  },
];

const users = {};
let demoDayOffset = 0;

function getDateWithOffset() {
  const now = new Date();
  now.setDate(now.getDate() + demoDayOffset);
  return now;
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getYesterdayKey(date) {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getDateKey(yesterday);
}

function getOrCreateUser(userId) {
  if (!users[userId]) {
    users[userId] = {
      streak: 0,
      points: 0,
      lastCheckinDay: null,
      checkins: [],
      gallery: [],
    };
  }

  return users[userId];
}

function buildChallengePayload(userId) {
  const user = getOrCreateUser(userId);
  const date = getDateWithOffset();
  const dayIndex = date.getDay();
  const dateKey = getDateKey(date);
  const theme = weeklyThemes[dayIndex];
  const pose = poseLibrary[dayIndex % poseLibrary.length];

  const completedToday = user.lastCheckinDay === dateKey;
  const level = Math.floor(user.points / 120) + 1;

  return {
    today: {
      dateKey,
      dayLabel: date.toLocaleDateString('en-US', { weekday: 'long' }),
      theme,
      pose,
      completedToday,
    },
    progression: {
      streak: user.streak,
      points: user.points,
      level,
    },
    stats: {
      weeklyCheckins: user.checkins.filter((checkin) => {
        const checkinDate = new Date(checkin.timestamp);
        const diffMs = date - checkinDate;
        return diffMs <= 7 * 24 * 60 * 60 * 1000;
      }).length,
      totalGenerated: user.gallery.length,
    },
  };
}

function buildPoseTips(poseId) {
  const pose = poseLibrary.find((item) => item.id === poseId) || poseLibrary[0];

  return {
    poseId: pose.id,
    title: pose.title,
    tips: [pose.cameraTip, pose.bodyTip, pose.propTip],
    coachingPrompt: `Generate a cinematic ${pose.title} portrait with editorial lighting`,
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/challenge', (req, res) => {
  const userId = req.query.userId || 'demo-user';
  res.json(buildChallengePayload(userId));
});

app.get('/api/reel', (req, res) => {
  const userId = req.query.userId || 'demo-user';
  const user = getOrCreateUser(userId);
  const theme = weeklyThemes[getDateWithOffset().getDay()];

  const personalPosts = user.gallery
    .slice()
    .reverse()
    .map((item, idx) => ({
      id: `user-${idx}`,
      username: 'you',
      likes: 25 + idx * 3,
      theme,
      poseId: item.poseId,
      caption: item.caption,
      imageUrl: item.imageUrl,
      timestamp: item.timestamp,
    }));

  res.json({ items: [...personalPosts, ...seedCommunityPosts] });
});

app.get('/api/pose-tips/:poseId', (req, res) => {
  res.json(buildPoseTips(req.params.poseId));
});

app.post('/api/generate-image', (req, res) => {
  const { userId = 'demo-user', prompt = '', poseId = 'power-stance' } = req.body || {};

  const safePrompt = String(prompt).trim() || 'cinematic portrait';
  const seed = encodeURIComponent(`${userId}-${poseId}-${safePrompt}-${Date.now()}`);
  const imageUrl = `https://picsum.photos/seed/${seed}/720/960`;

  res.json({
    imageUrl,
    usedPrompt: safePrompt,
    puterHint:
      'To switch to Puter.js generation, replace this endpoint with a server call using your Puter API credentials.',
  });
});

app.post('/api/checkin', (req, res) => {
  const {
    userId = 'demo-user',
    poseId = 'power-stance',
    imageUrl = '',
    caption = 'Made a fresh shot in PixelMuse.',
  } = req.body || {};

  const user = getOrCreateUser(userId);
  const date = getDateWithOffset();
  const todayKey = getDateKey(date);

  if (user.lastCheckinDay !== todayKey) {
    user.streak = user.lastCheckinDay === getYesterdayKey(date) ? user.streak + 1 : 1;
    user.points += 20 + Math.min(user.streak * 2, 20);
    user.lastCheckinDay = todayKey;
  }

  user.checkins.push({
    poseId,
    timestamp: new Date().toISOString(),
  });

  user.gallery.push({
    poseId,
    imageUrl,
    caption,
    timestamp: new Date().toISOString(),
  });

  res.json({
    ok: true,
    streak: user.streak,
    points: user.points,
    message: 'Daily check-in locked. Come back tomorrow to protect your streak.',
  });
});

app.post('/api/demo/advance-day', (_req, res) => {
  demoDayOffset += 1;
  res.json({ ok: true, demoDayOffset });
});

app.listen(port, () => {
  console.log(`PixelMuse retention API running on port ${port}`);
});
