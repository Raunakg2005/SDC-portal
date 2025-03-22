const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    svvNetId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { collection: "users" } // Ensure collection name is 'users'
);

module.exports = mongoose.model("User", UserSchema);
