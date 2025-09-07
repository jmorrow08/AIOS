import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertTriangle,
  Star,
  Zap,
  Clock,
  DollarSign,
  Image as ImageIcon,
  Mic,
  Video,
  Settings,
} from 'lucide-react';
import { MediaProjectSettings } from '@/lib/types';

interface ServiceOption {
  id: string;
  name: string;
  provider: string;
  description: string;
  features: string[];
  pricing: {
    perRequest: number;
    currency: string;
    unit: string;
  };
  quality: 'high' | 'medium' | 'low';
  speed: 'fast' | 'medium' | 'slow';
  status: 'available' | 'beta' | 'coming_soon';
  requiresApiKey: boolean;
  apiKeyConfigured: boolean;
}

interface MultiToolSelectorProps {
  settings: MediaProjectSettings;
  onSettingsUpdate: (settings: MediaProjectSettings) => void;
  className?: string;
}

const MultiToolSelector: React.FC<MultiToolSelectorProps> = ({
  settings,
  onSettingsUpdate,
  className = '',
}) => {
  const [selectedServices, setSelectedServices] = useState({
    image: settings.imageService,
    audio: settings.audioService,
    video: settings.videoService,
  });

  // Available AI services
  const imageServices: ServiceOption[] = [
    {
      id: 'dalle',
      name: 'DALL-E',
      provider: 'OpenAI',
      description: 'High-quality image generation with excellent prompt understanding',
      features: ['Photorealistic', 'Art styles', 'Complex scenes', 'High resolution'],
      pricing: { perRequest: 0.04, currency: 'USD', unit: 'image' },
      quality: 'high',
      speed: 'medium',
      status: 'available',
      requiresApiKey: true,
      apiKeyConfigured: true, // This would be checked from actual API key status
    },
    {
      id: 'stability',
      name: 'Stable Diffusion',
      provider: 'Stability AI',
      description: 'Open-source image generation with customization options',
      features: ['Style transfer', 'Inpainting', 'Custom models', 'Cost-effective'],
      pricing: { perRequest: 0.03, currency: 'USD', unit: 'image' },
      quality: 'high',
      speed: 'fast',
      status: 'available',
      requiresApiKey: true,
      apiKeyConfigured: true,
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      provider: 'Midjourney',
      description: 'Art-focused image generation with unique artistic style',
      features: [
        'Artistic styles',
        'Creative variations',
        'Community-driven',
        'Discord integration',
      ],
      pricing: { perRequest: 0.06, currency: 'USD', unit: 'image' },
      quality: 'high',
      speed: 'slow',
      status: 'beta',
      requiresApiKey: false,
      apiKeyConfigured: false,
    },
  ];

  const audioServices: ServiceOption[] = [
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      provider: 'ElevenLabs',
      description: 'High-quality text-to-speech with natural voices',
      features: ['Natural voices', 'Emotion control', 'Multiple languages', 'Voice cloning'],
      pricing: { perRequest: 0.15, currency: 'USD', unit: 'minute' },
      quality: 'high',
      speed: 'fast',
      status: 'available',
      requiresApiKey: true,
      apiKeyConfigured: true,
    },
    {
      id: 'google-tts',
      name: 'Google Text-to-Speech',
      provider: 'Google Cloud',
      description: 'Reliable TTS with consistent quality',
      features: ['Multiple voices', 'Languages support', 'WaveNet quality', 'Free tier available'],
      pricing: { perRequest: 0.0001, currency: 'USD', unit: 'character' },
      quality: 'medium',
      speed: 'fast',
      status: 'available',
      requiresApiKey: true,
      apiKeyConfigured: true,
    },
  ];

  const videoServices: ServiceOption[] = [
    {
      id: 'heygen',
      name: 'HeyGen',
      provider: 'HeyGen',
      description: 'AI video generation with realistic avatars',
      features: ['Avatar videos', 'Text-to-video', 'Custom avatars', 'Multi-language'],
      pricing: { perRequest: 0.25, currency: 'USD', unit: 'minute' },
      quality: 'high',
      speed: 'medium',
      status: 'available',
      requiresApiKey: true,
      apiKeyConfigured: false,
    },
    {
      id: 'sora',
      name: 'Sora',
      provider: 'OpenAI',
      description: 'Advanced video generation with complex scenes',
      features: ['Complex scenes', 'Motion control', 'High resolution', 'Creative freedom'],
      pricing: { perRequest: 0.12, currency: 'USD', unit: 'second' },
      quality: 'high',
      speed: 'slow',
      status: 'beta',
      requiresApiKey: true,
      apiKeyConfigured: false,
    },
    {
      id: 'hedra',
      name: 'Hedra',
      provider: 'Hedra',
      description: 'Fast video generation for social media',
      features: ['Quick generation', 'Social formats', 'Templates', 'Brand customization'],
      pricing: { perRequest: 0.08, currency: 'USD', unit: 'video' },
      quality: 'medium',
      speed: 'fast',
      status: 'coming_soon',
      requiresApiKey: true,
      apiKeyConfigured: false,
    },
  ];

  const handleServiceSelect = (type: 'image' | 'audio' | 'video', serviceId: string) => {
    const newSelectedServices = { ...selectedServices, [type]: serviceId };
    setSelectedServices(newSelectedServices);

    onSettingsUpdate({
      ...settings,
      [`${type}Service`]: serviceId,
    });
  };

  const getServiceStatusIcon = (status: ServiceOption['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'beta':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'coming_soon':
        return <Clock className="w-4 h-4 text-blue-500" />;
    }
  };

  const getServiceStatusBadge = (status: ServiceOption['status']) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">Available</Badge>;
      case 'beta':
        return <Badge className="bg-yellow-500">Beta</Badge>;
      case 'coming_soon':
        return <Badge className="bg-blue-500">Coming Soon</Badge>;
    }
  };

  const ServiceCard: React.FC<{
    service: ServiceOption;
    isSelected: boolean;
    onSelect: () => void;
  }> = ({ service, isSelected, onSelect }) => (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-cosmic-accent bg-cosmic-accent bg-opacity-10 border-cosmic-accent'
          : 'hover:shadow-lg border-cosmic-light bg-cosmic-light bg-opacity-5'
      } ${service.status !== 'available' ? 'opacity-75' : ''}`}
      onClick={service.status === 'available' ? onSelect : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-cosmic-highlight flex items-center gap-2">
            {service.id === selectedServices.image && <ImageIcon className="w-5 h-5" />}
            {service.id === selectedServices.audio && <Mic className="w-5 h-5" />}
            {service.id === selectedServices.video && <Video className="w-5 h-5" />}
            {service.name}
          </CardTitle>
          {getServiceStatusIcon(service.status)}
        </div>
        <div className="text-sm text-cosmic-light opacity-75">by {service.provider}</div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-cosmic-light">{service.description}</p>

        {/* Features */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-cosmic-accent">Features:</div>
          <div className="flex flex-wrap gap-1">
            {service.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Quality & Speed */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            <span className="capitalize">{service.quality} quality</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span className="capitalize">{service.speed} speed</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center gap-1 text-sm">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span className="font-medium">
            {service.pricing.currency} {service.pricing.perRequest.toFixed(3)} per{' '}
            {service.pricing.unit}
          </span>
        </div>

        {/* Status and API Key */}
        <div className="flex items-center justify-between pt-2">
          {getServiceStatusBadge(service.status)}
          {service.requiresApiKey && (
            <div className="flex items-center gap-1 text-xs">
              {service.apiKeyConfigured ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-red-500" />
              )}
              <span className={service.apiKeyConfigured ? 'text-green-500' : 'text-red-500'}>
                API Key {service.apiKeyConfigured ? 'Configured' : 'Required'}
              </span>
            </div>
          )}
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="flex items-center justify-center pt-2">
            <Badge className="bg-cosmic-accent">Selected</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cosmic-highlight">
            <Settings className="w-5 h-5" />
            AI Service Configuration
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-cosmic-light bg-opacity-20">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Image Services
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Audio Services
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Services
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {imageServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedServices.image === service.id}
                    onSelect={() => handleServiceSelect('image', service.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {audioServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedServices.audio === service.id}
                    onSelect={() => handleServiceSelect('audio', service.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="video" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videoServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedServices.video === service.id}
                    onSelect={() => handleServiceSelect('video', service.id)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Cost Estimation */}
          <div className="mt-6 p-4 bg-cosmic-dark rounded-lg">
            <h4 className="text-sm font-medium text-cosmic-highlight mb-3">Estimated Costs</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-cosmic-light">Image Generation:</span>
                <div className="text-cosmic-accent font-medium">
                  ~$
                  {(
                    imageServices.find((s) => s.id === selectedServices.image)?.pricing
                      .perRequest || 0
                  ).toFixed(3)}{' '}
                  per image
                </div>
              </div>
              <div>
                <span className="text-cosmic-light">Audio Generation:</span>
                <div className="text-cosmic-accent font-medium">
                  ~$
                  {(
                    audioServices.find((s) => s.id === selectedServices.audio)?.pricing
                      .perRequest || 0
                  ).toFixed(3)}{' '}
                  per minute
                </div>
              </div>
              <div>
                <span className="text-cosmic-light">Video Generation:</span>
                <div className="text-cosmic-accent font-medium">
                  ~$
                  {(
                    videoServices.find((s) => s.id === selectedServices.video)?.pricing
                      .perRequest || 0
                  ).toFixed(3)}{' '}
                  per minute
                </div>
              </div>
            </div>
          </div>

          {/* API Key Warning */}
          {Object.values(selectedServices).some((serviceId) => {
            const allServices = [...imageServices, ...audioServices, ...videoServices];
            const service = allServices.find((s) => s.id === serviceId);
            return service?.requiresApiKey && !service?.apiKeyConfigured;
          }) && (
            <Alert className="mt-4 border-yellow-500 bg-yellow-500 bg-opacity-20 text-yellow-300">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some selected services require API keys that haven't been configured yet. Please
                check your API settings to ensure all selected services work properly.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MultiToolSelector;
