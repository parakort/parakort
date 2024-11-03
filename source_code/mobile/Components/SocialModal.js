import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Linking, StyleSheet, Image } from 'react-native';
import Modal from 'react-native-modal';
import config from "../app.json"

const SocialModal = ({ isVisible, onClose, provider, updateProfile, username }) => {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('')
  const [appUrl, setAppUrl] = useState('')
  const [icon, setIcon] = useState('')



  // Update text state when username prop changes
  useEffect(() => {
    setText(username);
  }, [username]);

  // Update nav links when user changes profile username
  useEffect(() => {
    switch (provider)
    {
        case "instagram":
        {
            setAppUrl(`instagram://user?username=${text}`)
            setUrl(`https://www.instagram.com/${text}`)
            break
        }
        case "linkedin":
        {
            setAppUrl(`linkedin://in/${text}`)
            setUrl(`https://www.linkedin.com/in/${text}`)
            break
        }
        case "facebook":
        {
            setAppUrl(`fb://profile/${text}`)
            setUrl(`https://www.facebook.com/${text}`)
            break
        }
    }
  }, [text])

  // Update icon link based on provider
  useEffect(() => {
    switch (provider)
    {
        case "instagram":
        {
            setIcon(require('../assets/social-icons/instagram.png'))
            break
        }
        case "linkedin":
        {
            setIcon(require('../assets/social-icons/linkedin.png'))
            break
        }
        case "facebook":
        {
            setIcon(require('../assets/social-icons/facebook.png'))
            break
        }
    }
  }, [provider])

  const handleSubmit = () => {
    updateProfile(`socials.${provider}`, text);
    onClose(); // Close the modal
  };

  const handleLinkTest = async() => {
    // Test the social link
    try {
        const supported = await Linking.canOpenURL(appUrl);
        await Linking.openURL(supported ? appUrl : url);
      } catch (error) {
        console.log(error);
      }
  }

  return (
    <Modal isVisible={isVisible} onBackdropPress={() => {setText(username); onClose()}}>
      <View style={styles.modalContent}>
        <View style = {styles.matContainer}>
            <Image style={styles.icon} source={icon} />
        </View>

        <Text style={styles.title}>Enter your {provider} username</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type here..."
          returnKeyType="none"
        />
        <View style = {{display: "flex", flexDirection: "row", justifyContent: "space-between", width: "90%"}}>
            <TouchableOpacity
                style={{...styles.navButton, backgroundColor: config.app.theme.grey}}
                onPress={() => handleLinkTest()}
                >
                <Text>Test Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={{...styles.navButton, backgroundColor: config.app.theme.blue}}
                onPress={() => handleSubmit()}
                >
                <Text  style={{color: config.app.theme.creme}}>Submit</Text>
            </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    matContainer: {
        width: "20%",
        backgroundColor: "white", 
        borderRadius: 50, 
        padding: 10, // Adjust padding to control mat size
        position: "absolute",
        top: "-25%"
    },
    
    icon: {
        width: "100%",
        height: "100%",
        aspectRatio: 1,
    },
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
  navButton: {
    padding: 10,
    margin: 5,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
});

export default SocialModal;
