import React, { useState } from 'react';
import { View, Text } from 'react-native';
import styles from '../styles.js';
import Match from '../Components/Match.js';
import Chat from './Chat.js';

const Matches = (props) => {
  // User reference for chat system
  const [user, setUser] = useState(null);

  // Display chat if we are chatting
  if (user) {
    return <Chat loadMessages = {props.loadMessages} connectWs = {props.connectWs} ws = {props.ws} myuid = {props.myuid} serverUrl = {props.serverUrl} user={user} setUser={setUser} />;
  }

  if (props?.matches) {
    return (
      <View style={styles.screen}>
        <Text style={{ fontSize: 25, fontWeight: '100', paddingBottom: 10 }}>
          My Matches
        </Text>
        {props.matches
          .filter((match) => match.mutual) // Filter to include only matches with mutual: true
          .map((match, index) => (
            <Match
              key={index}
              match={match.uid} // Only send the ID of the user : we know it is mutual due to the above comment.
              media={props?.media.get(match.uid)}
              onSwipeLeft={props.onSwipeLeft}
              onPress={() => setUser({ ...props?.media.get(match.uid), uid: match.uid })}
              myid={props.myid}
            />
          ))}
      </View>
    );
  }
  return null;
};

export default Matches;
