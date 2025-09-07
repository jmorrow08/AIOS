import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CosmicBackground } from '@/components/CosmicBackground';
import { RadialMenu } from '@/components/RadialMenu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createMediaAsset, getMediaAssets, MediaAsset } from '@/api/mediaAssets';

interface GeneratedMedia {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  prompt: string;
  service: string;
  createdAt: Date;
}

const MediaStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState('image');
  const [imagePrompt, setImagePrompt] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [audioPrompt, setAudioPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState<GeneratedMedia[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load media assets on component mount
  useEffect(() => {
    loadMediaAssets();
  }, []);

  const loadMediaAssets = async () => {
    const { data, error } = await getMediaAssets();
    if (error) {
      console.error('Error loading media assets:', error);
    } else if (data) {
      setMediaAssets(data as MediaAsset[]);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt for image generation' });
      return;
    }

    setIsGenerating(true);
    try {
      // MidJourney/Ideogram stub - in real implementation, this would call the actual API
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API delay

      const mockImageUrl = `https://picsum.photos/512/512?random=${Date.now()}`;

      const newMedia: GeneratedMedia = {
        id: `img-${Date.now()}`,
        type: 'image',
        url: mockImageUrl,
        prompt: imagePrompt,
        service: 'MidJourney/Ideogram',
        createdAt: new Date(),
      };

      setGeneratedMedia((prev) => [newMedia, ...prev]);
      setImagePrompt('');
      setMessage({ type: 'success', text: 'Image generated successfully!' });
    } catch (error) {
      console.error('Error generating image:', error);
      setMessage({ type: 'error', text: 'Failed to generate image' });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!videoPrompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt for video generation' });
      return;
    }

    setIsGenerating(true);
    try {
      // HeyGen/Sora stub - in real implementation, this would call the actual API
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate API delay

      const mockVideoUrl = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';

      const newMedia: GeneratedMedia = {
        id: `vid-${Date.now()}`,
        type: 'video',
        url: mockVideoUrl,
        prompt: videoPrompt,
        service: 'HeyGen/Sora',
        createdAt: new Date(),
      };

      setGeneratedMedia((prev) => [newMedia, ...prev]);
      setVideoPrompt('');
      setMessage({ type: 'success', text: 'Video generated successfully!' });
    } catch (error) {
      console.error('Error generating video:', error);
      setMessage({ type: 'error', text: 'Failed to generate video' });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!audioPrompt.trim()) {
      setMessage({ type: 'error', text: 'Please enter a prompt for audio generation' });
      return;
    }

    setIsGenerating(true);
    try {
      // ElevenLabs stub - in real implementation, this would call the actual API
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

      const mockAudioUrl = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav';

      const newMedia: GeneratedMedia = {
        id: `aud-${Date.now()}`,
        type: 'audio',
        url: mockAudioUrl,
        prompt: audioPrompt,
        service: 'ElevenLabs',
        createdAt: new Date(),
      };

      setGeneratedMedia((prev) => [newMedia, ...prev]);
      setAudioPrompt('');
      setMessage({ type: 'success', text: 'Audio generated successfully!' });
    } catch (error) {
      console.error('Error generating audio:', error);
      setMessage({ type: 'error', text: 'Failed to generate audio' });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveToLibrary = async (media: GeneratedMedia) => {
    try {
      // First, upload the file to Supabase Storage
      const response = await fetch(media.url);
      const blob = await response.blob();

      const fileExt = media.type === 'image' ? 'jpg' : media.type === 'video' ? 'mp4' : 'wav';
      const fileName = `${media.type}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);

      // Save to media_assets table
      const assetData = {
        title: `${media.type.charAt(0).toUpperCase() + media.type.slice(1)} - ${media.prompt.slice(
          0,
          50,
        )}...`,
        description: `Generated using ${media.service}`,
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: blob.size,
        file_type: blob.type || `application/${media.type}`,
        media_type: media.type,
        prompt: media.prompt,
        ai_service: media.service,
      };

      const { data: assetResult, error: assetError } = await createMediaAsset(assetData);

      if (assetError) {
        throw assetError;
      }

      // Remove from generated media and add to assets
      setGeneratedMedia((prev) => prev.filter((m) => m.id !== media.id));
      if (assetResult) {
        setMediaAssets((prev) => [assetResult as MediaAsset, ...prev]);
      }

      setMessage({ type: 'success', text: 'Media saved to library successfully!' });
    } catch (error) {
      console.error('Error saving to library:', error);
      setMessage({ type: 'error', text: 'Failed to save media to library' });
    }
  };

  const renderMediaPreview = (media: GeneratedMedia) => {
    switch (media.type) {
      case 'image':
        return (
          <img
            src={media.url}
            alt={media.prompt}
            className="w-full h-full object-cover rounded-lg"
          />
        );
      case 'video':
        return <video src={media.url} controls className="w-full h-full object-cover rounded-lg" />;
      case 'audio':
        return (
          <div className="flex items-center justify-center h-full bg-cosmic-light bg-opacity-20 rounded-lg">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-cosmic-accent mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C10.896 2 10 2.896 10 4V12C8.896 12 8 12.896 8 14C8 15.104 8.896 16 10 16V20C10 21.104 10.896 22 12 22C13.104 22 14 21.104 14 20V16C15.104 16 16 15.104 16 14C16 12.896 15.104 12 14 12V4C14 2.896 13.104 2 12 2Z" />
              </svg>
              <audio controls className="w-full">
                <source src={media.url} type="audio/wav" />
              </audio>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-cosmic-dark text-white">
      <CosmicBackground />
      <RadialMenu />

      <div className="relative z-10 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cosmic-highlight mb-2">Media Studio</h1>
          <p className="text-xl text-cosmic-accent">
            Generate and create multimedia content with AI
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500 bg-opacity-20 text-green-300 border border-green-500'
                : 'bg-red-500 bg-opacity-20 text-red-300 border border-red-500'
            }`}
          >
            {message.text}
            <button onClick={() => setMessage(null)} className="float-right ml-4 text-xl font-bold">
              ×
            </button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-cosmic-light bg-opacity-20">
            <TabsTrigger value="image" className="data-[state=active]:bg-cosmic-accent">
              Image Generation
            </TabsTrigger>
            <TabsTrigger value="video" className="data-[state=active]:bg-cosmic-accent">
              Video Generation
            </TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-cosmic-accent">
              Audio Generation
            </TabsTrigger>
          </TabsList>

          {/* Image Tab */}
          <TabsContent value="image" className="space-y-6">
            <div className="bg-cosmic-light bg-opacity-10 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-cosmic-highlight mb-4">
                MidJourney / Ideogram Image Generation
              </h2>
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe the image you want to generate..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="min-h-[100px] bg-cosmic-dark border-cosmic-light text-white"
                />
                <Button
                  onClick={generateImage}
                  disabled={isGenerating || !imagePrompt.trim()}
                  className="bg-cosmic-accent hover:bg-cosmic-accent-hover"
                >
                  {isGenerating ? 'Generating...' : 'Generate Image'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video" className="space-y-6">
            <div className="bg-cosmic-light bg-opacity-10 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-cosmic-highlight mb-4">
                HeyGen / Sora Video Generation
              </h2>
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe the video scene you want to generate..."
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  className="min-h-[100px] bg-cosmic-dark border-cosmic-light text-white"
                />
                <Button
                  onClick={generateVideo}
                  disabled={isGenerating || !videoPrompt.trim()}
                  className="bg-cosmic-accent hover:bg-cosmic-accent-hover"
                >
                  {isGenerating ? 'Generating...' : 'Generate Video'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="space-y-6">
            <div className="bg-cosmic-light bg-opacity-10 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-cosmic-highlight mb-4">
                ElevenLabs Audio Generation
              </h2>
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe the audio you want to generate..."
                  value={audioPrompt}
                  onChange={(e) => setAudioPrompt(e.target.value)}
                  className="min-h-[100px] bg-cosmic-dark border-cosmic-light text-white"
                />
                <Button
                  onClick={generateAudio}
                  disabled={isGenerating || !audioPrompt.trim()}
                  className="bg-cosmic-accent hover:bg-cosmic-accent-hover"
                >
                  {isGenerating ? 'Generating...' : 'Generate Audio'}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Generated Media Preview */}
        {generatedMedia.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-cosmic-highlight">Generated Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedMedia.map((media) => (
                <div key={media.id} className="bg-cosmic-light bg-opacity-20 rounded-lg p-4">
                  <div className="aspect-video bg-cosmic-dark rounded mb-3 overflow-hidden">
                    {renderMediaPreview(media)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-cosmic-accent">{media.service}</p>
                    <p className="text-xs text-cosmic-light line-clamp-2">{media.prompt}</p>
                    <p className="text-xs text-cosmic-light">
                      {media.createdAt.toLocaleDateString()}
                    </p>
                    <Button
                      onClick={() => saveToLibrary(media)}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      Save to Library
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Media Library */}
        {mediaAssets.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-cosmic-highlight">Media Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mediaAssets.map((asset) => (
                <div key={asset.id} className="bg-cosmic-light bg-opacity-20 rounded-lg p-4">
                  <div className="aspect-video bg-cosmic-dark rounded mb-3 overflow-hidden">
                    {asset.media_type === 'image' && (
                      <img
                        src={asset.file_url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {asset.media_type === 'video' && (
                      <video src={asset.file_url} className="w-full h-full object-cover" controls />
                    )}
                    {asset.media_type === 'audio' && (
                      <div className="flex items-center justify-center h-full bg-cosmic-light bg-opacity-20">
                        <svg
                          className="h-16 w-16 text-cosmic-accent"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C10.896 2 10 2.896 10 4V12C8.896 12 8 12.896 8 14C8 15.104 8.896 16 10 16V20C10 21.104 10.896 22 12 22C13.104 22 14 21.104 14 20V16C15.104 16 16 15.104 16 14C16 12.896 15.104 12 14 12V4C14 2.896 13.104 2 12 2Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium truncate" title={asset.title}>
                      {asset.title}
                    </p>
                    <p className="text-xs text-cosmic-light">{asset.ai_service}</p>
                    <p className="text-xs text-cosmic-light">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => window.open(asset.file_url, '_blank')}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        View
                      </Button>
                      <Button
                        onClick={() => window.open(asset.file_url, '_blank')}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaStudio;
