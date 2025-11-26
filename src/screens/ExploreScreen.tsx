import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { downloadManager, DownloadTask } from '../services/downloadManager';
import { addBook } from '../services/bookService';
import { Book } from '../types';

interface GutenbergBook {
  id: number;
  title: string;
  authors: Array<{ name: string }>;
  formats: { [key: string]: string };
}

const ExploreScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<GutenbergBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<Set<number>>(new Set());
  const [downloadTasks, setDownloadTasks] = useState<Map<number, DownloadTask>>(new Map());

  const searchBooks = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `https://gutendex.com/books?search=${encodeURIComponent(searchQuery)}&languages=en`
      );
      setBooks(response.data.results || []);
    } catch (error) {
      console.error('Error searching books:', error);
      Alert.alert('Error', 'Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  const downloadBook = async (book: GutenbergBook) => {
    const pdfUrl = book.formats['application/pdf'] || book.formats['text/html'];
    if (!pdfUrl) {
      Alert.alert('Not Available', 'PDF version not available for this book');
      return;
    }

    setDownloading(prev => new Set(prev).add(book.id));

    try {
      const fileName = `${book.id}.pdf`;
      const fileUri = `${(FileSystem as any).documentDirectory}books/${fileName}`;

      await FileSystem.makeDirectoryAsync(`${(FileSystem as any).documentDirectory}books/`, { intermediates: true });

      const taskId = downloadManager.addDownload(pdfUrl, fileUri);
      const task = downloadManager.getTask(taskId);
      if (task) {
        setDownloadTasks(prev => new Map(prev).set(book.id, task));
      }

      // Monitor progress
      const checkProgress = async () => {
        const currentTask = downloadManager.getTask(taskId);
        if (currentTask) {
          setDownloadTasks(prev => new Map(prev).set(book.id, currentTask));
          if (currentTask.status === 'completed') {
            const newBook: Omit<Book, 'id' | 'date_added'> = {
              title: book.title,
              author: book.authors.length > 0 ? book.authors[0].name : undefined,
              file_path: fileUri,
              current_page: 0,
              reading_progress: 0,
              is_finished: false,
            };
            await addBook(newBook);
            Alert.alert('Success', 'Book downloaded and added to library!');
            setDownloadTasks(prev => {
              const newMap = new Map(prev);
              newMap.delete(book.id);
              return newMap;
            });
          } else if (currentTask.status === 'failed') {
            Alert.alert('Error', 'Failed to download book');
            setDownloadTasks(prev => {
              const newMap = new Map(prev);
              newMap.delete(book.id);
              return newMap;
            });
          } else {
            setTimeout(checkProgress, 500);
          }
        }
      };
      checkProgress();

    } catch (error) {
      console.error('Error downloading book:', error);
      Alert.alert('Error', 'Failed to download book');
    } finally {
      setDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(book.id);
        return newSet;
      });
    }
  };

  const renderBook = ({ item }: { item: GutenbergBook }) => {
    const isDownloading = downloading.has(item.id);
    const task = downloadTasks.get(item.id);
    return (
      <View style={styles.bookItem}>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.authors.length > 0 ? item.authors[0].name : 'Unknown Author'}
          </Text>
          <Text style={styles.bookFormat}>
            {item.formats['application/pdf'] ? 'PDF Available' : 'HTML Only'}
          </Text>
          {task && (
            <Text style={styles.progressText}>
              {task.status === 'downloading' ? `Downloading: ${Math.round(task.progress * 100)}%` :
               task.status === 'completed' ? 'Completed' : 'Failed'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.downloadButton, isDownloading && styles.downloadingButton]}
          onPress={() => downloadBook(item)}
          disabled={isDownloading}
        >
          <Text style={styles.downloadText}>
            {isDownloading ? 'Downloading...' : 'Download'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Explore Books</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Project Gutenberg..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchBooks}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchBooks}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Searching...</Text>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery ? 'No books found. Try a different search.' : 'Search for books to explore.'}
            </Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    color: '#666',
  },
  bookItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookFormat: {
    fontSize: 12,
    color: '#888',
  },
  progressText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  downloadButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  downloadingButton: {
    backgroundColor: '#ffc107',
  },
  downloadText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ExploreScreen;