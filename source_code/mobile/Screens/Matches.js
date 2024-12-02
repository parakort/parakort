import React, { useState, useEffect } from 'react';
import {
  View, Text
} from 'react-native';
import styles from '../styles.js'
import Match from '../Components/Match.js';

// Render a list of all meals saved in the database
const Matches = (props) => {



  if (props.matches)
  return (
    <View style = {styles.screen}>
      <Text style = {{fontSize: 25, fontWeight: 100, paddingBottom: 10}}>My Matches</Text>

      {props.matches
        .filter(match => match.mutual) // Filter to include only matches with mutual: true
        .map((match, index) => (
          <Match key={index} index={index} match={match} media = {props.media.get(match.uid)} />
        ))}

    </View>
  );
};

export default Matches;
