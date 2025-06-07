require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const argon2 = require('argon2');
const path = require('path');
const flash = require('connect-flash');
const User = require('./models/User');

const app = express();

// Passport Configuration
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) return done(null, false, { message: 'Incorrect username.' });

      const isValid = await user.verifyPassword(password);
      if (!isValid) return done(null, false, { message: 'Incorrect password.' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/satsuya_casino', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Import routes
const authRoutes = require('./routes/authRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const gameRoutes = require('./routes/gameRoutes');

//PATH LOGGING
app.use(async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || (req.ip.includes(':') ? req.ip.split(':').pop() : req.ip);
    console.log(`[${req.method}] Path: ${req.path} > IP: ${ip}`);
    next();
});

// Routes
app.use('/', authRoutes);
app.use('/', inviteRoutes);
app.use('/', dashboardRoutes);
app.use('/', gameRoutes);

app.use((req, res, next) => {
  res.locals.messages = req.flash();
  res.locals.user = req.user;
  next();
});

app.get('/', (req, res) => {
  res.render('index');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
