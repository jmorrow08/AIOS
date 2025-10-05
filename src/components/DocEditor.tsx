import React, { useState, useEffect } from 'react';
import { Document, DocumentCategory, AIDraftRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, X, Wand2, Eye, Edit3, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DocEditorProps {
  document: Document | null;
  mode: 'view' | 'edit' | 'create';
  isLoading: boolean;
  onSave: (document: Partial<Document>) => Promise<void>;
  onCancel: () => void;
  onGenerateAIDraft: (request: AIDraftRequest) => Promise<string>;
}

const DocEditor: React.FC<DocEditorProps> = ({
  document,
  mode,
  isLoading,
  onSave,
  onCancel,
  onGenerateAIDraft,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'General' as DocumentCategory,
    content: '',
    description: '',
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available categories
  const categories: DocumentCategory[] = ['SOPs', 'Templates', 'Knowledge', 'Summaries', 'General'];

  // Update form data when document or mode changes
  useEffect(() => {
    if (document && mode !== 'create') {
      setFormData({
        title: document.title,
        category: document.category as DocumentCategory,
        content: document.content,
        description: document.description || '',
      });
    } else if (mode === 'create') {
      setFormData({
        title: '',
        category: 'General',
        content: '',
        description: '',
      });
    }
    setError(null);
  }, [document, mode]);

  // Handle input changes
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Handle save
  const handleSave = async () => {
    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      const documentData: Partial<Document> = {
        ...formData,
        ...(mode === 'edit' && document ? { id: document.id } : {}),
      };

      await onSave(documentData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document');
    }
  };

  // Handle AI draft generation
  const handleGenerateAIDraft = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a title first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const description = formData.description || formData.title;
      const request: AIDraftRequest = {
        description,
        category: formData.category,
        title: formData.title,
      };

      const generatedContent = await onGenerateAIDraft(request);
      setFormData((prev) => ({ ...prev, content: generatedContent }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate AI draft');
    } finally {
      setIsGenerating(false);
    }
  };

  // Get template suggestions based on category
  const getTemplateSuggestion = (category: DocumentCategory) => {
    switch (category) {
      case 'SOPs':
        return `# Standard Operating Procedure: ${formData.title}

## Purpose
[Describe the purpose of this procedure]

## Scope
[Define what this procedure covers]

## Procedure
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Responsibilities
- [Role]: [Responsibility]

## References
[Link to related documents]`;
      case 'Templates':
        return `# ${formData.title} Template

## Overview
[Brief description of what this template is for]

## Sections
- [Section 1]
- [Section 2]
- [Section 3]

## Usage Instructions
[How to use this template]

## Variables to Replace
- {{variable1}}: [Description]
- {{variable2}}: [Description]`;
      case 'Knowledge':
        return `# ${formData.title}

## Overview
[Brief introduction to the topic]

## Key Concepts
- [Concept 1]: [Explanation]
- [Concept 2]: [Explanation]

## Best Practices
- [Practice 1]
- [Practice 2]

## Resources
- [Link 1]
- [Link 2]`;
      case 'Summaries':
        return `# ${formData.title} - Summary

## Original Document
[Reference to original document]

## Key Points
- [Point 1]
- [Point 2]
- [Point 3]

## Conclusions
[Main takeaways]

## Action Items
- [Action 1]
- [Action 2]`;
      default:
        return `# ${formData.title}

## Introduction
[Your content here]

## Details
[More detailed information]

## Conclusion
[Summary or next steps]`;
    }
  };

  // Apply template when category changes
  const handleCategoryChange = (category: DocumentCategory) => {
    setFormData((prev) => ({
      ...prev,
      category,
      content: prev.content || getTemplateSuggestion(category),
    }));
  };

  // Render mode indicator
  const getModeIndicator = () => {
    switch (mode) {
      case 'view':
        return (
          <div className="flex items-center text-blue-400 mb-4">
            <Eye className="w-4 h-4 mr-2" />
            <span className="text-sm">Viewing Document</span>
          </div>
        );
      case 'edit':
        return (
          <div className="flex items-center text-yellow-400 mb-4">
            <Edit3 className="w-4 h-4 mr-2" />
            <span className="text-sm">Editing Document</span>
          </div>
        );
      case 'create':
        return (
          <div className="flex items-center text-green-400 mb-4">
            <FileText className="w-4 h-4 mr-2" />
            <span className="text-sm">Creating New Document</span>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-cosmic-dark rounded-lg border border-cosmic-light overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-cosmic-light">
        {getModeIndicator()}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            {mode === 'view' ? (
              <h2 className="text-2xl font-bold text-white">{document?.title}</h2>
            ) : (
              <div className="flex-1 max-w-md">
                <Label htmlFor="title" className="text-white mb-2 block">
                  Title
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter document title..."
                  className="bg-cosmic-light text-white border-cosmic-accent"
                  disabled={mode === 'view'}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-cosmic-accent border-cosmic-accent">
                {formData.category}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {mode !== 'view' && (
              <Button
                onClick={handleGenerateAIDraft}
                disabled={isGenerating || !formData.title.trim()}
                variant="outline"
                className="text-cosmic-accent border-cosmic-accent hover:bg-cosmic-accent"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-2" />
                )}
                AI Draft
              </Button>
            )}

            {mode !== 'view' ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-cosmic-accent hover:bg-cosmic-highlight"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {mode === 'create' ? 'Create' : 'Save'}
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  className="text-white border-cosmic-light hover:bg-cosmic-light"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={onCancel}
                variant="outline"
                className="text-white border-cosmic-light hover:bg-cosmic-light"
              >
                <X className="w-4 h-4 mr-2" />
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert className="mb-4 border-red-500 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        {/* Category and Description (Edit/Create mode) */}
        {mode !== 'view' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="category" className="text-white mb-2 block">
                Category
              </Label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-cosmic-light text-white border-cosmic-accent">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  {categories.map((category) => (
                    <SelectItem
                      key={category}
                      value={category}
                      className="text-white hover:bg-cosmic-light"
                    >
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" className="text-white mb-2 block">
                Description (Optional)
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description..."
                className="bg-cosmic-light text-white border-cosmic-accent"
              />
            </div>
          </div>
        )}

        {/* Document Info (View mode) */}
        {mode === 'view' && document && (
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>
              Category: <span className="text-cosmic-accent">{document.category}</span>
            </span>
            <span>•</span>
            <span>Created: {new Date(document.created_at).toLocaleDateString()}</span>
            {document.updated_at !== document.created_at && (
              <>
                <span>•</span>
                <span>Updated: {new Date(document.updated_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        {mode === 'view' ? (
          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-white leading-relaxed font-mono text-sm">
              {formData.content}
            </div>
          </div>
        ) : (
          <Textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder={
              mode === 'create'
                ? 'Start writing your document content...'
                : 'Edit document content...'
            }
            className="min-h-[400px] bg-cosmic-light text-white border-cosmic-accent resize-none font-mono text-sm leading-relaxed"
          />
        )}
      </div>

      {/* Footer with AI Draft hint */}
      {mode !== 'view' && (
        <div className="p-4 border-t border-cosmic-light bg-cosmic-light/50">
          <p className="text-xs text-gray-400">
            💡 <strong>AI Draft:</strong> Enter a title and click "AI Draft" to generate content
            using AI. The AI will create structured content based on your title and selected
            category.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocEditor;
