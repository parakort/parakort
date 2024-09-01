import React, { useEffect, useState } from 'react';
import { View, Image, Video, StyleSheet, Dimensions, Text } from 'react-native';
import RNFS from 'react-native-fs';

const screenWidth = Dimensions.get('window').width;
const imageSize = screenWidth * 0.3;
const borderRadius = imageSize / 2;

export default function App() {
  const [localMediaPaths, setLocalMediaPaths] = useState([]);

  useEffect(() => {
    const mediaArray = [
      { uri: 'https://mega.nz/file/example1.jpg', type: 'image' },
      { uri: 'https://mega.nz/file/example2.mp4', type: 'video' },
      // Add more media URIs here
    ];

    const downloadMediaFiles = async () => {
      const downloadedMedia = [];

      for (const media of mediaArray) {
        const filename = media.uri.split('/').pop();
        const localPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
        const mediaType = media.uri.includes('.jpg') ? 'image' : 'video';

        try {
          const downloadResult = await RNFS.downloadFile({
            fromUrl: media.uri,
            toFile: localPath,
          }).promise;

          if (downloadResult.statusCode === 200) {
            downloadedMedia.push({ path: 'file://' + localPath, type: mediaType });
          } else {
            console.error('Failed to download:', media.uri);
          }
        } catch (error) {
          console.error('Error downloading file:', error);
        }
      }

      setLocalMediaPaths(downloadedMedia);
    };

    downloadMediaFiles();
  }, []);

  return (
    <View style={styles.container}>
      {localMediaPaths.length === 0 ? (
        <Text>Loading media...</Text>
      ) : (
        localMediaPaths.map((media, index) => {
          if (media.type === 'image') {
            return (
              <Image
                key={index}
                source={{ uri: media.path }}
                style={[
                  styles.image,
                  {
                    width: imageSize,
                    height: imageSize,
                    borderRadius: borderRadius,
                  },
                ]}
                resizeMode="cover"
              />
            );
          } else if (media.type === 'video') {
            return (
              <Video
                key={index}
                source={{ uri: media.path }}
                style={[
                  styles.image,
                  {
                    width: imageSize,
                    height: imageSize,
                    borderRadius: borderRadius,
                  },
                ]}
                resizeMode="cover"
                controls={true}
              />
            );
          }
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  image: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
});
