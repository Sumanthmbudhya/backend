const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: String,
    designation: String,
    gender: String,
    courses: [String],
    image: String,
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', userSchema);
