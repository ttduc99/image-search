require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const searchRoute = require('./routes/search');
const recentRoute = require('./routes/recent');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Routes
app.use('/query', searchRoute);
app.use('/recent', recentRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
