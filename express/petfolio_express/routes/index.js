const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Petfolio Express backend is running! DB connected, no errors.');
});

module.exports = router;
