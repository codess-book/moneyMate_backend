
const mongoose = require("mongoose");
const dotenv = require("dotenv");


dotenv.config({ path: ".env.development" });


dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 9000, // 5 sec timeout
      socketTimeoutMS: 45000, // 45 sec timeout
    });
        console.log(process.env.MONGO_URI,"mongo")

console.log(`📦 Using DB: ${process.env.MONGO_URI.split('/').pop()}`);

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
