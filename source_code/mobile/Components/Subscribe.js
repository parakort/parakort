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
  ScrollView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import config from "../app.json";

const { width } = Dimensions.get('window');

const Subscribe = ({ Purchases, purchase, subscriptionTier, close }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('Premium'); // Default selected tier
  const [borderAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(1));
  
  const scrollViewRef = useRef(null);
  
  // Subscription tier colors
  const tierColors = {
    Pro: ['#2196F3', '#64B5F6'],      // Blue
    Premium: ['#9C27B0', '#BA68C8'],  // Purple
    Elite: ['#F44336', '#EF9A9A']     // Red
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

  

  // Check current subscription status
  // Update the checkSubscriptionStatus function
const checkSubscriptionStatus = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Check which tier the user has active (using uppercase)
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

  // Get available subscription offerings
  const getSubscriptionOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        return offerings.current.availablePackages;
      } else {
        // Fallback to getProducts if offerings are not set up
        const products = await Purchases.getProducts(['pro_subscription', 'premium_subscription', 'elite_subscription']);
        
        // Format products to match offerings structure
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
      // Check current subscription status
      //const tier = await checkSubscriptionStatus();
      // setCurrentTier(tier); We do this from /user now
      
      // Get available packages
      const availablePackages = await getSubscriptionOfferings();
      setPackages(availablePackages);
      setLoading(false);
    };
    
    loadSubscriptionData();
    
    // Rainbow border animation
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

  // Create interpolation for the border color
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
      // Direct product
      if ('introPrice' in pkg.product && pkg.product.introPrice) {
        return pkg.product.introPrice.priceString;
      }
      return pkg.product.priceString;
    } else {
      // RevenueCat package
      if (pkg.product.introPrice) {
        return pkg.product.introPrice.priceString;
      }
      return pkg.product.priceString;
    }
  };

  // Tier selection handler
  // Update the handleTierSelect function
const handleTierSelect = (tier) => {
  setSelectedTier(tier);
  
  // Scroll to the appropriate section using scrollToIndex for FlatList
  if (scrollViewRef.current) {
    const index = {
      'Pro': 0,
      'Premium': 1,
      'Elite': 2
    };
    scrollViewRef.current.scrollToIndex({ 
      index: index[tier], 
      animated: true 
    });
  }
};

  // Add this function to handle potential scroll failures
const handleScrollToIndexFailed = (info) => {
  // Wait a bit and then try again with animation disabled
  setTimeout(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToIndex({ 
        index: info.index, 
        animated: false 
      });
    }
  }, 100);
};

  // if (subscriptionTier) {
  //   return (
  //     <View style={styles.outerContainer}>
  //       <View style={[styles.container]}>
  //         <View style={styles.activeContainer}>
  //           <LinearGradient
  //             colors={tierColors[subscriptionTier]}
  //             style={styles.gradientHeader}
  //           >
  //             <Text style={styles.activeText}>{subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} Active</Text>
  //           </LinearGradient>
            
  //           <Image 
  //             source={require('../assets/premium-badge.png')} 
  //             style={styles.premiumImage} 
  //             resizeMode="contain"
  //           />
            
  //           <View style={styles.featureList}>
  //             <Text style={styles.featureTitle}>Your Benefits:</Text>
  //             {tierFeatures[subscriptionTier].map((feature, index) => (
  //               <View key={index} style={styles.featureItem}>
  //                 <View style={[styles.bulletPoint, {backgroundColor: tierColors[subscriptionTier][0]}]} />
  //                 <Text style={styles.featureText}>{feature}</Text>
  //               </View>
  //             ))}
  //           </View>
            
  //           <Text style={styles.thankYouText}>
  //             Thank you for your support! Enjoy all {subscriptionTier} features.
  //           </Text>
  //         </View>
  //       </View>
  //     </View>
  //   );
  //}

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.container]}>
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={close}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient
            colors={tierColors[selectedTier]}
            style={styles.gradientHeader}
          >
            <Text style={styles.headerText}>Choose Your Plan</Text>
          </LinearGradient>
          
          <View style={styles.tierSelector}>
  <TouchableOpacity
    style={[
      styles.tierTab,
      selectedTier === 'Pro' && {borderBottomColor: tierColors.Pro[0], borderBottomWidth: 3}
    ]}
    onPress={() => handleTierSelect('Pro')}
  >
    <Text style={[styles.tierText, selectedTier === 'Pro' && {color: tierColors.Pro[0]}]}>Pro</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={[
      styles.tierTab,
      selectedTier === 'Premium' && {borderBottomColor: tierColors.Premium[0], borderBottomWidth: 3}
    ]}
    onPress={() => handleTierSelect('Premium')}
  >
    <Text style={[styles.tierText, selectedTier === 'Premium' && {color: tierColors.Premium[0]}]}>Premium</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={[
      styles.tierTab,
      selectedTier === 'Elite' && {borderBottomColor: tierColors.Elite[0], borderBottomWidth: 3}
    ]}
    onPress={() => handleTierSelect('Elite')}
  >
    <Text style={[styles.tierText, selectedTier === 'Elite' && {color: tierColors.Elite[0]}]}>Elite</Text>
  </TouchableOpacity>
