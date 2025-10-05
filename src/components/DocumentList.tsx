import React, { useState, useMemo } from 'react';
import { Document, DocumentCategory, DocumentFilters } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  File,
  BookOpen,
  FileCheck,
  MoreHorizontal,
  Edit3,
  Trash2,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onDocumentSelect: (document: Document | null) => void;
  onDocumentEdit: (document: Document | null) => void;
  onDocumentDelete: (documentId: string) => void;
  onSummarize: (document: Document) => void;
  selectedDocumentId?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isLoading,
  onDocumentSelect,
  onDocumentEdit,
  onDocumentDelete,
  onSummarize,
  selectedDocumentId,
}) => {
  const [filters, setFilters] = useState<DocumentFilters>({
    category: 'All',
    searchQuery: '',
  });

  // Available categories
  const categories: DocumentCategory[] = [
    'All',
    'SOPs',
    'Templates',
    'Knowledge',
    'Summaries',
    'General',
  ];

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sops':
        return <FileCheck className="w-4 h-4" />;
      case 'templates':
        return <File className="w-4 h-4" />;
      case 'knowledge':
        return <BookOpen className="w-4 h-4" />;
      case 'summaries':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'sops':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'templates':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'knowledge':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'summaries':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Filter documents based on category and search query
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Category filter
      const matchesCategory = filters.category === 'All' || doc.category === filters.category;

      // Search filter
      const matchesSearch =
        filters.searchQuery === '' ||
        doc.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        doc.content.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        (doc.description &&
          doc.description.toLowerCase().includes(filters.searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [documents, filters]);

  // Handle category change
  const handleCategoryChange = (category: DocumentCategory) => {
    setFilters((prev) => ({ ...prev, category }));
  };

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  // Handle document actions
  const handleViewDocument = (doc: Document) => {
    onDocumentSelect(doc);
  };

  const handleEditDocument = (doc: Document) => {
    onDocumentEdit(doc);
  };

  const handleDeleteDocument = (doc: Document) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${doc.title}"? This action cannot be undone.`,
      )
    ) {
      onDocumentDelete(doc.id);
    }
  };

  const handleSummarizeDocument = (doc: Document) => {
    onSummarize(doc);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get excerpt from content
  const getExcerpt = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-accent"></div>
        <span className="ml-3 text-white">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Search documents..."
          value={filters.searchQuery}
          onChange={handleSearchChange}
          className="pl-10 bg-cosmic-light text-white border-cosmic-accent placeholder-gray-400"
        />
      </div>

      {/* Category Tabs */}
      <Tabs
        value={filters.category}
        onValueChange={(value) => handleCategoryChange(value as DocumentCategory)}
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-cosmic-dark border border-cosmic-light">
          {categories.map((category) => (
            <TabsTrigger
              key={category}
              value={category}
              className="text-white data-[state=active]:bg-cosmic-accent data-[state=active]:text-white text-xs lg:text-sm"
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} found
        {filters.category !== 'All' && ` in ${filters.category}`}
        {filters.searchQuery && ` matching "${filters.searchQuery}"`}
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((doc) => (
          <Card
            key={doc.id}
            className={`bg-cosmic-dark border-cosmic-light hover:border-cosmic-accent transition-colors cursor-pointer ${
              selectedDocumentId === doc.id ? 'ring-2 ring-cosmic-accent' : ''
            }`}
            onClick={() => handleViewDocument(doc)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white text-lg leading-tight mb-2 line-clamp-2">
                    {doc.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(doc.category)}
                    <Badge
                      variant="outline"
                      className={`text-xs ${getCategoryColor(doc.category)}`}
                    >
                      {doc.category}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400">Created {formatDate(doc.created_at)}</div>
                </div>

                {/* Action Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-cosmic-dark border-cosmic-light">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(doc);
                      }}
                      className="text-white hover:bg-cosmic-light"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDocument(doc);
                      }}
                      className="text-white hover:bg-cosmic-light"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSummarizeDocument(doc);
                      }}
                      className="text-white hover:bg-cosmic-light"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Summarize
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc);
                      }}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                {getExcerpt(doc.content)}
              </p>
              {doc.description && (
                <p className="text-gray-400 text-xs mt-2 italic">
                  {getExcerpt(doc.description, 80)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No documents found</h3>
          <p className="text-gray-400">
            {filters.searchQuery || filters.category !== 'All'
              ? 'Try adjusting your search or category filter.'
              : 'Create your first document to get started.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
