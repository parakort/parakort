import React, { useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import styles from '../styles.js';
import Liker from '../Components/Liker.js';

const Likes = (props) => {
  const matchUids = useMemo(() => 
    props.matches
      .filter(match => match.mutual)
      .map(match => match.uid), 
    [props.matches]
  );

  const filteredLikers = useMemo(() => 
    props.likers
      .filter(liker => 
        !props.dislikes.includes(liker) && 
        !matchUids.includes(liker)
      ), 
    [props.likers, props.dislikes, matchUids]
  );

  function handleSwipeLeft (liker)
    { props.onSwipeLeft(liker) }


    function handleSwipeLeft (liker)
    { props.onSwipeRight(liker) }

  if (props.likers && props.matches)
    return (
      <View style={styles.screen}>
        <Text style={{ fontSize: 25, fontWeight: "100", paddingBottom: 10 }}>New Likers</Text>

        {filteredLikers.map((liker, index) => (
          <Liker 
            onSwipeLeft={handleSwipeLeft} 
            onSwipeRight={handleSwipeRight} 
            key={index} 
            index={index} 
            liker={liker} 
            media={props.media.get(liker)} 
          />
        ))}
      </View>
    );

  if (props.likerCount == 0)
    return (
      <View style={styles.screen}>
        <Text style={{ fontSize: 25, fontWeight: "100", paddingBottom: 10 }}>New Likers</Text>
        <View style={{ display: "flex", alignSelf: "center", alignContent: "center" }}>
          <Text>Premium users can view their likers easily.</Text>
          <Text>Upgrade now!</Text>
        </View>
      </View>
    );

  return (
    <View style={styles.screen}>
      <Text style={{ fontSize: 25, fontWeight: "100", paddingBottom: 10 }}>New Likers</Text>
      <View style={{ display: "flex", alignSelf: "center", alignContent: "center" }}>
        <Text>You have {props.likerCount > 0 ? `${props.likerCount} ` : ""}liker{props.likerCount == 1 ? "" : "s"}!</Text>
        <Text>Upgrade to reveal their identit{props.likerCount == 1 ? "y" : "ies"}.</Text>
      </View>
    </View>
  );
};

export default Likes;
