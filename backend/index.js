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
  const { id, encryptedMessage, expirySeconds, maxViews } = req.body;
  await redisClient.hSet(`msg:${id}`, { encryptedMessage, remainingViews: maxViews });
  if(expirySeconds > 0) await redisClient.expire(`msg:${id}`, expirySeconds);
  res.json({ success: true });
});

app.get('/api/message/:id', async (req, res) => {
  const id = req.params.id;
  const data = await redisClient.hGetAll(`msg:${id}`);
  if(!data || !data.encryptedMessage) return res.status(404).json({ error: 'Message not found or expired' });
  let views = parseInt(data.remainingViews);
  if(views <= 0){ await redisClient.del(`msg:${id}`); return res.status(404).json({ error: 'Message expired' }); }
  views--;
  await redisClient.hSet(`msg:${id}`, 'remainingViews', views);
  res.json({ encryptedMessage: data.encryptedMessage });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));