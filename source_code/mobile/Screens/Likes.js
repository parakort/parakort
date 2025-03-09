import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Liker from '../Components/Liker.js';
import styless from '../styles.js';
import { useNavigation } from '@react-navigation/native';


const Likes = (props) => {
  const matchUids = useMemo(() =>
    props.matches
      .filter(match => match.mutual)
      .map(match => match.uid),
    [props.matches]
  );

  const navigate = useNavigation();

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
  if (props.subscriptionTier === 'Premium' || props.subscriptionTier === 'Elite') {
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
            <Text style={styles.benefitText}>Skip the waiting game</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.upgradeButton}
          onPress={() => {props.paywall(); navigate.navigate('Profile')}}
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
    marginTop: 20,
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
  // New styles for the enhanced paywall
  paywallContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  blurOverlay: {
    height: 200,
    backgroundColor: 'rgba(103, 58, 183, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likesCountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#673AB7',
  },
  ctaContainer: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
  },
  ctaHeading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubheading: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    marginVertical: 20,
    backgroundColor: '#f9f5ff',
    padding: 16,
    borderRadius: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    color: '#673AB7',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  benefitText: {
    fontSize: 16,
    color: '#444',
  },
  upgradeButton: {
    backgroundColor: '#673AB7',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#673AB7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guaranteeText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 16,
    fontSize: 14,
  }
});

export default Likes;