
const User = require("./db/userModel");

let users = {};

function setUsersMap(map) {
  users = map;
}

/**
 * Sends a push notification to a specific user
 * @param {string} userId - The ID of the user to send the notification to
 * @param {string} title - The notification title
 * @param {string} body - The notification body content
 * @param {Object} [data={}] - Optional additional data to include with the notification
 * @returns {Promise<Object>} Result containing success status and data or error
 */
async function sendNotificationToUser(userId, title, body, data = {}) {
  try {
    if (!title || !body) {
      throw new Error('Title and body are required');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const result = await user.sendPushNotification(title, body, data);
    return {
      success: true,
      message: 'Notification sent successfully',
      data: result.data,
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      message: error.message,
      error,
    };
  }
}

/**
 * Force a user to get new data via WebSocket
 * @param {string} uid - The user ID to notify
 * @param {string} sender - The sender's user ID
 * @param {string} messagePreview - Message preview string
 * @param {string} senderName - The sender's name
 */
function forceUpdate(uid, sender, messagePreview, senderName) {
  const recipientWs = users[uid];
  if (recipientWs) {
    recipientWs.send(
      JSON.stringify({
        type: 'update',
        sender,
        messagePreview,
        senderName,
      })
    );
  }
}

module.exports = {
  forceUpdate,
  sendNotificationToUser,
  setUsersMap,
};
