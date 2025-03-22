import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Liker from '../Components/Liker.js';
import styless from '../styles.js';
import { useNavigation } from '@react-navigation/native';

// App color scheme
const theme = {
  red: "#F9063C",
  blue: "#849bff",
  creme: "#FFFFF1",
  grey: "#e0e0e0",
  gray: "#6f6f6f",
  black: "#2f2e2e"
};

const Likes = (props) => {
  const matchUids = useMemo(() =>
    props.matches
      .filter(match => match.mutual)
      .map(match => match.uid),
    [props.matches]
  );

  const navigate = useNavigation();

  const filteredLikers = useMemo(() =>
    props.likers?.filter(liker =>
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
    navigate.navigate('Matches');
  }


  // If user has likers and is subscribed, show the likers
  if (props.subscriptionTier === 'Pro' || props.subscriptionTier === 'Premium' || props.subscriptionTier === 'Elite') {
    // If user has no likers
    if (props.likers.length === 0) {
      return (
        <View style={styless.screen}>
          <Text style={{ fontSize: 25, fontWeight: '100', paddingBottom: 10 }}>New Likers</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nobody liked your profile yet.</Text>
            <Text style={styles.emptySubtext}>Check back soon!</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={styless.screen}>
        <Text style={{ fontSize: 25, fontWeight: '100', paddingBottom: 10 }}>New Likers</Text>
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

  // Enhanced subscription CTA for non-subscribed users
  return (
    <View style={styles.paywallContainer}>
      <View style={styles.blurOverlay}>
        <Text style={styles.likesCountText}>
          {props.likerCount > 0 ? (props.likerCount > 1 ? `${props.likerCount} people liked you!` : 'Someone liked you!') : 'Want to see who liked you?'}
        </Text>
      </View>
      
      <View style={styles.ctaContainer}>
        <Text style={styles.ctaHeading}>Unlock Your Secret Admirers</Text>
        <Text style={styles.ctaSubheading}>
          See who's already interested in you and match instantly!
        </Text>
        
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>See everyone who likes you</Text>
          </View>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Match instantly with your admirers</Text>
          </View>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>View nearby courts</Text>
          </View>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>More swipes per day</Text>
          </View>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitIcon}>✓</Text>
            <Text style={styles.benefitText}>Remove ads</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => {props.showPaywall("Premium");}}
          activeOpacity={0.8}
        >
          <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
        </TouchableOpacity>
        
        <Text style={styles.guaranteeText}>
          Boost your matches by up to 3x with Premium
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: theme.creme,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "300",
    color: theme.black,
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  emptyContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: theme.creme,
    borderRadius: 16,
    
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.black,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: theme.gray,
    marginTop: 8,
    textAlign: 'center',
  },
  // New styles for the enhanced paywall
  paywallContainer: {
    flex: 1,
    backgroundColor: theme.creme,
  },
  blurOverlay: {
    height: 200,
    backgroundColor: `${theme.blue}20`, // Using blue with 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  likesCountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.blue,
  },
  ctaContainer: {
    padding: 24,
    backgroundColor: theme.creme,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    flex: 1,
    shadowColor: theme.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  ctaHeading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.black,
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubheading: {
    fontSize: 16,
    color: theme.gray,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    marginVertical: 20,
    backgroundColor: `${theme.blue}10`, // Using blue with 10% opacity
    padding: 16,
    borderRadius: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    color: theme.blue,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  benefitText: {
    fontSize: 16,
    color: theme.black,
  },
  upgradeButton: {
    backgroundColor: theme.blue,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: theme.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  upgradeButtonText: {
    color: theme.creme,
    fontSize: 18,
    fontWeight: 'bold',
  },
  guaranteeText: {
    textAlign: 'center',
    color: theme.gray,
    marginTop: 16,
    fontSize: 14,
  }
});

export default Likes;