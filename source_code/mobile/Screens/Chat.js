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
  const [messageInput, setMessageInput] = useState('');
  const flatListRef = useRef(null);

  useEffect(() => {
    async function loadMessages() {
      try {
        if (props?.user) {

          // Clear old messages
          props.setMessages([])

          // Bind socket event to listen for functions
          if (isSocketBroken(props.ws.current))
            props.connectWs()


          // Load messages
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

    const time = new Date()

    const newMessage = {
      type: 'message',
      senderId: props.myuid,
      senderName: props.senderName,
      recipientId: props.user.uid,
      text: messageInput,
      timestamp: time
    };

    props.ws.current.send(JSON.stringify(newMessage));
    props.setMessages((prev) => [...prev, {sender: true, message: messageInput, timestamp: time}]);
    setMessageInput('');
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender
          ? styles.myMessage
          : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.message}</Text>
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

      <View style = {{flex: 1, paddingBottom: 10}}>
        <FlatList
          ref={flatListRef}
          data={props.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.timestamp.toString() + item.sender.toString()}
          style={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
          onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Type a message..."
          onFocus={() => {setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100)}}
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
    marginBottom: 10,
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
