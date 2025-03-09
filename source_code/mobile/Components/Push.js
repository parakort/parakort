import React, { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

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
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return token;
}

// API endpoint for your backend
const API_URL = 'https://your-api.com'; // Replace with your actual API URL

const Push = ({ userId, onTokenReceived, onNotificationReceived }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  // Function to save token to your backend
  const saveTokenToBackend = async (token) => {
    if (!userId || !token) return;
    
    try {
      const response = await fetch(`${API_URL}/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Adjust for your auth method
        },
        body: JSON.stringify({
          token,
          device: Platform.OS,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save push token');
      }
      
      console.log('Push token saved to backend successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  useEffect(() => {
    if (!userId) return
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        
        // Call the callback if provided
        if (onTokenReceived && typeof onTokenReceived === 'function') {
          onTokenReceived(token);
        }
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
      // Handle notification response (when user taps on notification)
      console.log('Notification response:', response);
      
      // You could add another callback prop here if needed
    });

    return () => {
      // Clean up listeners when component unmounts
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [onTokenReceived, onNotificationReceived, userId]);

  // Save token to backend when we have both a token and userId
  useEffect(() => {
    if (expoPushToken && userId) {
      saveTokenToBackend(expoPushToken);
    }
  }, [expoPushToken, userId]);

  // This component has no UI - it just sets up the notification system
  return null;
};

export default Push;