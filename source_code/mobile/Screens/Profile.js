import React, { useState, useEffect } from 'react';
import { Platform, View, Text, StyleSheet, TextInput, TouchableWithoutFeedback, Keyboard, Switch, TouchableOpacity, Alert, SafeAreaView, Image, Dimensions, KeyboardAvoidingView } from 'react-native';
import config from '../app.json'
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';


const Profile = (props) => {
  {
    const quick_delete = false;

    // Keybaord open, then hide stuff to fix android bug    
    const [isKeyboardOpen, setKeyboardOpen] = useState(false);
    const screenWidth = Dimensions.get('window').width;
    const imageSize = screenWidth * 0.3;
    const borderRadius = imageSize / 2;

    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        () => {
          setKeyboardOpen(true);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardOpen(false);
        }
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, []);


    // For deletion:
    const [password, setPassword] = useState('');
    const [delAccount, setDelAccount] = useState(false);


    

    const handleLogout = () => {
      // Show confirmation dialog before logging out
      Alert.alert(
        'Logout',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: () => {
            props.logout()
          } 
        },
        ],
        { cancelable: false }
      );
    };

    const handleDeletion = () => {
      if (quick_delete)
      {
        props.deleteAccount("123")
      }
      else
      {
        // Show confirmation dialog before deleting
        Alert.alert(
          'Delete Account',
          'Are you sure you want to delete your account?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'OK', onPress: () => props.deleteAccount(password) },
          ],
          { cancelable: false }
        );
      }
      
    };

    const requestPermission = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "You need to grant media access permission.");
        return false;
      }
      await AsyncStorage.setItem('mediaPermission', status);
      return true;
    };
  
    const pickMedia = async (index) => {
      const permission = await AsyncStorage.getItem('mediaPermission') || await requestPermission();
      if (permission) {
        let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: index ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 1,
          videoMaxDuration: 30,
        });
  
        if (!result.canceled) {
          props.updateMedia(index, result.assets[0])
        }
      }
    };

    
    // Show delete page if deleting
    if (delAccount)
    {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loginFormView}>
            <Text style={styles.logoText}>Delete Your Account</Text>
            <TextInput
              placeholder="Please confirm your password"
              placeholderColor="#c4c3cb"
              style={styles.loginFormTextInput}
              autoCapitalize="none"
              secureTextEntry={true}
              autoCorrect= {false}
              onChangeText={(text) => {setPassword(text)}}
            />
            

          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.buttonWithBorder}
              onPress={() => {handleDeletion()}}
            >
              <Text style={styles.buttonText}>Confirm Deletion</Text>
            </TouchableOpacity>

         

            <TouchableOpacity
              style={styles.buttonWithBorder}
              onPress={()=> {setDelAccount(false)}}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

      )
    }

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          {/* Profile pic and name */}
          <View style={styles.imagecontainer}>
            <Image
              source={{ uri: props.media? props.media?.get(props.user._id)?.media[0].uri : "" }}
              style={{
                  width: imageSize,
                  height: imageSize,
                  borderRadius: borderRadius,
              }}
              resizeMode="cover"
            />
            <Text style = {{fontSize: 20, color: config.app.theme.creme}}>{props.profile.firstName}</Text>
          </View>

          <View>

            <KeyboardAvoidingView>
                  <Text style={styles.label}>Modify bio</Text>
                  <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Your bio"
                  value={props.profile.bio}
                  onChangeText={(text) => handleInputChange('bio', text)}
                  maxLength={300}
                  multiline={false}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  />
              </KeyboardAvoidingView>

              <View style={styles.mediaContainer}>
                <Text style={styles.label}>Modify Images</Text>
                <View style={styles.mediaGrid}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.mediaBox,
                        props.media?.get(props.user._id)?.media[index] && styles.mediaFilled,
                      ]}
                      onPress={() => {pickMedia(index)}}
                      disabled={index > (props.media?.get(props.user._id)?.media ? props.media?.get(props.user._id)?.media.length : 0)}
                    >
                      {props.media?.get(props.user._id)?.media[index] ? (
                        <Image
                          source={{ uri: props.media?.get(props.user._id)?.media[index].uri }}
                          style={styles.mediaPreview}
                        />
                      ) : (
                        <Text style={styles.plusSign}>+</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            
          </View>

          {/* <View style={styles.preferencesContainer}>
            
          </View>
          {!isKeyboardOpen && (
          <View>
            
          <View style={styles.buttonContainer}>
            
            <TouchableOpacity
              style={styles.buttonWithBorder}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonWithBorder}
              onPress={() => {setDelAccount(true)}}
            >
              <Text style={styles.buttonText}>Delete Account</Text>
            </TouchableOpacity>


          </View>
          </View>)} */}
          
        
        </SafeAreaView>
        
        
      </TouchableWithoutFeedback>
    );
  }
};

const styles = StyleSheet.create({
  mediaContainer: {
    marginTop: 20,
  },
  mediaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mediaBox: {
    width: '30%',
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaFilled: {
    borderWidth: 2,
    borderColor: config.app.theme.blue,
  },
  plusSign: {
    fontSize: 24,
    color: '#808080',
  },
  mediaPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '200',
    margin: 5,
  },
  input: {
    borderColor: config.app.theme.grey,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    backgroundColor: config.app.theme.creme
  },
  bioInput: {
    textAlignVertical: 'top',
  },
  imagecontainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: {
    flex: 1,
    margin: 10,
    justifyContent: 'space-between', // Pushes content and buttons to the top and bottom, respectively
  },
  logoText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 60 : 40,
    fontWeight: "100",
    marginTop: Platform.OS === 'ios' && Platform.isPad ? 250 : 150 ,
    marginBottom: 30,
    textAlign: "center",
  },
  errorText: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 24 : 18 ,
    fontWeight: "200",
    marginTop: 20,
    marginBottom: 30,
    marginHorizontal: 40,
    textAlign: "center",
  },
  loginFormTextInput: {
    height: 43,
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 23 : 14,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#eaeaea",
    backgroundColor: "#fafafa",
    paddingLeft: 10,
    marginTop: 5,
    marginBottom: 5,
  },
  buttonWithBorder: {
    backgroundColor: config.app.theme.grey,
    padding: 15,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonText: {
    color: config.app.theme.red
    
  },
  title: {
    fontSize: Platform.OS === 'ios' && Platform.isPad ? 22 : 15,
    alignSelf: 'center',
    fontWeight: 'bold',
    margin: 5,
  },
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin:3,
  },
  preferencesContainer: {
    flex: 1, // Takes up available space in the container
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Platform.OS === 'ios' && Platform.isPad ? 30 : 10
  },
});

export default Profile;
