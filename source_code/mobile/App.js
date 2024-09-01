
import {AppState, Platform, Modal, View, StyleSheet, Text, TouchableOpacity, TextInput, TouchableWithoutFeedback, Keyboard, Linking, Image} from 'react-native';
import Navigation from './Screens/Navigation';
import Login from './Components/Login';
import Setup from './Components/Setup.js';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react'
import styles from './styles.js'

import { getLocation } from './utils/location.js';
//import { NetworkInfo } from 'react-native-network-info';
import config from "./app.json"
import RNFS from 'react-native-fs';



import Purchases from 'react-native-purchases';

const BASE_URL = config.app.server

// Demo video url
const DEMO_URL = "https://youtu.be/udKK51jYs7M"

// RevCat API
const APPL_API = "appl_iymEcrjJXGyUyYLMNqGXZYiaKvP"
const GOOG_API = "goog_NxhhAZhHJkJSHDfsFAPtYIyEClP"

export default function App() {

  // useEffect(() => {
  //   NetworkInfo.getIPV4Address().then(ipv4Address => {
  //     console.log(ipv4Address)
  //   });
  // }, []);

  const [authenticated, setAuthenticated] = useState(false)
  const [setupScreen, setSetupScreen] = useState(true)

  const [subscribed, setSubscribed] = useState(false)

  // State value of 'booting' - true while we wait to reach the server, false when we have connected (show splash screen while true)
  const [showSplash, setShowSplash] = useState(true)
  


  const [tokens, setTokens] = useState(0)
  const [location, setLocation] = useState(null)

  // user object we get from logging in
  const [user, setUser] = useState()

  // useRef prevents a redundant persistance 
  const [filters, setFilters] = useState(null)
  const [profile, setProfile] = useState(null)
  const [media, setMedia] = useState(null)

  const prevFilters = useRef(null)
  const prevProfile = useRef(null)
  const MEDIA_EXPIRE_AFTER = 3

  
  // Check if we are logged in
  const [init, setInit] = useState(true)

  // is this the help modal?
  const [isModalVisible, setModalVisible] = useState(false)


  // Help modal text: Contact message
  const [textInputValue, setTextInputValue] = useState('');

  // finished setup and tutorial: Show the app content
  function finishedSetup() {
    setSetupScreen(false)
  }

  // Media to cloud links
  async function uploadMedia(media)
  {
    let links = [] // cloud links to the user's images

    for (const file of media) {
      try {
        // Prepare the form data
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.fileName,
          type: file.mimeType
        });

        // Specify this is a new user (needs a new folder)
        formData.append('new', profile.media.length )
        formData.append('uid', user._id)
  
        // Send the file to the server
        const response = await axios.post(`${BASE_URL}/uploadMedia`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
  
        // Log the response
        //console.log('File uploaded at:', response.data);
        links.push(response.data)

      } catch (error) {
        console.error(error);
        Alert.alert('Error', `Failed to upload ${file.fileName}`);
      }
    }

    return links
  }

  // provided all profile details: save to db
  // First time only
  // Edits will be handled like filters
  // One function that responds to state updates
  // Images must be considered carefully:
  // Must upload media too through endpoint.
  async function makeProfile(profile_in)
  {
    // Upload the new user's media and store their profile
    uploadMedia(profile_in.media)
    setProfile(profile_in) // side effect will update db
  }

  /** 
   * @FILTERS
   * Function to update a specific filter
   */
  const updateNestedKey = (filters, key, value) => {
    const keys = key.split('.');
    let result = { ...filters }; // Make a shallow copy of the filters object
    let temp = result;

    keys.forEach((cur, idx) => {
        if (idx === keys.length - 1) {
            temp[cur] = value; // Update the final key with the new value
        } else {
            temp[cur] = { ...temp[cur] }; // Make sure we don't mutate the original object
            temp = temp[cur];
        }
    });

    return result; // Return the updated filters object
};

