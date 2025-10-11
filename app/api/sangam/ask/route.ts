/**
 * Sangam Ask API Route
 * Handles user queries and returns AI-generated responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { sangamService } from '@/lib/sangam/sangam';
import { getCurrentUserAction } from '@/app/actions/auth';
import type { SangamQueryRequest, SangamQueryResponse } from '@/lib/types/sangam';

export async function POST(request: NextRequest) {
  try {
    // Get current user for authentication and tenant validation
    const currentUser = await getCurrentUserAction();
    if (!currentUser?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated or no tenant found' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: SangamQueryRequest = await request.json();
    const { tenantId, question, maxResults, similarityThreshold } = body;

    // Validate tenant access
    if (tenantId !== currentUser.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to specified tenant' },
        { status: 403 }
      );
    }

    // Validate inputs
    if (!tenantId || !question?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID and question are required' },
        { status: 400 }
      );
    }

    // Process the query
    console.log(`Processing Sangam query for tenant: ${tenantId}`);
    const result: SangamQueryResponse = await sangamService.processQuery({
      tenantId,
      question: question.trim(),
      maxResults,
      similarityThreshold
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in ask API route:', error);
    
    const response: SangamQueryResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// Special endpoint for generating summaries
export async function PUT(request: NextRequest) {
  try {
    // Get current user for authentication and tenant validation
    const currentUser = await getCurrentUserAction();
    if (!currentUser?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated or no tenant found' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { tenantId, timeRange, maxResults, infoType } = body;

    // Validate tenant access
    if (tenantId !== currentUser.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to specified tenant' },
        { status: 403 }
      );
    }

    // Validate inputs
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    let result: SangamQueryResponse;

    // Handle different types of requests
    if (infoType && ['decisions', 'deadlines', 'documents', 'action-items'].includes(infoType)) {
      // Extract specific information
      console.log(`Extracting ${infoType} for tenant: ${tenantId}`);
      result = await sangamService.extractInformation(tenantId, infoType, maxResults);
    } else if (body.query && body.searchType === 'documents') {
      // Search specifically for documents
      console.log(`Searching documents for tenant: ${tenantId}`);
      result = await sangamService.searchDocuments(tenantId, body.query, maxResults);
    } else {
      // Generate summary
      console.log(`Generating summary for tenant: ${tenantId}`);
      result = await sangamService.generateSummary(tenantId, timeRange, maxResults);
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in summary API route:', error);
    
    const response: SangamQueryResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}
