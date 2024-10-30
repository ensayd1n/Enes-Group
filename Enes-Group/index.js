const express = require('express');
const fs = require('fs');
const path = require('path');
const { engine } = require('express-handlebars');
const nodemailer = require('nodemailer');
const { sendConfirmationCode,verificationCodeConfirmation,userLoginVerification} = require('./registery');
const { connectDB} = require('./database');
const { fetchExchangeRateData} = require('./invoicer');
require('dotenv').config({ path: './privacy.env' });
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;
connectDB();
const allowedLayouts = ['dashboard'];
app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: 'dashboard',
    layoutsDir: path.join(__dirname, 'views'),
    partialsDir: path.join(__dirname, 'views'),
    helpers: {
    },
  })
);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

app.get('/mp3-converter', (req, res) => {
  res.render('mp3-converter');
  console.log(process.env.CONFIRMATION_CODES_COLLECTION_NAME);

});

app.get('/document-converter', (req, res) => {
  res.render('document-converter');
});

app.get('/profile', (req, res) => {
  res.render('profile');
});
app.get('/cv-maker', (req, res) => {
  res.render('cv-maker');
});
app.get('/registery', (req, res) => {
  res.render('registery', { layout: false });
});
app.get('/login', (req, res) => {
  res.render('login', { layout: false });
});
app.get('/unauthorized-access', (req, res) => {
  res.render('unauthorized-access', { layout: false });
});
app.get('/invoicer', (req, res) => {
  res.render('invoicer');
});
app.get('/', (req, res) => {
  res.render('home');
});

app.post('/send-confirmation-code', async (req, res) => {
  try {
      const userEmail = req.body.email; 
      const confirmationCode = generateConfirmationCode();
      await sendConfirmationCode(userEmail, confirmationCode);
      res.send(true);
  } catch (error) {
      console.error(error);
      res.send(false);
  }
});

app.post('/verification-code-confirmation', async (req, res) => {
  try {
    const { name, lastName, birthday, email, password, userCode } = req.body;
      const verificationResult = await verificationCodeConfirmation(name, lastName, birthday, email, password, userCode);
      res.send(verificationResult);
  } catch (error) {
      console.error('Hata:', error);
      res.status(500).send('Bir hata oluştu.');
  }
});

app.post('/login-check-user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const checkUserExistenceResult = await userLoginVerification(email, password);

    if (checkUserExistenceResult != null) {
      req.session.authority = checkUserExistenceResult;
      console.log("Authority:", req.session.authority);
      res.send(true);
    } else {
      res.send(false);
    }

  } catch (error) {
    res.send(false);
  }
});

app.post('/get-exchange-rate-data', async (req, res) => {
  try {
    const exchangeRateData  = await fetchExchangeRateData();

    if (exchangeRateData  != null) {
      res.send(exchangeRateData );
    } else {
      res.send(null);
    }

  } catch (error) {
    res.send(null);
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});