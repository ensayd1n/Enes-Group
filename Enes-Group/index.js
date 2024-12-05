import express from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { engine } from 'express-handlebars';
import { sendConfirmationCode, verificationCodeConfirmation, userLoginVerification, sendUserPasswordToEmail, sendEmailThatUserPasswordHasChanged } from './registery.js';
import { connectDB, getUserDatas, saveUserLogo, getUserPasswordandMail, updateUserPassword } from './database.js';
import { fetchExchangeRateData, generatePDF } from './invoicer.js';
import { hashData } from './hashProcessor.js';
import { usersDatas ,updateUserDatas} from './admin.js';
import {converterMedia} from './mp3-converter.js';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: './privacy.env' });

const app = express();
const port = 3000;
connectDB();

const allowedLayouts = ['dashboard'];

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'dashboard',
  layoutsDir: path.join(__dirname, 'views'),
  partialsDir: path.join(__dirname, 'views'),
  helpers: {},
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

const upload = multer({ dest: path.join('uploads', '/') });

app.use('/pdf_output', express.static(path.join(__dirname, 'pdf_output')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


app.get('/mp3-converter', (req, res) => {
  res.render('mp3-converter');
});

app.get('/document-converter', (req, res) => {
  res.render('document-converter')
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

app.get('/chat-ai', (req, res) => {
  res.render('chat-ai');
});
app.get('/admin-page', (req, res) => {
  res.render('admin-page');
});

app.get('/', (req, res) => {
  res.render('index');
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
    const verificationResult = await verificationCodeConfirmation(name, lastName, birthday, email, hashData(password), userCode);
    res.send(verificationResult);
  } catch (error) {
    console.error('Hata:', error);
    res.status(500).send('Bir hata oluştu.');
  }
});
app.post('/login-check-user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const checkUserExistenceResult = await userLoginVerification(email, hashData(password));
    if (checkUserExistenceResult != null) {
      const userId = checkUserExistenceResult._id.toString();
      const authority = checkUserExistenceResult.Authority;

      const token = jwt.sign(
        { userId, authority },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      req.session.userid = userId;
      
      res.status(200).json({ success: true, token: token });
    } else {
      res.status(401).json({ success: false });
    }
  } catch (error) {
    console.error('Error during login check:', error);
    res.status(500).json({ success: false });
  }
});
app.post('/logout-of-acount', async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error during session destruction:', err);
        return res.send(false);
      }
      res.send(true);
    });
  } catch (error) {
    console.error('Error during logout:', error);
    res.send(false);
  }
});
app.post('/get-exchange-rate-data', async (req, res) => {
  try {
    const exchangeRateData = await fetchExchangeRateData();

    if (exchangeRateData != null) {
      res.send(exchangeRateData);
    } else {
      res.send(null);
    }
  } catch {
    res.send(null);
  }
});
app.post('/generate-and-download-pdf', upload.single('companyLogo'), async (req, res) => {
  try {
    const {
      companyName,
      companyAddress,
      companyTaxNumber,
      companyCrsNumber,
      targetCompanyName,
      targetCompanyAddress,
      targetTaxNumber,
      invoiceNumber,
      invoiceDate,
      products
    } = req.body;

    const logoPath = req.file ? req.file.path : null;

    const parsedProducts = JSON.parse(products);

    const generatedPDF = await generatePDF({
      companyName,
      companyAddress,
      companyTaxNumber,
      companyCrsNumber,
      targetCompanyName,
      targetCompanyAddress,
      targetTaxNumber,
      invoiceNumber,
      invoiceDate,
      logoPath,
      products: parsedProducts
    });

    if (generatedPDF) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
      res.send(generatedPDF);
    } else {
      res.status(500).send('PDF creation failed');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});
app.post('/get-profile-informations', async (req, res) => {
  try {
    const id = req.session.userid;
    const userInformations = await getUserDatas(id);

    if (userInformations != null) {
      res.send(userInformations);
    } else {
      res.send(null);
    }
  } catch {
    res.send(null);
  }
});
app.post('/set-profile-logo', upload.single('image'), (req, res) => {
  try {
    if (req.file && req.session.userid) {
      const userid = req.session.userid;
      const fileExtension = path.extname(req.file.originalname);
      const newFilePath = path.join('userLogos', `${userid}${fileExtension}`);
      const directoryPath = path.join(__dirname, 'public', 'userLogos');

      const saveUserLogoByDB = saveUserLogo(userid, newFilePath);

      fs.readdir(directoryPath, (err, files) => {
        if (err) {
          console.error('Error reading directory:', err);
          return res.status(500).send('An error occurred while accessing the directory');
        }

        const existingFile = files.find(file => file.startsWith(userid));
        if (existingFile) {
          const existingFilePath = path.join(directoryPath, existingFile);

          fs.unlink(existingFilePath, (err) => {
            if (err) {
              console.error('Error deleting existing file:', err);
              return res.status(500).send('An error occurred while deleting the existing file');
            }
          });
        }

        fs.rename(req.file.path, path.join(__dirname, 'public', newFilePath), (err) => {
          if (err) {
            console.error('Error renaming file:', err);
            return res.status(500).send('An error occurred while saving the file');
          }
          res.send({ logoPath: newFilePath });
        });
      });
    } else {
      res.status(400).send('File not uploaded or user ID not found');
    }
  } catch {
    res.send(null);
  }
});
app.post('/see-user-password', async (req, res) => {
  try {
    const id = req.session.userid;
    const userInformations = await getUserPasswordandMail(id);
    const emailSent = await sendUserPasswordToEmail(userInformations.Email, userInformations.Password);
    if (emailSent) {
      res.send(true);
    } else {
      res.send(false);
    }

  } catch (error) {
    console.error('Error in /see-user-password:', error);
    res.send(false);
  }
});
app.post('/user-change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const id = req.session.userid;
    const userInformations = await getUserPasswordandMail(id);
    if (hashData(oldPassword) == userInformations.Password) {
      const result = await updateUserPassword(id, hashData(newPassword));
      if (result) {
        res.send(true);
      } else {
        res.send(false);
      }
    }
  } catch (error) {
    console.error('Error in /see-user-password:', error);
    res.send(false);
  }
});
app.post('/media-converter',async (req,res)=>{
  try{
    const {mediaURL,mediaType}=req.body;
    const result = await converterMedia(mediaURL, mediaType);
    if(result){
      res.send(true);
    }else{
      res.send(null);
    }
  }catch(error){
    res.send(null);
  }
});
app.post('/get-users-datas', async (req, res) => {
  try {
    console.log("Fetching user data...");
    
    const users = await usersDatas();
    if (users && users.length > 0) {
      res.send(users);
    } else {
      res.send(null);
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.send(null);
  }
});
app.post('/get-choosen-profile-informations', async (req, res) => {
  try {
    const {_id}=req.body;
    const userInformations = await getUserDatas(_id);
    if (userInformations != null) {
      res.send(userInformations);
    } else {
      res.send(null);
    }
  } catch {
    res.send(null);
  }
});
app.post('/update-user-profile', async (req, res) => {
  try {
    const { _id, authority, firstName, lastName, email, birthday } = req.body;

    const result = await updateUserDatas(_id, authority, firstName, lastName, email, birthday);

    if(result){
      res.send(true);
    }else{
      res.send(null);
    }
  } catch (error) {
    console.error('Error in /update-user-profile:', error);
    res.send(false);
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
