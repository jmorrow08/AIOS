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

// Media Studio V2 Types
export type TrackType = 'video' | 'audio' | 'text';

export interface Clip {
  id: string;
  trackId: string;
  type: TrackType;
  title: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  endTime: number; // calculated: startTime + duration
  content: {
    // Video/Audio content
    mediaUrl?: string;
    thumbnailUrl?: string;
    // Text content
    text?: string;
    // AI generation data
    prompt?: string;
    aiService?: string;
  };
  effects?: {
    volume?: number; // 0-1 for audio
    opacity?: number; // 0-1 for video
    filters?: string[];
  };
  metadata: {
    createdAt: string;
    modifiedAt: string;
    aiGenerated: boolean;
    serviceUsed?: string;
  };
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  height: number; // in pixels
  color: string; // for visual distinction
  locked: boolean;
  visible: boolean;
  clips: Clip[];
}

export interface TimelineState {
  tracks: Track[];
  totalDuration: number; // in seconds
  currentTime: number; // playback position
  zoom: number; // pixels per second
  scrollLeft: number; // scroll position
  selectedClipIds: string[];
  playheadPosition: number;
  isPlaying: boolean;
  snapToGrid: boolean;
  gridSize: number; // in seconds
}

export interface TimelineRuler {
  pixelsPerSecond: number;
  majorTickInterval: number; // in seconds
  minorTickInterval: number; // in seconds
  showTimeLabels: boolean;
  timeFormat: 'seconds' | 'minutes' | 'timestamp';
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
  // V2 Settings
  timelineZoom: number;
  snapToGrid: boolean;
  gridSize: number;
  autoSyncAudio: boolean;
  defaultTrackHeight: number;
  exportQuality: 'high' | 'medium' | 'low';
  includeSubtitles: boolean;
  socialPublishing: {
    youtube: boolean;
    twitter: boolean;
    linkedin: boolean;
  };
}

export interface VideoExportOptions {
  format: 'mp4' | 'webm';
  resolution: '1080p' | '720p' | '480p';
  quality: 'high' | 'medium' | 'low';
  includeSubtitles: boolean;
  publishToLibrary: boolean;
  // V2 Export Options
  publishToSocial: boolean;
  socialPlatforms: string[];
  exportPath?: string;
  metadata: {
    title: string;
    description: string;
    tags: string[];
    thumbnailUrl?: string;
  };
}

export interface MediaStudioV2State {
  currentTab: 'projects' | 'timeline' | 'exports';
  timelineState: TimelineState;
  selectedProject?: MediaProject;
  isGeneratingClip: boolean;
  isExporting: boolean;
  exportProgress?: RenderProgress;
  aiServiceStatus: {
    imageServices: { [key: string]: boolean };
    audioServices: { [key: string]: boolean };
    videoServices: { [key: string]: boolean };
  };
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

// Security Panel Types
export type ApiServiceType =
  | 'openai'
  | 'elevenlabs'
  | 'heygen'
  | 'stability'
  | 'stripe'
  | 'notion'
  | 'drive'
  | 'anthropic'
  | 'google-gemini'
  | 'claude'
  | 'midjourney'
  | 'other';

export type AuditActionType =
  | 'create_api_key'
  | 'delete_api_key'
  | 'use_api_key'
  | 'view_api_key'
  | 'update_api_key'
  | 'login'
  | 'logout'
  | 'failed_login'
  | 'permission_denied'
  | 'system_access';

export interface ApiKeyRecord {
  id: string;
  company_id: string;
  service: ApiServiceType;
  key_encrypted: string;
  last_used: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaskedApiKeyRecord {
  id: string;
  service: ApiServiceType;
  masked_key: string;
  last_used: string | null;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  actor_id: string;
  action: AuditActionType;
  target: string;
  details?: Record<string, any>;
  timestamp: string;
  users?: {
    email: string;
  };
}

export interface SecuritySettingRecord {
  id: string;
  company_id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

export interface SecurityPanelState {
  currentTab: 'api-keys' | 'audit-logs' | 'settings';
  apiKeys: MaskedApiKeyRecord[];
  auditLogs: AuditLogRecord[];
  securitySettings: SecuritySettingRecord[];
  isLoading: boolean;
  isAddingKey: boolean;
  isDeletingKey: boolean;
}

export interface AddApiKeyForm {
  service: ApiServiceType;
  apiKey: string;
}

export interface SecuritySettingsForm {
  twoFactorEnforced: boolean;
  keyRotationDays: number;
  auditRetentionDays: number;
  maxFailedLoginAttempts: number;
}

// Compliance & Security Policy Types
export interface SecurityPolicy {
  id: string;
  company_id: string;
  enforce_2fa: boolean;
  ip_allowlist: string[];
  key_rotation_days: number;
  data_retention_days: number;
  gdpr_request_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComplianceRequest {
  id: string;
  company_id: string;
  user_id: string;
  request_type: 'export_data' | 'delete_data' | 'access_data';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  request_reason?: string;
  completion_notes?: string;
  requested_at: string;
  completed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DataRetentionLog {
  id: string;
  company_id: string;
  data_category: string;
  record_count: number;
  oldest_record?: string;
  newest_record?: string;
  retention_days: number;
  last_cleanup?: string;
  next_cleanup?: string;
  created_at: string;
  updated_at: string;
}

export interface CompliancePanelState {
  currentTab: 'access-control' | 'key-management' | 'data-retention' | 'compliance-requests';
  securityPolicy: SecurityPolicy | null;
  complianceRequests: ComplianceRequest[];
  dataRetentionLogs: DataRetentionLog[];
  flaggedKeys: string[];
  isLoading: boolean;
  isUpdatingPolicy: boolean;
  isCreatingRequest: boolean;
}

export interface IPAllowlistForm {
  newIP: string;
}

export interface ComplianceRequestForm {
  request_type: 'export_data' | 'delete_data' | 'access_data';
  request_reason: string;
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

// Automation Builder Types
export interface AutomationFlow {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationNode {
  id: string;
  flow_id: string;
  type: 'trigger' | 'action' | 'condition';
  node_type: string;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  created_at: string;
  updated_at: string;
}

export type NodeType = 'trigger' | 'action' | 'condition';

export interface NodeConfig {
  [key: string]: any;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: string;
    config: NodeConfig;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface AutomationExecutionPayload {
  triggerType: string;
  data: Record<string, any>;
  flowId?: string;
}

export interface AutomationTriggerConfig {
  eventType: 'new_service' | 'new_invoice' | 'new_client' | 'budget_warning';
  conditions?: Record<string, any>;
}

export interface AutomationActionConfig {
  actionType: 'send_email' | 'send_slack' | 'generate_doc' | 'start_agent_task';
  template?: string;
  recipients?: string[];
  message?: string;
  parameters?: Record<string, any>;
}

export interface AutomationConditionConfig {
  field: string;
  operator: 'equals' | 'greater' | 'less' | 'contains' | 'matches';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface AutomationExecutionResult {
  success: boolean;
  executedNodes: string[];
  errors: string[];
  outputs: Record<string, any>;
}

export interface TestPayload {
  triggerType: string;
  data: Record<string, any>;
}
