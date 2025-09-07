import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { performRAGSearch, getSourceDocuments, type SearchResult } from '@/agents/rag';
import { queryKnowledge, type VectorSearchResult } from '@/utils/rag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Database, Cloud, ExternalLink, Loader2 } from 'lucide-react';

const KnowledgeLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [vectorResults, setVectorResults] = useState<VectorSearchResult[]>([]);
  const [searchSummary, setSearchSummary] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [useVectorSearch, setUseVectorSearch] = useState(true);

  // Source-specific data
  const [notionDocs, setNotionDocs] = useState<SearchResult[]>([]);
  const [driveDocs, setDriveDocs] = useState<SearchResult[]>([]);
  const [internalDocs, setInternalDocs] = useState<SearchResult[]>([]);
  const [loadingSources, setLoadingSources] = useState({
    notion: false,
    drive: false,
    internal: false,
  });

  useEffect(() => {
    // Load documents from each source on component mount
    loadSourceDocuments();
  }, []);

  const loadSourceDocuments = async () => {
    // Load Notion documents
    setLoadingSources((prev) => ({ ...prev, notion: true }));
    try {
      const notionResults = await getSourceDocuments('notion');
      setNotionDocs(notionResults);
    } catch (error) {
      console.error('Error loading Notion docs:', error);
    } finally {
      setLoadingSources((prev) => ({ ...prev, notion: false }));
    }

    // Load Google Drive documents
    setLoadingSources((prev) => ({ ...prev, drive: true }));
    try {
      const driveResults = await getSourceDocuments('google-drive');
      setDriveDocs(driveResults);
    } catch (error) {
      console.error('Error loading Drive docs:', error);
    } finally {
      setLoadingSources((prev) => ({ ...prev, drive: false }));
    }

    // Load Internal documents
    setLoadingSources((prev) => ({ ...prev, internal: true }));
    try {
      const internalResults = await getSourceDocuments('internal');
      setInternalDocs(internalResults);
    } catch (error) {
      console.error('Error loading internal docs:', error);
    } finally {
      setLoadingSources((prev) => ({ ...prev, internal: false }));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setVectorResults([]);
    setSearchSummary('');

    try {
      if (useVectorSearch) {
        // Use vector search for more accurate results
        const vectorResponse = await queryKnowledge(searchQuery);

        if (vectorResponse.success) {
          setVectorResults(vectorResponse.results);
          setSearchSummary(
            `Found ${vectorResponse.results.length} relevant results using vector search.`,
          );
        } else {
          console.error('Vector search failed:', vectorResponse.error);
          setSearchSummary('Vector search failed. Falling back to API search...');
          // Fall back to API search
          await performAPISearch();
        }
      } else {
        // Use API-based search
        await performAPISearch();
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setSearchSummary('An error occurred while searching.');
    } finally {
      setIsSearching(false);
    }
  };

  const performAPISearch = async () => {
    try {
      const response = await performRAGSearch(searchQuery);

      if (response.success) {
        setSearchResults(response.results);
        setSearchSummary(response.summary || '');
      } else {
        console.error('API search failed:', response.error);
        setSearchSummary('Search failed. Please try again.');
      }
    } catch (error) {
      console.error('Error performing API search:', error);
      setSearchSummary('An error occurred while searching.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'notion':
        return <FileText className="w-4 h-4" />;
      case 'google-drive':
        return <Cloud className="w-4 h-4" />;
      case 'internal':
        return <Database className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'notion':
        return 'text-blue-400';
      case 'google-drive':
        return 'text-green-400';
      case 'internal':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatSourceName = (source: string) => {
    switch (source) {
      case 'notion':
        return 'Notion';
      case 'google-drive':
        return 'Google Drive';
      case 'internal':
        return 'Internal';
      default:
        return source;
    }
  };

  const renderDocumentTable = (documents: SearchResult[], loading: boolean) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-cosmic-accent" />
          <span className="ml-2 text-white">Loading documents...</span>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">No documents found in this source.</div>
      );
    }

    return (
      <div className="bg-cosmic-dark rounded-lg border border-cosmic-light overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-white">Title</TableHead>
              <TableHead className="text-white">Source</TableHead>
              <TableHead className="text-white">Last Modified</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="text-white font-medium">{doc.title}</TableCell>
                <TableCell>
                  <div className={`flex items-center ${getSourceColor(doc.source)}`}>
                    {getSourceIcon(doc.source)}
                    <span className="ml-2">{formatSourceName(doc.source)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-white">
                  {doc.lastModified ? new Date(doc.lastModified).toLocaleDateString() : 'N/A'}
                </TableCell>
                <TableCell>
                  {doc.url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.url, '_blank')}
                      className="text-white border-cosmic-accent hover:bg-cosmic-accent"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderSearchResults = () => {
    const hasResults = (searchResults.length > 0 || vectorResults.length > 0) && !isSearching;
    if (!hasResults && !isSearching) {
      return null;
    }

    return (
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Search Results</h3>

        {searchSummary && (
          <div className="bg-cosmic-light p-4 rounded-lg mb-4">
            <p className="text-white">{searchSummary}</p>
          </div>
        )}

        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-cosmic-accent" />
            <span className="ml-2 text-white">Searching...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Vector Search Results */}
            {vectorResults.length > 0 && (
              <div className="bg-cosmic-dark rounded-lg border border-cosmic-light overflow-hidden">
                <div className="p-4 border-b border-cosmic-light">
                  <h4 className="text-white font-semibold">Vector Search Results</h4>
                  <p className="text-gray-400 text-sm">AI-powered semantic search</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Content</TableHead>
                      <TableHead className="text-white">Source</TableHead>
                      <TableHead className="text-white">Similarity</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vectorResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="text-white">
                          <div>
                            <div className="font-medium">{result.metadata.title}</div>
                            <div className="text-sm text-gray-400 mt-1">
                              {result.content.length > 100
                                ? `${result.content.substring(0, 100)}...`
                                : result.content}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div
                            className={`flex items-center ${getSourceColor(
                              result.metadata.source,
                            )}`}
                          >
                            {getSourceIcon(result.metadata.source)}
                            <span className="ml-2">{formatSourceName(result.metadata.source)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          {(result.similarity * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {result.metadata.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(result.metadata.url, '_blank')}
                              className="text-white border-cosmic-accent hover:bg-cosmic-accent"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* API Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-cosmic-dark rounded-lg border border-cosmic-light overflow-hidden">
                <div className="p-4 border-b border-cosmic-light">
                  <h4 className="text-white font-semibold">API Search Results</h4>
                  <p className="text-gray-400 text-sm">Direct source integration</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">Title</TableHead>
                      <TableHead className="text-white">Source</TableHead>
                      <TableHead className="text-white">Relevance</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="text-white font-medium">{result.title}</TableCell>
                        <TableCell>
                          <div className={`flex items-center ${getSourceColor(result.source)}`}>
                            {getSourceIcon(result.source)}
                            <span className="ml-2">{formatSourceName(result.source)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">
                          {result.relevanceScore
                            ? `${(result.relevanceScore * 100).toFixed(0)}%`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {result.url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(result.url, '_blank')}
                              className="text-white border-cosmic-accent hover:bg-cosmic-accent"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Knowledge Library</h1>
      </div>

      {/* Unified Search Bar */}
      <div className="bg-cosmic-dark rounded-lg border border-cosmic-light p-6 mb-6">
        <div className="flex space-x-4 mb-4">
          <div className="flex-1">
            <Label htmlFor="search" className="text-white mb-2 block">
              Search Across All Sources
            </Label>
            <Input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your search query..."
              className="bg-cosmic-light text-white border-cosmic-accent"
            />
          </div>
          <div className="flex items-end space-x-2">
            <div className="flex items-center space-x-2">
              <Label htmlFor="search-mode" className="text-white text-sm">
                {useVectorSearch ? 'Vector Search' : 'API Search'}
              </Label>
              <button
                onClick={() => setUseVectorSearch(!useVectorSearch)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  useVectorSearch ? 'bg-cosmic-accent' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    useVectorSearch ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-cosmic-accent hover:bg-cosmic-highlight px-6"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>
        </div>

        {/* Search Mode Info */}
        <div className="text-sm text-gray-400">
          {useVectorSearch ? (
            <div>
              <strong>Vector Search:</strong> AI-powered semantic search using embeddings. Requires
              vector database setup.{' '}
              <span className="text-cosmic-accent">Run: supabase db push</span> to set up.
            </div>
          ) : (
            <div>
              <strong>API Search:</strong> Direct integration with Notion, Google Drive, and
              Supabase Storage. Configure API keys in environment variables.
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {renderSearchResults()}

      {/* Source Tabs */}
      <Tabs defaultValue="notion" className="flex-1">
        <TabsList className="grid w-full grid-cols-3 bg-cosmic-dark border border-cosmic-light">
          <TabsTrigger
            value="notion"
            className="text-white data-[state=active]:bg-cosmic-accent data-[state=active]:text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Notion Pages
          </TabsTrigger>
          <TabsTrigger
            value="drive"
            className="text-white data-[state=active]:bg-cosmic-accent data-[state=active]:text-white"
          >
            <Cloud className="w-4 h-4 mr-2" />
            Google Drive
          </TabsTrigger>
          <TabsTrigger
            value="internal"
            className="text-white data-[state=active]:bg-cosmic-accent data-[state=active]:text-white"
          >
            <Database className="w-4 h-4 mr-2" />
            Internal Docs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notion" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Notion Pages</h2>
            <Button
              onClick={() => loadSourceDocuments()}
              variant="outline"
              className="text-white border-cosmic-accent hover:bg-cosmic-accent"
            >
              Refresh
            </Button>
          </div>
          {renderDocumentTable(notionDocs, loadingSources.notion)}
        </TabsContent>

        <TabsContent value="drive" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Google Drive Files</h2>
            <Button
              onClick={() => loadSourceDocuments()}
              variant="outline"
              className="text-white border-cosmic-accent hover:bg-cosmic-accent"
            >
              Refresh
            </Button>
          </div>
          {renderDocumentTable(driveDocs, loadingSources.drive)}
        </TabsContent>

        <TabsContent value="internal" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Internal Documents</h2>
            <Button
              onClick={() => loadSourceDocuments()}
              variant="outline"
              className="text-white border-cosmic-accent hover:bg-cosmic-accent"
            >
              Refresh
            </Button>
          </div>
          {renderDocumentTable(internalDocs, loadingSources.internal)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default KnowledgeLibrary;
