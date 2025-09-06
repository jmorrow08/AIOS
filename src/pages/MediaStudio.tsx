import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CosmicBackground } from '@/components/CosmicBackground';
import { RadialMenu } from '@/components/RadialMenu';

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

const MediaStudio: React.FC = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load uploaded files on component mount
  useEffect(() => {
    loadUploadedFiles();
  }, []);

  const loadUploadedFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from('media').list();

      if (error) {
        console.error('Error loading files:', error);
        return;
      }

      const filesWithUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(file.name);

          return {
            id: file.name,
            name: file.name,
            url: urlData.publicUrl,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'unknown',
            uploadedAt: new Date(file.created_at),
          };
        }),
      );

      setUploadedFiles(filesWithUrls);
    } catch (error) {
      console.error('Error loading uploaded files:', error);
    }
  };

  const generatePreview = (file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    } else if (file.type.startsWith('video/')) {
      return URL.createObjectURL(file);
    }
    return '/placeholder-file.png'; // You can add a placeholder icon
  };

  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithPreview[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        newFiles.push({
          file,
          preview: generatePreview(file),
          id: `${Date.now()}-${Math.random()}`,
        });
      }
    }
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles],
  );

  const uploadFile = async (fileWithPreview: FileWithPreview) => {
    const fileId = fileWithPreview.id;
    setUploadingFiles((prev) => new Set([...prev, fileId]));

    try {
      const fileExt = fileWithPreview.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('media')
        .upload(fileName, fileWithPreview.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);

      // Add to uploaded files list
      const newUploadedFile: UploadedFile = {
        id: fileName,
        name: fileWithPreview.file.name,
        url: urlData.publicUrl,
        size: fileWithPreview.file.size,
        type: fileWithPreview.file.type,
        uploadedAt: new Date(),
      };

      setUploadedFiles((prev) => [newUploadedFile, ...prev]);

      // Remove from files to upload
      setFiles((prev) => prev.filter((f) => f.id !== fileId));

      setMessage({ type: 'success', text: `${fileWithPreview.file.name} uploaded successfully!` });
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: `Failed to upload ${fileWithPreview.file.name}` });
    } finally {
      setUploadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
    }
  };

  const deleteFile = async (fileName: string) => {
    try {
      const { error } = await supabase.storage.from('media').remove([fileName]);

      if (error) {
        throw error;
      }

      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileName));
      setMessage({ type: 'success', text: 'File deleted successfully!' });
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete file' });
    }
  };

  const generateAIContent = (fileName: string) => {
    // Stub function for AI content generation
    const aiContent =
      Math.random() > 0.5
        ? `AI-generated caption: "A stunning ${fileName
            .split('.')
            .pop()} that captures the essence of creativity and innovation."`
        : `AI-generated script: "Welcome to this amazing visual journey featuring ${fileName}. Let's explore the possibilities together!"`;

    setMessage({ type: 'success', text: aiContent });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="relative min-h-screen bg-cosmic-dark text-white">
      <CosmicBackground />
      <RadialMenu />

      <div className="relative z-10 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cosmic-highlight mb-2">Media Studio</h1>
          <p className="text-xl text-cosmic-accent">
            Upload and create multimedia content with AI enhancements
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500 bg-opacity-20 text-green-300 border border-green-500'
                : 'bg-red-500 bg-opacity-20 text-red-300 border border-red-500'
            }`}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right ml-4 text-xl font-bold">
              ×
            </button>
          </div>
        )}

        {/* Upload Zone */}
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? 'border-cosmic-accent bg-cosmic-accent bg-opacity-10'
                : 'border-cosmic-light hover:border-cosmic-accent'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-cosmic-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-xl mb-2">Drop files here or click to browse</p>
            <p className="text-cosmic-light mb-4">Supports images and videos</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-cosmic-accent hover:bg-cosmic-accent-hover px-6 py-2 rounded-lg transition-colors"
            >
              Select Files
            </button>
          </div>
        </div>

        {/* File Previews */}
        {files.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-cosmic-highlight">Ready to Upload</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((fileWithPreview) => (
                <div
                  key={fileWithPreview.id}
                  className="bg-cosmic-light bg-opacity-20 rounded-lg p-4"
                >
                  <div className="aspect-video bg-cosmic-dark rounded mb-2 overflow-hidden">
                    {fileWithPreview.file.type.startsWith('image/') ? (
                      <img
                        src={fileWithPreview.preview}
                        alt={fileWithPreview.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={fileWithPreview.preview}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{fileWithPreview.file.name}</p>
                  <p className="text-xs text-cosmic-light">
                    {formatFileSize(fileWithPreview.file.size)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => uploadFile(fileWithPreview)}
                      disabled={uploadingFiles.has(fileWithPreview.id)}
                      className="flex-1 bg-cosmic-accent hover:bg-opacity-80 disabled:opacity-50 px-3 py-1 rounded text-sm transition-colors"
                    >
                      {uploadingFiles.has(fileWithPreview.id) ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      onClick={() =>
                        setFiles((prev) => prev.filter((f) => f.id !== fileWithPreview.id))
                      }
                      className="px-3 py-1 rounded text-sm border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-cosmic-highlight">Uploaded Files</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="bg-cosmic-light bg-opacity-20 rounded-lg p-4">
                  <div className="aspect-video bg-cosmic-dark rounded mb-2 overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <video src={file.url} className="w-full h-full object-cover" controls />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-cosmic-light">{formatFileSize(file.size)}</p>
                  <p className="text-xs text-cosmic-light">
                    {file.uploadedAt.toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex gap-1">
                    <button
                      onClick={() => window.open(file.url, '_blank')}
                      className="flex-1 bg-cosmic-accent hover:bg-opacity-80 px-2 py-1 rounded text-xs transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => generateAIContent(file.name)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors"
                    >
                      AI Content
                    </button>
                    <button
                      onClick={() => deleteFile(file.id)}
                      className="px-2 py-1 rounded text-xs border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaStudio;
