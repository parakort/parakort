
import {AppState, Platform, Modal, View, Button, Text, TouchableOpacity, TextInput, TouchableWithoutFeedback, Keyboard, Linking, Image} from 'react-native';
import Navigation from './Screens/Navigation';
import Login from './Components/Login';
import Setup from './Components/Setup.js';
import ConfettiScreen from './Components/ConfettiScreen.js';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useRef } from 'react'
import styles from './styles.js'

import { getLocation } from './utils/location.js';
//import { NetworkInfo } from 'react-native-network-info';
import config from "./app.json"
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import { Vibration } from 'react-native';
import Push from './Components/Push.js';



import Purchases from 'react-native-purchases';

// Should we wait for the suggestions media to load before dropping the splash?
// right now, just waits for the first suggestion, but maybe wait til we load our own too.
const HOLD_SPLASH_FOR_MEDIA = false

const BASE_URL = config.app.server

// Demo video url
const DEMO_URL = "https://youtu.be/udKK51jYs7M"

// RevCat API
const APPL_API = "appl_nXWrNaSRSUiJEYHJmYKpMnIcdUb"
const GOOG_API = "goog_NxhhAZhHJkJSHDfsFAPtYIyEClP"

export default function App() {



  // Confetti effect
  const [triggerEffect, setTriggerEffect] = useState(false);


  const [haltSuggestLoop, setHaltSuggestLoop] = useState(false);

  // Who are we currently chatting with?
  // Closure is created when the onMessage registers, so we create references which won't result in reading stale state.
  const [chatUser, setChatUser] = useState(null);
  const chatUserRef = useRef(chatUser);
  useEffect(() => {
    chatUserRef.current = chatUser?.uid; // Update ref whenever state changes
  }, [chatUser]);

  const [messages, setMessages] = useState([])
  const [unread, setUnread] = useState(false)

  


  // SOCKET CONNECTION

  const ws = useRef(null); // WebSocket reference

  // Navigation ref, so we can change pages programatically
  const navigationRef = useRef(null);



  const handleTriggerEffect = () => {
    setTriggerEffect(true); // Trigger the effect
  };

  const handleEffectComplete = () => {
    setTriggerEffect(false); // Reset trigger for future use
  };



  const [authenticated, setAuthenticated] = useState(false)
  const [setupScreen, setSetupScreen] = useState(true)

  const [subscriptionTier, setSubscriptionTier] = useState(null);
  const [paywall, setPaywall] = useState(false)


  // State value of 'booting' - true while we wait to reach the server, false when we have connected (show splash screen while true)
  const [showSplash, setShowSplash] = useState(true)
  


  const [tokens, setTokens] = useState(0)
  const [location, setLocation] = useState(null)

  // user object we get from logging in
  const [user, setUser] = useState()

  // useRef prevents a redundant persistance 
  const [filters, setFilters] = useState(null)
  const [profile, setProfile] = useState(null)

  // Where user data is stored
  // A reference exists and is to be used in a context where closure exsists such as in registered callbacks like .onmessage webhooks.
  const [media, setMedia] = useState(new Map())              // Links to local files of our matches, fetched synchronously
  const mediaRef = useRef(media);
  useEffect(() => {
    mediaRef.current = media; // Update ref whenever state changes
  }, [media]);

  const [matches, setMatches] = useState(null)          // UID array of our matched users
  const [dislikes, setDislikes] = useState(null)          
  const [likers, setLikers] = useState(null)    
  const [likerCount, setLikerCount] = useState(null)          




  const [suggestions, setSuggestions] = useState(null)  // UID array of suggested users

  const [currentSuggestion, setCurrentSuggestion] = useState(null)  // Current suggested user media



  const prevFilters = useRef(null)
  const prevProfile = useRef(null)
  const prevLocation = useRef(null);
  const QUEUE_LEN = 3

  
  // Check if we are logged in
  const [init, setInit] = useState(true)

  // is this the help modal?
  const [isModalVisible, setModalVisible] = useState(false)


  // Help modal text: Contact message
  const [textInputValue, setTextInputValue] = useState('');


  // NOTIFICATIONS

  const [lastNotification, setLastNotification] = useState(null);
  
  // Function to handle when a notification is received
  const handleNotificationReceived = (notification) => {
    setLastNotification(notification);
    
    // You can implement custom logic here based on notification content
    // For example, navigate to a specific screen or update app state
    console.log('Received notification:', notification);
    
    // Example of accessing notification data:
    const notificationData = notification.request.content.data;
    if (notificationData.type === 'message') {
      // Navigate to messages screen or update message count, etc.
    }
  };

  const handleTokenReceived = (token) => {
    console.log('Push token received:', token);
  };
  
  const handleNotificationResponse = (response) => {
    // console.log('Notification response:', response);
    // We need to check the notification type, if it is a chat, go to the user's chat based on data.senderId, if it is a match, go to the matches screen

    // For the action type (e.g., if user tapped the notification)
    const actionIdentifier = response.actionIdentifier;
    
    // Get the notification content
    const notification = response.notification;
    const request = notification.request;
    const content = request.content;
    
    // Extract basic notification details
    const title = content.title;         // "Peter Buonaiuto"
    const body = content.body;           // "Hello"
    const sound = content.sound;         // "default"
    
    // Extract custom data
    const data = content.data;
    const messageType = data.type;       // "message"
    const senderId = data.sender;        // "66ca6375ee0503fcc92c6a33"
    
    // Get trigger information
    const trigger = request.trigger;
    const triggerType = trigger.type;    // "push"
    if (messageType === 'message') {
      // Navigate to messages screen
      setChatUser((prev) => ({ ...mediaRef.current.get(senderId), uid: senderId }));
      navigationRef.current?.navigate('Matches');

      // set message as read
      axios.post(`${BASE_URL}/readMessage`, {senderId: senderId, recipientId: user._id})
      .then((res) => {
        // update locally
        setMatches((prevMatches) =>
          prevMatches.map((item) =>
            item.uid === senderId ? { ...item, unread: false } : item
          )
        );
      });

    } else if (messageType === 'new_like') {
      // Navigate to matches screen
      navigationRef.current?.navigate('Likes');
    } else {
      console.log("Unhandled type:", messageType)
    }







  };

  // finished setup and tutorial: Show the app content
  function finishedSetup() {
    setSetupScreen(false)
  }

  const [retry, setRetry] = useState(true)

  useEffect(() => {
    if (currentSuggestion)
    {
      // re-enable retry if current suggestion fails
      setRetry(true)
    }
    if (!currentSuggestion && retry)
    {
      setRetry(false)

      setTimeout(() => {
        resumeSuggestLoop(false)
      }, 1000)
    }


  }, [currentSuggestion])

  // When messages change, make sure we mark messages as read if we are on the page
  useEffect(() => {
    if (chatUser && messages.length > 0) {
    // If our currently opened chat is marked as unread, mark it as read
      if (matches.find((item) => ( item.mutual && item.uid == chatUser.uid)).unread)
      {

        axios.post(`${BASE_URL}/readMessage`, {senderId: chatUser.uid, recipientId: user._id})
        .then((res) => {


          // update locally
          setMatches((prevMatches) => 
            prevMatches.map((item) => 
              item.uid === chatUser.uid ? { ...item, unread: false } : item
            )
          );
          
        })
      }
    }
  }, [ matches])


  // When matches update, check if there is an unread message
  useEffect(() => {
    if (matches)
    {
      setUnread(matches.some((item) => (item.mutual && item.unread)))
    }

  }, [matches])



  // Refresh
  useEffect(() => {
    if (user) {
      // Connect to WebSocket server
      connectWs()

      // Runs when this socket gets a message
      // We also have an .onmessage in the Chat component.
      ws.current.onmessage = (event) => {
        const receivedMessage = JSON.parse(event.data);
        if (receivedMessage.type === 'update') {
          fetchData()

          if (receivedMessage.sender && receivedMessage.sender != chatUserRef.current)
          { 
            // Long buzz since we're not in the chat
            Vibration.vibrate(400);

            // We got a message from this user, and the app is open. Put a notification if we aren't on a chat with them
            Toast.show({
              type: 'info',
              text1: receivedMessage.senderName,
              text2: receivedMessage.messagePreview,
              onPress: async () => {
                if (!mediaRef.current.get(receivedMessage.sender))
                  await downloadMediaFiles(receivedMessage.sender)
            
                setChatUser((prev) => ({ ...mediaRef.current.get(receivedMessage.sender), uid: receivedMessage.sender }));
                navigationRef.current?.navigate('Matches');

                Toast.hide()
              }
            });

          }
        }

        if (chatUserRef.current && receivedMessage.type === 'message') {
          setMessages((prev) => [...prev, JSON.parse(event.data)]);
          // Short buzz since we're in the chat already
          Vibration.vibrate(100);
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
      };



      return () => {
        ws.current?.close(); // Clean up WebSocket connection
      };



    }

  }, [user])


  function connectWs()
  {
    ws.current = new WebSocket(`ws://${BASE_URL.substring(BASE_URL.indexOf("//") + 2, BASE_URL.indexOf(":", 5))}:8080`);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        // Register this user with the WebSocket server
        ws.current.send(
          JSON.stringify({ type: 'register', userId: user._id })
        );
      };
  }

  async function fetchData() {


    if (user)
    {
      const response = await axios.post(`${BASE_URL}/getData`, {user: user._id})
    
      setMatches((prevMatches) => {
        const newMatches = response.data.matches.filter(
          (newMatch) => !prevMatches.some((prevMatch) => prevMatch.uid === newMatch.uid)
        );
      
        // Should only be one
        newMatches.forEach(async (match) => {

          if (match.mutual)
          {
            // Download their media (it should already be, since we swiped on them, unless we say if match.mutual in getMedia())
            if (!media.get(match.uid)) await downloadMediaFiles(match.uid)

            // Two buzzes for a new liker
            Vibration.vibrate([100, 100, 100, 100]);

            Toast.show({
              type: 'success',
              text1: 'New match!',
              text2: `${media.get(match.uid).profile.firstName + " " + media.get(match.uid).profile.lastName} matched you back!`,
              onPress: async () => {
            
                setChatUser((prev) => ({ ...media.get(match.uid), uid: match.uid }));
                navigationRef.current?.navigate('Matches');
  
                Toast.hide()
              }
            });

          }
        })
      

        // Return the total value that came through, before we split it
        return response.data.matches;
      });

      if (response.data.likers)
      {
        setLikers((prevLikers) => {
          const newLikers = response.data.likers.filter(
            (newLiker) => !prevLikers.some((prevLiker) => prevLiker === newLiker)
          );

        
          // Should only be one
          newLikers.forEach(async (liker) => {

            // Download their media (it should already be, since we swiped on them, unless we say if liker.mutual in getMedia())
            if (!media.get(liker)) await downloadMediaFiles(liker)
            // Two buzzes for a new liker
            Vibration.vibrate([100, 100, 100, 100]);

            Toast.show({
              type: 'error',
              text1: 'New liker!',
              text2: `${media.get(liker).profile.firstName + " " + media.get(liker).profile.lastName} liked you!`,
              onPress: () => {
            
                navigationRef.current?.navigate('Likes');

                Toast.hide()
              }
            });

            
          })
        
          // Return both new and old (before we split)
          return response.data.likers;
        });
      }
      else  {
        setLikerCount(response.data.likerCount)

        if (response.data.likerCount > likerCount)
        {
          // Two buzzes for a new liker
          Vibration.vibrate([100, 100, 100, 100]);

          Toast.show({
            type: 'error',
            text1: 'Someone liked you!',
            text2: response.data.likerCount > 1 ? `Tap to reveal ${response.data.likerCount} likers` : "Tap to reveal their identity!",
            onPress: () => {
          
              navigationRef.current?.navigate('Likes');
  
              Toast.hide()
            }
          });
        }

        

      }
      setDislikes(response.data.dislikes)

       
        

    }
    

  };


  // User loads messages between them and a recipient
  async function loadMessages(senderId, recipientId) {
    try {
      const response = await axios.get(`${BASE_URL}/messages/${senderId}/${recipientId}`);
      return response.data; // Returns the array of messages
    } catch (error) {

      if (error.response.status == 404) return []

      console.error("Error loading messages", error);
      throw error; 
    }
  }



  // Update media item, replacing with new if existing
  // If we provide a falsey value (or nothing) to new_media param, it will delete the media at the given index and not replace it
  // This will shift all others so we avoid gaps in the media.
  async function updateMedia(index, new_media)
  {
    // Check if we're trying to replace media 
    if (index < (media.get(user._id)? media.get(user._id).media.length : 0))
    {
      // delete the existing media at index
      await axios.post(`${BASE_URL}/deleteMedia`, {uid: user._id, index: index, shift: !new_media})
      .then(async (res) => {

      })
      .catch((e) =>{
        console.log("Error deleting media file:", e)
      })
    }

    // Upload the new media
    if (new_media) await uploadMedia([new_media])

    // Download the latest media locally, which will show the new media item on the profile page
    downloadMediaFiles(user._id)

  }

  // Media to cloud links
  async function uploadMedia(media)
  {
    //let links = [] // cloud links to the user's images

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
        await axios.post(`${BASE_URL}/uploadMedia`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
  
        // Log the response
        //console.log('File uploaded at:', response.data);
        //links.push(response.data)

      } catch (error) {
        console.error(error);
        Alert.alert('Error', `Failed to upload ${file.fileName}`);
      }
    }

    // No longer returning links, because they are not direct downloadable.
    //return links
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
   * Can update an array element as well, in this matter:
   * ex: updateFilter('sports', { index: 1, data: { my_level: 2, match_level: [1, 2] } });
   * 
   * Values not provided when updating an object in an array, will remain unchanged.
   */
  const updateNestedKey = (filters, key, value) => {
    const keys = key.split('.');
    let result = { ...filters }; // Make a shallow copy of the filters object
    let temp = result;

    keys.forEach((cur, idx) => {
        if (idx === keys.length - 1) {
            if (Array.isArray(temp[cur])) {
                const index = value.index; // Assuming value contains an index property
                const newItemValues = value.data; // New values to set
                // Merge the existing object with the new values
                temp[cur][index] = { ...temp[cur][index], ...newItemValues };
            } else {
                temp[cur] = value; // For non-array cases, just update the key directly
            }
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

// when any of these fields are modified, we will refresh suggestions
// If we poll for new dislikes value, which we do, this will trigger on each poll
// Could be a good thing, to periodically check.
const refreshTriggers = [dislikes, location]
useEffect(() => {

  if (haltSuggestLoop) resumeSuggestLoop(false)

}, refreshTriggers)

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
    // if we are resetting dislikes, be sure to change them locally too.
    // This will allow the trigger to have the latest info when we try to resume
    if (field == "dislikes") 
      {
        setDislikes(newValue)
      }

    

    axios.post(`${BASE_URL}/updateField`, {uid: user?._id, field: field, newValue: newValue})

    
  }

  
  // Download a given user's profile pics from the cloud
  // Deletes existing content if it exists
  // we call this if we want to forecefully get the user's latest pictures
  const downloadMediaFiles = async (uid) => {

    // If we have the user's media, just return it
    // If we do, it will have to be from this app state, since we delete all media when the app is opened
    // 2 reasons to just return it: 1) It hasn't been that long since we opened the app 2) We should never download a user's media twice anyway, very rare in one app state.
    //if (media.has(uid)) return media.get(uid)
    // I don't do this because it only makes sense in testing for edge cases 
    
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
        try {
          await RNFS.unlink(file.path);
        } catch (error) {

        }
      }
    }
  
    try {
      // Now redownload all files
      const res = await axios.post(`${BASE_URL}/downloadMedia`, { uid });
      
      let localMedia = res.data.media;
      let userProfile = res.data.profile;
      let sports = res.data?.sports? res.data?.sports : null
      
  
      for (const media of localMedia) {
        media.uri = await saveFileFromBuffer(media);
        try {
          await Image.prefetch(media.uri);
          // console.log(`Image preloaded successfully: ${media.uri}`);
        } catch (error) {
          // console.error(`Failed to preload image: ${media.uri}`, error);
        }

        delete media.data; // We don't need to store the buffer locally
      }

      // Media object holds the user's profile and media
      let userMedia = {profile: userProfile, media: localMedia, sports: sports}
      
      // we have the media for this user. Store it in the media Map, which will store in async storage also
      setMedia((prevMedia) => {
        const updatedMap = new Map(prevMedia);
        updatedMap.set(uid, userMedia);
        return updatedMap;
      });
      

      return userMedia
      

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

// remove the lock on the suggest loop and try again
function resumeSuggestLoop(clearSuggestions)
{
  // If we were unable to match with users
  if (haltSuggestLoop)
  {
    setHaltSuggestLoop(false)
    suggestUser()


  } 
  // if we were able to match (we have matches) but we changed filters,
  // we need to empty suggestions and restart.
  // I think i should keep the first, because we can avoid the loading screen, and it will likely still meet our filters
  else if (clearSuggestions && suggestions)
  {
    setSuggestions((prevItems) => [...prevItems.slice(0, 1)]);
    
    suggestUser()

  }

}


  
  // The following side effects persist data to mongo
  // Data is automatically persisted when updating a value with state.
  // For filters, we have a updateFilter function to update only one filter at a time.
  // Should filters be in AsyncStorage? Not right now, because what if we want to support users who use multiple devices?
  useEffect(() => {
    if (location) {

      const prev = prevLocation.current;
      const hasMoved =
        prev &&
        haversineDistance(
          prev.lat,
          prev.lon,
          location.lat,
          location.lon
        ) >= 1;

      if (!prev || hasMoved) {
        updateField("location", location);
        resumeSuggestLoop(true); // Incase our new location filter allows for more users
        prevLocation.current = location;
      }
    }
  }, [location]);

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8; // Earth's radius in miles
    const toRadians = (degrees) => degrees * (Math.PI / 180);
  
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in miles
  }

  
  useEffect(() => {
    // Ignores the first update (does not persist), because that is the one coming from the database (would be redundant).
    if (!!filters && !!prevFilters.current && !deepEqual(filters, prevFilters.current)) {

        updateField("filters", filters);

        // Remove the lock on the loop if it exists, because our filters changed
        resumeSuggestLoop(true);
    }

    if (filters) prevFilters.current = JSON.parse(JSON.stringify(filters)); // Deep copy of filters

}, [filters]);


  // Check if filters really changed
  function deepEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  // Helper function to log differences between two objects
function logDifferences(obj1, obj2, log) {
  const differences = [];
  
  // Compare keys in obj1
  for (const key in obj1) {
    if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
      differences.push({ key, obj1: obj1[key], obj2: obj2[key] });
    }
  }

  // Compare keys in obj2 that might not exist in obj1
  for (const key in obj2) {
    if (!(key in obj1)) {
      differences.push({ key, obj1: undefined, obj2: obj2[key] });
    }
  }

  // Log the differences
  if (log)
  {
    if (differences.length > 0) 
      differences.forEach(diff => {
        console.log(`Key: ${diff.key}`);
        console.log(`prevFilters.current:`, diff.obj1);
        console.log(`filters:`, diff.obj2);
      });


    else console.log("No differences found.");
  }
 
  return differences
  
}

  // Recursive loop to suggest users for a match
  // Their media is downloaded beforehand
  useEffect(() => {


    if (suggestions)
    {
      AsyncStorage.setItem('suggestions', JSON.stringify(suggestions))

      // Do we need to generate more? Recurse if so.
      if ((suggestions.length < QUEUE_LEN) && !haltSuggestLoop) {
        suggestUser()
      }

      // Update the current suggestion to always point to the first item - can't we just use a pointer?
      setCurrentSuggestion(media.get(suggestions[0]));
      
    }

    
    

  }, [suggestions])

  useEffect(() => {
    async function getMedia()
    {
      // Load suggestions from async storage
      // State side effect will ensure we generate enough suggestions, recursively
      let storedSuggestions = await AsyncStorage.getItem('suggestions');
      storedSuggestions = storedSuggestions? JSON.parse(storedSuggestions) : []
      setSuggestions(storedSuggestions)

      // Download the first suggestion first so we can load the media asap
      if (storedSuggestions.length) setCurrentSuggestion(await downloadMediaFiles(storedSuggestions[0]))

      // When the first suggestion media is loaded, we can remove the splash to show the app
      if (HOLD_SPLASH_FOR_MEDIA) setShowSplash(false)
      

      // Download latest media for ourself & our matches / suggestions, in parallel.
      for (const uid of storedSuggestions.slice(1))  downloadMediaFiles(uid)
      for (const match of matches)          downloadMediaFiles(match.uid)
      for (const liker of likers)          downloadMediaFiles(liker)
      
      downloadMediaFiles(user._id)
      
    }

    // The first update (coming from the database, when prevProfile is null,) we want to use to download the media
    if (profile && !prevProfile.current)
    {
      getMedia() // Download latest profile and image information for all stored users
    }
    
    // Ignores the first update (does not persist), because that is the one coming from the database (would be redundant).
    if (profile && profile !== prevProfile.current) {
      updateField("profile", profile)
      prevProfile.current = profile;
    } 
    
  }, [profile])

  const deleteAllFiles = async () => {
    try {
      // Directory path, e.g., RNFS.DocumentDirectoryPath or any valid directory path
      const directoryPath = RNFS.DocumentDirectoryPath;

      // List all files in the directory
      const files = await RNFS.readDir(directoryPath);

      // Delete each file
      for (const file of files) {
        await RNFS.unlink(file.path);
      }

      console.log("deleted all local files")
    } catch (err) {
      console.log(err)
    }
  };

  // Suggest new user
  // will grab an ID to suggest, add it to the array, and download their media
  // swiped: Should we remove the first user (yes if we swiped)
  function suggestUser(swiped) {
    if (!location)
    {
      // Location didn't load yet, quit. This function will be called again
      return
    }

    // Remove the first suggestion if either
    // A: the list is full
    // B: we swiped

    setSuggestions(prevSuggestions => {
      if (swiped || prevSuggestions.length >= QUEUE_LEN) {
        // Create a new array excluding the first item
        return prevSuggestions.slice(1);
      }
      // If no modification is needed, return the original array
      return prevSuggestions;
    });
    
    
    // Send an array of UIDs which we are matched with (mutual is irrelevant) and 
    // (TODO) also send an array of history (users we should exclude)
    //console.log(suggestions)

    axios.post(`${BASE_URL}/suggestUser`, {uid: user._id, filters: filters, location: location, dislikes: dislikes, suggestions: suggestions, matches: matches.map((obj) => {return obj.uid})})
    .then((res) => {
      
      console.log("Suggested", res.data)

      // Start a media download for the user if we don't have their media from recently
      if (!media.has(res.data)) downloadMediaFiles(res.data)

      // Add the user to the suggestion array (side effect will generate more users if needed)
      setSuggestions((prevSuggestions) => {
        // Ensure no duplicates by checking against existing suggestions
        const isDuplicate = prevSuggestions.some((s) => s === res.data);
        if (!isDuplicate) {
          return [...prevSuggestions, res.data];
        }
        return prevSuggestions;
      });
      

    })
    .catch((e) => {
      if (e.response.status == 404)
      {
        //console.log("No suitable users")

        // Stop trying and display no more users
        setHaltSuggestLoop(true)
        

      }
      else
      {
      console.log("Error suggesting user", e)

      }
    })
  }

  async function refreshSuggestion()
  {
    if (suggestions[0]) setCurrentSuggestion(await downloadMediaFiles(suggestions[0]))
  }

  // Delete media by uid: Aside from expiry, we can delete a media object (user profile and their media ) directly
  // used when swiping left, or blocking someone, for example
  function deleteMedia(uid) { 

    // Abort if this user is in our suggestions list
    if (suggestions.includes(uid)) return

    // Shallow copy of the map
    const updatedMap = new Map(media);
  
    updatedMap.delete(uid);
    // remove the media locally
    try
    {
      RNFS.unlink(`${RNFS.DocumentDirectoryPath}/${uid}`)
    }
    catch (error)
    {
      console.log("Error deleting media folder", uid, error)
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

        // axios.post(`${BASE_URL}/appOpened`, {user_id: user._id})
      }
        
    }
    

  };

  // When we first open the app

  useEffect(() => {
    // Delete existing media
    //deleteAllFiles() // We do this because we will re-download everything that is still necessary.

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
  }

// match a user
function matchUser(usr)
{
  // move suggestions[0] to matches, useEffect should update in DB.
  // we do not need to downloadMedia, it is already downloaded.

  // Is it mutual?
  axios.post(`${BASE_URL}/matchUser`, {source: user._id, dest: usr})
  .then((res) => {
    let mutual = res.data
    // We don't need to persist to DB here, because we do it in this /matchUser api call.
    setMatches([...matches, {uid: usr, mutual: mutual}])

    if (mutual)
    {
      // fun effect
      handleTriggerEffect()
    }
    
  })
  .catch((e) => {
    console.log("Error matching user:",e)
  })
}

// unmatch a user, swiped left on our match page
function unmatch(uid)
{
  setMatches(prevItems => 
    prevItems.filter(item => item.uid !== uid) // Filter out the item to remove
  );
  // delete the media for this user
  deleteMedia(uid)

  // dislike this user
  setDislikes([...dislikes, uid])

  axios.post(`${BASE_URL}/unmatchUser`, {src: user._id, dest: uid})
  .then((res) => {

  })
  .catch((e) => {
    console.log("Error unmatching user:",e)
  })
}
// We swiped on a user.
function swiped(right)
{

  // Make sure we haven't already matched
  // This isn't necessary, because, the match algorithm will not include current matches.
  // Temporary, for testing, since there is no match algorithm yet.
  // We want to check if it is another user & exists, or if its myself, if it's not mutual.
  if (! ( (suggestions[0] == user._id) ? (matches.some(item => (item.uid === suggestions[0] && item.mutual))) :  matches.some(item => item.uid === suggestions[0])))
  {
    if (right)
    {
      matchUser(suggestions[0])

    }
    else
    {
      unmatch(suggestions[0])
      

    }
  }
  // Suggest a new user, which will shift the suggestions as well

  setHaltSuggestLoop(true)
  suggestUser(true)
  setHaltSuggestLoop(false)


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
    setSubscriptionTier(res.data.user.subscription_tier? res.data.user.subscription_tier.charAt(0).toUpperCase() + res.data.user.subscription_tier.slice(1).toLowerCase() : null)

    // user will be used for the immutable fields such as name, email, id.
    // if we bundle all of it into user, like bundling filters too, we can't isolate state changes.
    const { _id, email} = res.data.user;
    setUser({ _id, email});

    setFilters(res.data.user.filters)
    setMatches(res.data.user.matches)
    if (res.data.user.likers) setLikers(res.data.user.likers)
    else setLikerCount(res.data.user.likerCount)

    setDislikes(res.data.user.dislikes)

    // if we don't have a profile object, user has not yet been setup
    setSetupScreen(!res.data.user.profile)

    // Do this last, because it will trigger the media downloads, and we need our matches and filters (and likers)
    // ready to go for downloading media and for generating suggestions.
    setProfile(res.data.user.profile)

    

    
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
    
    // We now wait to remove the splash until we load the first user's images
    if (!HOLD_SPLASH_FOR_MEDIA) setShowSplash(false) // we finished our attempt to login, so we can hide the splash screen
    setAuthenticated(true)
    
  })
  .catch((e) => {
    console.log('Error in logIn app.js: ', e)
    //console.log(e.response.status)
    // need to show login screen again
    setShowSplash(false)
    
  })
}