// Updates a specific filter with state (not in db)
const updateFilter = (filterType, newValue) => {
    setFilters(prevFilters => updateNestedKey(prevFilters, filterType, newValue));
};

// Updates a specific profile key with state (not in db)
const updateProfile = (key, newValue) => {
  setProfile(prevProfile => updateNestedKey(prevProfile, key, newValue));
};



  /**
   * Passes the update request to the server to persist the data
   * @param {String} field 
   * @param {*} newValue 
   */
  function updateField(field, newValue) 
  {
    axios.post(`${BASE_URL}/updateField`, {uid: user?._id, field: field, newValue: newValue})
  }

  
  // Download a given user's profile pics from the cloud
  // Deletes existing content if it exists
  // we call this if we want to forecefully get the user's latest pictures
  // (we won't call to get our own pics if we already have them)
  const downloadMediaFiles = async (uid, does_expire) => {
    // Define a path where this user's media is to be stored
    const directoryPath = `${RNFS.DocumentDirectoryPath}/${uid}`;
  
    // Check if the directory exists for the user's pictures
    const directoryExists = await RNFS.exists(directoryPath);
  
    // If the directory does not exist, create it
    if (!directoryExists) {
      await RNFS.mkdir(directoryPath);
    } else {
      // If directory does exist, delete existing data, it is out of date
      const files = await RNFS.readDir(directoryPath);
  
      // Iterate over the files and delete each one
      for (const file of files) {
        await RNFS.unlink(file.path);
      }
    }
  
    try {
      // Now redownload all files
      const res = await axios.post(`${BASE_URL}/downloadMedia`, { uid });
      let localMedia = res.data.media;
      let userProfile = res.data.profile;
  
      for (const media of localMedia) {
        media.uri = await saveFileFromBuffer(media);
        delete media.data; // We don't need to store the buffer locally
      }

      // Media object which also has the expiry field so we can delete temporary users (in cache for swiping) after time
      // 0 expiry users will never expire (self, matches)
      let userMedia = {profile: uid == user._id ? null : userProfile, media: localMedia, expiry: does_expire? MEDIA_EXPIRE_AFTER: 0}
  
      // we have the media for this user. Store it in the media Map, which will store in async storage also
      const updatedMap = new Map(media);
      updatedMap.set(user._id, userMedia)
      setMedia(updatedMap)
      

    } catch (error) {
      console.error('Error downloading media files:', error);
      return null; // Handle errors or return a meaningful value
    }
  };
  



