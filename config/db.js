const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.DATABASE);
    console.log(" woohoo! Mongoose connection open successfully");
  } catch (error) {
    console.error(`Connection error: ${error.message}`); // fixed: use 'error' not 'err'
    process.exit(1);
  }
};

module.exports = connectDb;
