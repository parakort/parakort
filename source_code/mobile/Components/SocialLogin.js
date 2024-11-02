import React, { useState } from 'react';
import { View, Button, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

const INSTAGRAM_CLIENT_ID = 'YOUR_INSTAGRAM_CLIENT_ID';
const INSTAGRAM_REDIRECT_URI = 'YOUR_INSTAGRAM_REDIRECT_URI';
const FACEBOOK_APP_ID = '3102099443262594';
const FACEBOOK_REDIRECT_URI = 'YOUR_FACEBOOK_REDIRECT_URI';
const LINKEDIN_CLIENT_ID = 'YOUR_LINKEDIN_CLIENT_ID';
const LINKEDIN_REDIRECT_URI = 'YOUR_LINKEDIN_REDIRECT_URI';

const SocialLogin = () => {
  const [url, setUrl] = useState('');

  const handleLogin = (provider) => {
    let oauthUrl;

    switch (provider) {
      case 'instagram':
        oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${INSTAGRAM_REDIRECT_URI}&response_type=code&scope=user_profile,user_media`;
        break;
      case 'facebook':
        oauthUrl = `https://www.facebook.com/v10.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${FACEBOOK_REDIRECT_URI}&response_type=token&scope=email,public_profile`;
        break;
      case 'linkedin':
        oauthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${LINKEDIN_REDIRECT_URI}&scope=r_liteprofile%20r_emailaddress`;
        break;
      default:
        return;
    }

    setUrl(oauthUrl);
  };

  const handleNavigationStateChange = (navState) => {
    // Handle redirect logic here
    if (navState.url.startsWith(INSTAGRAM_REDIRECT_URI) || 
        navState.url.startsWith(FACEBOOK_REDIRECT_URI) || 
        navState.url.startsWith(LINKEDIN_REDIRECT_URI)) {
      // Extract authorization code or access token
      const code = navState.url.split('code=')[1] || navState.url.split('access_token=')[1];
      if (code) {
        Alert.alert('Authorization Code/Token', code);
        // Reset URL after login
        setUrl('');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <TouchableOpacity onPress={() => handleLogin('instagram')}>
          <Image style={styles.icon} source={require('../assets/social-icons/instagram.png')} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => handleLogin('facebook')} >
          <Image style={styles.icon} source={require('../assets/social-icons/linkedin.png')} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => handleLogin('linkedin')}>
          <Image style={styles.icon} source={require('../assets/social-icons/facebook.png')} />
        </TouchableOpacity>
        
      </View>
      {url !== '' && (
        <WebView
          source={{ uri: url }}
          onNavigationStateChange={handleNavigationStateChange}
          style={styles.webview}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {

    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly"
  },
  icon: { 
    
    width: "32%",
    height: "auto",
    aspectRatio: 1,
    alignSelf: "center",
  },
  webview: {
    flex: 1,
  },
});

export default SocialLogin;
