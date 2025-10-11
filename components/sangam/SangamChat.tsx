/**
 * Sangam Chat Component
 * Optional UI component for testing Sangam AI functionality
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, MessageSquare, FileText, Calendar, CheckSquare, Brain } from 'lucide-react';
import { useTenant } from '@/contexts/tenant-context';
import { toast } from 'sonner';

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

interface EmbeddingStats {
  totalMessages: number;
  embeddedMessages: number;
  unembeddedMessages: number;
  lastEmbeddingCreated: string | null;
}

export function SangamChat() {
  const { tenantId } = useTenant();
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<SangamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [embeddingLoading, setEmbeddingLoading] = useState(false);
  const [stats, setStats] = useState<EmbeddingStats | null>(null);

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
          maxResults: 10,
          similarityThreshold: 0.5
        })
      });

      const data: SangamResponse = await res.json();
      setResponse(data);

      if (data.success) {
        toast.success('Sangam responded successfully!');
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

  const handleGenerateSummary = async (timeRange?: string) => {
    if (!tenantId) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/sangam/ask', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          timeRange,
          maxResults: 20
        })
      });

      const data: SangamResponse = await res.json();
      setResponse(data);

      if (data.success) {
        toast.success('Summary generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractInfo = async (infoType: 'decisions' | 'deadlines' | 'documents' | 'action-items') => {
    if (!tenantId) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/sangam/ask', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          infoType,
          maxResults: 15
        })
      });

      const data: SangamResponse = await res.json();
      setResponse(data);

      if (data.success) {
        toast.success(`${infoType.replace('-', ' ')} extracted successfully!`);
      } else {
        toast.error(data.error || 'Failed to extract information');
      }
    } catch (error) {
      console.error('Error extracting info:', error);
      toast.error('Failed to extract information');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessEmbeddings = async () => {
    if (!tenantId) return;

    setEmbeddingLoading(true);

    try {
      const res = await fetch('/api/sangam/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          batchSize: 100
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`Processed ${data.processedCount} messages`);
        await loadStats(); // Refresh stats
      } else {
        toast.error(data.error || 'Failed to process embeddings');
      }
    } catch (error) {
      console.error('Error processing embeddings:', error);
      toast.error('Failed to process embeddings');
    } finally {
      setEmbeddingLoading(false);
    }
  };

  const loadStats = async () => {
    if (!tenantId) return;

    try {
      const res = await fetch(`/api/sangam/embed?tenantId=${tenantId}`);
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load stats on component mount
  React.useEffect(() => {
    if (tenantId) {
      loadStats();
    }
  }, [tenantId]);

  if (!tenantId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sangam AI Assistant
          </CardTitle>
          <CardDescription>
            AI-powered conversation summarization and Q&A
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please select a tenant to use Sangam.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sangam AI Assistant
          </CardTitle>
          <CardDescription>
            Ask questions about your team's conversations or generate summaries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Embedding Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalMessages}</div>
                <div className="text-sm text-muted-foreground">Total Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.embeddedMessages}</div>
                <div className="text-sm text-muted-foreground">Embedded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.unembeddedMessages}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  {stats.lastEmbeddingCreated 
                    ? new Date(stats.lastEmbeddingCreated).toLocaleDateString()
                    : 'Never'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Last Processed</div>
              </div>
            </div>
          )}

          {/* Process Embeddings Button */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Process New Messages</h3>
              <p className="text-sm text-muted-foreground">
                Generate embeddings for unprocessed messages
              </p>
            </div>
            <Button 
              onClick={handleProcessEmbeddings} 
              disabled={embeddingLoading}
              variant="outline"
            >
              {embeddingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Process'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ask" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ask">Ask Question</TabsTrigger>
          <TabsTrigger value="summarize">Summarize</TabsTrigger>
          <TabsTrigger value="extract">Extract Info</TabsTrigger>
        </TabsList>

        <TabsContent value="ask" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Ask a Question
              </CardTitle>
              <CardDescription>
                Ask Sangam about your team's conversations and decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g., What was decided in the last meeting? What documents were shared this week?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
              />
              <Button 
                onClick={handleAskQuestion} 
                disabled={loading || !question.trim()}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Ask Sangam
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summarize" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generate Summary
              </CardTitle>
              <CardDescription>
                Get a summary of recent conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button 
                  onClick={() => handleGenerateSummary('this week')}
                  disabled={loading}
                  variant="outline"
                >
                  This Week
                </Button>
                <Button 
                  onClick={() => handleGenerateSummary('this month')}
                  disabled={loading}
                  variant="outline"
                >
                  This Month
                </Button>
                <Button 
                  onClick={() => handleGenerateSummary()}
                  disabled={loading}
                  variant="outline"
                >
                  All Recent
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extract" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Extract Information
              </CardTitle>
              <CardDescription>
                Extract specific types of information from conversations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button 
                  onClick={() => handleExtractInfo('decisions')}
                  disabled={loading}
                  variant="outline"
                  className="flex flex-col h-auto py-3"
                >
                  <CheckSquare className="h-4 w-4 mb-1" />
                  <span className="text-xs">Decisions</span>
                </Button>
                <Button 
                  onClick={() => handleExtractInfo('deadlines')}
                  disabled={loading}
                  variant="outline"
                  className="flex flex-col h-auto py-3"
                >
                  <Calendar className="h-4 w-4 mb-1" />
                  <span className="text-xs">Deadlines</span>
                </Button>
                <Button 
                  onClick={() => handleExtractInfo('documents')}
                  disabled={loading}
                  variant="outline"
                  className="flex flex-col h-auto py-3"
                >
                  <FileText className="h-4 w-4 mb-1" />
                  <span className="text-xs">Documents</span>
                </Button>
                <Button 
                  onClick={() => handleExtractInfo('action-items')}
                  disabled={loading}
                  variant="outline"
                  className="flex flex-col h-auto py-3"
                >
                  <CheckSquare className="h-4 w-4 mb-1" />
                  <span className="text-xs">Action Items</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Response Display */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Sangam's Response
              {response.processingTime && (
                <Badge variant="secondary" className="ml-auto">
                  {response.processingTime}ms
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {response.success ? (
              <>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{response.answer}</p>
                </div>
                
                {response.sources && response.sources.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Sources ({response.sources.length})</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {response.sources.map((source, index) => (
                        <div key={source.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline">
                              Similarity: {(source.similarity * 100).toFixed(1)}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(source.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{source.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-red-600">
                <p>Error: {response.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
