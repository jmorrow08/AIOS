import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Filter,
  Download,
  Star,
  Users,
  Zap,
  TrendingUp,
  Eye,
  ThumbsUp,
  MessageSquare,
  Workflow,
  Play,
  Copy,
  Share2,
} from 'lucide-react';

interface EnhancedAgentTemplate {
  id: string;
  name: string;
  role: string;
  description: string;
  prompt_template: string;
  default_model: string;
  cost_estimate: number;
  category: string;
  tags: string[];
  is_public: boolean;
  created_by: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
  // Enhanced fields
  rating?: number;
  total_ratings?: number;
  total_uses?: number;
  workflow_preview?: any; // JSON representation of workflow
  featured?: boolean;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  estimated_time?: number; // minutes to set up
  success_rate?: number; // percentage
  creator_name?: string;
  creator_avatar?: string;
}

interface MarketplaceFilters {
  category?: string;
  complexity?: string;
  minRating?: number;
  maxCost?: number;
  tags?: string[];
}

const EnhancedAgentMarketplace: React.FC = () => {
  const { user } = useUser();
  const [templates, setTemplates] = useState<EnhancedAgentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EnhancedAgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<EnhancedAgentTemplate | null>(null);
  const [filters, setFilters] = useState<MarketplaceFilters>({});
  const [sortBy, setSortBy] = useState<'rating' | 'uses' | 'newest' | 'cost'>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Categories from templates
  const categories = [
    'Business',
    'Creative',
    'Technical',
    'Data',
    'Customer Service',
    'Operations',
  ];
  const complexities = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [templates, searchQuery, filters, sortBy]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_templates')
        .select(
          `
          *,
          creator:created_by (
            name,
            avatar_url
          )
        `,
        )
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance templates with mock analytics data (in real app, this would come from separate analytics table)
      const enhancedTemplates = data.map((template) => ({
        ...template,
        rating: Math.random() * 2 + 3, // Mock rating 3-5
        total_ratings: Math.floor(Math.random() * 50) + 5,
        total_uses: Math.floor(Math.random() * 1000) + 10,
        complexity: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)] as any,
        estimated_time: Math.floor(Math.random() * 30) + 5,
        success_rate: Math.random() * 30 + 70,
        featured: Math.random() > 0.8,
        creator_name: template.creator?.name || 'Anonymous',
        creator_avatar: template.creator?.avatar_url,
      }));

      setTemplates(enhancedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = templates.filter((template) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some((tag) => tag.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category && template.category !== filters.category) return false;

      // Complexity filter
      if (filters.complexity && template.complexity !== filters.complexity) return false;

      // Rating filter
      if (filters.minRating && (template.rating || 0) < filters.minRating) return false;

      // Cost filter
      if (filters.maxCost && template.cost_estimate > filters.maxCost) return false;

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((tag) => template.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'uses':
          return (b.total_uses || 0) - (a.total_uses || 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'cost':
          return a.cost_estimate - b.cost_estimate;
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  const handleUseTemplate = async (template: EnhancedAgentTemplate) => {
    // Create agent from template
    try {
      const agentData = {
        name: `${template.name} (Copy)`,
        role: template.role,
        description: template.description,
        prompt: template.prompt_template,
        llm_provider: template.default_model.includes('gpt')
          ? 'openai'
          : template.default_model.includes('claude')
          ? 'claude'
          : 'gemini',
        llm_model: template.default_model,
        company_id: user?.user_metadata?.company_id,
      };

      // This would call your agent creation API
      console.log('Creating agent from template:', agentData);

      // Update usage stats (in real app)
      // await supabase.from('template_usage').insert({...})
    } catch (error) {
      console.error('Error creating agent from template:', error);
    }
  };

  const TemplateCard: React.FC<{ template: EnhancedAgentTemplate }> = ({ template }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border-cosmic-light bg-cosmic-light bg-opacity-5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg text-cosmic-highlight group-hover:text-cosmic-accent transition-colors">
                {template.name}
              </CardTitle>
              {template.featured && <Badge className="bg-yellow-500 text-black">Featured</Badge>}
            </div>
            <CardDescription className="text-sm text-cosmic-light">
              {template.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{template.rating?.toFixed(1)}</span>
            <span className="text-gray-500">({template.total_ratings})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-3 text-sm text-cosmic-light">
          <div className="flex items-center gap-1">
            <Workflow className="w-4 h-4" />
            <span>{template.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span className="capitalize">{template.complexity}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{template.total_uses} uses</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={template.creator_avatar} />
              <AvatarFallback className="text-xs">
                {template.creator_name?.[0] || 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="text-cosmic-light">{template.creator_name}</span>
          </div>
          <div className="text-right">
            <div className="font-medium text-cosmic-accent">
              ${template.cost_estimate.toFixed(3)}/use
            </div>
            <div className="text-xs text-gray-500">~{template.estimated_time}min setup</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setSelectedTemplate(template)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-cosmic-accent hover:bg-cosmic-highlight"
            onClick={() => handleUseTemplate(template)}
          >
            <Download className="w-4 h-4 mr-2" />
            Use Template
          </Button>
        </div>
      </CardFooter>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cosmic-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cosmic-highlight">Agent Marketplace</h1>
          <p className="text-cosmic-light mt-1">Discover and deploy pre-built agent workflows</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share Template
          </Button>
          <Button className="bg-cosmic-accent hover:bg-cosmic-highlight">
            <Plus className="w-4 h-4 mr-2" />
            Publish Template
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-cosmic-light text-white border-cosmic-accent"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-cosmic-light text-white border border-cosmic-accent rounded"
          >
            <option value="rating">Highest Rated</option>
            <option value="uses">Most Used</option>
            <option value="newest">Newest</option>
            <option value="cost">Lowest Cost</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="featured" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates
              .filter((t) => t.featured)
              .map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates
              .sort((a, b) => (b.total_uses || 0) - (a.total_uses || 0))
              .slice(0, 9)
              .map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Template Preview Modal would go here */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedTemplate.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">{selectedTemplate.description}</p>
                <div className="flex gap-4">
                  <Badge>Rating: {selectedTemplate.rating?.toFixed(1)} ⭐</Badge>
                  <Badge>{selectedTemplate.total_uses} uses</Badge>
                  <Badge>${selectedTemplate.cost_estimate.toFixed(3)}/use</Badge>
                </div>
                {/* Add workflow preview, ratings, reviews, etc. */}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-cosmic-accent hover:bg-cosmic-highlight"
                onClick={() => handleUseTemplate(selectedTemplate)}
              >
                Use This Template
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedAgentMarketplace;














