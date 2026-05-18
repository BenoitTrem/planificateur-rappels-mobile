import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [reminders, setReminders] = useState<any[]>([]);

  const loadReminders = async () => {
    const data = await AsyncStorage.getItem('reminders');
    if (data) {
      setReminders(JSON.parse(data));
    } else {
      setReminders([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [])
  );

  
  return (
    <View style={styles.container}>
      <FlatList
        data={reminders}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
        <TouchableOpacity onPress={() => router.push({ pathname: '/reminder-detail', params: { index: index.toString() } })}>
          <View style={styles.card}>
            <Text style={styles.reminderTitle}>{item.title}</Text>
            <Text style={styles.reminderText}>
              {`Between ${new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} and ${new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            </Text>
            <Text style={styles.reminderText}>{`${item.count} reminders/day`}</Text>
          </View>
        </TouchableOpacity>
        )}    
        ListEmptyComponent={<Text style={styles.emptyText}>No reminders scheduled</Text>
      }
      />
      <Button
        title="Go to Notifications"
        onPress={() => router.push('/notification')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: 'white', textAlign: 'center', alignContent: 'center', paddingVertical: 70, },
  card: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  reminderText: {
    color: '#ccc',
    fontSize: 14,
  },
});
