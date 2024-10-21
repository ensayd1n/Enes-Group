const express = require('express');
const fs = require('fs');
const path = require('path');
const { engine } = require('express-handlebars');
const nodemailer = require('nodemailer');
const { sendConfirmationCode,verificationCodeConfirmation,userLoginVerification} = require('./registery');
const { connectDB, saveConfirmationCode, getLastInsertedData } = require('./database');
require('dotenv').config({ path: './privacy.env' });
const bodyParser = require('body-parser');

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

app.get('/registery', (req, res) => {
  res.render('registery', { layout: false });
});
app.get('/login', (req, res) => {
  res.render('login', { layout: false });
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
      res.send(checkUserExistenceResult);
  } catch (error) {
      console.error('Hata:', error);
      res.status(500).send('Bir hata oluştu.');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});