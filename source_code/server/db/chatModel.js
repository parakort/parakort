const mongoose = require("mongoose");
const { Schema, model, Types } = mongoose;

const ChatSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    chats: {
      type: Map,
      of: [
        {
          message: { type: String, required: true },
          sender: { type: Boolean, required: true },
          timestamp: { type: Date, required: true },
        },
      ],
    },
  });

module.exports = model("Chat", ChatSchema);
