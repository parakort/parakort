import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';

const SocialModal = ({ isVisible, onClose, provider, updateProfile, username }) => {
  const [text, setText] = useState('');

  // Update text state when username prop changes
  useEffect(() => {
    setText(username);
  }, [username]);

  const handleSubmit = () => {
    console.log('Entered Text:', text); // Handle the entered text
    updateProfile(`socials.${provider}`, text);
    onClose(); // Close the modal
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.modalContent}>
        <Text style={styles.title}>Enter your {provider} username</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type here..."
          returnKeyType="done"
          onSubmitEditing={handleSubmit} // Handle "Enter" key
        />
        <Button title="Submit" onPress={handleSubmit} />
        <Button title="Cancel" onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    marginBottom: 10,
    padding: 10,
  },
});

export default SocialModal;
