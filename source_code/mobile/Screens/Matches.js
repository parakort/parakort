import React, { useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import styles from '../styles.js';
import Match from '../Components/Match.js';
import Chat from './Chat.js';

const Matches = (props) => {



  // Display chat if we are chatting
  if (props.user) {
    return <Chat senderName = {props.media.get(props.myuid).profile.firstName + " " + props.media.get(props.myuid).profile.lastName} messages = {props.messages} setMessages = {props.setMessages} loadMessages={props.loadMessages} connectWs={props.connectWs} ws={props.ws} myuid={props.myuid} serverUrl={props.serverUrl} user={props.user} setUser={props.setUser} />;
  }

  if (props?.matches) {
    // Sort matches by timestamp in descending order
    const sortedMatches = props.matches
      .filter(match => match.mutual) // Filter to include only matches with mutual: true
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by descending timestamp

    return (
      <View style={styles.screen}>
        <Text style={{ fontSize: 25, fontWeight: '100', paddingBottom: 10 }}>
          My Matches
        </Text>
        <FlatList
          data={sortedMatches}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Match
              match={item.uid} // Only send the ID of the user
              media={props?.media.get(item.uid)}
              onSwipeLeft={props.onSwipeLeft}
              onPress={() => props.setUser({ ...props?.media.get(item.uid), uid: item.uid })}
              myid={props.myuid}
            />
          )}
        />
      </View>
    );
  }
  return null;
};

export default Matches;
