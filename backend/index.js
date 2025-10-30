require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('redis');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect();

app.post('/api/message', async (req, res) => {
  const { id, encryptedMessage, expirySeconds, maxViews, passwordHash } = req.body;
  let views = Number(maxViews) || 0;
  if (views > 0) views = views + 1; // always 1 more than client asks
  const fields = { encryptedMessage, remainingViews: views };
  if (passwordHash && typeof passwordHash === 'string' && passwordHash.length > 0) {
    fields.passwordHash = passwordHash;
  }
  await redisClient.hSet(`msg:${id}`, fields);
  if(Number(expirySeconds) > 0) await redisClient.expire(`msg:${id}`, Number(expirySeconds));
  res.json({ success: true });
});

// Backward compatible GET (no password enforcement) - kept for legacy links
app.get('/api/message/:id', async (req, res) => {
  const id = req.params.id;
  const data = await redisClient.hGetAll(`msg:${id}`);
  if(!data || !data.encryptedMessage) return res.status(404).json({ error: 'Message not found or expired' });
  let views = parseInt(data.remainingViews);
  if(Number.isNaN(views)) views = 0;
  if(views > 0){
    views--;
    await redisClient.hSet(`msg:${id}`, 'remainingViews', views);
    if(views <= 0){ await redisClient.del(`msg:${id}`); return res.status(404).json({ error: 'Message expired' }); }
  }
  res.json({ encryptedMessage: data.encryptedMessage });
});

// Preferred endpoint with optional password verification
app.post('/api/message/:id/consume', async (req, res) => {
  const id = req.params.id;
  const providedHash = (req.body && typeof req.body.passwordHash === 'string') ? req.body.passwordHash : '';
  const data = await redisClient.hGetAll(`msg:${id}`);
  if(!data || !data.encryptedMessage) return res.status(404).json({ error: 'Message not found or expired' });
  if (data.passwordHash && data.passwordHash.length > 0) {
    if (!providedHash || providedHash !== data.passwordHash) {
      return res.status(401).json({ error: 'Password required or incorrect' });
    }
  }
  let views = parseInt(data.remainingViews);
  if(Number.isNaN(views)) views = 0;
  if(views > 0){
    views--;
    await redisClient.hSet(`msg:${id}`, 'remainingViews', views);
    if(views <= 0){ await redisClient.del(`msg:${id}`); return res.status(404).json({ error: 'Message expired' }); }
  }
  res.json({ encryptedMessage: data.encryptedMessage });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));