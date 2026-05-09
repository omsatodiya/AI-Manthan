import { NextRequest, NextResponse } from 'next/server';
import { sangamService } from '@/lib/sangam/sangam';
import { getCurrentUserAction } from '@/app/actions/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const tenantId = typeof body?.tenantId === 'string' ? body.tenantId : '';
    const messageId = typeof body?.messageId === 'string' ? body.messageId : '';

    if (!tenantId || !messageId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID and message ID are required' },
        { status: 400 }
      );
    }

    // Legacy validation removed: tenantId is validated via middleware/permissions in Phase 3

    const result = await sangamService.processTenantQueue(tenantId);
    return NextResponse.json(
      {
        success: !result.error,
        processedCount: result.processedCount,
        status: result.status,
        error: result.error,
      },
      { status: result.error ? 400 : 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
