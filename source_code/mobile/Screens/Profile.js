import React, { useState, useEffect } from 'react';
import { Platform, View, Text, Button, StyleSheet, TextInput, TouchableWithoutFeedback, Keyboard, Switch, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Preferences = (props) => {
  {
    const quick_delete = true;

    // Keybaord open, then hide stuff to fix android bug    
    const [isKeyboardOpen, setKeyboardOpen] = useState(false);

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

    const navigation = useNavigation();


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
              style={[styles.buttonWithBorder, styles.customButton]}
              onPress={() => {handleDeletion()}}
            >
              <Text style={styles.buttonText}>Confirm Deletion</Text>
            </TouchableOpacity>

         

            <TouchableOpacity
              style={[styles.buttonWithBorder, styles.customButton]}
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
          <View style={styles.preferencesContainer}>
            
          </View>
          {!isKeyboardOpen && (
          <View>
            
          <View style={styles.buttonContainer}>
            
            <TouchableOpacity
              style={[styles.buttonWithBorder, styles.customButton]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonWithBorder, styles.customButton]}
              onPress={() => {setDelAccount(true)}}
            >
              <Text style={styles.buttonText}>Delete Account</Text>
            </TouchableOpacity>


          </View>
          </View>)}
          
        
        </SafeAreaView>
        
        
      </TouchableWithoutFeedback>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
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
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 5,
  },
  customButton: {
    padding: 10,
  },
  buttonText: {
    color: 'red',
    
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

export default Preferences;
