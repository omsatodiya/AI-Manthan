import { NextRequest, NextResponse } from 'next/server';
import { sangamService } from '@/lib/sangam/sangam';
import { getCurrentUserAction } from '@/app/actions/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser?.tenantId) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated or no tenant found' },
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

    if (tenantId !== currentUser.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to specified tenant' },
        { status: 403 }
      );
    }

    const result = await sangamService.processMessageOnUpload(tenantId, messageId);
    return NextResponse.json(
      {
        success: !result.error,
        processedCount: result.processedCount,
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
