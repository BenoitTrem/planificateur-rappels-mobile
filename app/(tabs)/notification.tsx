import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Asset } from "expo-asset";
import { Audio } from "expo-av";
import * as Notifications from "expo-notifications";
import { router, useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function NotificationScreen() {
  const navigation = useNavigation();
  const [soundObject, setSoundObject] = useState<Audio.Sound | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: "Notification" });

    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Enable notifications in your settings to get reminders.",
        );
      }
    }
    requestPermissions();

    const activateAudioSession = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
        });
        console.log("Audio session activated.");
      } catch (error) {
        console.log("Error activating audio session:", error);
      }
    };

    activateAudioSession();

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      const videoUri = require("../../assets/video/vid1.mp4");
      const videoAsset = Asset.fromModule(videoUri);
      setVideoUri(videoAsset.uri);

      router.push({
        pathname: "/Page-Video",
        params: { videoUrl: videoAsset.uri },
      });
    });
  }, []);

  const [startTime, setStartTime] = useState(
    new Date(new Date().setHours(8, 0)),
  );
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(21, 0)));
  const [notificationsPerDay, setNotificationsPerDay] = useState("3");
  const [reminderText, setReminderText] = useState("");

  const formatTime = (date: Date): string =>
    `${((date.getHours() + 11) % 12) + 1}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")} ${date.getHours() >= 12 ? "PM" : "AM"}`;

  const scheduleNotifications = async () => {
    const count = parseInt(notificationsPerDay);

    if (!reminderText.trim()) {
      Alert.alert("Invalid reminder", "Please enter a reminder message.");
      return;
    }

    if (isNaN(count) || count <= 0) {
      Alert.alert(
        "Invalid input",
        "Please enter a valid number of notifications.",
      );
      return;
    }

    if (startTime >= endTime) {
      Alert.alert("Invalid time range", "Start time must be before end time.");
      return;
    }

    const totalMillis = endTime.getTime() - startTime.getTime();

    const minInterval = 1 * 60 * 1000;
    const requiredTime = (count - 1) * minInterval;

    if (totalMillis < requiredTime) {
      Alert.alert(
        "Insufficient time range",
        `The time range is too short for the selected number of notifications. Please ensure at least ${minInterval / 60000} minute between each notification.`,
      );
      return;
    }

    let fireTimes = [];

    const intervalMillis = totalMillis / (count + 1);

    const actualInterval = Math.max(intervalMillis, minInterval);

    for (let i = 0; i < count; i++) {
      const date = new Date(startTime.getTime() + actualInterval * (i + 1));
      date.setSeconds(0, 0);
      fireTimes.push(date);
    }

    for (let i = 0; i < fireTimes.length; i++) {
      const fireDate = fireTimes[i];
      const fireHour = fireDate.getHours();
      const fireMinute = fireDate.getMinutes();
      const fireSecond = fireDate.getSeconds();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminderText,
          body: "Click to get a motivational boost!",
        },
        trigger: {
          type: "calendar",
          repeats: true,
          hour: fireHour,
          minute: fireMinute,
          second: fireSecond,
        } as any,
      });
    }

    Alert.alert("Scheduled", `${count} notifications scheduled.`, [
      {
        text: "OK",
        onPress: () => router.replace("/"),
      },
    ]);

    const reminder = {
      title: reminderText,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      count,
    };

    try {
      const existing = await AsyncStorage.getItem("reminders");
      const reminders = existing ? JSON.parse(existing) : [];
      reminders.push(reminder);
      await AsyncStorage.setItem("reminders", JSON.stringify(reminders));
    } catch (err) {
      console.error("Error saving reminder:", err);
    }
  };
  const sendTestNotification = async () => {
    const videoUri = require("../../assets/video/vid1.mp4");
    const videoAsset = Asset.fromModule(videoUri);
    setVideoUri(videoAsset.uri);

    const sound = new Audio.Sound();
    setSoundObject(sound);

    try {
      await sound.loadAsync({ uri: videoAsset.uri });
      await sound.playAsync();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Test Reminder",
          body: "Click to get a motivational boost!",
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error playing video: ", error);
    }
  };

  const dismissEverything = () => {
    Keyboard.dismiss();
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  return (
    <TouchableWithoutFeedback onPress={dismissEverything} accessible={false}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.label}>Reminder Message:</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Do the dishes"
            placeholderTextColor="#aaa"
            value={reminderText}
            onChangeText={setReminderText}
            onFocus={() => {
              setShowStartPicker(false);
              setShowEndPicker(false);
            }}
          />
          <Text style={styles.label}>Start Time:</Text>
          <Pressable
            onPress={() => {
              dismissEverything();
              setShowStartPicker(true);
            }}
            style={styles.timeText}
          >
            <Text style={styles.textWhite}>{formatTime(startTime)}</Text>
          </Pressable>

          <Modal transparent visible={showStartPicker} animationType="fade">
            <TouchableWithoutFeedback onPress={() => setShowStartPicker(false)}>
              <View style={styles.modalBackground}>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={startTime}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === "android") setShowStartPicker(false);
                      if (selectedDate) setStartTime(selectedDate);
                    }}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          <Text style={styles.label}>End Time:</Text>
          <Pressable
            onPress={() => {
              dismissEverything();
              setShowEndPicker(true);
            }}
            style={styles.timeText}
          >
            <Text style={styles.textWhite}>{formatTime(endTime)}</Text>
          </Pressable>

          <Modal transparent visible={showEndPicker} animationType="fade">
            <TouchableWithoutFeedback onPress={() => setShowEndPicker(false)}>
              <View style={styles.modalBackground}>
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={endTime}
                    mode="time"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      if (Platform.OS === "android") setShowEndPicker(false);
                      if (selectedDate) setEndTime(selectedDate);
                    }}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          <Text style={styles.label}>Notifications Per Day:</Text>
          <TextInput
            style={styles.input}
            value={notificationsPerDay}
            onChangeText={setNotificationsPerDay}
            keyboardType="numeric"
            placeholder="Number of Notifications"
            placeholderTextColor="#fff"
            onFocus={() => {
              setShowStartPicker(false);
              setShowEndPicker(false);
            }}
          />

          <View style={{ marginTop: 20 }} />
          <Button
            title="Schedule Notifications"
            onPress={scheduleNotifications}
          />

          <View style={styles.container}>
            <Button
              title="Send Test Notification"
              onPress={sendTestNotification}
              color="#4CAF50"
            />
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#000",
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#fff",
    color: "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  label: {
    color: "#fff",
    alignSelf: "flex-start",
    marginBottom: 5,
  },
  textWhite: {
    color: "#fff",
    textAlign: "center",
  },
  timeText: {
    borderColor: "#fff",
    color: "#fff",
    borderWidth: 1,
    padding: 10,
    width: "100%",
    marginBottom: 15,
    borderRadius: 5,
    textAlign: "center",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    backgroundColor: "#000",
    borderRadius: 10,
    padding: 20,
    borderColor: "#fff",
    borderWidth: 1,
  },
});
