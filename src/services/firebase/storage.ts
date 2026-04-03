/**
 * Firebase Storage Service
 * Handles file uploads and media management
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';
import { MediaItem, MediaType } from '../../types';

/**
 * Upload an image file to Firebase Storage
 * @param file - File to upload
 * @param planId - Trip plan ID
 * @param locationId - Location ID
 * @returns Promise<MediaItem> - Created media item with URL
 */
export async function uploadImage(
  file: File,
  planId: string,
  locationId: string
): Promise<MediaItem> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${sanitizedName}`;
    
    // Storage path: plans/{planId}/locations/{locationId}/images/{filename}
    const storagePath = `plans/${planId}/locations/${locationId}/images/${filename}`;
    const storageRef = ref(storage, storagePath);

    // Upload file
    console.log('[Storage] Uploading image:', { storagePath, fileSize: file.size });
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    // Get download URL
    const url = await getDownloadURL(snapshot.ref);
    console.log('[Storage] Image uploaded successfully:', url);

    // Create media item
    const mediaItem: MediaItem = {
      id: timestamp.toString(),
      type: 'image',
      url,
      thumbnail: url, // For now, use same URL as thumbnail
      title: file.name,
      createdAt: new Date(),
    };

    return mediaItem;
  } catch (error) {
    console.error('[Storage] Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete an image from Firebase Storage
 * @param url - Image URL to delete
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    // Extract storage path from URL
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      console.warn('[Storage] Could not extract path from URL:', url);
      return;
    }

    const storagePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, storagePath);

    console.log('[Storage] Deleting image:', storagePath);
    await deleteObject(storageRef);
    console.log('[Storage] Image deleted successfully');
  } catch (error) {
    console.error('[Storage] Error deleting image:', error);
    // Don't throw - image might already be deleted
  }
}

/**
 * Create a media item from a URL (YouTube, link, etc.)
 * @param type - Media type
 * @param url - Media URL
 * @param title - Optional title
 * @param description - Optional description
 * @returns MediaItem
 */
export function createMediaItem(
  type: MediaType,
  url: string,
  title?: string,
  description?: string
): MediaItem {
  // Validate YouTube URL
  if (type === 'youtube') {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(url)) {
      throw new Error('Invalid YouTube URL');
    }

    // Extract video ID for thumbnail
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    }

    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined;

    return {
      id: Date.now().toString(),
      type: 'youtube',
      url,
      thumbnail,
      title: title || 'YouTube Video',
      description,
      createdAt: new Date(),
    };
  }

  // Validate regular URL
  if (type === 'link') {
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL');
    }

    return {
      id: Date.now().toString(),
      type: 'link',
      url,
      title: title || url,
      description,
      createdAt: new Date(),
    };
  }

  throw new Error(`Unsupported media type: ${type}`);
}

/**
 * Get YouTube video ID from URL
 * @param url - YouTube URL
 * @returns Video ID or null
 */
export function getYouTubeVideoId(url: string): string | null {
  if (url.includes('youtube.com/watch?v=')) {
    return url.split('v=')[1]?.split('&')[0] || null;
  } else if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] || null;
  }
  return null;
}

/**
 * Get YouTube embed URL from video URL
 * @param url - YouTube URL
 * @returns Embed URL or null
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}
