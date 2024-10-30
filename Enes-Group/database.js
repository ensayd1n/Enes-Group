const mongoose = require('mongoose');
require('dotenv').config({ path: './privacy.env' });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connection established.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

async function saveConfirmationCode(code) {
  try {
    const url = process.env.MONGODB_URI;
    const dbName = process.env.DATABASE_NAME;
    const collectionName = process.env.CONFIRMATION_CODES_COLLECTION_NAME;

    if (mongoose.connection.readyState === 0) {
      await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(client => {
          mongoose.connect(`${url}/${dbName}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
          });
        });
    }

    const newCode = {
      Code: code,
      Created_Date:new Date(),
    };
    const db = mongoose.connection;
    const collection = db.collection(collectionName);

    const result = await collection.insertOne(newCode);
    console.log(`Confirmation code inserted with ID: ${result.insertedId}`);
    return true;

  } catch (error) {
    console.error('Confirmation code saving error:', error);
    return false;
  }
}

async function getLastInsertedData() {
  try {
    const collectionName = process.env.CONFIRMATION_CODES_COLLECTION_NAME;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const db = mongoose.connection;
    const collection = db.collection(collectionName);

    const result = await collection.find().sort({ _id: -1 }).limit(1).toArray();
    
    if (result && result.length > 0) {
      console.log(`Son eklenen code: ${result[0].Code}`);
      return result[0].Code;
    } else {
      console.log('Koleksiyonda hiç veri bulunamadı.');
      return null;
    }
  } catch (error) {
    console.error("Error fetching last inserted data:", error);
    return null;
  }
}



async function saveUser(name, lastName, birthday, email, password,userCode) {
  try {
    const url = process.env.MONGODB_URI;
    const dbName = process.env.DATABASE_NAME;
    const userCollectionName = process.env.USERS_COLLECTION_NAME;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const newUser = {
      Name: name,
      LastName: lastName,
      Birthday: birthday,
      Email: email,
      Password: password,
      Registery_Confirmation_Code:userCode,
      Registery_Date:new Date(),
      Authority:'User'
    };

    const db = mongoose.connection;
    const collection = db.collection(userCollectionName);

    const result = await collection.insertOne(newUser);
    console.log(`User inserted with ID: ${result.insertedId}`);
    return true;

  } catch (error) {
    console.error('User saving error:', error);
    return false;
  }
}


async function checkUser(email, password) {
  try {
    const url = process.env.MONGODB_URI;
    const dbName = process.env.DATABASE_NAME;
    const userCollectionName = process.env.USERS_COLLECTION_NAME;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const db = mongoose.connection;
    const collection = db.collection(userCollectionName);

    const result = await collection.findOne({ Email: email, Password: password });
    if (result) {
      console.log('Found document:');
      return result.Authority;
    } else {
      console.log('No document found.');
      return null;
    }

  } catch (error) {
    return null;
  }
}

module.exports = { connectDB, saveUser , checkUser , getLastInsertedData , saveConfirmationCode };
