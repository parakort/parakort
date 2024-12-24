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
} from 'react-native';
import RetryableImage from '../Components/RetryableImage';
import config from "../app.json";

const Chat = (props) => {
  const [messageInput, setMessageInput] = useState('');
  const [debouncedMessageInput, setDebouncedMessageInput] = useState('');
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
});


export default Chat;
