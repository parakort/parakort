import { View, Image, StyleSheet} from 'react-native';
import config from "../app.json"
import sportIcons from '../utils/icons';



const SkillLevels = ({sports}) => {

    const styles = StyleSheet.create({

        skillContainer: {
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-evenly",
            borderWidth: 2,
            borderRadius: 10,
            backgroundColor: config.app.theme.creme,
            padding: "0.5%"
        },
        skillItem: {
            display: "flex",
            flexDirection: "column",
            alignSelf: 'center',
          },
      
          skillIcon: {
            height: "60%",
            aspectRatio: 1,
            alignSelf: 'center'
          },
          skillLevel: {
            height: "30%",
            width: "auto",
            aspectRatio: 3,
            marginTop: 3
            
          },
      
    })

    return (
        <View style = {styles.skillContainer}>
            {sports.map((sport) => (
            (sport.my_level !== 0) && ( // Render only if my_level is not 0
                <View key={sport.id} style={styles.skillItem}>
                <Image 
                    source={sportIcons[sport.sportId.name.toLowerCase()] ? sportIcons[sport.sportId.name.toLowerCase()] : sport.sportId.image} 
                    style={styles.skillIcon} 
                />
                <Image 
                    source={sportIcons[sport.my_level === 1 ? "beg" : sport.my_level === 2 ? "int" : "adv"]} 
                    style={styles.skillLevel} 
                />
                </View>
            )
            ))}

        </View>
    )
}

export default SkillLevels