// Function to save the file from Base64 string
const saveFileFromBuffer = async (media) => {

  const filePath = `${RNFS.DocumentDirectoryPath}/${user._id}/${media.name}`;
  const buffer = media.data

  try {
    await RNFS.writeFile(filePath, buffer, 'base64'); // Directly use base64Data
    return filePath
  } catch (error) {
    console.error('Error saving file:', error);
  }
};

  
  // The following side effects persist data to mongo
  // Data is automatically persisted when updating a value with state.
  // For filters, we have a updateFilter function to update only one filter at a time.
  // Should filters be in AsyncStorage? Not right now, because what if we want to support users who use multiple devices?
  useEffect(() => {
    
    // location.timestamp can be used for 'last seen'
    // this allows other users to get the latest location of this user
    if (location) 
    {
      updateField("location", location)
    }
    
  }, [location])

  
  useEffect(() => {
    
    // Ignores the first update (does not persist), because that is the one coming from the database (would be redundant).
    if (filters && filters !== prevFilters.current) {
      updateField("filters", filters)
      prevFilters.current = filters;
    } 
    
  }, [filters])

  useEffect(() => {
    async function getMedia()
    {
      // check if we already have user's profile media
      const directoryPath = `${RNFS.DocumentDirectoryPath}/${user._id}`;
      const directoryExists = await RNFS.exists(directoryPath);

      // check if we have the map
      const storedMapString = await AsyncStorage.getItem('mediaMap');
      let mediaMap = new Map();

      if (storedMapString) {
        // Convert the stored string back to a Map
        const storedMapArray = JSON.parse(storedMapString);
        mediaMap = new Map(storedMapArray);
        setMedia(mediaMap) // save the existing media in state
      }
      

      // If we don't have this user's media stored
      if (!mediaMap.has(key) || !directoryExists) {

        // Download media and store in the map 
        // false so that this media does not expire
        // false is for self or matches, true for swipes
        downloadMediaFiles(user._id, false)
        
      }
    }

    // The first update (coming from the database, when prevProfile is null,) we want to use to download the media
    if (profile && !prevProfile.current)
    {
      getMedia() // ensure we have our own media
    }
    
    // Ignores the first update (does not persist), because that is the one coming from the database (would be redundant).
    if (profile && profile !== prevProfile.current) {
      updateField("profile", profile)
      prevProfile.current = profile;
    } 
    
  }, [profile])


  // Save media map in storage for next time
  // triggered through downloadMedia(uid), where we want the media for a user
  // here, we can handle expiry as well.
  // A new item was just added, so we need to decrease expiry for each item by 1
  // for any items with expiry 1, delete from the map
  useEffect(() => {
    if (media)
    {
      async function saveMedia()
      {
        // Save the map to async storage for next time
        const mapArray = Array.from(media.entries()); // Convert the Map to an array
        await AsyncStorage.setItem('mediaMap', JSON.stringify(mapArray));
      }
      

      saveMedia()
    }
    
    
  }, [media])

  // Shift media:
  // increases age of all media by 1 such that they all become closer to expiry or expired
  function shiftMedia() {
    const updatedMap = new Map(media);
  
    for (const key of updatedMap.keys()) {
      const updatedValue = { ...updatedMap.get(key) }; // Create a shallow copy, since we use .set later. Could just make a deep copy and not use .set, also.
  
      if (updatedValue.expiry === 1) {
        updatedMap.delete(key);
        // remove the media locally
        try
        {
          RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${id}}`)
        }
        catch (error)
        {
          console.log("Shift: Error deleting media folder ", key, error)
        }
        

      } else if (updatedValue.expiry > 1) {
        // Decrease expiry by 1
        updatedValue = { ...updatedValue, expiry: updatedValue.expiry - 1 };
        updatedMap.set(key, updatedValue);
      }
    }

    
  
    // Save the new media with state and to local storage
    setMedia(updatedMap);
  }

  // Delete media by uid: Aside from expiry, we can delete a media object (user profile and their media ) directly
  function deleteMedia(uid) {
    // Shallow copy of the map
    const updatedMap = new Map(media);
  
    updatedMap.delete(key);
    // remove the media locally
    try
    {
      RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${id}}`)
    }
    catch (error)
    {
      console.log("Error deleting media folder ", key, error)
    }

    // Save the new media with state and to local storage
    setMedia(updatedMap);
  }


  // Help modal
  const handleChangeText = (text) => {
    setTextInputValue(text);
  };

  // Submit help message
  const handleSubmit = () => {
    // Close modal
    closeModal();

    // Send the message
    axios.post(`${BASE_URL}/contact`, {msg: textInputValue, uid: user._id, email: user.email})
    .then(() => {
      alert("Your message was recieved!")
    })
    .catch(() => {
      alert("We're sorry, there was an error.\nPlease email app.TheClubhouse@gmail.com")
    })
    setTextInputValue('');
  };






  const handleAppStateChange = async newState => {
    if (newState === 'active') {
      // App opened. User is not dormat.
      // If we need this depends on if we reach /user when opening the app, even if it's in the background will it run /user again?
      // probably not... 

      // we are updating user location whenever they open the app, not just when the app restarts
      // is this overkill?
      // @TODO what if we logout the user when the app is closed?
     
      if (user?._id)
      {
        
        // Get their current location
        const { location, error } = await getLocation();
        if (error) {
          console.log("error with location: ", error)
          // permission denied - do not allow them in to app

        } else {
          
          // We have their location!
          setLocation({lat: location.coords.latitude, lon: location.coords.longitude})
        
        }

        axios.post(`${BASE_URL}/appOpened`, {user_id: user._id})
      }
        
    }
    

  };

  useEffect(() => {
    // Subscribe to AppState changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    //console.log("Opened")

    // Clean up subscription when component unmounts
    return () => {
      appStateSubscription.remove();
    };
  }, []);

  

  // Hide / show the help modal
  const showHelpModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };


  // Log out through preference page
  function logOut()
  {
    AsyncStorage.removeItem('token')
    setAuthenticated(false)
  }

   // Delete account through preference page
   function deleteAccount(password)
   {
    AsyncStorage.getItem('token')
    .then((id) => {

      axios.post(`${BASE_URL}/deleteAccount`, {id: id, password: password})
      .then((res) => {
        // Deleted account successfully, logout now
        AsyncStorage.removeItem('token')
        setAuthenticated(false)

      })
      .catch((e) => {
        // could not delete, display error
        if (e.response.status == 400)
        {
          alert("Failed to delete your account. Your password was incorrect.")

        }
        else if (e.response.status == 404)
        {
          alert("Failed to delete your account: User not found")

        }
        else{
          alert("Failed to delete your account. Please try again later")

        }
        
        console.log("Error deleting account:", e.response.status)
      })
     

    })
    
   }

  

  

  // On first load, get values from storage and restore state
  if (init)
  {
    setInit(false)

    console.log('initializing')

    // Load user data from DB
    // if we have the token, we have their db content (todo)
    AsyncStorage.getItem('token').then(value => {
      if (value)
      {
        logIn(value)
      }
      else
      {
        // We are not log in, hide the splash screen (to present the login page)
        setShowSplash(false)
      }
    })
    

    // Initialize preferences
    // Prefs are to be saved after modifying one: set state variable and store
    AsyncStorage.getItem('preferences').then(value => {
      if(value)
        setPreferences(JSON.parse(value))
    })


  }

