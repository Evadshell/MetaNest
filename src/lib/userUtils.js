// src/lib/userUtils.js
import connectToDatabase from './mongodb';
import User from '@/models/User';

export async function storeUserInDatabase(auth0User) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Check if the user exists in MongoDB
    let dbUser = await User.findOne({ auth0Id: auth0User.sub });
    if (!dbUser) {
      // If user does not exist, create them in MongoDB
      dbUser = await User.create({
        auth0Id: auth0User.sub,
        name: auth0User.name,
        email: auth0User.email,
        nickname: auth0User.nickname,
        picture: auth0User.picture,
      });
      console.log("User created in MongoDB:", dbUser);
    } else {
      console.log("User already exists in MongoDB:", dbUser);
    }
  } catch (error) {
    console.error("Error storing user in MongoDB:", error);
  }
}
