/**
 * Sangam Embed API Route
 * Processes unembedded messages and generates embeddings
 */

import { NextRequest, NextResponse } from 'next/server';
import { sangamService } from '@/lib/sangam/sangam';
import { getCurrentUserAction } from '@/app/actions/auth';
import type { EmbeddingRequest, EmbeddingResponse } from '@/lib/types/sangam';

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
    const body: EmbeddingRequest = await request.json();
    const { tenantId, batchSize } = body;

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

    // Process unembedded messages
    console.log(`Processing embeddings for tenant: ${tenantId}`);
    const result = await sangamService.processUnembeddedMessages(tenantId, batchSize);

    const response: EmbeddingResponse = {
      success: result.processedCount > 0 || result.processedCount === 0,
      message: result.processedCount > 0 
        ? `Successfully processed ${result.processedCount} messages`
        : 'No unembedded messages found',
      processedCount: result.processedCount,
      error: result.error
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in embed API route:', error);
    
    const response: EmbeddingResponse = {
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user for authentication and tenant validation
    const currentUser = await getCurrentUserAction();
    if (!currentUser?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated or no tenant found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    // Validate tenant access
    if (!tenantId || tenantId !== currentUser.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing tenant ID' },
        { status: 400 }
      );
    }

    // Get embedding statistics
    const stats = await sangamService.getEmbeddingStats(tenantId);

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting embedding stats:', error);
    
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
