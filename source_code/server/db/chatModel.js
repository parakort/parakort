
const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chats: {
    type: Map,
    of: [{
      message: {
        type: String,
        required: true
      },
      sender: {
        type: Boolean,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      isSpecial: {
        type: Boolean,
        default: false
      },
      specialType: {
        type: String,
        default: null
      }
    }]
  }
});

module.exports = mongoose.model('Chat', ChatSchema);