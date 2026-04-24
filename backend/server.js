const express = require('express');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'minimal-node-api'
  });
});

app.get('/data', (req, res) => {
  res.status(200).json({
    message: 'Voici les données de test',
    items: [
      { id: 1, name: 'Post 1' },
      { id: 2, name: 'Post 2' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`API en cours sur le port ${PORT}`);
});