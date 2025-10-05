import React, { useState } from 'react';
import { Document, QnAResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, ExternalLink, Loader2, MessageCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QnAWidgetProps {
  documents: Document[];
  onAskQuestion: (question: string) => Promise<QnAResponse>;
  className?: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: QnAResponse['sources'];
}

const QnAWidget: React.FC<QnAWidgetProps> = ({ documents, onAskQuestion, className }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle asking a question
  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setIsLoading(true);

    try {
      const response = await onAskQuestion(question);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press in input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  // Get document by ID
  const getDocumentById = (id: string) => {
    return documents.find((doc) => doc.id === id);
  };

  // Clear conversation
  const handleClearConversation = () => {
    setMessages([]);
  };

  return (
    <Card className={cn('bg-cosmic-dark border-cosmic-light', className)}>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cosmic-accent" />
            <CardTitle className="text-white text-lg">AI Knowledge Assistant</CardTitle>
            <Badge variant="outline" className="text-xs text-cosmic-accent border-cosmic-accent">
              {documents.length} docs
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearConversation();
                }}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Clear
              </Button>
            )}
            <MessageCircle
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                isExpanded && 'rotate-180',
              )}
            />
          </div>
        </div>

        {!isExpanded && (
          <p className="text-sm text-gray-400 mt-2">
            Ask questions about your knowledge base and get AI-powered answers
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Messages Area */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  No questions yet. Ask me anything about your knowledge base!
                </p>
                <p className="text-xs mt-2 opacity-75">
                  I can help with SOPs, templates, knowledge articles, and more.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    message.type === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  {message.type === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-cosmic-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[80%] rounded-lg px-4 py-3',
                      message.type === 'user'
                        ? 'bg-cosmic-accent text-white'
                        : 'bg-cosmic-light border border-cosmic-accent/20',
                    )}
                  >
                    <div
                      className={cn(
                        'text-sm leading-relaxed',
                        message.type === 'user' ? 'text-white' : 'text-gray-200',
                      )}
                    >
                      {message.content}
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-cosmic-accent/20">
                        <div className="text-xs text-gray-400 mb-2">Sources:</div>
                        <div className="space-y-1">
                          {message.sources.map((source, index) => {
                            const doc = getDocumentById(source.id);
                            return (
                              <div key={index} className="flex items-start gap-2">
                                <FileText className="w-3 h-3 text-cosmic-accent mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-cosmic-accent font-medium truncate">
                                    {source.title}
                                  </div>
                                  <div className="text-xs text-gray-400 truncate">
                                    {source.excerpt}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="text-xs opacity-60 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {message.type === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-cosmic-accent flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-cosmic-light border border-cosmic-accent/20 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cosmic-accent" />
                    <span className="text-sm text-gray-200">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your knowledge base..."
              className="flex-1 bg-cosmic-light text-white border-cosmic-accent placeholder-gray-400"
              disabled={isLoading}
            />
            <Button
              onClick={handleAskQuestion}
              disabled={isLoading || !question.trim()}
              className="bg-cosmic-accent hover:bg-cosmic-highlight px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="text-xs text-gray-400 text-center">
            💡 Try asking: "How do I create a new SOP?" or "What are the best practices for..."
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default QnAWidget;
