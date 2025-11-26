import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { addBook } from '../services/bookService';
import { Book } from '../types';

const AddBookScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedCover, setSelectedCover] = useState<any>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/epub+zip'],
        copyToCacheDirectory: false,
      });

      if ((result as any).type === 'success') {
        setSelectedFile((result as any));
        // Extract title from filename if not set
        if (!title) {
          const fileName = (result as any).name.replace(/\.(pdf|epub)$/i, '');
          setTitle(fileName);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const pickCover = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedCover(result.assets[0]);
    }
  };

  const saveBook = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a book file.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }

    try {
      // Copy file to app directory
      const fileName = `${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const newPath = `${(FileSystem as any).documentDirectory}books/${fileName}`;
      await FileSystem.makeDirectoryAsync(`${(FileSystem as any).documentDirectory}books/`, { intermediates: true });
      await FileSystem.copyAsync({ from: selectedFile.uri, to: newPath });

      let coverPath: string | undefined;
      if (selectedCover) {
        const coverFileName = `${Date.now()}_cover.jpg`;
        const coverNewPath = `${(FileSystem as any).documentDirectory}covers/${coverFileName}`;
        await FileSystem.makeDirectoryAsync(`${(FileSystem as any).documentDirectory}covers/`, { intermediates: true });
        await FileSystem.copyAsync({ from: selectedCover.uri, to: coverNewPath });
        coverPath = coverNewPath;
      }

      const book: Omit<Book, 'id' | 'date_added'> = {
        title: title.trim(),
        author: author.trim() || undefined,
        file_path: newPath,
        cover_path: coverPath,
        current_page: 0,
        reading_progress: 0,
        is_finished: false,
      };

      await addBook(book);
      Alert.alert('Success', 'Book added to library!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving book:', error);
      Alert.alert('Error', 'Failed to add book.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add New Book</Text>

      <TouchableOpacity style={styles.pickButton} onPress={pickDocument}>
        <Text style={styles.pickButtonText}>
          {selectedFile ? `Selected: ${selectedFile.name}` : 'Pick PDF or EPUB File'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.pickButton} onPress={pickCover}>
        <Text style={styles.pickButtonText}>
          {selectedCover ? 'Cover Selected' : 'Pick Cover Image (Optional)'}
        </Text>
      </TouchableOpacity>

      {selectedCover && (
        <Image source={{ uri: selectedCover.uri }} style={styles.coverPreview} />
      )}

      <TextInput
        style={styles.input}
        placeholder="Book Title"
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.input}
        placeholder="Author (optional)"
        value={author}
        onChangeText={setAuthor}
      />

      <TouchableOpacity style={styles.saveButton} onPress={saveBook}>
        <Text style={styles.saveButtonText}>Add to Library</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  pickButton: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  pickButtonText: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  coverPreview: {
    width: 100,
    height: 133,
    alignSelf: 'center',
    marginBottom: 15,
    borderRadius: 5,
  },
});

export default AddBookScreen;