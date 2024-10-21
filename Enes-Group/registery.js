const mongoose = require('mongoose');
const { getLastInsertedData, saveUser , checkUser, saveConfirmationCode} = require('./database');
require('dotenv').config({ path: './privacy.env' });
const nodemailer = require('nodemailer');

async function sendConfirmationCode(userEmail, confirmationCode) {
  console.log('buraya girdi mail göndermeye çalışıcak');
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();

    const mailBody = {
      from: 'Aydin Group <info.aydingroup@gmail.com>',
      to: userEmail,
      subject: 'Verification code',
      html: `
      <p style="font-family: Arial, sans-serif; font-size: 16px;">
    Dear new user,<br><br>

    Your Aydin Group membership is being created. If you initiated this process, please verify your confirmation code:
    <span style="background-color: black; color: white; padding: 5px;">${confirmationCode}</span>.

    If you did not initiate this process, please do not share this code with anyone.
    </p>
    `
    };

    await transporter.sendMail(mailBody);
    saveConfirmationCode(confirmationCode);
    console.log('Verification code sent:', mailBody.to);
    return { message: 'Verification code sent successfully' };
  } catch (error) {
    console.error(error);
    throw new Error('Error sending verification code');
  }
}

async function getConfirmationCode() {
  try {
    return await getLastInsertedData();
  } catch (error) {
    console.error(error);
    return 0;
  }
}

async function verificationCodeConfirmation(name, lastName, birthday, email, password, userCode) {
  try {
    const code = await getConfirmationCode();
    console.log(userCode);
    console.log(code);
    if (userCode === code) {
      console.log('kodlar uyuşuyor');
      const savedUser = await saveUser(name, lastName, birthday, email, password,userCode);
      if (savedUser) {
        console.log('User has been successfully saved to the database.');
        return true;
      } else {
        console.error('Failed to save the user.');
        return false;
      }
    } else {
      return false;
    }

  } catch (error) {
    console.error('An error occurred during verification:', error);
    return false;
  }
}

async function userLoginVerification(email, password) {
  try {
    const userExists = await checkUser(email, password);

    if (userExists) {
      console.log("The user exists in the database and its existence is verified.");
      return true;
    } else {
      console.log("User does not exist.");
      return false;
    }

  } catch (error) {
    console.error('An error occurred during verification:', error);
    return false;
  }
}




module.exports = { sendConfirmationCode, getConfirmationCode, verificationCodeConfirmation ,userLoginVerification};
