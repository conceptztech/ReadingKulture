import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Switch, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import { Book } from '../types';
import { updateBookProgress, addBookmark, getBookmarksForBook } from '../services/bookService';
import * as Speech from 'expo-speech';
import * as ScreenOrientation from 'expo-screen-orientation';

const ReaderScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { book } = route.params as { book: Book };
  const [currentPage, setCurrentPage] = useState(book.current_page || 1);
  const [totalPages, setTotalPages] = useState(book.total_pages || 0);
  const [showControls, setShowControls] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<any[]>([]);
  const [scale, setScale] = useState(1.0);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [orientation, setOrientation] = useState(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  useEffect(() => {
    loadBookmarks();
    // Lock orientation to portrait initially
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const loadBookmarks = async () => {
    try {
      const bms = await getBookmarksForBook(book.id);
      setBookmarks(bms);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const onPageChanged = async (page: number, numberOfPages: number) => {
    setCurrentPage(page);
    setTotalPages(numberOfPages);
    const progress = page / numberOfPages;
    try {
      await updateBookProgress(book.id, page, progress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const addBookmarkHere = async () => {
    try {
      await addBookmark({
        book_id: book.id,
        page_number: currentPage,
        percentage: currentPage / totalPages,
        note: `Page ${currentPage}`,
      });
      loadBookmarks();
      Alert.alert('Bookmark Added', `Bookmarked page ${currentPage}`);
    } catch (error) {
      console.error('Error adding bookmark:', error);
    }
  };

  const toggleTTS = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      // Note: Extracting text from PDF is complex. For now, we'll speak page info
      const text = `Page ${currentPage} of ${totalPages}`;
      Speech.speak(text, {
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
      setIsSpeaking(true);
    }
  };

  const toggleOrientation = async () => {
    const newOrientation = orientation === ScreenOrientation.OrientationLock.PORTRAIT_UP
      ? ScreenOrientation.OrientationLock.LANDSCAPE
      : ScreenOrientation.OrientationLock.PORTRAIT_UP;
    await ScreenOrientation.lockAsync(newOrientation);
    setOrientation(newOrientation);
  };

  const source = { uri: book.file_path, cache: true };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <TouchableOpacity style={styles.pdfContainer} onPress={toggleControls} activeOpacity={1}>
        <Pdf
          source={source}
          onLoadComplete={(numberOfPages, filePath, toc: any) => {
            setTotalPages(numberOfPages);
            setTableOfContents(toc?.tableOfContents || []);
          }}
          onPageChanged={onPageChanged}
          onError={(error) => {
            console.log(error);
          }}
          scale={scale}
          style={styles.pdf}
        />
      </TouchableOpacity>

      {showControls && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => navigation.goBack()}>
            <Text style={styles.controlText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={addBookmarkHere}>
            <Text style={styles.controlText}>Bookmark</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleTTS}>
            <Text style={styles.controlText}>{isSpeaking ? 'Stop TTS' : 'TTS'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleOrientation}>
            <Text style={styles.controlText}>Rotate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => { setShowChapters(true); setShowControls(false); }}>
            <Text style={styles.controlText}>Chapters</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={() => { setShowSettings(true); setShowControls(false); }}>
            <Text style={styles.controlText}>Settings</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.pageInfo, darkMode && styles.darkText]}>
          Page {currentPage} of {totalPages}
        </Text>
      </View>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Settings</Text>
            <View style={styles.settingRow}>
              <Text>Dark Mode</Text>
              <Switch value={darkMode} onValueChange={setDarkMode} />
            </View>
            <View style={styles.settingRow}>
              <Text>Zoom: {Math.round(scale * 100)}%</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => setScale(Math.max(0.5, scale - 0.1))} style={styles.zoomButton}>
                  <Text>-</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setScale(Math.min(2.0, scale + 0.1))} style={styles.zoomButton}>
                  <Text>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSettings(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Chapters Modal */}
      <Modal visible={showChapters} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Table of Contents</Text>
            {tableOfContents.length > 0 ? (
              tableOfContents.map((chapter, index) => (
                <TouchableOpacity key={index} style={styles.chapterItem} onPress={() => { /* TODO: jump to page */ setShowChapters(false); }}>
                  <Text>{chapter.title}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text>No table of contents available</Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowChapters(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
  },
  controlButton: {
    padding: 10,
  },
  controlText: {
    color: '#fff',
    fontSize: 16,
  },
  footer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    alignItems: 'center',
  },
  pageInfo: {
    color: '#fff',
    fontSize: 16,
  },
  darkText: {
    color: '#e0e0e0',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    alignSelf: 'center',
    padding: 10,
  },
  chapterItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  zoomButton: {
    padding: 5,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
});

export default ReaderScreen;