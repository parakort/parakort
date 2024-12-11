import { Text, View, Image } from "react-native"
import styles from '../styles.js';
import config from "../app.json"


const Loading = (props) => {

    return (
        <View style = {styles.screen}>

                <View style = {{display: "flex", alignItems: "center"}}>
                    <Image
                        source={require('../assets/alone.png')}
                        style={{height: 140, marginTop: 20 }}
                        resizeMode="contain" // Ensures the image fits within its bounds
                    />
                    <Text style = {{fontSize: 30, fontWeight: "100", marginTop: 20}}>Loading...</Text>
                </View>

                

        </View>
    )
}

export default Loading