const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');

app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (page === 'css' || page === 'js' || page === 'errors' || page === 'pages') {
    return next();
  }

  if (page.includes('.')) {
    return next();
  }

  const filePath = path.join(publicDir, 'pages', `${page}.html`);
  fs.access(filePath, fs.constants.F_OK, err => {
    if (err) return next();
    res.sendFile(filePath);
  });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, 'errors', '404.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).sendFile(path.join(publicDir, 'errors', '500.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