// middleware Login from login screen: Must set token because it definitely is not set
function loggedIn(token, new_user)
{
  AsyncStorage.setItem('token', token)
  logIn(token) // stores user data locally
}


// Log in: load user data and authenticate

// New user has never used the app before
// New account is if we just made this account
function logIn(token)
{
  
  // get user info from the database. This can load paid features, etc
  axios.post(`${BASE_URL}/user`, {user_id: token})
  .then(async (res) => {

    setTokens(res.data.tokens)
    setSubscribed(res.data.user.subscribed)

    // user will be used for the immutable fields such as name, email, id.
    // if we bundle all of it into user, like bundling filters too, we can't isolate state changes.
    const { _id, email} = res.data.user;
    setUser({ _id, email});

    setFilters(res.data.user.filters)
    setProfile(res.data.user.profile)

    // if we don't have a profile object, user has not yet been setup
    setSetupScreen(!res.data.user.profile)

    

    // They logged in: If location is null, it is a new account, so get their location
    // actually, don't we get their location upon EVERY login? yeah ...
   
      // Get their current location
      // why do we need to do this if we do it every time we open the app?
      const { location, error } = await getLocation();
      if (error) {
        console.log("error with location: ", error)
        // permission denied - do not allow them in to app

      } else {
        // We have their location!
        setLocation({lat: location.coords.latitude, lon: location.coords.longitude})
        
      
      }
    
  
    
    // Allow purchasing subscriptions
    // this can happen as soon as we get the user id
    try {
      if (Platform.OS === 'ios')
      {
        await Purchases.configure({apiKey: APPL_API, appUserID: token})
      }
      else
      {
        await Purchases.configure({apiKey: GOOG_API, appUserID: token})
      }
    }
    catch {
      console.log("RevenueCat failed to initialize")
    }
    
    setShowSplash(false) // we finished our attempt to login, so we can hide the splash screen
    setAuthenticated(true)
    
  })
  .catch((e) => {
    console.log('Error in logIn app.js: ', e)
    //console.log(e.response.status)
    // need to show login screen again
    setShowSplash(false)
    
  })
}

