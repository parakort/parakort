import { View, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const SocialButtons = ({socials, horizontal}) => {

    const styles = StyleSheet.create({
    
        iconContainer: {
          display: "flex",
          flexDirection: horizontal ? "row" : "column",
          justifyContent: "space-evenly",
          borderColor: "red",
          borderWidth: 1
          
        },
        icon: {
          height: "50%",
          aspectRatio: 1,
          resizeMode: "contain",
          top: !horizontal? "37.5%": "auto",
        }
      });

      const openProfile = async (url, appUrl) => {
        try {
          
          const supported = await Linking.canOpenURL(appUrl);
          await Linking.openURL(supported ? appUrl : url);
        } catch (error) {
          console.log(error);
        }
      };

    return (
        <View style={styles.iconContainer}>
            {socials.instagram && (
                <TouchableOpacity onPress={() => openProfile(`https://www.instagram.com/${socials.instagram}`, `instagram://user?username=${socials.instagram}`)}>
                < Image style={styles.icon} source={require('../assets/social-icons/instagram.png')} />
                </TouchableOpacity>
            )}
            
            {socials.linkedin && (
                <TouchableOpacity onPress={() => openProfile(`https://www.linkedin.com/in/${socials.linkedin}`, `linkedin://in/${socials.linkedin}`)}>
                <Image style={styles.icon} source={require('../assets/social-icons/linkedin.png')} />
                </TouchableOpacity>
            )}
            
            {socials.facebook && (

                <TouchableOpacity onPress={() => openProfile(`https://www.facebook.com/${socials.facebook}`, `fb://profile/${socials.facebook}`)}>
                <Image style={styles.icon} source={require('../assets/social-icons/facebook.png')} />
                </TouchableOpacity>
            )}

        </View>
    )
}
export default SocialButtons