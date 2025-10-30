import React, { useState, useEffect } from 'react';
import { MainNavigation } from '@/components/MainNavigation';
import { supabase } from '@/lib/supabaseClient';
import { Document, EditorMode } from '@/lib/types';
import {
  generateDocumentDraft,
  generateDocumentSummary,
  answerQuestionWithKnowledge,
  createSummaryDocument,
} from '@/lib/aiServices';
import DocumentList from '@/components/DocumentList';
import DocEditor from '@/components/DocEditor';
import QnAWidget from '@/components/QnAWidget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  FileText,
  Database,
  Cloud,
  ExternalLink,
  Loader2,
  Plus,
  BookOpen,
  MessageCircle,
  Settings,
} from 'lucide-react';

const KnowledgeLibrary: React.FC = () => {
  // Document management state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Legacy search state (for backward compatibility with existing features)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [vectorResults, setVectorResults] = useState<any[]>([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [useVectorSearch, setUseVectorSearch] = useState(true);

  // Legacy source data
  const [notionDocs, setNotionDocs] = useState<any[]>([]);
  const [driveDocs, setDriveDocs] = useState<any[]>([]);
  const [internalDocs, setInternalDocs] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState({
    notion: false,
    drive: false,
    internal: false,
  });

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
    loadSourceDocuments(); // Keep legacy functionality
  }, []);

  // Load documents from Supabase
  const loadDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  // Save document (create or update)
  const saveDocument = async (documentData: Partial<Document>) => {
    setIsSaving(true);
    try {
      if (editorMode === 'edit' && selectedDocument) {
        // Update existing document
        const { data, error } = await supabase
          .from('documents')
          .update(documentData)
          .eq('id', selectedDocument.id)
          .select()
          .single();

        if (error) throw error;

        // Update local state
        setDocuments((prev) =>
          prev.map((doc) => (doc.id === selectedDocument.id ? { ...doc, ...data } : doc)),
        );
        setSelectedDocument({ ...selectedDocument, ...data });
      } else {
        // Create new document
        const { data, error } = await supabase
          .from('documents')
          .insert([documentData])
          .select()
          .single();

        if (error) throw error;

        // Add to local state
        setDocuments((prev) => [data, ...prev]);
        setSelectedDocument(data);
        setEditorMode('view');
      }
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete document
  const deleteDocument = async (documentId: string) => {
    try {
      const { error } = await supabase.from('documents').delete().eq('id', documentId);

      if (error) throw error;

      // Update local state
      setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setEditorMode(null);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  // Generate AI draft
  const handleGenerateAIDraft = async (request: any) => {
    const content = await generateDocumentDraft(request);
    return content;
  };

  // Handle document summarization
  const handleSummarizeDocument = async (document: Document) => {
    try {
      const summaryContent = await generateDocumentSummary(document);
      const summaryDoc = createSummaryDocument(document, summaryContent);

      // Option to save as new document
      if (window.confirm('Would you like to save this summary as a new document?')) {
        await saveDocument(summaryDoc);
      } else {
        // Just show the summary in an alert for now
        alert(`Summary:\n\n${summaryContent}`);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    }
  };

  // Handle Q&A
  const handleAskQuestion = async (question: string) => {
    return await answerQuestionWithKnowledge(question, documents);
  };

  // Legacy function - keep for backward compatibility
  const loadSourceDocuments = async () => {
    // This would load external sources if needed
    console.log('Legacy source loading - keeping for compatibility');
  };

  // Document management handlers
  const handleDocumentSelect = (document: Document | null) => {
    setSelectedDocument(document);
    setEditorMode(document ? 'view' : null);
  };

  const handleDocumentEdit = (document: Document | null) => {
    setSelectedDocument(document);
    setEditorMode(document ? 'edit' : null);
  };

  const handleCreateDocument = () => {
    setSelectedDocument(null);
    setEditorMode('create');
  };

  const handleCancelEdit = () => {
    setEditorMode(selectedDocument ? 'view' : null);
  };

  // Legacy search function - keep for compatibility
  const handleSearch = async () => {
    // Legacy search implementation can be kept here if needed
  };

  return (
    <div className="h-screen flex bg-cosmic-dark">
      <MainNavigation />
      <div className="flex-1 flex flex-col p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BookOpen className="w-8 h-8 text-cosmic-accent" />
            <h1 className="text-3xl font-bold text-white">Knowledge Library</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreateDocument}
              className="bg-cosmic-accent hover:bg-cosmic-highlight"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Document
            </Button>
            <Button
              onClick={() => loadDocuments()}
              variant="outline"
              className="text-white border-cosmic-accent hover:bg-cosmic-accent"
            >
              <Loader2 className={`w-4 h-4 mr-2 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Content - Two Pane Layout */}
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Left Pane - Document List */}
          <div className="flex-1 flex flex-col min-w-0">
            <Card className="bg-cosmic-dark border-cosmic-light flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <DocumentList
                  documents={documents}
                  isLoading={isLoadingDocuments}
                  onDocumentSelect={handleDocumentSelect}
                  onDocumentEdit={handleDocumentEdit}
                  onDocumentDelete={deleteDocument}
                  onSummarize={handleSummarizeDocument}
                  selectedDocumentId={selectedDocument?.id}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Pane - Editor */}
          <div className="flex-1 flex flex-col min-w-0">
            {editorMode ? (
              <DocEditor
                document={selectedDocument}
                mode={editorMode}
                isLoading={isSaving}
                onSave={saveDocument}
                onCancel={handleCancelEdit}
                onGenerateAIDraft={handleGenerateAIDraft}
              />
            ) : (
              <Card className="bg-cosmic-dark border-cosmic-light h-full flex flex-col">
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium text-white mb-2">
                      {selectedDocument ? 'Select an action' : 'Select a document'}
                    </h3>
                    <p className="text-sm">
                      {selectedDocument
                        ? 'Choose to view, edit, or summarize the selected document.'
                        : 'Choose a document from the list to view or edit it.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Q&A Widget */}
        <div className="mt-6">
          <QnAWidget documents={documents} onAskQuestion={handleAskQuestion} />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeLibrary;