// Purchase subscription
const purchase = async () => {
  try {
      // Try to make the purchase
      //Purchases.getOfferings()
      products = await Purchases.getProducts(['cards']);
      product = products[0]
      //console.log(product)
      try {
        const {customerInfo, productIdentifier} = await Purchases.purchaseStoreProduct(product);
        if (typeof customerInfo.entitlements.active['pro'] !== "undefined") {
          // Successfull purchase, grant tokens
          axios.post(`${BASE_URL}/newSubscriber`, {user_id: user._id})
          .then((response) => {
            // Update tokens locally
            setTokens(response.data.tokens)
            setSubscribed(true)
            console.log("Subscribed!")

            // UI feedback here for subscription

          })
          .catch((e) => {
            // User was charged, but my server made an error
            // issue refund / log the error
            console.log(e)
          })
        }
        else
        {
          //console.log("LOCKED")
        }
      } catch (e) {
        if (!e.userCancelled) {
          console.log(e)
        }
      }

      
      
  }
  catch(e)
  { // User canceled, no wifi etc
      alert('Error Purchasing. You were not charged.')
  }
}




// Show splash screen while attempting to authenticate.

if (showSplash)
  {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={require('./assets/splash.png')}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
        resizeMode="cover"
      />
      </View>
    )
  }

  if (authenticated)
  {
    // Only return app if we setup our account first
    if (setupScreen)
    {
      return (
        <Setup makeProfile = {makeProfile} finishedSetup = {finishedSetup} ></Setup>
      )
    }

    return (
      <>
          {/* Navigation is the actual Screen which gets displayed based on the tab cosen */}
          <Navigation user = {user} media = {media} profile = {profile} updateProfile = {updateProfile} help = {showHelpModal} deleteAccount = {deleteAccount} subscribed = {subscribed} purchase = {purchase} logout = {logOut} tokens = {tokens}></Navigation>
          
          
          {/* Help Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={closeModal}
          >
            <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.modalContent}>
                {/* Title and Close Button */}
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Help</Text>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>x</Text>
                  </TouchableOpacity>
                </View>

{/* Main Content view (Top / button) */}
              <View style = {{flex:1, justifyContent: 'space-between'}}>
{/* Message Content */}
              <View style ={{marginTop: '5%'}}>
              <Text style={styles.text}>Have a comment / concern?</Text>
                <TextInput
                  style={{
                    height: Platform.OS === 'ios' && Platform.isPad ? 300 : 190,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: 'gray',
                    padding: 10,
                    margin: 5,
                    fontSize: Platform.OS === 'ios' && Platform.isPad ? 25 : 14
                  }}
                  multiline={true}
                  numberOfLines={10}
                  value={textInputValue}
                  onChangeText={handleChangeText}
                />
                {(textInputValue && 
                <TouchableOpacity onPress={() => handleSubmit()} style={styles.demoButton}>
                  <Text style={styles.buttonText}>Send Message</Text>
                </TouchableOpacity>
                )}
              </View>

                    {/* Tutorial appears on the button  */}
              <View>
                <Text style={styles.text}>Or, watch a video app walkthrough</Text>

                <TouchableOpacity onPress={() => {Linking.openURL(DEMO_URL)
      .catch((err) => console.error('An error occurred', err))}} style={styles.demoButton}>
                  <Text style={styles.buttonText}>Watch Tutorial</Text>
                </TouchableOpacity>
              </View>

              </View>
              {/* Above ends the main content view (top and bottom) */}
                
              </View>
              </TouchableWithoutFeedback>
            </View>
          </Modal>
        </>
    );
  }
  return(
    <Login login = {loggedIn} api = {BASE_URL}></Login>
  )

  
}

