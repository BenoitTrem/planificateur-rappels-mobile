import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type RootStackParamList = {
  "Page-Video": { videoUrl: string };
};

export default function PageVideo() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "Page-Video">>();
  const [videoUri, setVideoUri] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.videoUrl) {
      setVideoUri(route.params.videoUrl);
    }
  }, [route]);

  const handleClose = () => {
    navigation.goBack();
  };

  if (!videoUri) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: videoUri }}
        style={styles.video}
        shouldPlay
        isLooping
        useNativeControls
        resizeMode={ResizeMode.COVER}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
