import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ObjectId } from 'mongodb';

dotenv.config({ path: './privacy.env' });


export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connection established.');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export async function saveConfirmationCode(code) {
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
export async function getLastInsertedData() {
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
export async function saveUser(name, lastName, birthday, email, password,userCode) {
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
      Authority:'User',
      LogoPath:'http://localhost:3000/anonimAvatar.png'
    };

    const db = mongoose.connection;
    const collection = db.collection(userCollectionName);

    const result = await collection.insertOne(newUser);
    return true;

  } catch (error) {
    return false;
  }
}
export async function checkUser(email, password) {
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
      return {
        _id: result._id,
        Authority: result.Authority
      };
    } else {
      console.log('No document found.');
      return null;
    }

  } catch (error) {
    return null;
  }
}
export async function saveUserLogo(id, logoPath) {
  try {
    const url = process.env.MONGODB_URI;
    const userCollectionName = process.env.USERS_COLLECTION_NAME;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const db = mongoose.connection;
    const collection = db.collection(userCollectionName);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { LogoPath: logoPath } },
      { returnDocument: 'after' }
    );

    if (result.value) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
}
export async function getUserDatas(id) {
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

    const objectId = new mongoose.Types.ObjectId(id);

    const result = await collection.findOne({ _id: objectId });
    if (result) {
      return {
        _id:result._id,
        LogoPath: result.LogoPath,
        Name: result.Name,
        LastName: result.LastName,
        Birthday: result.Birthday,
        Email: result.Email,
        Authority:result.Authority
      };
    } else {
      return null;
    }

  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}
export async function getUserPasswordandMail(id) {
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

    const objectId = new mongoose.Types.ObjectId(id);

    const result = await collection.findOne({ _id: objectId });
    if (result) {
      return {
        Email: result.Email,
        Password: result.Password
      };
    } else {
      return null;
    }

  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}
export async function updateUserPassword(id, newPassword) {
  try {
    const url = process.env.MONGODB_URI;
    const userCollectionName = process.env.USERS_COLLECTION_NAME;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const db = mongoose.connection;
    const collection = db.collection(userCollectionName);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { Password: newPassword } },
      { returnDocument: 'after' }
    );

    if (result) {
      console.log('Password updated successfully');
      return true;
    } else {
      console.log('User not found or update failed');
      return null;
    }
  } catch (error) {
    console.error('Error updating password:', error);
    return null;
  }
}
export async function getUsersDatas() {
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

    const users = await collection.find({}, { projection: { Password: 0 } }).toArray(); 
    if (users) {
      const resultList = users.map((user) => ({
        _id: user._id,
        LogoPath: user.LogoPath,
        Name: user.Name,
        LastName: user.LastName,
        Birthday: user.Birthday,
        Email: user.Email,
        Authority: user.Authority
      }));
      return resultList;
    } else {
      return null;
    }

  } catch (error) {
    console.error("Error fetching users datas:", error);
    return null;
  }
}
export async function updateUserInformation(_id, authority, firstName, lastName, email, birthday) {
  try {
    const url = process.env.MONGODB_URI;
    const userCollectionName = process.env.USERS_COLLECTION_NAME;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }

    const db = mongoose.connection;
    const collection = db.collection(userCollectionName);

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $set: { Authority: authority, Name: firstName, LastName: lastName, Email: email, Birthday: birthday } },
      { returnDocument: 'after' }
    );

    if (result) {
      console.log('Data updated successfully');
      return true;
    } else {
      console.log('User not found or update failed');
      return null;
    }
    
  } catch (error) {
    console.error('Error updating user information:', error);
    return null;
  }
}