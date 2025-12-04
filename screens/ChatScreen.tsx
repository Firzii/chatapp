import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '../firebase';
import { messagesCollection } from '../firebase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  launchImageLibrary,
  ImagePickerResponse,
} from 'react-native-image-picker';

type MessageType = {
  id: string;
  text: string;
  user: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  imageUrl?: string;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const MESSAGES_STORAGE_KEY = 'chat_messages_offline';

export default function ChatScreen({ route }: Props) {
  const { name } = route.params;
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [uploading, setUploading] = useState(false);

  // Load messages from local storage on mount
  useEffect(() => {
    loadOfflineMessages();
  }, []);

  // Sync with Firestore and save to local storage
  useEffect(() => {
    const q = query(messagesCollection, orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      snapshot => {
        const list: MessageType[] = [];
        snapshot.forEach(doc => {
          list.push({
            id: doc.id,
            ...(doc.data() as Omit<MessageType, 'id'>),
          });
        });
        setMessages(list);
        // Save to local storage for offline access
        saveOfflineMessages(list);
      },
      error => {
        console.error('Firestore error:', error);
        Alert.alert(
          'Mode Offline',
          'Tidak dapat terhubung ke server. Menampilkan pesan offline.',
        );
      },
    );
    return () => unsub();
  }, []);

  const loadOfflineMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(MESSAGES_STORAGE_KEY);
      if (stored) {
        const parsedMessages: MessageType[] = JSON.parse(stored);
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Error loading offline messages:', error);
    }
  };

  const saveOfflineMessages = async (msgs: MessageType[]) => {
    try {
      await AsyncStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(msgs));
    } catch (error) {
      console.error('Error saving offline messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      await addDoc(messagesCollection, {
        text: message,
        user: name,
        createdAt: serverTimestamp(),
      });
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'Gagal mengirim pesan. Coba lagi.');
      console.error('Send message error:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', 'Gagal memilih gambar');
        return;
      }

      if (result.assets && result.assets[0]) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
    }
  };

  const uploadImage = async (asset: any) => {
    if (!asset.uri) return;

    setUploading(true);
    try {
      // Convert image to blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Create storage reference
      const filename = `images/${Date.now()}_${asset.fileName || 'image.jpg'}`;
      const storageRef = ref(storage, filename);

      // Upload
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Send message with image
      await addDoc(messagesCollection, {
        text: '',
        user: name,
        imageUrl: downloadURL,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Berhasil', 'Gambar berhasil dikirim!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Gagal mengupload gambar');
    } finally {
      setUploading(false);
    }
  };

  const renderItem = ({ item }: { item: MessageType }) => (
    <View
      style={[
        styles.msgBox,
        item.user === name ? styles.myMsg : styles.otherMsg,
      ]}
    >
      <Text style={styles.sender}>{item.user}</Text>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <Text>{item.text}</Text>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />
      <View style={styles.inputRow}>
        <TouchableOpacity
          onPress={pickImage}
          disabled={uploading}
          style={styles.imageButton}
        >
          <Text style={styles.imageButtonText}>📷</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Ketik pesan..."
          placeholderTextColor="#888"
          value={message}
          onChangeText={setMessage}
        />
        {uploading ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Button title="Kirim" onPress={sendMessage} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  msgBox: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 6,
    maxWidth: '80%',
  },
  myMsg: {
    backgroundColor: '#d1f0ff',
    alignSelf: 'flex-end',
  },
  otherMsg: {
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
  },
  sender: {
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    marginRight: 10,
    padding: 8,
    borderRadius: 6,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginTop: 5,
  },
  imageButton: {
    padding: 10,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 24,
  },
});
