// Navigation.js
import React from 'react';
import config from "../app.json"
import { NavigationContainer, DefaultTheme} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';


import Discover from './Discover.js'
import Profile from './Profile.js'
import Page2 from './Page2.js'

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'black',//config.app.theme.blue, // Tab icon tint
    background: config.app.theme.blue, // background color is what?
    card: config.app.theme.creme, // Creme: top and bottom theme
    text: 'black', 
    border: 'gray', // thin lines around creme 
  },
};


const Tab = createBottomTabNavigator();

const Navigation = (props) => {

  return (
    <NavigationContainer theme={MyTheme}>
      
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              
              if (route.name === 'Discover') {
                iconName = focused ? 'search' : 'search-outline';
              } else if (route.name === 'Likes') {
                iconName = focused ? 'heart' : 'heart-outline';
              } else if (route.name === 'Chat') {
                iconName = focused ? 'chatbubble' : 'chatbubble-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }
              
              
              return <Icon name={iconName} size={size} color={color} />;
            },
        
            headerShown: false, // Hide the header if not needed
          })}
        >
          <Tab.Screen name="Discover" children={()=>
            <Discover swiped = {props.swiped} currentSuggestion = {props.currentSuggestion}/>}/>

          <Tab.Screen name="Likes" children={()=>
            <Page2 />}/>

          <Tab.Screen name="Chat" children={()=>
            <Page2 />}/>

          <Tab.Screen name="Profile" children={()=>
            <Profile user = {props.user} media = {props.media} profile = {props.profile} updateProfile = {props.updateProfile} logout = {props.logout} deleteAccount = {props.deleteAccount}/>}/>
       
        </Tab.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
