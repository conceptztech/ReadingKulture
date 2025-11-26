import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('readingkulture.db');

// Initialize database tables
export const initDatabase = async () => {
  try {
    // Books table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        file_path TEXT NOT NULL,
        cover_path TEXT,
        total_pages INTEGER,
        current_page INTEGER DEFAULT 0,
        reading_progress REAL DEFAULT 0.0,
        is_finished BOOLEAN DEFAULT 0,
        date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_opened TIMESTAMP,
        google_drive_file_id TEXT
      );
    `);

    // Bookmarks table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id TEXT,
        page_number INTEGER,
        percentage REAL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );
    `);

    // Settings table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);

    console.log('Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

export default db;