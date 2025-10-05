import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Steps } from '@/components/ui/steps';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  MessageCircle,
  FileText,
  CreditCard,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Upload,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { Service, ServiceStatus } from '@/api/services';
import {
  ServiceMessage,
  getServiceMessages,
  createServiceMessage,
  SenderType,
} from '@/api/serviceMessages';
import {
  ServiceDeliverable,
  getServiceDeliverables,
  createServiceDeliverable,
  updateServiceDeliverable,
} from '@/api/serviceDeliverables';
import {
  ServiceFeedback,
  createServiceFeedback,
  hasClientSubmittedFeedback,
} from '@/api/serviceFeedback';
import { queryKnowledge } from '@/utils/rag';
import { useUser } from '@/context/UserContext';

interface ServiceCardProps {
  service: Service;
  onStatusUpdate: (serviceId: string, status: ServiceStatus) => void;
  onViewMessages?: () => void;
  compact?: boolean;
}

const getStatusColor = (status: ServiceStatus) => {
  switch (status) {
    case 'requested':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'in_progress':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
    case 'review':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
    case 'completed':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'archived':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
};

const getStatusIcon = (status: ServiceStatus) => {
  switch (status) {
    case 'requested':
      return <Clock className="w-4 h-4" />;
    case 'in_progress':
      return <AlertCircle className="w-4 h-4" />;
    case 'review':
      return <Eye className="w-4 h-4" />;
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'archived':
      return <Archive className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getServiceSteps = (
  currentStatus: ServiceStatus,
): Array<{
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'current' | 'completed';
}> => {
  const allSteps = [
    { id: 'requested', title: 'Requested', description: 'Service requested' },
    { id: 'in_progress', title: 'In Progress', description: 'Work in progress' },
    { id: 'review', title: 'Review', description: 'Ready for review' },
    { id: 'completed', title: 'Completed', description: 'Service completed' },
  ];

  const statusOrder = ['requested', 'in_progress', 'review', 'completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  return allSteps.map((step, index) => ({
    ...step,
    status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'pending',
  }));
};

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onStatusUpdate,
  onViewMessages,
  compact = false,
}) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<ServiceMessage[]>([]);
  const [deliverables, setDeliverables] = useState<ServiceDeliverable[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingDeliverables, setIsLoadingDeliverables] = useState(false);
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [hasFeedback, setHasFeedback] = useState(false);
  const [knowledgeSuggestions, setKnowledgeSuggestions] = useState<any[]>([]);

  React.useEffect(() => {
    if (user?.id) {
      checkExistingFeedback();
      loadKnowledgeSuggestions();
    }
  }, [service.id, user?.id]);

  const checkExistingFeedback = async () => {
    if (!user?.id) return;
    const result = await hasClientSubmittedFeedback(service.id, user.id);
    setHasFeedback(result.hasSubmitted);
  };

  const loadKnowledgeSuggestions = async () => {
    try {
      const result = await queryKnowledge(
        `${service.name} ${service.description || ''}`,
        undefined,
        {
          skipBudgetCheck: true,
          skipUsageLogging: true,
        },
      );

      if (result.success && result.results.length > 0) {
        setKnowledgeSuggestions(result.results.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading knowledge suggestions:', error);
    }
  };

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const result = await getServiceMessages(service.id);
      if (result.data && Array.isArray(result.data)) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadDeliverables = async () => {
    setIsLoadingDeliverables(true);
    try {
      const result = await getServiceDeliverables(service.id);
      if (result.data && Array.isArray(result.data)) {
        setDeliverables(result.data);
      }
    } catch (error) {
      console.error('Error loading deliverables:', error);
    } finally {
      setIsLoadingDeliverables(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    setIsSubmittingMessage(true);
    try {
      const result = await createServiceMessage({
        service_id: service.id,
        sender_id: user.id,
        sender_type: 'client',
        message: newMessage,
        attachments: [],
      });

      if (result.data) {
        setMessages((prev) => [...prev, result.data as ServiceMessage]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!user?.id) return;

    setIsSubmittingFeedback(true);
    try {
      const result = await createServiceFeedback({
        service_id: service.id,
        client_id: user.id,
        rating: feedbackRating,
        comment: feedbackComment,
        is_public: false,
      });

      if (result.data) {
        setHasFeedback(true);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleStatusChange = (newStatus: ServiceStatus) => {
    onStatusUpdate(service.id, newStatus);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canUpdateStatus = (currentStatus: ServiceStatus, newStatus: ServiceStatus) => {
    const statusFlow = {
      requested: ['in_progress'],
      in_progress: ['review'],
      review: ['completed'],
      completed: ['archived'],
      archived: [],
    };

    return statusFlow[currentStatus]?.includes(newStatus) || false;
  };

  if (compact) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-white">{service.name}</h3>
              <p className="text-sm text-cosmic-accent mt-1">
                {service.description || 'No description available'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(service.status)}>
                  {getStatusIcon(service.status)}
                  <span className="ml-1 capitalize">{service.status.replace('_', ' ')}</span>
                </Badge>
                <span className="text-xs text-cosmic-accent">
                  Updated {formatDate(service.created_at)}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onViewMessages}
                className="bg-white/5 border-white/20 hover:bg-white/10"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">{service.name}</CardTitle>
          <Badge className={getStatusColor(service.status)}>
            {getStatusIcon(service.status)}
            <span className="ml-1 capitalize">{service.status.replace('_', ' ')}</span>
          </Badge>
        </div>
        <p className="text-cosmic-accent">{service.description || 'No description available'}</p>
      </CardHeader>

      <CardContent>
        {/* Progress Tracker */}
        <div className="mb-6">
          <Steps
            steps={getServiceSteps(service.status)}
            currentStep={service.status}
            className="mb-4"
          />
        </div>

        {/* Service Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="text-cosmic-accent">Price:</span>
            <span className="text-white ml-2">
              ${service.price}/{service.billing_type === 'subscription' ? 'month' : 'project'}
            </span>
          </div>
          <div>
            <span className="text-cosmic-accent">Started:</span>
            <span className="text-white ml-2">
              {service.start_date ? formatDate(service.start_date) : 'Not started'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          {canUpdateStatus(service.status, 'in_progress') && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('in_progress')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Start Work
            </Button>
          )}
          {canUpdateStatus(service.status, 'review') && (
            <Button
              size="sm"
              onClick={() => handleStatusChange('review')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Submit for Review
            </Button>
          )}
          {service.status === 'completed' && !hasFeedback && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Star className="w-4 h-4 mr-2" />
                  Leave Feedback
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-cosmic-dark border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-white">Rate Your Experience</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-cosmic-accent">Rating</Label>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setFeedbackRating(star)}
                          className={`text-2xl ${
                            star <= feedbackRating ? 'text-yellow-400' : 'text-gray-400'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-cosmic-accent">Comments (Optional)</Label>
                    <Textarea
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Tell us about your experience..."
                      className="bg-white/10 border-white/20 text-white placeholder-cosmic-accent"
                    />
                  </div>
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmittingFeedback}
                    className="w-full bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark"
                  >
                    {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10">
            <TabsTrigger value="messages" className="data-[state=active]:bg-cosmic-accent">
              Messages
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="data-[state=active]:bg-cosmic-accent">
              Deliverables
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="data-[state=active]:bg-cosmic-accent">
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {messages.length === 0 ? (
                <p className="text-cosmic-accent text-center py-4">No messages yet</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.sender_type === 'client'
                        ? 'bg-cosmic-accent/20 ml-8'
                        : 'bg-white/10 mr-8'
                    }`}
                  >
                    <p className="text-white text-sm">{message.message}</p>
                    <p className="text-xs text-cosmic-accent mt-1">
                      {formatDate(message.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="bg-white/10 border-white/20 text-white placeholder-cosmic-accent"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSubmittingMessage || !newMessage.trim()}
                className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-cosmic-dark"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="space-y-4">
            {deliverables.length === 0 ? (
              <p className="text-cosmic-accent text-center py-4">No deliverables yet</p>
            ) : (
              deliverables.map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{deliverable.title}</h4>
                      <p className="text-cosmic-accent text-sm">{deliverable.description}</p>
                      <Badge className={`mt-2 ${getStatusColor(deliverable.status as any)}`}>
                        {deliverable.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {deliverable.file_url && (
                      <Button size="sm" variant="outline" className="bg-white/5">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                  {deliverable.feedback && (
                    <div className="mt-3 p-3 bg-white/10 rounded">
                      <p className="text-cosmic-accent text-sm">{deliverable.feedback}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          {/* Knowledge Tab */}
          <TabsContent value="knowledge" className="space-y-4">
            {knowledgeSuggestions.length === 0 ? (
              <p className="text-cosmic-accent text-center py-4">No related resources found</p>
            ) : (
              knowledgeSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <h4 className="text-white font-medium">{suggestion.metadata.title}</h4>
                  <p className="text-cosmic-accent text-sm mt-1">
                    {suggestion.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.metadata.source}
                    </Badge>
                    <span className="text-xs text-cosmic-accent">
                      Similarity: {Math.round(suggestion.similarity * 100)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
