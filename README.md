# ReadingKulture - E-Book Reader App

A feature-rich Android e-book reader application built with React Native (Expo) that allows users to upload, organize, and read their personal e-book collection with Google Drive synchronization.

## Features

- **Book Upload**: Upload PDF and EPUB files from device storage
- **Library Management**: Organize books with grid/list view, search, and filters
- **PDF Reader**: Smooth PDF viewing with page navigation and progress tracking
- **Progress Tracking**: Automatic saving of reading progress
- **Local Database**: SQLite for offline book storage and metadata
- **Cross-Platform**: Built with Expo for easy Android deployment

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Database**: SQLite (expo-sqlite)
- **File Management**: expo-file-system
- **Document Picker**: expo-document-picker
- **PDF Rendering**: react-native-pdf
- **Navigation**: React Navigation

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ReadingKulture
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Run on Android:
   ```bash
   npx expo run:android
   ```

## Project Structure

```
src/
├── database.ts          # SQLite database initialization
├── types.ts             # TypeScript interfaces
├── services/
│   └── bookService.ts   # Book CRUD operations
└── screens/
    ├── LibraryScreen.tsx    # Main library view
    ├── AddBookScreen.tsx    # Book upload screen
    ├── ReaderScreen.tsx     # PDF reader
    ├── ExploreScreen.tsx    # Book discovery (placeholder)
    └── SettingsScreen.tsx   # Settings (placeholder)
```

## Database Schema

### Books Table
- id (TEXT PRIMARY KEY)
- title (TEXT)
- author (TEXT)
- file_path (TEXT)
- cover_path (TEXT)
- total_pages (INTEGER)
- current_page (INTEGER)
- reading_progress (REAL)
- is_finished (BOOLEAN)
- date_added (TIMESTAMP)
- last_opened (TIMESTAMP)
- google_drive_file_id (TEXT)

### Bookmarks Table
- id (INTEGER PRIMARY KEY)
- book_id (TEXT)
- page_number (INTEGER)
- percentage (REAL)
- note (TEXT)
- created_at (TIMESTAMP)

## Development Roadmap

### Phase 1: Core MVP ✅
- [x] Project setup with Expo
- [x] Book upload & local storage
- [x] Basic Library UI (grid view)
- [x] PDF rendering with page navigation
- [x] SQLite database setup

### Phase 2: Reading Features ✅
- [x] Volume button navigation (planned for future)
- [x] Dark mode toggle
- [x] Font size adjustment (zoom control)
- [x] Bookmark system
- [x] Progress tracking & persistence
- [x] Chapters menu (TOC)

### Phase 3: Advanced Features ✅
- [x] Google Drive synchronization (planned for future)
- [x] Custom book covers
- [x] Search & filter system
- [x] Bulk delete
- [x] Finished books section
- [x] EPUB support (planned for future)

### Phase 4: Explore & Polish
- [ ] Explore section with web scraping
- [ ] Download manager
- [ ] Text-to-speech integration
- [ ] Screen orientation controls
- [ ] Performance optimization
- [ ] Bug fixes & testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with Expo and React Native
- PDF rendering powered by react-native-pdf
- Inspired by popular e-book reader apps