</View>
          
          <FlatList
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            data={['Pro', 'Premium', 'Elite']}
            keyExtractor={(item) => item}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            renderItem={({item: tier}) => (
              <View style={[styles.tierDetails, {width: width * 0.9}]}>
                <Image 
                  source={
                    tier === 'pro' ? require('../assets/premium-badge.png') :
                    tier === 'premium' ? require('../assets/premium-badge.png') :
                    require('../assets/premium-badge.png')
                  } 
                  style={styles.premiumImage} 
                  resizeMode="contain"
                />
                
                
                <View style={styles.featureList}>
                  <Text style={styles.featureTitle}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} Benefits:
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
                disabled = {selectedTier === subscriptionTier}
              >
                <LinearGradient
                  colors={tierColors[selectedTier]}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonText}>
                    {subscriptionTier && selectedTier === subscriptionTier ? 'You own this plan!' : `${subscriptionTier? "Switch" : "Subscribe"} to ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          <Text style={styles.termsText}>
            By subscribing, you agree to our{' '}
            <Text 
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://yourdomain.com/terms')}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text 
              style={styles.termsLink}
              onPress={() => Linking.openURL('https://yourdomain.com/privacy')}
            >
              Privacy Policy
            </Text>
          </Text>
          
          {/* <Text style={styles.cancelText}>
            You can cancel your subscription anytime through your App Store or Google Play account settings.
          </Text> */}
        </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  container: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 15,
    backgroundColor: config.app.theme.creme,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 30,
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
    color: '#fff',
    textAlign: 'center',
  },
  tierSelector: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    color: '#777',
  },
  tierDetails: {
    padding: 20,
    alignItems: 'center',
  },
  premiumImage: {
    width: 120,
    height: 120,
    marginVertical: 10,
  },
  likersAlert: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderLeftWidth: 4,
    marginVertical: 15,
  },
  likersAlertText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  likersAlertSubtext: {
    fontSize: 14,
    marginTop: 5,
  },
  featureList: {
    width: '100%',
    marginVertical: 15,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#444',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: '#555',
    marginRight: 5,
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '80%',
    marginTop: 20,
  },
  animatedBorder: {
    borderWidth: 2,
    borderRadius: 30,
    padding: 3,
  },
  subscribeButton: {
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradientButton: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    marginTop: 20,
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  termsLink: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  cancelText: {
    marginTop: 10,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  subscribeButtonSimple: {
    backgroundColor: '#9C27B0',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    marginVertical: 10,
  },
  activeContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  activeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  thankYouText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  // Back button styles
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
});

export default Subscribe;