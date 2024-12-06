// Navigation.js
import React from 'react';
import config from "../app.json"
import { NavigationContainer, DefaultTheme} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';


import Discover from './Discover.js'
import Profile from './Profile.js'
import Matches from './Matches.js'
import Likes from './Likes.js';

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
              } else if (route.name === 'Matches') {
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
            <Discover refreshSuggestion = {props.refreshSuggestion} swiped = {props.swiped} currentSuggestion = {props.currentSuggestion}/>}/>

          <Tab.Screen name="Likes" children={()=>
            <Likes onSwipeLeft = {props.unmatch} onSwipeRight = {props.matchUser} media = {props.media} likers = {props.likers} dislikes = {props.dislikes} matches = {props.matches}/>}/>

          <Tab.Screen name="Matches" children={()=>
            <Matches  onSwipeLeft = {props.unmatch} matches = {props.matches} media = {props.media}/>}/>

          <Tab.Screen name="Profile" children={()=>
            <Profile updateField = {props.updateField} updateFilter = {props.updateFilter} filters = {props.filters} updateMedia = {props.updateMedia} user = {props.user} media = {props.media} profile = {props.profile} updateProfile = {props.updateProfile} logout = {props.logout} deleteAccount = {props.deleteAccount}/>}/>
       
        </Tab.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
