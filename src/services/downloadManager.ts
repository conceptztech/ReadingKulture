import * as FileSystem from 'expo-file-system';

export interface DownloadTask {
  id: string;
  url: string;
  filePath: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
}

class DownloadManager {
  private queue: DownloadTask[] = [];
  private activeDownloads: Map<string, any> = new Map();
  private maxConcurrent = 2;

  addDownload(url: string, filePath: string): string {
    const id = Date.now().toString();
    const task: DownloadTask = {
      id,
      url,
      filePath,
      progress: 0,
      status: 'pending',
    };
    this.queue.push(task);
    this.processQueue();
    return id;
  }

  private async processQueue() {
    const activeCount = this.activeDownloads.size;
    if (activeCount >= this.maxConcurrent) return;

    const pendingTask = this.queue.find(task => task.status === 'pending');
    if (!pendingTask) return;

    pendingTask.status = 'downloading';
    await this.startDownload(pendingTask);
  }

  private async startDownload(task: DownloadTask) {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        task.url,
        task.filePath,
        {},
        (downloadProgress) => {
          task.progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        }
      );

      this.activeDownloads.set(task.id, downloadResumable);
      const result = await downloadResumable.downloadAsync();

      if (result) {
        task.status = 'completed';
        task.progress = 1;
      } else {
        task.status = 'failed';
      }
    } catch (error) {
      task.status = 'failed';
      console.error('Download failed:', error);
    } finally {
      this.activeDownloads.delete(task.id);
      this.processQueue();
    }
  }

  getTask(id: string): DownloadTask | undefined {
    return this.queue.find(task => task.id === id);
  }

  getAllTasks(): DownloadTask[] {
    return [...this.queue];
  }

  cancelDownload(id: string) {
    const task = this.queue.find(t => t.id === id);
    if (task && task.status === 'downloading') {
      const download = this.activeDownloads.get(id);
      if (download) {
        download.cancelAsync();
        this.activeDownloads.delete(id);
      }
      task.status = 'failed';
      this.processQueue();
    }
  }
}

export const downloadManager = new DownloadManager();