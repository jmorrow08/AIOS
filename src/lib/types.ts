// Database types
export interface Document {
  id: string;
  title: string;
  category: string;
  content: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type DocumentCategory = 'All' | 'SOPs' | 'Templates' | 'Knowledge' | 'Summaries' | 'General';

// AI and search types
export interface AIDraftRequest {
  description: string;
  category: string;
  title?: string;
}

export interface AISummaryRequest {
  documentId: string;
  content: string;
}

export interface QnARequest {
  question: string;
}

export interface QnAResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    excerpt: string;
  }>;
}

// Component state types
export interface DocumentFilters {
  category: DocumentCategory;
  searchQuery: string;
}

export type EditorMode = 'view' | 'edit' | 'create' | null;

// Media Studio Types
export interface Scene {
  id: string;
  title: string;
  script: string;
  imageUrl?: string;
  imagePrompt?: string;
  audioUrl?: string;
  audioPrompt?: string;
  duration: number; // in seconds
  textOverlays?: TextOverlay[];
  order: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  startTime: number;
  endTime: number;
}

export interface MediaProjectSettings {
  imageService: 'dalle' | 'stability' | 'midjourney';
  audioService: 'elevenlabs' | 'google-tts';
  videoService: 'heygen' | 'sora' | 'hedra';
  promptRewriterEnabled: boolean;
  outputFormat: 'mp4' | 'webm';
  resolution: '1080p' | '720p' | '480p';
}

export interface VideoExportOptions {
  format: 'mp4' | 'webm';
  resolution: '1080p' | '720p' | '480p';
  quality: 'high' | 'medium' | 'low';
  includeSubtitles: boolean;
  publishToLibrary: boolean;
}

export interface RenderProgress {
  stage:
    | 'preparing'
    | 'downloading'
    | 'processing'
    | 'rendering'
    | 'uploading'
    | 'complete'
    | 'error';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // in seconds
}

// Marketing Hub Types
export interface MarketingCampaign {
  id: string;
  title: string;
  goal: string;
  targetAudience: string;
  platforms: string[];
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  budget?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  content: CampaignContent[];
  analytics: CampaignAnalytics;
}

export interface CampaignContent {
  id: string;
  campaignId: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  aiGenerated: boolean;
  templateId?: string;
}

export interface CampaignAnalytics {
  impressions: number;
  clicks: number;
  engagements: number;
  conversions: number;
  reach: number;
  costPerClick?: number;
  costPerConversion?: number;
  roi?: number;
  platformBreakdown: PlatformMetrics[];
}

export interface PlatformMetrics {
  platform: string;
  impressions: number;
  clicks: number;
  engagements: number;
  conversions: number;
}

export interface MarketingTemplate {
  id: string;
  name: string;
  category: string;
  platform: string;
  content: string;
  variables: TemplateVariable[];
  thumbnailUrl?: string;
  canvaId?: string;
  tags: string[];
  createdAt: string;
  usageCount: number;
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'text' | 'url' | 'image' | 'date';
  defaultValue?: string;
  required: boolean;
}

export interface SocialMediaPost {
  id: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  scheduledDate: string;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  campaignId?: string;
  templateId?: string;
  aiGenerated: boolean;
  metrics: PostMetrics;
}

export interface PostMetrics {
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  impressions: number;
  engagement: number;
}

export interface MarketingAnalytics {
  period: string;
  totalImpressions: number;
  totalClicks: number;
  totalEngagements: number;
  totalConversions: number;
  topPerformingContent: TopContent[];
  platformPerformance: PlatformAnalytics[];
  audienceInsights: AudienceInsights;
  trends: TrendData[];
}

export interface TopContent {
  contentId: string;
  title: string;
  platform: string;
  impressions: number;
  engagements: number;
  engagementRate: number;
}

export interface PlatformAnalytics {
  platform: string;
  followers: number;
  posts: number;
  impressions: number;
  engagements: number;
  growthRate: number;
}

export interface AudienceInsights {
  totalReach: number;
  demographics: DemographicData[];
  interests: string[];
  peakTimes: PeakTimeData[];
  bestPerformingDays: string[];
}

export interface DemographicData {
  category: string;
  value: string;
  percentage: number;
}

export interface PeakTimeData {
  day: string;
  hour: number;
  engagement: number;
}

export interface TrendData {
  date: string;
  metric: string;
  value: number;
  change: number;
}

export interface AIContentRequest {
  platform: string;
  topic: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  keywords?: string[];
  targetAudience?: string;
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  callToAction?: string;
}

export interface ContentSuggestion {
  id: string;
  content: string;
  platform: string;
  predictedEngagement: number;
  reasons: string[];
  hashtags: string[];
  bestTimeToPost: string;
}

export interface MarketingStrategy {
  id: string;
  name: string;
  objective: string;
  targetKPIs: string[];
  recommendedPlatforms: string[];
  contentCalendar: ContentCalendarItem[];
  budgetAllocation: BudgetItem[];
  aiRecommendations: string[];
}

export interface ContentCalendarItem {
  date: string;
  platform: string;
  contentType: string;
  topic: string;
  status: 'planned' | 'drafted' | 'scheduled' | 'posted';
}

export interface BudgetItem {
  platform: string;
  amount: number;
  spent: number;
  remaining: number;
}

export interface AITrendAnalysis {
  trends: Trend[];
  predictions: Prediction[];
  recommendations: string[];
  competitorInsights: CompetitorData[];
}

export interface Trend {
  topic: string;
  growth: number;
  platforms: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  volume: number;
}

export interface Prediction {
  metric: string;
  predictedValue: number;
  confidence: number;
  timeframe: string;
}

export interface CompetitorData {
  name: string;
  platforms: string[];
  engagementRate: number;
  contentStrategy: string;
  strengths: string[];
  opportunities: string[];
}

export interface MarketingAutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  conditions: AutomationCondition[];
  enabled: boolean;
  lastExecuted?: string;
}

export interface AutomationTrigger {
  type: 'engagement' | 'time' | 'performance' | 'custom';
  value: string | number;
}

export interface AutomationAction {
  type: 'post' | 'respond' | 'alert' | 'optimize';
  templateId?: string;
  message?: string;
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'greater' | 'less' | 'contains';
  value: string | number;
}
