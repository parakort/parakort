import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
  Image,
  Animated,
  Easing,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import config from "../app.json";

const { width } = Dimensions.get('window');

const Subscribe = ({ Purchases, purchase, subscriptionTier, close }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('Premium'); // Default selected tier
  const [borderAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(1));
  const translateX = useRef(new Animated.Value(0)).current;
  
  const flatListRef = useRef(null);
  
  // Available tiers
  const tiers = ['Pro', 'Premium', 'Elite'];
  const selectedIndex = tiers.indexOf(selectedTier);
  
  // Subscription tier colors
  const tierColors = {
    Pro: [config.app.theme.blue, '#A5B9FF'],      // Blue
    Premium: [config.app.theme.red, '#FF5478'],   // Red
    Elite: ['#2f2e2e', config.app.theme.gray]     // Black to Gray
  };
  
  // Tier features
  const tierFeatures = {
    Pro: [
      "75 Swipes per day",
      "No ads",
    ],
    Premium: [
      "See who likes your profile",
      "100 swipes per day",
      "No ads"
    ],
    Elite: [
      "See who likes your profile",
      "Unlimited matches per day",
      "AI Court recommendations",
      "No ads"
    ]
  };

  // Check subscription status function
  const checkSubscriptionStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      
      if (customerInfo.entitlements.active.Elite) {
        return 'Elite';
      } else if (customerInfo.entitlements.active.Premium) {
        return 'Premium';
      } else if (customerInfo.entitlements.active.Pro) {
        return 'Pro';
      } else {
        return null; // Not subscribed
      }
    } catch (e) {
      return null;
    }
  };

  // Get subscription offerings
  const getSubscriptionOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages;
      } else {
        // Fallback to getProducts
        const products = await Purchases.getProducts(['pro_subscription', 'premium_subscription', 'elite_subscription']);
        
        return products.map(product => ({
          identifier: product.productId.includes('pro') ? 'pro' :
                     product.productId.includes('premium') ? 'premium' : 'elite',
          product: product,
          offeringIdentifier: 'subscriptions'
        }));
      }
    } catch (e) {
      console.log('Error fetching offerings:', e);
      return [];
    }
  };

  useEffect(() => {
    const loadSubscriptionData = async () => {
      // Get available packages
      const availablePackages = await getSubscriptionOfferings();
      setPackages(availablePackages);
      setLoading(false);
    };
    
    loadSubscriptionData();
    
    // Border animation
    Animated.loop(
      Animated.timing(borderAnimation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Pulsing scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ])
    ).start();
  }, []);

  // Create interpolation for border color
  const borderColor = borderAnimation.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [
      tierColors[selectedTier][0],
      tierColors[selectedTier][1],
      tierColors[selectedTier][0],
      tierColors[selectedTier][1],
      tierColors[selectedTier][0],
      tierColors[selectedTier][1]
    ]
  });

  // Helper to get price from package
  const getPackagePrice = (identifier) => {
    const pkg = packages.find(p => p.identifier.toLowerCase() === identifier.toLowerCase());
    if (!pkg) return '';
    
    if (pkg.product) {
      if ('introPrice' in pkg.product && pkg.product.introPrice) {
        return pkg.product.introPrice.priceString;
      }
      return pkg.product.priceString;
    } else {
      if (pkg.product.introPrice) {
        return pkg.product.introPrice.priceString;
      }
      return pkg.product.priceString;
    }
  };

  // Tier selection handler
  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    
    if (flatListRef.current) {
      const index = tiers.indexOf(tier);
      flatListRef.current.scrollToIndex({ 
        index: index, 
        animated: true 
      });
    }
  };

  // Handle scroll failures
  const handleScrollToIndexFailed = (info) => {
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ 
          index: info.index, 
          animated: false 
        });
      }
    }, 100);
  };

  // Handle swipe gestures
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      
      // Determine swipe direction
      if (translationX > 70 && selectedIndex > 0) {
        // Swipe right - previous plan
        handleTierSelect(tiers[selectedIndex - 1]);
      } else if (translationX < -70 && selectedIndex < tiers.length - 1) {
        // Swipe left - next plan
        handleTierSelect(tiers[selectedIndex + 1]);
      }
      
      // Reset translation
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true
      }).start();
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={close}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <LinearGradient
          colors={tierColors[selectedTier]}
          style={styles.gradientHeader}
        >
          <Text style={styles.headerText}>Choose Your Plan</Text>
        </LinearGradient>
        
        <View style={styles.tierSelector}>
          {tiers.map(tier => (
            <TouchableOpacity
              key={tier}
              style={[
                styles.tierTab,
                selectedTier === tier && {borderBottomColor: tierColors[tier][0], borderBottomWidth: 3}
              ]}
              onPress={() => handleTierSelect(tier)}
            >
              <Text style={[styles.tierText, selectedTier === tier && {color: tierColors[tier][0]}]}>
                {tier}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <GestureHandlerRootView style={styles.gestureContainer}>
          <PanGestureHandler
            onGestureEvent={onGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
          >
            <Animated.View 
              style={[
                styles.contentContainer,
                { transform: [{ translateX }] }
              ]}
            >
              <FlatList
                ref={flatListRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false}
                data={tiers}
                keyExtractor={(item) => item}
                initialScrollIndex={tiers.indexOf('Premium')}
                getItemLayout={(data, index) => ({
                  length: width * 0.9,
                  offset: (width * 0.9) * index,
                  index,
                })}
                onScrollToIndexFailed={handleScrollToIndexFailed}
                renderItem={({item: tier}) => (
                  <View style={[styles.tierDetails, {width: width * 0.9}]}>
                    <Image 
                      source={require('../assets/premium-badge.png')}
                      style={styles.premiumImage} 
                      resizeMode="contain"
                    />
                    
                    <View style={styles.featureList}>
                      <Text style={styles.featureTitle}>
                        {tier} Benefits:
                      </Text>
                      {tierFeatures[tier].map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                          <View style={[styles.bulletPoint, {backgroundColor: tierColors[tier][0]}]} />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                    
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceLabel}>Price:</Text>
                      <Text style={[styles.priceText, {color: tierColors[tier][0]}]}>
                        {getPackagePrice(tier) + '/month' || 'Loading...'}
                      </Text>
                    </View>
                  </View>
                )}
              />
            </Animated.View>
          </PanGestureHandler>
        </GestureHandlerRootView>
        
        <View style={styles.buttonContainer}>
          <Animated.View
            style={[
              styles.animatedBorder,
              {
                borderColor: borderColor,
                transform: [{ scale: scaleAnimation }],
              },
            ]}
          >
            <TouchableOpacity 
              onPress={() => purchase(selectedTier.toLowerCase())} 
              style={styles.subscribeButton}
              disabled={selectedTier === subscriptionTier}
            >
              <LinearGradient
                colors={tierColors[selectedTier]}
                style={styles.gradientButton}
              >
                <Text style={styles.buttonText}>
                  {subscriptionTier && selectedTier === subscriptionTier 
                    ? 'You own this plan!' 
                    : `${subscriptionTier? "Switch" : "Subscribe"} to ${selectedTier}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        <Text style={styles.termsText}>
          By subscribing, you agree to our{' '}
          <Text 
            style={styles.termsLink}
            onPress={() => Linking.openURL('terms')}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text 
            style={styles.termsLink}
            onPress={() => Linking.openURL('privacy')}
          >
            Privacy Policy
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    paddingTop: 50,
    backgroundColor: 'rgba(47, 46, 46, 0.1)',
  },
  container: {
    width: '100%',
    maxWidth: 500,
    height: '90%',
    borderRadius: 10,
    backgroundColor: '#FFFFF1', //  creme color
    borderWidth: 2,
    borderColor: '#2f2e2e', //  black color
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  gestureContainer: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
  gradientHeader: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFF1', //  creme color for contrast
    textAlign: 'center',
  },
  tierSelector: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', //  grey color
  },
  tierTab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6f6f6f', //  gray color
  },
  tierDetails: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  premiumImage: {
    width: 80,
    height: 80,
    marginVertical: 5,
  },
  featureList: {
    width: '100%',
    marginVertical: 10,
    backgroundColor: 'rgba(230, 230, 220, 0.5)', // Slightly darker creme for contrast
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0', //  grey color
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2f2e2e', //  black color
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#2f2e2e', //  black color
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
    color: '#2f2e2e', //  black color
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  animatedBorder: {
    borderWidth: 2,
    borderRadius: 30,
    padding: 2,
  },
  subscribeButton: {
    width: 250,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFF1', //  creme color
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: '#6f6f6f', //  gray color
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  termsLink: {
    color: '#376DF6', // Blue color for links
    textDecorationLine: 'underline',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    padding: 10,
  },
  backButtonText: {
    color: '#FFFFF1', //  creme color
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default Subscribe;