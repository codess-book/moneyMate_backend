const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// require('dotenv').config();

require('dotenv').config({ path: '.env.development' });

const User = require('./models/admin');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD missing in .env file");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ User already exists");
      return mongoose.disconnect();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    console.log('✅ User created');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error creating user:', error);
    process.exit(1);
  }
}

createAdmin();
