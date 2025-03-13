import React, { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import axios from 'axios';

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Function to register for push notifications
async function registerForPushNotificationsAsync() {
  let token;
  let permissionStatus = 'denied';
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    permissionStatus = finalStatus;
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return { token: null, permissionStatus };
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return { token, permissionStatus };
}

const Push = ({ 
  userId, 
  onTokenReceived, 
  onNotificationReceived, 
  onNotificationResponse, 
  API_URL,
  onNotificationStatusChange // New prop to report status changes
}) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Function to check if notifications are currently enabled
  const checkNotificationStatus = async () => {
    if (!Device.isDevice) {
      setNotificationsEnabled(false);
      return false;
    }
    
    const { status } = await Notifications.getPermissionsAsync();
    const isEnabled = status === 'granted';
    
    setNotificationsEnabled(isEnabled);
    
    // Report status change to parent component
    if (onNotificationStatusChange && typeof onNotificationStatusChange === 'function') {
      onNotificationStatusChange(isEnabled);
    }
    
    return isEnabled;
  };

  // Function to save token to your backend using axios
  const saveTokenToBackend = async (token) => {
    if (!userId || !token) return;
    
    try {
      const response = await axios.post(`${API_URL}/push-token`, {
        token: token,
        device: Platform.OS,
        uid: userId
      });
      
      console.log('Push token saved to backend successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  useEffect(() => {
    // First check current status
    checkNotificationStatus();
    
    // Register for push notifications
    registerForPushNotificationsAsync().then(({ token, permissionStatus }) => {
      if (token) {
        setExpoPushToken(token);
        
        // Call the callback if provided
        if (onTokenReceived && typeof onTokenReceived === 'function') {
          onTokenReceived(token);
        }
      }
      
      // Update notifications status
      const isEnabled = permissionStatus === 'granted';
      setNotificationsEnabled(isEnabled);
      
      // Report status to parent
      if (onNotificationStatusChange && typeof onNotificationStatusChange === 'function') {
        onNotificationStatusChange(isEnabled);
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Call the callback if provided
      if (onNotificationReceived && typeof onNotificationReceived === 'function') {
        onNotificationReceived(notification);
      }
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (onNotificationResponse && typeof onNotificationResponse === 'function') {
        onNotificationResponse(response);
      }
    });
    
    // Setup a listener for changes in notification permissions
    const subscription = Notifications.addPushTokenListener(() => {
      checkNotificationStatus();
    });

    return () => {
      // Clean up listeners when component unmounts
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      subscription.remove();
    };
  }, [onTokenReceived, onNotificationReceived, onNotificationResponse, onNotificationStatusChange]);

  // Save token to backend when we have both a token and userId
  useEffect(() => {
    if (expoPushToken && userId) {
      saveTokenToBackend(expoPushToken);
    }
  }, [expoPushToken, userId]);

  // Expose a method to request notifications permission again
  const requestPermissions = async () => {
    if (!Device.isDevice) return false;
    
    const { status } = await Notifications.requestPermissionsAsync();
    const isEnabled = status === 'granted';
    
    setNotificationsEnabled(isEnabled);
    
    // Report status change to parent component
    if (onNotificationStatusChange && typeof onNotificationStatusChange === 'function') {
      onNotificationStatusChange(isEnabled);
    }
    
    return isEnabled;
  };

  // This component has no UI - it just sets up the notification system
  return null;
};

export default Push;