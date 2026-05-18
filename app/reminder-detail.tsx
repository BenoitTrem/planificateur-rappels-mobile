import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
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

export default function ReminderDetailScreen() {
  const { index } = useLocalSearchParams();
  const navigation = useNavigation();

  const [reminder, setReminder] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [count, setCount] = useState<string>("1");
  const [notificationsCancelled, setNotificationsCancelled] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const formatTime = (date: Date) =>
    `${((date.getHours() + 11) % 12) + 1}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")} ${date.getHours() >= 12 ? "PM" : "AM"}`;

  useEffect(() => {
    navigation.setOptions({ headerBackTitle: "Back", title: "Modification" });

    const load = async () => {
      const data = await AsyncStorage.getItem("reminders");
      if (!data) return;
      const reminders = JSON.parse(data);
      const current = reminders[parseInt(index as string)];
      if (current) {
        setReminder(current);
        setNotificationsCancelled(current.notificationsCancelled || false);
        setTitle(current.title);
        setStartTime(new Date(current.startTime));
        setEndTime(new Date(current.endTime));
        setCount(current.count.toString());
      }
    };
    load();
  }, []);

  const deleteReminder = async () => {
    const data = await AsyncStorage.getItem("reminders");
    if (!data) return;

    const reminders = JSON.parse(data);
    reminders.splice(parseInt(index as string), 1);
    await AsyncStorage.setItem("reminders", JSON.stringify(reminders));

    Alert.alert("Deleted", "Reminder removed.");
    router.back();
  };

  const cancelNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const data = await AsyncStorage.getItem("reminders");
    if (!data) return;

    const reminders = JSON.parse(data);
    reminders[parseInt(index as string)].notificationsCancelled = true;
    await AsyncStorage.setItem("reminders", JSON.stringify(reminders));
    setNotificationsCancelled(true);

    Alert.alert(
      "Notifications Cancelled",
      "This reminder will no longer send notifications.",
    );
  };

  const reactivateNotifications = async () => {
    console.log("Reactivating notifications...");

    setNotificationsCancelled(false);
    console.log("Notifications reactivated, state updated to:", false);

    const data = await AsyncStorage.getItem("reminders");
    if (!data) return;

    const reminders = JSON.parse(data);
    const updatedReminder = reminders[parseInt(index as string)];

    updatedReminder.notificationsCancelled = false;
    reminders[parseInt(index as string)] = updatedReminder;

    await AsyncStorage.setItem("reminders", JSON.stringify(reminders));
    console.log("Reminder updated in AsyncStorage:", updatedReminder);

    await saveChanges(false);
  };

  const saveChanges = async (cancelledState: boolean) => {
    console.log("Saving changes...");

    const data = await AsyncStorage.getItem("reminders");
    if (!data) return;

    const reminders = JSON.parse(data);
    const updated = {
      ...reminders[parseInt(index as string)],
      title,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      count: parseInt(count),
      notificationsCancelled: cancelledState,
    };

    reminders[parseInt(index as string)] = updated;
    await AsyncStorage.setItem("reminders", JSON.stringify(reminders));

    console.log("Reminder saved with notificationsCancelled:", cancelledState);

    if (!cancelledState) {
      await Notifications.cancelAllScheduledNotificationsAsync();

      const totalMillis =
        new Date(endTime).getTime() - new Date(startTime).getTime();
      const countInt = parseInt(count);

      const minInterval = 1 * 60 * 1000;
      const requiredTime = (countInt - 1) * minInterval;

      if (totalMillis < requiredTime) {
        Alert.alert(
          "Insufficient time range",
          `Please ensure at least 1 minute between each notification.`,
        );
        return;
      }

      const fireTimes: Date[] = [];
      const intervalMillis = totalMillis / (countInt + 1);
      const actualInterval = Math.max(intervalMillis, minInterval);

      for (let i = 0; i < countInt; i++) {
        const date = new Date(
          new Date(startTime).getTime() + actualInterval * (i + 1),
        );
        date.setSeconds(0, 0);
        fireTimes.push(date);
      }

      for (let i = 0; i < fireTimes.length; i++) {
        const fireDate = fireTimes[i];
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Reminder ${i + 1}`,
            body: title,
          },
          trigger: {
            type: "calendar",
            repeats: true,
            hour: fireDate.getHours(),
            minute: fireDate.getMinutes(),
            second: fireDate.getSeconds(),
          } as any,
        });
      }
    }

    Alert.alert("Saved", "Reminder updated.");
  };

  const dismissPickers = () => {
    setShowStartPicker(false);
    setShowEndPicker(false);
    Keyboard.dismiss();
  };

  if (!reminder) return <Text style={{ color: "white" }}>Loading...</Text>;

  return (
    <TouchableWithoutFeedback onPress={dismissPickers}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Edit Title:</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholder="Reminder title"
          placeholderTextColor="#ccc"
          onFocus={() => {
            setShowStartPicker(false);
            setShowEndPicker(false);
          }}
        />

        <Text style={styles.label}>Start Time:</Text>
        <Pressable
          onPress={() => {
            dismissPickers();
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
            dismissPickers();
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

        <Text style={styles.label}>Reminders per day:</Text>
        <TextInput
          value={count}
          onChangeText={setCount}
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 3"
          placeholderTextColor="#ccc"
          onFocus={() => {
            setShowStartPicker(false);
            setShowEndPicker(false);
          }}
        />

        <View style={{ marginTop: 20 }}>
          <Button title="Save Changes" onPress={() => saveChanges(false)} />
        </View>

        <View style={styles.buttonContainer}>
          {notificationsCancelled ? (
            <Button
              title="Reactivate Notifications"
              onPress={reactivateNotifications}
              color="#2ecc71"
            />
          ) : (
            <Button
              title="Cancel Notifications"
              onPress={cancelNotifications}
              color="#f39c12"
            />
          )}
        </View>

        <View style={{ marginTop: 5 }}>
          <Button
            title="Delete Reminder"
            onPress={deleteReminder}
            color="#e74c3c"
          />
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  container: {
    padding: 20,
    backgroundColor: "#000",
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
    marginTop: 15,
    marginBottom: 5,
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
  textWhite: {
    color: "#fff",
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
