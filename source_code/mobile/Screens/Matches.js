import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles.js';
import Match from '../Components/Match.js';

const Matches = (props) => {
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
              media={props.media.get(match.uid)}
              onSwipeLeft={props.onSwipeLeft}
            />
          ))}
      </View>
    );
  }
  return null;
};

export default Matches;
