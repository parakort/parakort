import React, { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

const RetryableImage = ({ uri, style, useLoading }) => {
    const [retryCount, setRetryCount] = useState(0);
    const [trying, setTrying] = useState(true);
    const [imageUri, setImageUri] = useState(uri);
    const [loading, setLoading] = useState(false);

    const MAX_RETRIES = 300;

    if (!imageUri) setImageUri(uri);

    useEffect(() => {
        if (imageUri !== uri) setImageUri(uri);
    }, [uri]);

    useEffect(() => {
        if (!trying) {
            setTrying(true);
        }
        setLoading(false);
    }, [imageUri]);

    const handleImageError = () => {
        if (retryCount > MAX_RETRIES) {
            setTrying(false);
            setImageUri(null);
            setLoading(false);
            return;
        }
        if (useLoading) setLoading(true);
        setRetryCount(retryCount + 1);
        setTimeout(() => {
            setImageUri(retryCount % 2 !== 0 ? null : `${uri}?retry=${retryCount + 1}`);
        }, 10);
    };

    return (
        <View>
            {loading && (
                <Image
                    key={`loading-${retryCount}`}
                    style={{ ...style}}
                    source={require('../assets/loading.png')}
                />
            )}
            {!loading && trying && (
                <Image
                    key={`image-${imageUri}`}
                    source={{ uri: imageUri }}
                    style={style}
                    onError={handleImageError}
                    onLoad={() => { 
                        setRetryCount(0); 
                        setLoading(false); 
                    }}
                />
            )}
            {!loading && !trying && (
                <Image
                    key={`notfound`}
                    style={style}
                    source={require('../assets/notfound.jpg')}
                />
            )}
        </View>
    );
};

export default RetryableImage;
