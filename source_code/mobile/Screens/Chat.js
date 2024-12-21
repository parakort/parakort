import React, { useState, useEffect, useRef } from 'react';
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
import config from "../app.json"


const Chat = (props) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (props?.user) {
      // Bind socket event to listen for functions
      if (isSocketBroken(props.ws.current))
        props.connectWs()

      props.ws.current.onmessage = (event) => {
        const receivedMessage = JSON.parse(event.data);
        if (receivedMessage.type === 'message') {
          setMessages((prev) => [...prev, receivedMessage]);
        }
      };

    }
  }, [props.user]);

  function isSocketBroken(socket) {
    try {
  
      // Define conditions for a "working" socket
      const isSocketIdValid = typeof socket._socketId === "number";
      const isReadyStateValid = socket.readyState === 3;
      const isSubscriptionsValid = Array.isArray(socket._subscriptions) && socket._subscriptions.length === 0;
  
      // Return true if all conditions are met
      return isSocketIdValid && isReadyStateValid && isSubscriptionsValid;
    } catch (error) {
      console.error("Invalid JSON string provided:", error.message);
      return false; // Invalid input, cannot determine
    }
  }

  const sendMessage = () => {
    if (messageInput.trim() === '' || !props.ws.current) return;

    if (isSocketBroken(props.ws.current))
      props.connectWs()

    const newMessage = {
      type: 'message',
      senderId: props.myuid,
      recipientId: props.user.uid,
      text: messageInput,
      timestamp: new Date(),
    };

    props.ws.current.send(JSON.stringify(newMessage));
    setMessages((prev) => [...prev, newMessage]);
    setMessageInput('');
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.senderId === props.myuid
          ? styles.myMessage
          : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => props.setUser(null)}>
          <Text style={styles.backButton}>{"< Back"}</Text>
        </TouchableOpacity>

        <View style = {{display: "flex", flexDirection: "column", alignItems: "center"}}>
          <RetryableImage
            style={{
              borderRadius: Dimensions.get('window').width * 0.1,
              height: Dimensions.get('window').width * 0.2,
              width: Dimensions.get('window').width * 0.2,
            }}
            uri={props.user.media[0].uri}
          />
          <Text style={styles.userName}>
            {props.user.profile.firstName} {props.user.profile.lastName}
          </Text>
        </View>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.timestamp.toString()}
        style={styles.messageList}
        inverted
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Type a message..."
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
    marginTop: 60,
  },
  header: {
    paddingHorizontal: 10,
    flexDirection: 'column',
  },
  backButton: {
    marginRight: 10,
    fontSize: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "200"
  },
  messageList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#d1e7ff',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
  },
  messageText: {
    fontSize: 16,
  },
  timestamp: {
    fontSize: 12,
    color: 'gray',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: config.app.theme.creme,

  },
  messageInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
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
    color: '#fff',
    fontSize: 16,
  },
});

export default Chat;
