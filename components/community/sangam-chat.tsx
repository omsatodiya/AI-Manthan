/**
 * Sangam Chat Component for Community Sidebar
 * Compact AI assistant interface for direct interaction
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, Send, MessageSquare, FileText, Calendar, CheckSquare, X } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface SangamResponse {
  success: boolean;
  answer?: string;
  sources?: Array<{
    id: string;
    chatId: string;
    content: string;
    similarity: number;
    createdAt: string;
  }>;
  error?: string;
  processingTime?: number;
}

interface SangamChatProps {
  tenantId?: string;
}

export function SangamChat({ tenantId }: SangamChatProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<SangamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [embeddingStats, setEmbeddingStats] = useState<{
    totalMessages: number;
    embeddedMessages: number;
    unembeddedMessages: number;
  } | null>(null);

  const handleAskQuestion = async () => {
    if (!question.trim() || !tenantId) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/sangam/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          question: question.trim(),
          maxResults: 50,
          similarityThreshold: 0.01
        })
      });

      const data: SangamResponse = await res.json();
      setResponse(data);

      if (data.success) {
        toast.success('Sangam responded!');
        setIsExpanded(true);
      } else {
        toast.error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error asking question:', error);
      toast.error('Failed to ask question');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action: 'summary' | 'decisions' | 'deadlines' | 'documents' | 'action-items') => {
    if (!tenantId) return;

    setLoading(true);
    setResponse(null);

    try {
      let requestBody: any = {
        tenantId,
        maxResults: 8
      };

      if (action === 'summary') {
        requestBody.timeRange = 'recent';
        requestBody.maxResults = 10;
      } else if (action === 'documents') {
        requestBody.searchType = 'documents';
        requestBody.query = 'Find all documents and files shared in conversations';
      } else {
        requestBody.infoType = action;
      }

      const res = await fetch('/api/sangam/ask', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data: SangamResponse = await res.json();
      setResponse(data);

      if (data.success) {
        toast.success(`${action.replace('-', ' ')} retrieved!`);
        setIsExpanded(true);
      } else {
        toast.error(data.error || 'Failed to get information');
      }
    } catch (error) {
      console.error('Error getting information:', error);
      toast.error('Failed to get information');
    } finally {
      setLoading(false);
    }
  };

  const clearResponse = () => {
    setResponse(null);
    setQuestion('');
    setIsExpanded(false);
  };

  // Load embedding stats on mount
  React.useEffect(() => {
    if (tenantId) {
      fetch(`/api/sangam/embed?tenantId=${tenantId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setEmbeddingStats(data.stats);
          }
        })
        .catch(console.error);
    }
  }, [tenantId]);

  if (!tenantId) {
    return (
      <div className="p-3 bg-muted/50 rounded-lg border border-border">
        <p className="text-xs font-sans text-muted-foreground text-center">
          Select a tenant to use Sangam
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Embedding Status */}
      {embeddingStats && embeddingStats.unembeddedMessages > 0 && (
        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs font-sans text-yellow-700 dark:text-yellow-300 mb-2">
            {embeddingStats.unembeddedMessages} messages need processing for better AI responses
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch('/api/sangam/embed', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tenantId, batchSize: 50 })
                });
                const data = await res.json();
                if (data.success) {
                  toast.success(`Processed ${data.processedCount} messages`);
                  // Refresh stats
                  const statsRes = await fetch(`/api/sangam/embed?tenantId=${tenantId}`);
                  const statsData = await statsRes.json();
                  if (statsData.success) {
                    setEmbeddingStats(statsData.stats);
                  }
                } else {
                  toast.error(data.error || 'Failed to process messages');
                }
              } catch (error) {
                toast.error('Failed to process messages');
              }
            }}
            className="w-full text-xs h-6"
          >
            Process Messages
          </Button>
        </div>
      )}

      {/* Compact Input */}
      <div className="flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask Sangam..."
          className="flex-1 text-xs font-sans"
          onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
          disabled={loading}
        />
        <Button
          size="sm"
          onClick={handleAskQuestion}
          disabled={loading || !question.trim()}
          className="px-2"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('summary')}
          disabled={loading}
          className="text-xs h-7 flex items-center gap-1"
        >
          <FileText className="h-3 w-3" />
          Summary
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('decisions')}
          disabled={loading}
          className="text-xs h-7 flex items-center gap-1"
        >
          <CheckSquare className="h-3 w-3" />
          Decisions
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('deadlines')}
          disabled={loading}
          className="text-xs h-7 flex items-center gap-1"
        >
          <Calendar className="h-3 w-3" />
          Deadlines
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleQuickAction('documents')}
          disabled={loading}
          className="text-xs h-7 flex items-center gap-1"
        >
          <MessageSquare className="h-3 w-3" />
          Files
        </Button>
      </div>

      {/* Response Display */}
      {response && (
        <Card className="border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold font-sans text-foreground">Sangam</span>
                {response.processingTime && (
                  <Badge variant="secondary" className="text-xs">
                    {response.processingTime}ms
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearResponse}
                className="h-5 w-5 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {response.success ? (
              <div className="space-y-2">
                <div className="text-xs font-sans text-foreground leading-relaxed prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-xs">{children}</li>,
                      code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      blockquote: ({ children }) => <blockquote className="border-l-2 border-muted pl-2 italic text-muted-foreground">{children}</blockquote>,
                      h1: ({ children }) => <h1 className="text-sm font-bold mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xs font-bold mb-1">{children}</h3>,
                    }}
                  >
                    {response.answer || ''}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="text-xs font-sans text-destructive">
                Error: {response.error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expand/Collapse Button */}
      {response && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-xs font-sans"
        >
          {isExpanded ? 'Show Less' : 'Show More'}
        </Button>
      )}
    </div>
  );
}
