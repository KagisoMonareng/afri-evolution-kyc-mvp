const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadRoutes = require('./api/upload'); // ✅ RELATIVE PATH OK

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files if needed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/upload', uploadRoutes); // ✅ This makes endpoint POST http://localhost:3000/api/upload

// Default root
app.get('/', (req, res) => {
  res.send('Afri Evolution KYC API running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// … existing imports …
const generatePackRoutes = require('./api/generate_pack');

// serve final PDFs
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// routes
app.use('/api/upload',   uploadRoutes);
app.use('/api/generate_pack', generatePackRoutes);
