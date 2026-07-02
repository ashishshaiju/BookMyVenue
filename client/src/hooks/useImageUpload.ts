import { useState } from 'react';
import { useToast } from './useToast';
import { getUploadSignature } from '../services/venueService';
import axios from 'axios';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { error: showError } = useToast();

  const validateFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showError(`Invalid file type: ${file.name}. Only JPG, PNG and WEBP are allowed.`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showError(`File too large: ${file.name}. Maximum size is 5MB.`);
      return false;
    }
    return true;
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    for (const file of files) {
      if (!validateFile(file)) {
        throw new Error('File validation failed');
      }
    }

    setIsUploading(true);
    try {
      // Fetch signature
      const sig = await getUploadSignature();
      const urls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', sig.apiKey);
        formData.append('timestamp', String(sig.timestamp));
        formData.append('signature', sig.signature);
        formData.append('folder', sig.folder);
        formData.append('upload_preset', sig.uploadPreset);

        const res = await axios.post(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          formData
        );
        urls.push(res.data.secure_url);
      }

      return urls;
    } catch (error) {
      showError('Failed to upload images. Please try again.');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFiles, isUploading };
};
