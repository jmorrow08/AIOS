import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, Copy, CheckCircle, RotateCcw } from 'lucide-react';
import { rewritePrompt } from '@/utils/mediaServices';
import { TrackType } from '@/lib/types';

interface PromptRewriterProps {
  initialPrompt: string;
  context: 'image' | 'audio' | 'video';
  trackType?: TrackType;
  onPromptUpdate: (newPrompt: string) => void;
  className?: string;
}

const PromptRewriter: React.FC<PromptRewriterProps> = ({
  initialPrompt,
  context,
  trackType,
  onPromptUpdate,
  className = '',
}) => {
  const [originalPrompt, setOriginalPrompt] = useState(initialPrompt);
  const [rewrittenPrompt, setRewrittenPrompt] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState('');
  const [cost, setCost] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Context-specific suggestions
  const getContextSuggestions = () => {
    switch (context) {
      case 'image':
        return [
          'Add lighting and atmosphere details',
          'Specify composition and framing',
          'Include style and mood descriptors',
          'Add visual details for better results',
        ];
      case 'audio':
        return [
          'Use natural speech patterns',
          'Add emotional delivery cues',
          'Include pronunciation guidance',
          'Specify pacing and tone',
        ];
      case 'video':
        return [
          'Describe visual storytelling elements',
          'Specify pacing and scene composition',
          'Include cinematic techniques',
          'Add production quality details',
        ];
      default:
        return [];
    }
  };

  const handleRewrite = async () => {
    if (!originalPrompt.trim()) {
      setError('Please enter a prompt to rewrite');
      return;
    }

    setIsRewriting(true);
    setError('');
    setCost(null);

    try {
      const result = await rewritePrompt(originalPrompt, context);

      if (result.success && result.rewrittenPrompt) {
        setRewrittenPrompt(result.rewrittenPrompt);
        setCost(result.cost || null);
      } else {
        setError(result.error || 'Failed to rewrite prompt');
      }
    } catch (err) {
      setError('An error occurred while rewriting the prompt');
    } finally {
      setIsRewriting(false);
    }
  };

  const handleAcceptRewrite = () => {
    if (rewrittenPrompt) {
      setOriginalPrompt(rewrittenPrompt);
      onPromptUpdate(rewrittenPrompt);
      setRewrittenPrompt('');
      setCost(null);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(rewrittenPrompt || originalPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleReset = () => {
    setOriginalPrompt(initialPrompt);
    setRewrittenPrompt('');
    setError('');
    setCost(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-cosmic-light bg-opacity-10 border-cosmic-light">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-cosmic-highlight">
            <Sparkles className="w-5 h-5" />
            AI Prompt Rewriter
            <Badge variant="secondary" className="ml-auto">
              {context.charAt(0).toUpperCase() + context.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Original Prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cosmic-light">Original Prompt</label>
            <Textarea
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              placeholder={`Enter your ${context} prompt here...`}
              className="bg-cosmic-dark border-cosmic-light text-white min-h-[100px]"
            />
          </div>

          {/* Rewrite Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleRewrite}
              disabled={isRewriting || !originalPrompt.trim()}
              className="bg-cosmic-accent hover:bg-cosmic-accent-hover flex-1"
            >
              {isRewriting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Rewrite with AI
                </>
              )}
            </Button>

            {originalPrompt !== initialPrompt && (
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="border-cosmic-light text-cosmic-light hover:bg-cosmic-light hover:bg-opacity-20"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-500 bg-red-500 bg-opacity-20 text-red-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Cost Display */}
          {cost && <div className="text-sm text-cosmic-accent">Cost: ${cost.toFixed(4)}</div>}

          {/* Rewritten Prompt */}
          {rewrittenPrompt && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-cosmic-light flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                AI-Enhanced Prompt
              </label>

              <Card className="bg-green-500 bg-opacity-10 border-green-500">
                <CardContent className="p-3">
                  <Textarea
                    value={rewrittenPrompt}
                    readOnly
                    className="bg-transparent border-none text-white resize-none min-h-[100px]"
                  />
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptRewrite}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Accept Rewrite
                </Button>

                <Button
                  onClick={handleCopyToClipboard}
                  size="sm"
                  variant="outline"
                  className="border-cosmic-light text-cosmic-light"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* Context Suggestions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-cosmic-light">💡 Enhancement Tips</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getContextSuggestions().map((suggestion, index) => (
                <div
                  key={index}
                  className="text-xs text-cosmic-light bg-cosmic-light bg-opacity-10 rounded px-2 py-1"
                >
                  • {suggestion}
                </div>
              ))}
            </div>
          </div>

          {/* Context-Specific Help */}
          <div className="text-xs text-cosmic-light bg-cosmic-dark rounded p-3">
            <strong>{context.charAt(0).toUpperCase() + context.slice(1)} Generation Tips:</strong>
            {context === 'image' && (
              <ul className="mt-1 space-y-1">
                <li>• Be specific about lighting, colors, and composition</li>
                <li>• Mention art styles, artists, or reference images</li>
                <li>• Include camera angles and perspectives</li>
                <li>• Specify resolution and aspect ratio preferences</li>
              </ul>
            )}
            {context === 'audio' && (
              <ul className="mt-1 space-y-1">
                <li>• Describe the speaker's emotion and tone</li>
                <li>• Specify speaking pace and emphasis</li>
                <li>• Include pronunciation for difficult words</li>
                <li>• Mention background music or sound effects</li>
              </ul>
            )}
            {context === 'video' && (
              <ul className="mt-1 space-y-1">
                <li>• Describe camera movements and transitions</li>
                <li>• Specify scene duration and pacing</li>
                <li>• Include visual effects and color grading</li>
                <li>• Mention target audience and platform</li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptRewriter;
