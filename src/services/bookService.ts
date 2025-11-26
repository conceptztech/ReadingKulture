import db from '../database';
import { Book, Bookmark } from '../types';

export const addBook = async (book: Omit<Book, 'id' | 'date_added'>): Promise<string> => {
  const id = Date.now().toString(); // Simple ID generation
  try {
    await db.runAsync(
      `INSERT INTO books (id, title, author, file_path, cover_path, total_pages, current_page, reading_progress, is_finished, last_opened, google_drive_file_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, book.title, book.author || null, book.file_path, book.cover_path || null, book.total_pages || null, book.current_page, book.reading_progress, book.is_finished ? 1 : 0, book.last_opened || null, book.google_drive_file_id || null]
    );
    return id;
  } catch (error) {
    throw error;
  }
};

export const getAllBooks = async (): Promise<Book[]> => {
  try {
    const result = await db.getAllAsync<Book>('SELECT * FROM books ORDER BY last_opened DESC, date_added DESC');
    return result;
  } catch (error) {
    throw error;
  }
};

export const updateBookProgress = async (id: string, currentPage: number, progress: number): Promise<void> => {
  try {
    await db.runAsync(
      'UPDATE books SET current_page = ?, reading_progress = ?, last_opened = CURRENT_TIMESTAMP WHERE id = ?',
      [currentPage, progress, id]
    );
  } catch (error) {
    throw error;
  }
};

export const markBookFinished = async (id: string, finished: boolean): Promise<void> => {
  try {
    await db.runAsync(
      'UPDATE books SET is_finished = ? WHERE id = ?',
      [finished ? 1 : 0, id]
    );
  } catch (error) {
    throw error;
  }
};

export const deleteBook = async (id: string): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM books WHERE id = ?', [id]);
  } catch (error) {
    throw error;
  }
};

export const addBookmark = async (bookmark: Omit<Bookmark, 'id' | 'created_at'>): Promise<number> => {
  try {
    const result = await db.runAsync(
      'INSERT INTO bookmarks (book_id, page_number, percentage, note) VALUES (?, ?, ?, ?)',
      [bookmark.book_id, bookmark.page_number, bookmark.percentage, bookmark.note || null]
    );
    return result.lastInsertRowId;
  } catch (error) {
    throw error;
  }
};

export const getBookmarksForBook = async (bookId: string): Promise<Bookmark[]> => {
  try {
    const result = await db.getAllAsync<Bookmark>('SELECT * FROM bookmarks WHERE book_id = ? ORDER BY page_number', [bookId]);
    return result;
  } catch (error) {
    throw error;
  }
};

export const deleteBookmark = async (id: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [id]);
  } catch (error) {
    throw error;
  }
};