// Purchase subscription with tier system
const purchase = async (tier) => {
  try {
    // Define mapping between tiers and RevenueCat offerings package identifiers
    const tierPackages = {
      'pro': 'Pro',
      'premium': 'Premium',
      'elite': 'Elite'
    };
    
    // Validate tier
    if (!tierPackages[tier]) {
      throw new Error('Invalid subscription tier');
    }
    
    // Get all offerings
    const offerings = await Purchases.getOfferings();
    
    if (!offerings.current) {
      throw new Error('No offerings available');
    }
    
    // Find the package that matches the requested tier
    const packageToPurchase = offerings.current.availablePackages.find(
      pkg => pkg.identifier === tierPackages[tier]
    );
    
    if (!packageToPurchase) {
      throw new Error(`No package found for ${tier} tier`);
    }
    
    try {
      // Make the purchase
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(packageToPurchase);
      
      // Check if the subscription is active for the purchased tier
      if (typeof customerInfo.entitlements.active[tier] !== "undefined") {
        // Successful purchase, grant tokens and update subscription status
        axios.post(`${BASE_URL}/newSubscriber`, {
          user_id: user._id,
          tier: tier // Include the tier in the request
        })
        .then((response) => {
          // Update tokens locally
          setTokens(response.data.tokens);
          setSubscriptionTier(tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()); // New state to track the subscription tier
          console.log(`Subscribed to ${tier} tier!`);
          // UI feedback here for subscription
        })
        .catch((e) => {
          // User was charged, but server made an error
          // Issue refund / log the error
          console.log('Backend error:', e);
        });
      } else {
        console.log("Subscription not active");
      }
    } catch (e) {
      if (!e.userCancelled) {
        console.log('Purchase error:', e);
      }
    }
  } catch (e) {
    // User canceled, no wifi etc
    alert('Error Purchasing. You were not charged.');
    console.log('Setup error:', e);
  }
};



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
          <Navigation paywall = {paywall} setPaywall = {setPaywall} subscriptionTier = {subscriptionTier} Purchases = {Purchases} likerCount = {likerCount} unread = {unread} ref = {navigationRef} messages = {messages} setMessages = {setMessages} chatUser={chatUser} setChatUser={setChatUser} loadMessages = {loadMessages} connectWs = {connectWs} ws = {ws} serverUrl = {BASE_URL} resumeSuggestLoop = {resumeSuggestLoop} haltSuggestLoop = {haltSuggestLoop} updateField = {updateField} matchUser = {matchUser} unmatch = {unmatch} likers = {likers} dislikes = {dislikes} matches = {matches} refreshSuggestion = {refreshSuggestion} updateFilter = {updateFilter} filters = {filters} updateMedia = {updateMedia} swiped = {swiped} currentSuggestion = {currentSuggestion} user = {user} media = {media} profile = {profile} updateProfile = {updateProfile} help = {showHelpModal} deleteAccount = {deleteAccount} purchase = {purchase} logout = {logOut} tokens = {tokens}></Navigation>
          
          {/* Notifications */}
          {user._id && (
        <Push 
          userId={user._id}
          onNotificationReceived={handleNotificationReceived}
          // onTokenReceived={handleTokenReceived}
          onNotificationResponse={handleNotificationResponse}
          API_URL={BASE_URL}
        />
      )}

          {/* Confetti Screen */}
          <ConfettiScreen
            trigger={triggerEffect}
            onComplete={handleEffectComplete}
            message="Instant Match!"
          />
          
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

          <Toast />
        </>
    );
  }
  return(
    <Login login = {loggedIn} api = {BASE_URL}></Login>
  )

  
}

