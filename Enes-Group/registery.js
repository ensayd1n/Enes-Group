import { getLastInsertedData, saveUser, checkUser, saveConfirmationCode } from './database.js';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config({ path: './privacy.env' });

export async function sendConfirmationCode(userEmail, confirmationCode) {
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

export async function getConfirmationCode() {
  try {
    return await getLastInsertedData();
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function verificationCodeConfirmation(name, lastName, birthday, email, password, userCode) {
  try {
    const code = await getConfirmationCode();
    if (userCode === code) {
      console.log('kodlar uyuşuyor');
      const savedUser = await saveUser(name, lastName, birthday, email, password, userCode);
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

export async function userLoginVerification(email, password) {
  try {
    const userExists = await checkUser(email, password);

    if (userExists != null) {
      console.log("The user exists in the database and its existence is verified.");
      return userExists;
    } else {
      console.log("User does not exist.");
      return null;
    }

  } catch (error) {
    console.error('An error occurred during verification:', error);
    return null;
  }
}

export async function sendUserPasswordToEmail(userEmail, password) {
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
        Dear user,<br><br>
        Thank you for registering with Aydin Group. Here is your account password:
        <span style="background-color: black; color: white; padding: 5px;">${password}</span>.<br><br>

        Please keep this password secure and do not share it with anyone. If you did not request this account creation, please contact our support team immediately.<br><br>

        Best regards,<br>
        The Aydin Group Team
      </p>
      `
    };

    await transporter.sendMail(mailBody);
    console.log('User password sent:', mailBody.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export async function sendEmailThatUserPasswordHasChanged(userEmail) {
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
        Dear user,<br><br>
        We wanted to let you know that your password has been successfully changed on the Enes Group system.<br><br>

        If you did not initiate this change or suspect any unauthorized activity on your account, please contact our support team immediately at <a href="mailto:support@enesgroup.com">support@enesgroup.com</a>.<br><br>

        For your security, please do not share your password with anyone.<br><br>

        Best regards,<br>
        The Enes Group Team
      </p>
      `
    };

    await transporter.sendMail(mailBody);
    console.log('Password change notification sent to:', mailBody.to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
