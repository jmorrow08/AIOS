import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CosmicBackground } from '@/components/CosmicBackground';
import { RadialMenu } from '@/components/RadialMenu';

interface Document {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface FileWithMetadata {
  file: File;
  title: string;
  description: string;
  id: string;
}

const KnowledgeLibrary: React.FC = () => {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [summary, setSummary] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithMetadata[] = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        newFiles.push({
          file,
          title: file.name.replace(/\.(pdf|doc|docx)$/i, ''),
          description: '',
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

  const uploadDocument = async (fileWithMetadata: FileWithMetadata) => {
    const fileId = fileWithMetadata.id;
    setUploadingFiles((prev) => new Set([...prev, fileId]));

    try {
      const fileExt = fileWithMetadata.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('docs')
        .upload(fileName, fileWithMetadata.file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('docs').getPublicUrl(fileName);

      // Save metadata to documents table
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert([
          {
            title: fileWithMetadata.title,
            description: fileWithMetadata.description,
            file_url: urlData.publicUrl,
            file_name: fileWithMetadata.file.name,
            file_size: fileWithMetadata.file.size,
            file_type: fileWithMetadata.file.type,
          },
        ])
        .select();

      if (docError) {
        throw docError;
      }

      // Add to documents list
      if (docData && docData[0]) {
        setDocuments((prev) => [docData[0], ...prev]);
      }

      // Remove from files to upload
      setFiles((prev) => prev.filter((f) => f.id !== fileId));

      setMessage({ type: 'success', text: `${fileWithMetadata.file.name} uploaded successfully!` });
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: `Failed to upload ${fileWithMetadata.file.name}` });
    } finally {
      setUploadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const deleteDocument = async (document: Document) => {
    try {
      // Delete from storage
      const fileName = document.file_url.split('/').pop();
      if (fileName) {
        const { error: storageError } = await supabase.storage.from('docs').remove([fileName]);
        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase.from('documents').delete().eq('id', document.id);

      if (dbError) {
        throw dbError;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== document.id));
      setMessage({ type: 'success', text: 'Document deleted successfully!' });
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
  };

  const generateSummary = async (document: Document) => {
    setSelectedDocument(document);
    setSummary('Generating summary...');

    // Stub AI summarization - replace with actual AI service integration later
    setTimeout(() => {
      const mockSummary = `This document "${
        document.title
      }" contains important business information. The content appears to be a ${
        document.file_type === 'application/pdf' ? 'PDF' : 'Word'
      } document uploaded on ${new Date(document.created_at).toLocaleDateString()}. 

Key insights from the document:
• Comprehensive documentation of business processes
• Strategic planning elements
• Operational procedures and guidelines
• Templates and standardized formats

This document serves as a valuable resource for team members and stakeholders to understand and implement organizational procedures effectively.`;

      setSummary(mockSummary);
      setShowSummaryModal(true);
    }, 2000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || doc.created_at.startsWith(dateFilter);
    return matchesSearch && matchesDate;
  });

  return (
    <div className="relative min-h-screen bg-cosmic-dark text-white">
      <CosmicBackground />
      <RadialMenu />

      <div className="relative z-10 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cosmic-highlight mb-2">Knowledge Library</h1>
          <p className="text-xl text-cosmic-accent">
            Upload, manage, and summarize your business documents
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-xl mb-2">Drop documents here or click to browse</p>
            <p className="text-cosmic-light mb-4">Supports PDF and Word documents</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-cosmic-accent hover:bg-opacity-80 px-6 py-2 rounded-lg transition-colors"
            >
              Select Documents
            </button>
          </div>
        </div>

        {/* File Previews for Upload */}
        {files.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-cosmic-highlight">Ready to Upload</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((fileWithMetadata) => (
                <div
                  key={fileWithMetadata.id}
                  className="bg-cosmic-light bg-opacity-20 rounded-lg p-4"
                >
                  <div className="mb-4">
                    <input
                      type="text"
                      value={fileWithMetadata.title}
                      onChange={(e) =>
                        setFiles((prev) =>
                          prev.map((f) =>
                            f.id === fileWithMetadata.id ? { ...f, title: e.target.value } : f,
                          ),
                        )
                      }
                      placeholder="Document title"
                      className="w-full bg-cosmic-dark border border-cosmic-light rounded px-3 py-2 mb-2 text-white"
                    />
                    <textarea
                      value={fileWithMetadata.description}
                      onChange={(e) =>
                        setFiles((prev) =>
                          prev.map((f) =>
                            f.id === fileWithMetadata.id
                              ? { ...f, description: e.target.value }
                              : f,
                          ),
                        )
                      }
                      placeholder="Document description (optional)"
                      className="w-full bg-cosmic-dark border border-cosmic-light rounded px-3 py-2 text-white resize-none"
                      rows={3}
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{fileWithMetadata.file.name}</p>
                  <p className="text-xs text-cosmic-light">
                    {formatFileSize(fileWithMetadata.file.size)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => uploadDocument(fileWithMetadata)}
                      disabled={uploadingFiles.has(fileWithMetadata.id)}
                      className="flex-1 bg-cosmic-accent hover:bg-opacity-80 disabled:opacity-50 px-3 py-1 rounded text-sm transition-colors"
                    >
                      {uploadingFiles.has(fileWithMetadata.id) ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      onClick={() =>
                        setFiles((prev) => prev.filter((f) => f.id !== fileWithMetadata.id))
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

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-cosmic-light bg-opacity-20 border border-cosmic-accent rounded px-4 py-2 text-white placeholder-cosmic-light"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-cosmic-light bg-opacity-20 border border-cosmic-accent rounded px-4 py-2 text-white"
          />
        </div>

        {/* Documents List */}
        {filteredDocuments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-cosmic-highlight">
              Documents ({filteredDocuments.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="bg-cosmic-light bg-opacity-20 rounded-lg p-4">
                  <div className="mb-3">
                    <h3
                      className="text-lg font-semibold text-cosmic-highlight truncate"
                      title={document.title}
                    >
                      {document.title}
                    </h3>
                    {document.description && (
                      <p className="text-sm text-cosmic-light mt-1 line-clamp-2">
                        {document.description}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-cosmic-light mb-3">
                    <p>{formatFileSize(document.file_size)}</p>
                    <p>{new Date(document.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => window.open(document.file_url, '_blank')}
                      className="flex-1 bg-cosmic-accent hover:bg-opacity-80 px-2 py-1 rounded text-xs transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => generateSummary(document)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs transition-colors"
                    >
                      Summarize
                    </button>
                    <button
                      onClick={() => deleteDocument(document)}
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

        {/* Summary Modal */}
        {showSummaryModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-cosmic-dark border border-cosmic-accent rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-cosmic-highlight">
                  AI Summary: {selectedDocument.title}
                </h3>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="text-cosmic-light hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="text-cosmic-light whitespace-pre-line">{summary}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KnowledgeLibrary;
