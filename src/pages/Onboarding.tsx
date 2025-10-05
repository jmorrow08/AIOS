import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { CosmicBackground } from '@/components/CosmicBackground';
import HeyGenAvatarWidget from '@/components/HeyGenAvatarWidget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createClient, Client } from '@/api/clients';
import { createClientProfile, updateClientProfile, ClientProfile } from '@/api/clientProfiles';
import { generateSOP } from '@/agents/sopBot';
import { supabase } from '@/lib/supabaseClient';
import {
  User,
  Building2,
  Target,
  DollarSign,
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Bot,
  Sparkles,
} from 'lucide-react';

// Types for onboarding flow
interface OnboardingData {
  // Basic Info
  name: string;
  role: string;
  email: string;
  phone: string;
  company: string;

  // Business Info
  businessType: string;
  companySize: string;
  industry: string;
  yearsInBusiness: number;

  // Goals & Challenges
  primaryGoals: string[];
  painPoints: string[];
  currentTools: string[];

  // Budget & Timeline
  budgetRange: string;
  timeline: string;
}

type OnboardingStep =
  | 'welcome'
  | 'basic-info'
  | 'business-info'
  | 'goals-challenges'
  | 'budget-timeline'
  | 'review'
  | 'processing'
  | 'complete';

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  // Step management
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [stepProgress, setStepProgress] = useState(0);

  // Form data
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    name: '',
    role: '',
    email: '',
    phone: '',
    company: '',
    businessType: '',
    companySize: '',
    industry: '',
    yearsInBusiness: 0,
    primaryGoals: [],
    painPoints: [],
    currentTools: [],
    budgetRange: '',
    timeline: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarMessages, setAvatarMessages] = useState<string[]>([
    "Hi there! I'm excited to help you get started with Oria. Let's begin by getting to know you better.",
    'First, could you tell me your name and what role you play in your organization?',
  ]);

  // HeyGen avatar interaction
  const [showAvatar, setShowAvatar] = useState(true);
  const [avatarSpeaking, setAvatarSpeaking] = useState(false);

  // Step definitions
  const steps: { key: OnboardingStep; title: string; description: string; progress: number }[] = [
    { key: 'welcome', title: 'Welcome', description: 'Getting started', progress: 10 },
    {
      key: 'basic-info',
      title: 'Basic Information',
      description: 'Personal details',
      progress: 25,
    },
    {
      key: 'business-info',
      title: 'Business Details',
      description: 'Company information',
      progress: 40,
    },
    {
      key: 'goals-challenges',
      title: 'Goals & Challenges',
      description: 'Your objectives',
      progress: 55,
    },
    {
      key: 'budget-timeline',
      title: 'Budget & Timeline',
      description: 'Planning ahead',
      progress: 70,
    },
    { key: 'review', title: 'Review', description: 'Confirm your details', progress: 85 },
    { key: 'processing', title: 'Processing', description: 'Creating your profile', progress: 100 },
    { key: 'complete', title: 'Complete', description: 'Welcome to Oria!', progress: 100 },
  ];

  // Update progress based on current step
  useEffect(() => {
    const currentStepData = steps.find((step) => step.key === currentStep);
    if (currentStepData) {
      setStepProgress(currentStepData.progress);
    }
  }, [currentStep]);

  // Handle input changes
  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setOnboardingData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle multi-select changes
  const handleMultiSelectChange = (
    field: 'primaryGoals' | 'painPoints' | 'currentTools',
    value: string,
    checked: boolean,
  ) => {
    setOnboardingData((prev) => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter((item) => item !== value),
    }));
  };

  // Navigation functions
  const nextStep = () => {
    const currentIndex = steps.findIndex((step) => step.key === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].key);
      updateAvatarMessage(steps[currentIndex + 1].key);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.findIndex((step) => step.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].key);
      updateAvatarMessage(steps[currentIndex - 1].key);
    }
  };

  // Update avatar messages based on step
  const updateAvatarMessage = (step: OnboardingStep) => {
    const messages = {
      welcome: [
        "Great! Let's get you set up with Oria. I'll guide you through this process step by step.",
      ],
      'basic-info': ['Perfect! Now I need some basic information about you and your role.'],
      'business-info': ['Tell me about your business so I can better understand your needs.'],
      'goals-challenges': [
        'What are your main goals and challenges? This helps me create the perfect system for you.',
      ],
      'budget-timeline': ["Let's talk about your budget and timeline for implementation."],
      review: ['Almost done! Please review your information before we create your profile.'],
      processing: [
        "I'm creating your personalized profile and system plan. This will just take a moment...",
      ],
      complete: ['Congratulations! Your profile is ready. Welcome to the Oria ecosystem!'],
    };

    setAvatarMessages(messages[step] || ["Let's continue with your onboarding."]);
  };

  // Validate current step
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'basic-info':
        return !!(onboardingData.name && onboardingData.role && onboardingData.email);
      case 'business-info':
        return !!(
          onboardingData.businessType &&
          onboardingData.companySize &&
          onboardingData.industry
        );
      case 'goals-challenges':
        return onboardingData.primaryGoals.length > 0 && onboardingData.painPoints.length > 0;
      case 'budget-timeline':
        return !!(onboardingData.budgetRange && onboardingData.timeline);
      default:
        return true;
    }
  };

  // Submit onboarding data
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setCurrentStep('processing');

      // 1. Create client in database
      const clientData = {
        name: onboardingData.name,
        company: onboardingData.company || `${onboardingData.name}'s Company`,
        email: onboardingData.email,
        phone: onboardingData.phone,
        status: 'Prospect' as const,
      };

      const clientResponse = await createClient(clientData);
      if (clientResponse.error || !clientResponse.data) {
        throw new Error(clientResponse.error || 'Failed to create client');
      }

      const client = clientResponse.data as Client;

      // 2. Create client profile
      const profileData = {
        client_id: client.id,
        name: onboardingData.name,
        role: onboardingData.role,
        email: onboardingData.email,
        phone: onboardingData.phone,
        business_type: onboardingData.businessType,
        company_size: onboardingData.companySize,
        industry: onboardingData.industry,
        years_in_business: onboardingData.yearsInBusiness,
        primary_goals: onboardingData.primaryGoals,
        pain_points: onboardingData.painPoints,
        current_tools: onboardingData.currentTools,
        budget_range: onboardingData.budgetRange,
        timeline: onboardingData.timeline,
        created_by: user?.id,
      };

      const profileResponse = await createClientProfile(profileData);
      if (profileResponse.error || !profileResponse.data) {
        throw new Error(profileResponse.error || 'Failed to create client profile');
      }

      const profile = profileResponse.data as ClientProfile;

      // 3. Generate system plan using SOP Bot
      const systemPlanPrompt = generateSystemPlanPrompt(onboardingData);
      const sopResponse = await generateSOP({
        title: `AI System Plan for ${onboardingData.name}`,
        topic: 'AI System Implementation',
        audience: 'client',
        notes: `Client: ${onboardingData.name}, Role: ${onboardingData.role}, Business: ${onboardingData.businessType}`,
        userId: user?.id,
      });

      if (sopResponse.success && sopResponse.sop) {
        // Save SOP to database
        const { data: sopDoc, error: sopError } = await supabase
          .from('documents')
          .insert([
            {
              title: sopResponse.sop.title,
              category: 'Client Plans',
              content: sopResponse.sop.content,
              description: `AI System Plan for ${onboardingData.name}`,
              created_by: user?.id,
            },
          ])
          .select()
          .single();

        if (!sopError && sopDoc) {
          // Update profile with system plan reference
          await updateClientProfile(profile.id, {
            system_plan_id: sopDoc.id,
            system_plan: {
              title: sopResponse.sop.title,
              content: sopResponse.sop.content,
              generated_at: new Date().toISOString(),
            },
            onboarding_status: 'completed',
          });
        }
      }

      // 4. Complete onboarding
      setCurrentStep('complete');

      // 5. Redirect to client portal after a delay
      setTimeout(() => {
        navigate('/client-portal', {
          state: {
            welcome: true,
            clientProfile: profile,
            message: `Welcome to Oria, ${onboardingData.name}! Your personalized system plan is ready.`,
          },
        });
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setCurrentStep('review');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate system plan prompt
  const generateSystemPlanPrompt = (data: OnboardingData): string => {
    return `
Based on the client's onboarding information:

**Client Profile:**
- Name: ${data.name}
- Role: ${data.role}
- Business Type: ${data.businessType}
- Company Size: ${data.companySize}
- Industry: ${data.industry}
- Years in Business: ${data.yearsInBusiness}

**Goals:** ${data.primaryGoals.join(', ')}
**Pain Points:** ${data.painPoints.join(', ')}
**Current Tools:** ${data.currentTools.join(', ')}
**Budget Range:** ${data.budgetRange}
**Timeline:** ${data.timeline}

Generate a comprehensive AI system implementation plan that addresses their specific needs and challenges.
    `;
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />;
      case 'basic-info':
        return <BasicInfoStep />;
      case 'business-info':
        return <BusinessInfoStep />;
      case 'goals-challenges':
        return <GoalsChallengesStep />;
      case 'budget-timeline':
        return <BudgetTimelineStep />;
      case 'review':
        return <ReviewStep />;
      case 'processing':
        return <ProcessingStep />;
      case 'complete':
        return <CompleteStep />;
      default:
        return <WelcomeStep />;
    }
  };

  // Welcome Step Component
  const WelcomeStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-white">Welcome to Oria</h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Let's create your personalized AI operating system. I'll guide you through a quick
          onboarding process to understand your needs and build the perfect solution for your
          business.
        </p>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={nextStep}
          className="bg-cosmic-accent hover:bg-cosmic-highlight text-white px-8 py-3 text-lg"
        >
          Get Started
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );

  // Basic Info Step Component
  const BasicInfoStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Tell us about yourself</h2>
        <p className="text-gray-300">This helps us personalize your experience</p>
      </div>

      <Card className="bg-cosmic-dark border-cosmic-light">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Full Name *
              </Label>
              <Input
                id="name"
                value={onboardingData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="bg-cosmic-light border-cosmic-accent text-white"
                placeholder="John Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">
                Role/Title *
              </Label>
              <Input
                id="role"
                value={onboardingData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                className="bg-cosmic-light border-cosmic-accent text-white"
                placeholder="CEO, Marketing Director, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={onboardingData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="bg-cosmic-light border-cosmic-accent text-white"
                placeholder="john@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                Phone Number
              </Label>
              <Input
                id="phone"
                value={onboardingData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="bg-cosmic-light border-cosmic-accent text-white"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-white">
              Company Name
            </Label>
            <Input
              id="company"
              value={onboardingData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="bg-cosmic-light border-cosmic-accent text-white"
              placeholder="Your Company LLC"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Business Info Step Component
  const BusinessInfoStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Business Information</h2>
        <p className="text-gray-300">Help us understand your business context</p>
      </div>

      <Card className="bg-cosmic-dark border-cosmic-light">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessType" className="text-white">
                Business Type *
              </Label>
              <Select
                value={onboardingData.businessType}
                onValueChange={(value) => handleInputChange('businessType', value)}
              >
                <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  <SelectItem value="b2b">B2B (Business to Business)</SelectItem>
                  <SelectItem value="b2c">B2C (Business to Consumer)</SelectItem>
                  <SelectItem value="b2b2c">B2B2C (Marketplace)</SelectItem>
                  <SelectItem value="saas">SaaS Company</SelectItem>
                  <SelectItem value="consulting">Consulting Services</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail/E-commerce</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize" className="text-white">
                Company Size *
              </Label>
              <Select
                value={onboardingData.companySize}
                onValueChange={(value) => handleInputChange('companySize', value)}
              >
                <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-1000">201-1000 employees</SelectItem>
                  <SelectItem value="1000+">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-white">
                Industry *
              </Label>
              <Select
                value={onboardingData.industry}
                onValueChange={(value) => handleInputChange('industry', value)}
              >
                <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="real-estate">Real Estate</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsInBusiness" className="text-white">
                Years in Business
              </Label>
              <Select
                value={onboardingData.yearsInBusiness.toString()}
                onValueChange={(value) => handleInputChange('yearsInBusiness', parseInt(value))}
              >
                <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                  <SelectValue placeholder="Select years" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  <SelectItem value="0">Startup (0-2 years)</SelectItem>
                  <SelectItem value="3">3-5 years</SelectItem>
                  <SelectItem value="6">6-10 years</SelectItem>
                  <SelectItem value="11">11-20 years</SelectItem>
                  <SelectItem value="21">20+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Goals & Challenges Step Component
  const GoalsChallengesStep = () => {
    const goalOptions = [
      'Increase operational efficiency',
      'Improve customer experience',
      'Reduce costs',
      'Scale business operations',
      'Automate repetitive tasks',
      'Enhance data analytics',
      'Improve decision making',
      'Streamline workflows',
      'Enhance marketing efforts',
      'Better HR management',
    ];

    const painPointOptions = [
      'Manual processes taking too long',
      'Data scattered across systems',
      'Poor customer communication',
      'Inefficient team collaboration',
      'Lack of real-time insights',
      'Compliance challenges',
      'Scaling difficulties',
      'High operational costs',
      'Talent management issues',
      'Technology integration problems',
    ];

    const toolOptions = [
      'CRM (Salesforce, HubSpot)',
      'ERP (SAP, Oracle)',
      'Project Management (Asana, Trello)',
      'Accounting (QuickBooks, Xero)',
      'Email Marketing (Mailchimp, Klaviyo)',
      'Analytics (Google Analytics, Mixpanel)',
      'Communication (Slack, Teams)',
      'HR (Workday, BambooHR)',
      'Custom spreadsheets',
      'Legacy systems',
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Goals & Challenges</h2>
          <p className="text-gray-300">
            What are you trying to achieve and what obstacles are you facing?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary Goals */}
          <Card className="bg-cosmic-dark border-cosmic-light">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-cosmic-accent" />
                Primary Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {goalOptions.map((goal) => (
                <div key={goal} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`goal-${goal}`}
                    checked={onboardingData.primaryGoals.includes(goal)}
                    onChange={(e) =>
                      handleMultiSelectChange('primaryGoals', goal, e.target.checked)
                    }
                    className="rounded border-cosmic-accent bg-cosmic-light"
                  />
                  <Label htmlFor={`goal-${goal}`} className="text-white text-sm cursor-pointer">
                    {goal}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pain Points */}
          <Card className="bg-cosmic-dark border-cosmic-light">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Pain Points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {painPointOptions.map((pain) => (
                <div key={pain} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`pain-${pain}`}
                    checked={onboardingData.painPoints.includes(pain)}
                    onChange={(e) => handleMultiSelectChange('painPoints', pain, e.target.checked)}
                    className="rounded border-cosmic-accent bg-cosmic-light"
                  />
                  <Label htmlFor={`pain-${pain}`} className="text-white text-sm cursor-pointer">
                    {pain}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Current Tools */}
          <Card className="bg-cosmic-dark border-cosmic-light">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Current Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {toolOptions.map((tool) => (
                <div key={tool} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`tool-${tool}`}
                    checked={onboardingData.currentTools.includes(tool)}
                    onChange={(e) =>
                      handleMultiSelectChange('currentTools', tool, e.target.checked)
                    }
                    className="rounded border-cosmic-accent bg-cosmic-light"
                  />
                  <Label htmlFor={`tool-${tool}`} className="text-white text-sm cursor-pointer">
                    {tool}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  };

  // Budget & Timeline Step Component
  const BudgetTimelineStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Budget & Timeline</h2>
        <p className="text-gray-300">Help us plan the implementation that fits your constraints</p>
      </div>

      <Card className="bg-cosmic-dark border-cosmic-light">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Budget Range *
              </Label>
              <Select
                value={onboardingData.budgetRange}
                onValueChange={(value) => handleInputChange('budgetRange', value)}
              >
                <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                  <SelectValue placeholder="Select your budget range" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  <SelectItem value="$0-5K">$0 - $5,000</SelectItem>
                  <SelectItem value="$5K-15K">$5,000 - $15,000</SelectItem>
                  <SelectItem value="$15K-50K">$15,000 - $50,000</SelectItem>
                  <SelectItem value="$50K-100K">$50,000 - $100,000</SelectItem>
                  <SelectItem value="$100K+">$100,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                Implementation Timeline *
              </Label>
              <Select
                value={onboardingData.timeline}
                onValueChange={(value) => handleInputChange('timeline', value)}
              >
                <SelectTrigger className="bg-cosmic-light border-cosmic-accent text-white">
                  <SelectValue placeholder="Select your timeline" />
                </SelectTrigger>
                <SelectContent className="bg-cosmic-dark border-cosmic-light">
                  <SelectItem value="ASAP">ASAP (Within 1 month)</SelectItem>
                  <SelectItem value="1-3 months">1-3 months</SelectItem>
                  <SelectItem value="3-6 months">3-6 months</SelectItem>
                  <SelectItem value="6-12 months">6-12 months</SelectItem>
                  <SelectItem value="Exploring options">Just exploring options</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Review Step Component
  const ReviewStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Review Your Information</h2>
        <p className="text-gray-300">Please review your details before we create your profile</p>
      </div>

      <Card className="bg-cosmic-dark border-cosmic-light">
        <CardContent className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Name:</span>{' '}
                <span className="text-white">{onboardingData.name}</span>
              </div>
              <div>
                <span className="text-gray-400">Role:</span>{' '}
                <span className="text-white">{onboardingData.role}</span>
              </div>
              <div>
                <span className="text-gray-400">Email:</span>{' '}
                <span className="text-white">{onboardingData.email}</span>
              </div>
              <div>
                <span className="text-gray-400">Phone:</span>{' '}
                <span className="text-white">{onboardingData.phone}</span>
              </div>
              <div className="md:col-span-2">
                <span className="text-gray-400">Company:</span>{' '}
                <span className="text-white">{onboardingData.company}</span>
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Business Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Business Type:</span>{' '}
                <span className="text-white">{onboardingData.businessType}</span>
              </div>
              <div>
                <span className="text-gray-400">Company Size:</span>{' '}
                <span className="text-white">{onboardingData.companySize}</span>
              </div>
              <div>
                <span className="text-gray-400">Industry:</span>{' '}
                <span className="text-white">{onboardingData.industry}</span>
              </div>
              <div>
                <span className="text-gray-400">Years in Business:</span>{' '}
                <span className="text-white">{onboardingData.yearsInBusiness} years</span>
              </div>
            </div>
          </div>

          {/* Goals & Challenges */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5" />
              Goals & Challenges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-gray-400 text-sm">Goals:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {onboardingData.primaryGoals.map((goal, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {goal}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Pain Points:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {onboardingData.painPoints.map((pain, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {pain}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Current Tools:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {onboardingData.currentTools.map((tool, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Budget & Timeline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Budget Range:</span>{' '}
                <span className="text-white">{onboardingData.budgetRange}</span>
              </div>
              <div>
                <span className="text-gray-400">Timeline:</span>{' '}
                <span className="text-white">{onboardingData.timeline}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}
    </motion.div>
  );

  // Processing Step Component
  const ProcessingStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <Loader2 className="w-16 h-16 animate-spin text-cosmic-accent mx-auto" />
        <h2 className="text-2xl font-bold text-white">Creating Your Profile</h2>
        <p className="text-gray-300">
          We're generating your personalized AI system plan and setting up your account...
        </p>
      </div>

      <Card className="bg-cosmic-dark border-cosmic-light max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-white">Creating client profile</span>
            </div>
            <div className="flex items-center gap-3">
              <Bot className="w-5 h-5 text-cosmic-accent animate-pulse" />
              <span className="text-white">Generating AI system plan</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
              <span className="text-white">Setting up your dashboard</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Complete Step Component
  const CompleteStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="space-y-4">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
        <h2 className="text-3xl font-bold text-white">Welcome to Oria!</h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Your personalized AI operating system is ready. We're redirecting you to your client
          portal where you can explore your custom system plan and start using your AI tools.
        </p>
      </div>

      <Card className="bg-cosmic-dark border-cosmic-light max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-white">Profile created successfully</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-white">AI system plan generated</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-white">Client portal ready</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-dark via-cosmic-dark to-black relative overflow-hidden">
      <CosmicBackground />

      {/* Header */}
      <div className="relative z-10 p-6 border-b border-cosmic-light">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Bot className="w-8 h-8 text-cosmic-accent" />
            <div>
              <h1 className="text-2xl font-bold text-white">Oria Onboarding</h1>
              <p className="text-gray-400">Building your AI operating system</p>
            </div>
          </div>

          {/* Progress */}
          <div className="hidden md:flex items-center gap-4">
            <span className="text-white text-sm">
              Step {steps.findIndex((s) => s.key === currentStep) + 1} of {steps.length}
            </span>
            <Progress value={stepProgress} className="w-32" />
            <span className="text-white text-sm">{stepProgress}%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card className="bg-cosmic-dark border-cosmic-light">
                <CardContent className="p-6">
                  <HeyGenAvatarWidget />
                  <div className="mt-4 space-y-2">
                    <h3 className="text-white font-semibold">Current Step</h3>
                    <p className="text-gray-300 text-sm">
                      {steps.find((s) => s.key === currentStep)?.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <div key={currentStep}>{renderStepContent()}</div>
            </AnimatePresence>

            {/* Navigation */}
            {currentStep !== 'welcome' &&
              currentStep !== 'processing' &&
              currentStep !== 'complete' && (
                <div className="flex justify-between mt-8">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="text-white border-cosmic-accent"
                    disabled={currentStep === 'welcome'}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <Button
                    onClick={currentStep === 'review' ? handleSubmit : nextStep}
                    className="bg-cosmic-accent hover:bg-cosmic-highlight"
                    disabled={!validateCurrentStep() || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : currentStep === 'review' ? (
                      <Sparkles className="w-4 h-4 mr-2" />
                    ) : (
                      <ArrowRight className="w-4 h-4 mr-2" />
                    )}
                    {currentStep === 'review' ? 'Create Profile' : 'Next'}
                  </Button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
