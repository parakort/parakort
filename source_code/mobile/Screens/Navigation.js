import React from 'react';
import config from "../app.json";
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import { View, StyleSheet } from 'react-native';

import Discover from './Discover.js';
import Profile from './Profile.js';
import Matches from './Matches.js';
import Likes from './Likes.js';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: 'black', // config.app.theme.blue, // Tab icon tint
    background: config.app.theme.blue, // background color is what?
    card: config.app.theme.creme, // Creme: top and bottom theme
    text: 'black',
    border: 'gray', // thin lines around creme 
  },
};

// Custom component for Matches tab icon
const MatchesIcon = ({ focused, color, size, unread }) => (
  <View style={styles.iconContainer}>
    <Icon
      name={focused ? 'chatbubble' : 'chatbubble-outline'}
      size={size}
      color={color}
    />
    {unread && <View style={styles.redDot} />}
  </View>
);

const Tab = createBottomTabNavigator();

const Navigation = React.forwardRef((props, ref) => {

  return (
    <NavigationContainer theme={MyTheme} ref={ref}>
      
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            if (route.name === 'Matches') {
              return (
                <MatchesIcon
                  focused={focused}
                  color={color}
                  size={size}
                  unread={props.unread}
                />
              );
            }
            let iconName;
            if (route.name === 'Discover') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Likes') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Discover" children={()=>
          <Discover 
            resumeSuggestLoop={props.resumeSuggestLoop} 
            haltSuggestLoop={props.haltSuggestLoop} 
            refreshSuggestion={props.refreshSuggestion} 
            swiped={props.swiped} 
            currentSuggestion={props.currentSuggestion}
          />
        }/>

        <Tab.Screen name="Likes" children={()=>
          <Likes 
            onSwipeLeft={props.unmatch} 
            onSwipeRight={props.matchUser} 
            media={props.media} 
            likers={props.likers} 
            dislikes={props.dislikes} 
            matches={props.matches}
            likerCount={props.likerCount}
            Purchases = {props.Purchases}
            purchase = {props.purchase}
            subscriptionTier = {props.subscriptionTier}

          />
        }/>

        <Tab.Screen name="Matches">
          {() => (
            <Matches
              messages={props.messages}
              setMessages={props.setMessages}
              user={props.chatUser}
              setUser={props.setChatUser}
              loadMessages={props.loadMessages}
              connectWs={props.connectWs}
              ws={props.ws}
              serverUrl={props.serverUrl}
              myuid={props.user._id}
              onSwipeLeft={props.unmatch}
              matches={props.matches}
              media={props.media}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="Profile" children={()=>
          <Profile 
            updateField={props.updateField} 
            updateFilter={props.updateFilter} 
            filters={props.filters} 
            updateMedia={props.updateMedia} 
            user={props.user} 
            media={props.media} 
            profile={props.profile} 
            updateProfile={props.updateProfile} 
            logout={props.logout} 
            deleteAccount={props.deleteAccount}
          />
        }/>
      </Tab.Navigator>
    </NavigationContainer>
  );
});

const styles = StyleSheet.create({
  iconContainer: {
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
});

export default Navigation;
