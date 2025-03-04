import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Purchases from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import config from "../app.json";


const { width } = Dimensions.get('window');

const Subscribe = ({ subscribed, purchase, product, simple, likerCount }) => {
  const [price, setPrice] = useState('');
  const [borderAnimation] = useState(new Animated.Value(0));
  const [scaleAnimation] = useState(new Animated.Value(1));
  
  // Premium features list
  const premiumFeatures = [
    "See who likes your profile",
    "Unlimited matches per day",
    "Priority in search results",
  ];

  useEffect(() => {
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
    outputRange: [config.app.theme.blue, config.app.theme.creme, config.app.theme.blue, config.app.theme.creme, config.app.theme.blue, config.app.theme.creme]
  });

  async function getProduct() {
    try {
      // Store the product data
      let products = await Purchases.getProducts(['premium']);
      let product = products[0];
      if ('introPrice' in product && product['introPrice']) {
        setPrice(product['introPrice']['priceString']);
      } else {
        setPrice(product['priceString']);
      }
    } catch (error) {
      console.log('Error fetching products:', error);
    }
  }

  useEffect(() => {
    getProduct();
  }, []);

  if (simple) {
    return (
      <TouchableOpacity onPress={() => purchase()} style={styles.subscribeButtonSimple}>
        <Text style={styles.buttonText}>Subscribe: {price}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.container]}>
        {subscribed ? (
          <View style={styles.activeContainer}>
            <LinearGradient
              colors={[config.app.theme.blue, '#8BC34A']}
              style={styles.gradientHeader}
            >
              <Text style={styles.activeText}>Premium Active</Text>
            </LinearGradient>
            
            <Image 
              source={require('../assets/premium-badge.png')} 
              style={styles.premiumImage} 
              resizeMode="contain"
            />
            
            <Text style={styles.thankYouText}>
              Thank you for your support! Enjoy all premium features.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <LinearGradient
              colors={['#2196F3', '#64B5F6']}
              style={styles.gradientHeader}
            >
              <Text style={styles.headerText}>Upgrade to Premium</Text>
            </LinearGradient>
            
            <Image 
              source={require('../assets/premium-features.png')} 
              style={styles.premiumImage} 
              resizeMode="contain"
            />
            
            {likerCount > 0 && (
              <View style={styles.likersAlert}>
                <Text style={styles.likersAlertText}>
                  {likerCount} {likerCount === 1 ? 'person' : 'people'} liked you!
                </Text>
                <Text style={styles.likersAlertSubtext}>
                  Upgrade now to see who they are
                </Text>
              </View>
            )}
            
            <View style={styles.featureList}>
              <Text style={styles.featureTitle}>Premium Benefits:</Text>
              {premiumFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            
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
                <TouchableOpacity onPress={() => purchase()} style={styles.subscribeButton}>
                  <LinearGradient
                    colors={[config.app.theme.blue, config.app.theme.blue]}
                    style={styles.gradientButton}
                  >
                    <Text style={styles.buttonText}>Subscribe: {price}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
            
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')} 
                style={styles.termsButton}
              >
                <Text style={styles.termsText}>Terms</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://www.freeprivacypolicy.com/live/e1017c14-2f48-423c-9598-a306e394c30a')} 
                style={styles.termsButton}
              >
                <Text style={styles.termsText}>Privacy</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: config.app.theme.blue,
  },
  container: {
    width: width * 0.9,
    maxHeight: '90%',
    borderRadius: 20,
    backgroundColor: config.app.theme.creme,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',

    borderWidth:1,
    borderColor: config.app.theme.gray
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  gradientHeader: {
    width: '100%',
    padding: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  activeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  thankYouText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: '#555',
  },
  premiumImage: {
    width: width * 0.6,
    height: width * 0.4,
    marginVertical: 20,
  },
  likersAlert: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD600',
  },
  likersAlertText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6F00',
  },
  likersAlertSubtext: {
    fontSize: 14,
    color: '#FF6F00',
    marginTop: 4,
  },
  featureList: {
    width: '90%',
    marginVertical: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  bulletPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
    marginRight: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#424242',
    flex: 1,
  },
  buttonContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  animatedBorder: {
    width: 220,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 3,
    overflow: 'hidden',
  },
  subscribeButton: {
    width: 210,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subscribeButtonSimple: {
    backgroundColor: '#E91E63',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  termsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  termsButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
  },
  termsText: {
    color: '#757575',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  activeContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    width: '100%',
    height: '100%',
  },
});

export default Subscribe;