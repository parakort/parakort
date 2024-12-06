import React from 'react';
import { View, Text } from 'react-native';
import styles from '../styles.js';
import Liker from '../Components/Liker.js';

// List all of the people who liked us, who are not in our dislikes, and are not in our matches
const Likes = (props) => {
  const matchUids = props.matches
    .filter(match => match.mutual) // Filter only mutual matches
    .map(match => match.uid);      // Map to uid values

  if (props.likers && props.matches)
    return (
      <View style={styles.screen}>
        <Text style={{ fontSize: 25, fontWeight: "100", paddingBottom: 10 }}>New Likers</Text>

        {props.likers
          .filter(
            (liker) =>
              !props.dislikes.includes(liker) && // Exclude if in dislikes array
              !matchUids.includes(liker)    // Exclude if in matches array
          )
          .map((liker, index) => (
              <Liker onSwipeLeft = {props.onSwipeLeft} onSwipeRight = {props.onSwipeRight} key={index} index={index} liker={liker} media={props.media.get(liker)} />
          ))}
      </View>
    );
};

export default Likes;
