
const User = require("./db/userModel");
const Chat = require("./db/chatModel.js")
const WebSocket = require('ws');
const { forceUpdate, sendNotificationToUser, setUsersMap } = require('./notificationHelpers');

const users = {};
setUsersMap(users);

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === 'register') {
        users[parsedMessage.userId] = ws;
        return;
      }

      else if (parsedMessage.type === 'message') {
        const recipientWs = users[parsedMessage.recipientId];
        
        // Create message object to send to recipient, preserving special message properties
        const messageToSend = {
          type: "message", 
          message: parsedMessage.text, 
          timestamp: parsedMessage.timestamp, 
          sender: false
        };
        
        // Add special message properties if they exist
        if (parsedMessage.isSpecial) {
          messageToSend.isSpecial = true;
          messageToSend.specialType = parsedMessage.specialType;
        }
        
        // Send message to recipient if they're connected
        if (recipientWs) {
          recipientWs.send(JSON.stringify(messageToSend));
        }
        
        // Send push notification to the recipient
        const recipient = await User.findById(parsedMessage.recipientId);
        if (recipient) {
          // For special messages, create a more descriptive notification
          let notificationBody;
          
          if (parsedMessage.isSpecial && parsedMessage.specialType === "venuesSummary") {
            notificationBody = "Sent you places to play together!";
          } else if (parsedMessage.isSpecial) {
            // try {
            //   const specialData = JSON.parse(parsedMessage.text);
            //   notificationBody = specialData.message || "Sent you a special message";
            // } catch (e) {
            //   notificationBody = "Sent you a special message";
            // }
            return
          } else {
            notificationBody = `${parsedMessage.text.substring(0, 30)}`;
          }
          
          const title = parsedMessage.senderName;
          const data = { type: 'message', sender: parsedMessage.senderId };
          
          sendNotificationToUser(parsedMessage.recipientId, title, notificationBody, data);
        }
        
        // Forward the message and store it in each user's database document
        let chatSender = await Chat.findOne({ user: parsedMessage.senderId });
        if (!chatSender) {
          chatSender = new Chat({ user: parsedMessage.senderId, chats: new Map() });
        }
        if (!chatSender.chats.has(parsedMessage.recipientId)) {
          chatSender.chats.set(parsedMessage.recipientId, []);
        }
        
        // Create message object for sender's chat history
        const senderMessageObj = {
          message: parsedMessage.text,
          sender: true,
          timestamp: parsedMessage.timestamp,
        };
        
        // Add special message properties if they exist
        if (parsedMessage.isSpecial) {
          senderMessageObj.isSpecial = true;
          senderMessageObj.specialType = parsedMessage.specialType;
        }
        
        chatSender.chats.get(parsedMessage.recipientId).push(senderMessageObj);
        await chatSender.save();
        
        // Find or create a chat for the recipient
        let chatRecipient = await Chat.findOne({ user: parsedMessage.recipientId });
        if (!chatRecipient) {
          chatRecipient = new Chat({ user: parsedMessage.recipientId, chats: new Map() });
        }
        if (!chatRecipient.chats.has(parsedMessage.senderId)) {
          chatRecipient.chats.set(parsedMessage.senderId, []);
        }
        
        // Create message object for recipient's chat history
        const recipientMessageObj = {
          message: parsedMessage.text,
          sender: false,
          timestamp: parsedMessage.timestamp,
        };
        
        // Add special message properties if they exist
        if (parsedMessage.isSpecial) {
          recipientMessageObj.isSpecial = true;
          recipientMessageObj.specialType = parsedMessage.specialType;
        }
        
        chatRecipient.chats.get(parsedMessage.senderId).push(recipientMessageObj);
        await chatRecipient.save();
        
        // Update matches for both users for the last chat timestamp
        await User.updateOne(
          { _id: parsedMessage.recipientId },
          {
            $set: {
              "matches.$[elem].timestamp": Date.now(),
              "matches.$[elem].unread": true
            }
          },
          {
            arrayFilters: [{ "elem.uid": parsedMessage.senderId }],
            new: true,
          }
        );
        
        await User.updateOne(
          { _id: parsedMessage.senderId },
          {
            $set: {
              "matches.$[elem].timestamp": Date.now()
            }
          },
          {
            arrayFilters: [{ "elem.uid": parsedMessage.recipientId }],
            new: true,
          }
        );
        
        // Create a more descriptive preview text for special messages
        let previewText;
        if (parsedMessage.isSpecial && parsedMessage.specialType === "venues") {
          previewText = "Sent places to play together!";
        } else if (parsedMessage.isSpecial) {
          try {
            const specialData = JSON.parse(parsedMessage.text);
            previewText = specialData.message || "Sent a special message";
          } catch (e) {
            previewText = "Sent a special message";
          }
        } else {
          previewText = parsedMessage.text.substring(0, 20);
        }
        
        // Force the recipient to refresh their match list
        forceUpdate(parsedMessage.recipientId, parsedMessage.senderId, previewText, parsedMessage.senderName);
      }
    });

    ws.on('close', () => {
      for (const [userId, socket] of Object.entries(users)) {
        if (socket === ws) {
          delete users[userId];
        }
      }
    });
  });
}

module.exports = { setupWebSocket };
