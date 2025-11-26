import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput, Switch } from 'react-native';
import { Book } from '../types';
import { getAllBooks, deleteBook, markBookFinished } from '../services/bookService';

const LibraryScreen = ({ navigation }: any) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFinished, setShowFinished] = useState(true);
  const [sortBy, setSortBy] = useState<'recentlyAdded' | 'recentlyRead' | 'titleAsc' | 'titleDesc'>('recentlyRead');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    filterAndSortBooks();
  }, [books, searchQuery, showFinished, sortBy]);

  const loadBooks = useCallback(async () => {
    try {
      const allBooks = await getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  }, []);

  const filterAndSortBooks = useCallback(() => {
    let filtered = books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFinished = showFinished || !book.is_finished;
      return matchesSearch && matchesFinished;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recentlyAdded':
          return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
        case 'recentlyRead':
          return (b.last_opened ? new Date(b.last_opened).getTime() : 0) - (a.last_opened ? new Date(a.last_opened).getTime() : 0);
        case 'titleAsc':
          return a.title.localeCompare(b.title);
        case 'titleDesc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    setFilteredBooks(filtered);
  }, [books, searchQuery, showFinished, sortBy]);

  const handleBookPress = (book: Book) => {
    if (selectionMode) {
      toggleSelection(book.id);
    } else {
      navigation.navigate('Reader', { book });
    }
  };

  const handleLongPress = (book: Book) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedBooks(new Set([book.id]));
    }
  };

  const toggleSelection = (bookId: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBooks(newSelected);
    if (newSelected.size === 0) {
      setSelectionMode(false);
    }
  };

  const deleteSelectedBooks = async () => {
    const bookIds = Array.from(selectedBooks);
    Alert.alert(
      'Delete Books',
      `Are you sure you want to delete ${bookIds.length} book(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(bookIds.map(id => deleteBook(id)));
              setSelectionMode(false);
              setSelectedBooks(new Set());
              loadBooks();
            } catch (error) {
              console.error('Error deleting books:', error);
            }
          },
        },
      ]
    );
  };

  const toggleFinished = async (book: Book) => {
    try {
      await markBookFinished(book.id, !book.is_finished);
      loadBooks();
    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  const renderBook = ({ item }: { item: Book }) => {
    const isSelected = selectedBooks.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.bookItem, isSelected && styles.selectedBook]}
        onPress={() => handleBookPress(item)}
        onLongPress={() => handleLongPress(item)}
      >
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          <Text style={styles.bookAuthor}>{item.author || 'Unknown Author'}</Text>
          <Text style={styles.bookProgress}>{Math.round(item.reading_progress * 100)}% complete</Text>
          {item.is_finished && <Text style={styles.finishedBadge}>Finished</Text>}
        </View>
        {selectionMode && (
          <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelection(item.id)}>
            <Text style={isSelected ? styles.checked : styles.unchecked}>
              {isSelected ? '☑' : '☐'}
            </Text>
          </TouchableOpacity>
        )}
        {!selectionMode && (
          <TouchableOpacity style={styles.finishedButton} onPress={() => toggleFinished(item)}>
            <Text style={item.is_finished ? styles.unfinishedText : styles.finishedText}>
              {item.is_finished ? 'Mark Unfinished' : 'Mark Finished'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Library</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search books..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <Text>Show Finished</Text>
          <Switch value={showFinished} onValueChange={setShowFinished} />
        </View>
        <View style={styles.sortButtons}>
          <TouchableOpacity style={[styles.sortButton, sortBy === 'recentlyRead' && styles.activeSort]} onPress={() => setSortBy('recentlyRead')}>
            <Text style={styles.sortText}>Recent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortButton, sortBy === 'titleAsc' && styles.activeSort]} onPress={() => setSortBy('titleAsc')}>
            <Text style={styles.sortText}>A-Z</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sortButton, sortBy === 'titleDesc' && styles.activeSort]} onPress={() => setSortBy('titleDesc')}>
            <Text style={styles.sortText}>Z-A</Text>
          </TouchableOpacity>
        </View>
      </View>

      {selectionMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedBooks.size} selected</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={deleteSelectedBooks}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => { setSelectionMode(false); setSelectedBooks(new Set()); }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredBooks}
        renderItem={renderBook}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No books match your search.</Text>}
      />

      {!selectionMode && (
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddBook')}>
          <Text style={styles.addButtonText}>Add Book</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sortButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  activeSort: {
    backgroundColor: '#2196F3',
  },
  sortText: {
    fontSize: 14,
    color: '#333',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 5,
  },
  deleteText: {
    color: '#fff',
    fontSize: 14,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#666',
    fontSize: 14,
  },
  bookItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedBook: {
    backgroundColor: '#e3f2fd',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
  },
  bookProgress: {
    fontSize: 12,
    color: '#999',
  },
  finishedBadge: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: 'bold',
    marginTop: 5,
  },
  checkbox: {
    padding: 5,
  },
  checked: {
    fontSize: 18,
    color: '#2196F3',
  },
  unchecked: {
    fontSize: 18,
    color: '#ccc',
  },
  finishedButton: {
    padding: 5,
  },
  finishedText: {
    fontSize: 12,
    color: '#4caf50',
  },
  unfinishedText: {
    fontSize: 12,
    color: '#f44336',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 50,
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LibraryScreen;