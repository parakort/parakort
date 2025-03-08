import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Liker from '../Components/Liker.js';
import Subscribe from '../Components/Subscribe.js';

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
  
  function handleSwipeLeft(liker) { 
    props.onSwipeLeft(liker); 
  }
  
  function handleSwipeRight(liker) { 
    props.onSwipeRight(liker); 
  }
  
  
  // If user has likers and is subscribed, show the likers
  if (props.subscribed && props.likers && props.matches) {
    return (
      <View style={styles.screen}>
        <Text style={styles.headerText}>New Likers</Text>
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
  }
  
  // If user has no likers
  if (props.likerCount === 0) {
    return (
      <View style={styles.screen}>
        <Text style={styles.headerText}>New Likers</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No one has liked your profile yet.</Text>
          <Text style={styles.emptySubtext}>Check back soon!</Text>
        </View>
      </View>
    );
  }
  
  // If user has likers but isn't subscribed, show the premium option
  return (
    <View style={styles.fullScreen}>
      <Subscribe 
        Purchases={props.Purchases}
        likerCount={props.likerCount}
        purchase={props.purchase}
        subscriptionTier = {props.subscriptionTier}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerText: {
    fontSize: 28,
    fontWeight: "300",
    color: '#333',
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#424242',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#757575',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Likes;