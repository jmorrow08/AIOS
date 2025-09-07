import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Zap,
  Bot,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Eye,
  Target,
  Users,
  MessageSquare,
  Share2,
  Heart,
  Activity,
  Settings,
  Sparkles,
  Lightbulb,
  Rocket,
  AlertTriangle,
  CheckCircle,
  Clock,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Youtube,
  Tiktok,
} from 'lucide-react';
import {
  generateMockAnalytics,
  generateMarketingStrategy,
  analyzeMarketingTrends,
  generateContentSuggestions,
} from '@/lib/marketingServices';
import {
  MarketingAnalytics,
  MarketingCampaign,
  MarketingTemplate,
  SocialMediaPost,
  MarketingStrategy,
  AITrendAnalysis,
  ContentSuggestion,
} from '@/lib/types';

const MarketingHub: React.FC = () => {
  const { user, role } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<MarketingAnalytics | null>(null);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<SocialMediaPost[]>([]);
  const [marketingStrategy, setMarketingStrategy] = useState<MarketingStrategy | null>(null);
  const [trendAnalysis, setTrendAnalysis] = useState<AITrendAnalysis | null>(null);
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [isAnalyzingTrends, setIsAnalyzingTrends] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const loadData = async () => {
      try {
        // Simulate API calls
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setAnalytics(generateMockAnalytics());

        // Mock campaigns
        setCampaigns([
          {
            id: '1',
            title: 'Q4 Product Launch',
            goal: 'Drive product awareness and sign-ups',
            targetAudience: 'Tech professionals 25-45',
            platforms: ['LinkedIn', 'Twitter', 'Instagram'],
            status: 'active',
            budget: 5000,
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: [],
            analytics: {
              impressions: 45000,
              clicks: 3200,
              engagements: 4800,
              conversions: 120,
              reach: 38000,
              platformBreakdown: [
                {
                  platform: 'LinkedIn',
                  impressions: 25000,
                  clicks: 1800,
                  engagements: 2800,
                  conversions: 80,
                },
                {
                  platform: 'Twitter',
                  impressions: 12000,
                  clicks: 900,
                  engagements: 1300,
                  conversions: 30,
                },
                {
                  platform: 'Instagram',
                  impressions: 8000,
                  clicks: 500,
                  engagements: 700,
                  conversions: 10,
                },
              ],
            },
          },
          {
            id: '2',
            title: 'Holiday Season Campaign',
            goal: 'Increase holiday sales',
            targetAudience: 'General consumers',
            platforms: ['Facebook', 'Instagram', 'Email'],
            status: 'scheduled',
            budget: 8000,
            startDate: '2024-11-01',
            endDate: '2024-12-31',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            content: [],
            analytics: {
              impressions: 0,
              clicks: 0,
              engagements: 0,
              conversions: 0,
              reach: 0,
              platformBreakdown: [],
            },
          },
        ]);

        // Mock templates
        setTemplates([
          {
            id: '1',
            name: 'LinkedIn Thought Leadership',
            category: 'Professional',
            platform: 'LinkedIn',
            content:
              "🚀 Exciting developments in #AI are transforming how we work. Here's what you need to know:\n\n1. **Automation**: Streamlining repetitive tasks\n2. **Insights**: Data-driven decision making\n3. **Innovation**: New possibilities for growth\n\nWhat trends are you seeing in your industry?\n\n#ArtificialIntelligence #FutureOfWork #Innovation",
            variables: [
              { key: 'topic', label: 'Topic', type: 'text', defaultValue: 'AI', required: true },
              {
                key: 'trend1',
                label: 'Trend 1',
                type: 'text',
                defaultValue: 'Automation',
                required: false,
              },
              {
                key: 'trend2',
                label: 'Trend 2',
                type: 'text',
                defaultValue: 'Insights',
                required: false,
              },
              {
                key: 'trend3',
                label: 'Trend 3',
                type: 'text',
                defaultValue: 'Innovation',
                required: false,
              },
            ],
            thumbnailUrl: '/templates/linkedin-pro.png',
            tags: ['thought-leadership', 'professional', 'ai'],
            createdAt: new Date().toISOString(),
            usageCount: 45,
          },
          {
            id: '2',
            name: 'Instagram Story Promotion',
            category: 'Promotional',
            platform: 'Instagram',
            content:
              '✨ FLASH SALE ALERT! ✨\n\nGet {{discount}}% off on all {{product_category}}!\n\n⏰ Limited time offer\n💳 Use code: {{promo_code}}\n🔗 Link in bio\n\n#Sale #Discount #Deal #ShopNow',
            variables: [
              {
                key: 'discount',
                label: 'Discount %',
                type: 'text',
                defaultValue: '50',
                required: true,
              },
              {
                key: 'product_category',
                label: 'Product Category',
                type: 'text',
                defaultValue: 'products',
                required: true,
              },
              {
                key: 'promo_code',
                label: 'Promo Code',
                type: 'text',
                defaultValue: 'SAVE50',
                required: true,
              },
            ],
            thumbnailUrl: '/templates/instagram-promo.png',
            tags: ['promotion', 'sale', 'instagram-story'],
            createdAt: new Date().toISOString(),
            usageCount: 78,
          },
        ]);

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading marketing data:', error);
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Generate AI marketing strategy
  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const businessInfo = {
        industry: 'Technology',
        targetAudience: 'Tech professionals 25-45',
        goals: ['Increase brand awareness', 'Drive website traffic', 'Generate leads'],
        budget: 5000,
        competitors: ['Competitor A', 'Competitor B', 'Competitor C'],
      };

      const strategy = await generateMarketingStrategy(businessInfo);
      setMarketingStrategy(strategy);
    } catch (error) {
      console.error('Error generating strategy:', error);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // Analyze marketing trends
  const handleAnalyzeTrends = async () => {
    setIsAnalyzingTrends(true);
    try {
      const analysis = await analyzeMarketingTrends('Technology', '30d');
      setTrendAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing trends:', error);
    } finally {
      setIsAnalyzingTrends(false);
    }
  };

  // Generate content suggestions
  const handleGenerateContentSuggestions = async (topic: string, platforms: string[]) => {
    try {
      const suggestions = await generateContentSuggestions(topic, platforms);
      setContentSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating content suggestions:', error);
    }
  };

  // Check access permissions
  if (!role || (role !== 'admin' && role !== 'marketing_agent')) {
    return (
      <div className="relative min-h-screen bg-cosmic-dark text-white flex items-center justify-center">
        <Alert className="max-w-md bg-red-900/20 border-red-500/50 text-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the Marketing Hub. Contact your administrator for
            access.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-cosmic-dark text-white">
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center">
              <Rocket className="h-12 w-12 mx-auto mb-4 text-cosmic-accent animate-pulse" />
              <h1 className="text-2xl font-bold mb-2">Loading Marketing Hub</h1>
              <p className="text-cosmic-accent">Initializing AI-powered marketing tools...</p>
            </div>
            <Progress value={75} className="w-full" />
          </div>
        </div>
      </div>
    );
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-cosmic-accent" />
              <div>
                <p className="text-sm text-cosmic-accent">Total Impressions</p>
                <p className="text-2xl font-bold text-white">
                  {analytics?.totalImpressions.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-cosmic-accent" />
              <div>
                <p className="text-sm text-cosmic-accent">Engagements</p>
                <p className="text-2xl font-bold text-white">
                  {analytics?.totalEngagements.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-cosmic-accent" />
              <div>
                <p className="text-sm text-cosmic-accent">Conversions</p>
                <p className="text-2xl font-bold text-white">
                  {analytics?.totalConversions.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-cosmic-accent" />
              <div>
                <p className="text-sm text-cosmic-accent">Growth Rate</p>
                <p className="text-2xl font-bold text-white">+12.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns */}
      <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Active Campaigns</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.slice(0, 3).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-4 bg-cosmic-dark/50 rounded-lg"
              >
                <div>
                  <h3 className="font-semibold text-white">{campaign.title}</h3>
                  <p className="text-sm text-cosmic-accent">{campaign.goal}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    {campaign.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={campaign.status === 'active' ? 'default' : 'secondary'}
                    className="mb-2"
                  >
                    {campaign.status}
                  </Badge>
                  <p className="text-sm text-cosmic-accent">
                    {campaign.analytics.impressions.toLocaleString()} impressions
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-20 bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark font-semibold">
              <Plus className="h-6 w-6 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-cosmic-dark border-cosmic-accent/30">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Campaign</DialogTitle>
              <DialogDescription className="text-cosmic-accent">
                Set up an AI-powered marketing campaign
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-title" className="text-white">
                  Campaign Title
                </Label>
                <Input
                  id="campaign-title"
                  placeholder="Q4 Product Launch"
                  className="bg-cosmic-light border-cosmic-accent/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="campaign-goal" className="text-white">
                  Goal
                </Label>
                <Input
                  id="campaign-goal"
                  placeholder="Drive product awareness and sign-ups"
                  className="bg-cosmic-light border-cosmic-accent/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="target-audience" className="text-white">
                  Target Audience
                </Label>
                <Input
                  id="target-audience"
                  placeholder="Tech professionals 25-45"
                  className="bg-cosmic-light border-cosmic-accent/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="platforms" className="text-white">
                  Platforms
                </Label>
                <Select>
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent/30 text-white">
                    <SelectValue placeholder="Select platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark">
                <Sparkles className="h-4 w-4 mr-2" />
                Create with AI
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="h-20 border-cosmic-accent text-cosmic-accent hover:bg-cosmic-accent/10"
            >
              <Bot className="h-6 w-6 mr-2" />
              AI Content Generator
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-cosmic-dark border-cosmic-accent/30">
            <DialogHeader>
              <DialogTitle className="text-white">AI Content Generator</DialogTitle>
              <DialogDescription className="text-cosmic-accent">
                Generate optimized content for any platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="content-topic" className="text-white">
                  Topic
                </Label>
                <Input
                  id="content-topic"
                  placeholder="AI marketing trends"
                  className="bg-cosmic-light border-cosmic-accent/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="content-platform" className="text-white">
                  Platform
                </Label>
                <Select>
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent/30 text-white">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content-tone" className="text-white">
                  Tone
                </Label>
                <Select>
                  <SelectTrigger className="bg-cosmic-light border-cosmic-accent/30 text-white">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          className="h-20 border-cosmic-accent text-cosmic-accent hover:bg-cosmic-accent/10"
        >
          <Calendar className="h-6 w-6 mr-2" />
          Schedule Posts
        </Button>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-cosmic-dark via-cosmic-light to-cosmic-dark text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmNGYxYmIiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cosmic-accent to-cosmic-highlight bg-clip-text text-transparent">
                Marketing Hub
              </h1>
              <p className="text-cosmic-accent mt-2">
                AI-powered marketing automation and analytics platform
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-cosmic-accent/20 text-cosmic-accent">
                <Sparkles className="h-3 w-3 mr-1" />
                AI-Powered
              </Badge>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-cosmic-light/50 border border-cosmic-accent/30 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-dark text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="campaigns"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-dark text-xs"
            >
              <Target className="h-3 w-3 mr-1" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-dark text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="scheduler"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-dark text-xs"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Scheduler
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-dark text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="strategy"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-dark text-xs"
            >
              <Lightbulb className="h-3 w-3 mr-1" />
              Strategy
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-dark text-xs"
            >
              <Activity className="h-3 w-3 mr-1" />
              Trends
            </TabsTrigger>
            <TabsTrigger
              value="ai-assistant"
              className="data-[state=active]:bg-cosmic-accent data-[state=active]:text-cosmic-dark text-xs"
            >
              <Bot className="h-3 w-3 mr-1" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="campaigns">
            <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Marketing Campaigns</span>
                  </span>
                  <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark">
                    <Plus className="h-4 w-4 mr-2" />
                    New Campaign
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="p-4 bg-cosmic-dark/50 rounded-lg border border-cosmic-accent/20"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-white text-lg">{campaign.title}</h3>
                          <p className="text-cosmic-accent text-sm">{campaign.goal}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              campaign.status === 'active'
                                ? 'default'
                                : campaign.status === 'scheduled'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={
                              campaign.status === 'active' ? 'bg-green-500 text-white' : ''
                            }
                          >
                            {campaign.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-cosmic-accent">Impressions</p>
                          <p className="text-lg font-semibold text-white">
                            {campaign.analytics.impressions.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-cosmic-accent">Clicks</p>
                          <p className="text-lg font-semibold text-white">
                            {campaign.analytics.clicks.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-cosmic-accent">Engagements</p>
                          <p className="text-lg font-semibold text-white">
                            {campaign.analytics.engagements.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-cosmic-accent">Conversions</p>
                          <p className="text-lg font-semibold text-white">
                            {campaign.analytics.conversions.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {campaign.platforms.map((platform) => (
                          <Badge key={platform} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Edit className="h-5 w-5" />
                    <span>Content Templates</span>
                  </span>
                  <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="bg-cosmic-dark/50 border-cosmic-accent/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="secondary" className="text-xs">
                            {template.platform}
                          </Badge>
                          <span className="text-xs text-cosmic-accent">
                            Used {template.usageCount} times
                          </span>
                        </div>

                        <h3 className="font-semibold text-white mb-2">{template.name}</h3>
                        <p className="text-sm text-cosmic-accent mb-3 line-clamp-3">
                          {template.content}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4 mr-1" />
                            Use
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduler">
            <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Content Scheduler</span>
                </CardTitle>
                <CardDescription className="text-cosmic-accent">
                  Schedule posts across all platforms with AI optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-cosmic-accent" />
                  <h3 className="text-lg font-semibold text-white mb-2">Advanced Scheduler</h3>
                  <p className="text-cosmic-accent mb-4">
                    Calendar view with Zapier automation and AI timing optimization coming soon
                  </p>
                  <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Marketing Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-cosmic-accent" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Advanced Analytics Dashboard
                    </h3>
                    <p className="text-cosmic-accent mb-4">
                      Comprehensive charts, metrics tracking, and performance insights
                    </p>
                    <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="strategy">
            <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>AI Marketing Strategy</span>
                  </span>
                  <Button
                    onClick={handleGenerateStrategy}
                    disabled={isGeneratingStrategy}
                    className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark"
                  >
                    {isGeneratingStrategy ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Strategy
                      </>
                    )}
                  </Button>
                </CardTitle>
                <CardDescription className="text-cosmic-accent">
                  AI-powered marketing strategy with content calendar, budget allocation, and
                  recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketingStrategy ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-cosmic-dark/50 border-cosmic-accent/20">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-white mb-2">Objective</h4>
                          <p className="text-sm text-cosmic-accent">
                            {marketingStrategy.objective}
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="bg-cosmic-dark/50 border-cosmic-accent/20">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-white mb-2">Target KPIs</h4>
                          <div className="flex flex-wrap gap-1">
                            {marketingStrategy.targetKPIs.map((kpi) => (
                              <Badge key={kpi} variant="secondary" className="text-xs">
                                {kpi}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-cosmic-dark/50 border-cosmic-accent/20">
                        <CardContent className="p-4">
                          <h4 className="font-semibold text-white mb-2">Recommended Platforms</h4>
                          <div className="flex flex-wrap gap-1">
                            {marketingStrategy.recommendedPlatforms.map((platform) => (
                              <Badge key={platform} variant="outline" className="text-xs">
                                {platform}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-4">Budget Allocation</h4>
                      <div className="space-y-3">
                        {marketingStrategy.budgetAllocation.map((item) => (
                          <div key={item.platform} className="flex items-center justify-between">
                            <span className="text-cosmic-accent">{item.platform}</span>
                            <div className="flex items-center space-x-2">
                              <Progress
                                value={(item.spent / item.amount) * 100}
                                className="w-24 h-2"
                              />
                              <span className="text-sm text-white">
                                ${item.spent}/${item.amount}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-4">AI Recommendations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {marketingStrategy.aiRecommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="p-3 bg-cosmic-dark/30 rounded-lg border border-cosmic-accent/20"
                          >
                            <p className="text-sm text-cosmic-accent">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 text-cosmic-accent" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Generate Marketing Strategy
                    </h3>
                    <p className="text-cosmic-accent mb-4">
                      Get AI-powered marketing strategy with content calendar, budget allocation,
                      and actionable recommendations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <div className="space-y-6">
              <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>Marketing Trends Analysis</span>
                    </span>
                    <Button
                      onClick={handleAnalyzeTrends}
                      disabled={isAnalyzingTrends}
                      className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark"
                    >
                      {isAnalyzingTrends ? (
                        <>
                          <Bot className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Analyze Trends
                        </>
                      )}
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-cosmic-accent">
                    AI-powered trend analysis, competitor insights, and predictive recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trendAnalysis ? (
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-white mb-4">Emerging Trends</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {trendAnalysis.trends.map((trend) => (
                            <Card
                              key={trend.topic}
                              className="bg-cosmic-dark/50 border-cosmic-accent/20"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-semibold text-white">{trend.topic}</h5>
                                  <Badge
                                    variant={
                                      trend.sentiment === 'positive'
                                        ? 'default'
                                        : trend.sentiment === 'negative'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {trend.sentiment}
                                  </Badge>
                                </div>
                                <p className="text-sm text-cosmic-accent mb-2">
                                  Growth: +{trend.growth}%
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {trend.platforms.map((platform) => (
                                    <Badge key={platform} variant="outline" className="text-xs">
                                      {platform}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white mb-4">Predictions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {trendAnalysis.predictions.map((prediction) => (
                            <Card
                              key={prediction.metric}
                              className="bg-cosmic-dark/50 border-cosmic-accent/20"
                            >
                              <CardContent className="p-4">
                                <h5 className="font-semibold text-white mb-2">
                                  {prediction.metric}
                                </h5>
                                <p className="text-sm text-cosmic-accent">
                                  Predicted: {prediction.predictedValue} by {prediction.timeframe}
                                </p>
                                <p className="text-xs text-cosmic-highlight mt-1">
                                  Confidence: {prediction.confidence * 100}%
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white mb-4">Competitor Insights</h4>
                        <div className="space-y-3">
                          {trendAnalysis.competitorInsights.map((competitor) => (
                            <Card
                              key={competitor.name}
                              className="bg-cosmic-dark/50 border-cosmic-accent/20"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-semibold text-white">{competitor.name}</h5>
                                  <span className="text-sm text-cosmic-accent">
                                    {competitor.engagementRate}% engagement
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-cosmic-accent">Strengths:</p>
                                    <ul className="list-disc list-inside text-white">
                                      {competitor.strengths.slice(0, 2).map((strength) => (
                                        <li key={strength}>{strength}</li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-cosmic-accent">Opportunities:</p>
                                    <ul className="list-disc list-inside text-white">
                                      {competitor.opportunities.slice(0, 2).map((opportunity) => (
                                        <li key={opportunity}>{opportunity}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-white mb-4">Strategic Recommendations</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {trendAnalysis.recommendations.map((rec, index) => (
                            <div
                              key={index}
                              className="p-3 bg-cosmic-dark/30 rounded-lg border border-cosmic-accent/20"
                            >
                              <p className="text-sm text-cosmic-accent">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 mx-auto mb-4 text-cosmic-accent" />
                      <h3 className="text-lg font-semibold text-white mb-2">AI Trend Analysis</h3>
                      <p className="text-cosmic-accent mb-4">
                        Get AI-powered insights on marketing trends, competitor analysis, and
                        predictive recommendations
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-assistant">
            <Card className="bg-cosmic-light/50 border-cosmic-accent/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>AI Marketing Assistant</span>
                </CardTitle>
                <CardDescription className="text-cosmic-accent">
                  Get intelligent recommendations for content optimization, trend analysis, and
                  strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() =>
                        handleGenerateContentSuggestions('AI Marketing', [
                          'LinkedIn',
                          'Twitter',
                          'Instagram',
                        ])
                      }
                      className="h-20 bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark font-semibold"
                    >
                      <MessageSquare className="h-6 w-6 mr-2" />
                      Content Ideas
                    </Button>

                    <Button
                      variant="outline"
                      className="h-20 border-cosmic-accent text-cosmic-accent hover:bg-cosmic-accent/10"
                    >
                      <Users className="h-6 w-6 mr-2" />
                      Audience Analysis
                    </Button>

                    <Button
                      variant="outline"
                      className="h-20 border-cosmic-accent text-cosmic-accent hover:bg-cosmic-accent/10"
                    >
                      <Settings className="h-6 w-6 mr-2" />
                      Optimization
                    </Button>
                  </div>

                  {contentSuggestions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-4">AI Content Suggestions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contentSuggestions.map((suggestion) => (
                          <Card
                            key={suggestion.id}
                            className="bg-cosmic-dark/50 border-cosmic-accent/20"
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {suggestion.platform}
                                </Badge>
                                <span className="text-xs text-cosmic-accent">
                                  {suggestion.predictedEngagement}% engagement
                                </span>
                              </div>
                              <p className="text-sm text-white mb-3">{suggestion.content}</p>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {suggestion.hashtags.map((hashtag) => (
                                  <Badge key={hashtag} variant="outline" className="text-xs">
                                    {hashtag}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-cosmic-accent">
                                Best time: {suggestion.bestTimeToPost}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-cosmic-accent" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      AI-Powered Marketing Assistant
                    </h3>
                    <p className="text-cosmic-accent mb-4">
                      Content optimization, trend analysis, competitor insights, and strategic
                      recommendations
                    </p>
                    <Button className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Ask AI Assistant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MarketingHub;
