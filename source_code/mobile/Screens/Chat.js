import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  Modal,
} from 'react-native';
import RetryableImage from '../Components/RetryableImage';
import config from "../app.json";

const Chat = (props) => {
  const [messageInput, setMessageInput] = useState('');
  const [debouncedMessageInput, setDebouncedMessageInput] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const flatListRef = useRef(null);

  const messages = useMemo(() => props.messages, [props.messages]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMessageInput(messageInput);
    }, 100); // Adjust debounce

    return () => {
      clearTimeout(handler);
    };
  }, [messageInput]);

  useEffect(() => {
    async function loadMessages() {
      try {
        if (props?.user) {
          props.setMessages([]);

          if (isSocketBroken(props.ws.current)) props.connectWs();

          const messages = await props.loadMessages(props.myuid, props.user.uid);
          props.setMessages(messages);
        }
      } catch (error) {
        console.error("Error setting messages", error);
      }
    }

    loadMessages();
  }, [props.user]);

  function isSocketBroken(socket) {
    try {
      const isSocketIdValid = typeof socket._socketId === "number";
      const isReadyStateValid = socket.readyState === 3;
      const isSubscriptionsValid = Array.isArray(socket._subscriptions) && socket._subscriptions.length === 0;

      return isSocketIdValid && isReadyStateValid && isSubscriptionsValid;
    } catch (error) {
      console.error("Invalid JSON string provided:", error.message);
      return false;
    }
  }

  const sendMessage = () => {
    if (debouncedMessageInput.trim() === '' || !props.ws.current) return;

    if (isSocketBroken(props.ws.current)) props.connectWs();

    const time = new Date();

    const newMessage = {
      type: 'message',
      senderId: props.myuid,
      senderName: props.senderName,
      recipientId: props.user.uid,
      text: debouncedMessageInput,
      timestamp: time,
    };

    props.ws.current.send(JSON.stringify(newMessage));
    props.setMessages((prev) => [...prev, { sender: true, message: debouncedMessageInput, timestamp: time }]);
    setMessageInput('');
  };

  const handleUnmatch = () => {
    props.unmatch(props.user.uid);
    setMenuVisible(false);
    props.setUser(null);
  };

  const handleBlock = () => {
    props.block(props.user.uid);
    setMenuVisible(false);
    props.setUser(null);
  };

  const renderMessage = useCallback(({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender
          ? styles.myMessage
          : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.message}</Text>
      <Text style={[styles.timestamp, item.sender ? {textAlign: "right"} : {textAlign: "left"}]}>
        {formattedDate(item.timestamp)}
      </Text>
    </View>
  ), []);

  const formattedDate = (timestamp) => {
    const date = new Date(timestamp);

    const month = date.getMonth() + 1;
    const day = date.getDate();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const isPM = hours >= 12;

    hours = hours % 12 || 12;

    const formattedMinutes = minutes.toString().padStart(2, '0');

    return `${month}/${day} ${hours}:${formattedMinutes} ${isPM ? 'PM' : 'AM'}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => props.setUser(null)} style={styles.backButtonContainer}>
          <Text style={styles.backButton}>{"< Back"}</Text>
        </TouchableOpacity>

        <View style={styles.profileContainer}>
          <RetryableImage
            style={styles.profileImage}
            uri={props.user.media[0].uri}
          />
          <Text style={styles.userName}>
            {props.user.profile.firstName} {props.user.profile.lastName}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={() => setMenuVisible(true)} 
          style={styles.menuButtonContainer}
        >
          <Text style={styles.menuButton}>{"..."}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingBottom: 10 }}>
      <FlatList
        ref={flatListRef}
        data={messages.slice().reverse()} // Reverse the messages array
        renderItem={renderMessage}
        keyExtractor={(item) => item.timestamp.toString() + item.sender.toString()}
        style={styles.messageList}
        inverted={true} // Inverts the list
        // onEndReached={props.loadMoreMessages} To load older messages
        // onEndReachedThreshold={0.5} // Trigger loading when 50% near the top
      />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Type a message..."
          onFocus={() => {
            // setTimeout(() => {
            //   flatListRef.current?.scrollToEnd({ animated: true, duration: 500 });
            // }, 100);
          }}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleUnmatch}
            >
              <Text style={styles.menuItemTextDanger}>Unmatch</Text>
            </TouchableOpacity>
            
            {/* <View style={styles.menuSeparator} />
            
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleBlock}
            >
              <Text style={styles.menuItemTextDanger}>Block</Text>
            </TouchableOpacity> */}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    marginTop: "5%",
  },
  header: {
    height: Dimensions.get("window").height * 0.2,
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // Allows absolute positioning within the header
  },
  backButtonContainer: {
    position: "absolute",
    left: 10,
  },
  backButton: {
    fontSize: 16,
  },
  menuButtonContainer: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  menuButton: {
    fontSize: 24,
    fontWeight: "bold",
  },
  profileContainer: {
    alignItems: "center",
  },
  profileImage: {
    borderRadius: Dimensions.get("window").width * 0.1,
    height: Dimensions.get("window").width * 0.2,
    width: Dimensions.get("window").width * 0.2,
  },
  userName: {
    fontSize: 20,
    fontWeight: "200",
    marginTop: 10,
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    marginTop: 10,
    borderRadius: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#d1e7ff",
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: "gray",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: config.app.theme.creme,
  },
  messageInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: config.app.theme.blue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
    width: '80%',
    maxWidth: 300,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
  menuItemTextDanger: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#e0e0e0',
  },
});

export default Chat;