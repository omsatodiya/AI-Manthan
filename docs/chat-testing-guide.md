# Chat Feature Testing Guide

## Prerequisites

1. **Database Setup**: Ensure conversations and messages tables exist with proper RLS policies
2. **Test Users**: Create at least 2 test users in different tenants
3. **Connections**: Users must be connected (accepted connections) to chat
4. **Environment**: Development server running with Supabase configured

## Test Scenarios

### 1. Basic Chat Functionality

#### Test 1.1: Send and Receive Messages
**Steps:**
1. Login as User A
2. Navigate to `/chat`
3. Click on a conversation with User B
4. Send a message: "Hello, this is a test message"
5. Verify message appears immediately (optimistic UI)
6. Login as User B in another browser/incognito
7. Navigate to the same conversation
8. Verify User B sees the message

**Expected Results:**
- Message appears immediately for sender
- Message appears for receiver
- Message shows correct sender name
- Message shows correct timestamp
- Read status updates correctly

#### Test 1.2: Message Validation
**Steps:**
1. Try sending empty message
2. Try sending very long message (>1000 characters)
3. Try sending message with special characters
4. Try sending message with emojis

**Expected Results:**
- Empty messages are rejected
- Long messages are accepted
- Special characters and emojis work correctly

### 2. Cursor-Based Pagination

#### Test 2.1: Initial Message Load
**Steps:**
1. Create a conversation with 50+ messages
2. Open the conversation
3. Check browser network tab

**Expected Results:**
- Only latest 40 messages load initially
- API call: `GET /api/messages?conversationId=X&limit=40`
- Messages are ordered newest first
- No `before` parameter in first request

#### Test 2.2: Scroll Pagination
**Steps:**
1. Scroll to the top of the chat
2. Watch for loading indicator
3. Check browser network tab
4. Verify older messages appear

**Expected Results:**
- Loading indicator appears when scrolling to top
- API call: `GET /api/messages?conversationId=X&limit=20&before=timestamp`
- Older messages are prepended to the list
- Scroll position is maintained

#### Test 2.3: Pagination Edge Cases
**Steps:**
1. Test with conversation that has exactly 40 messages
2. Test with conversation that has 0 messages
3. Test rapid scrolling to top multiple times

**Expected Results:**
- No pagination when exactly at limit
- Empty state shows correctly
- Duplicate requests are prevented

### 3. Real-Time Updates

#### Test 3.1: Live Message Updates
**Steps:**
1. Open conversation in two browser windows (User A and User B)
2. Send message from User A
3. Observe User B's window

**Expected Results:**
- Message appears in User B's window immediately
- No page refresh required
- Message appears at bottom of chat
- Real-time subscription is working

#### Test 3.2: Multiple Users
**Steps:**
1. Open conversation with 3+ users
2. Send messages from different users
3. Verify all users see all messages

**Expected Results:**
- All messages appear for all participants
- Messages are ordered correctly by timestamp
- No duplicate messages

### 4. Optimistic UI and Error Handling

#### Test 4.1: Optimistic Message Sending
**Steps:**
1. Send a message
2. Immediately disconnect internet
3. Observe message behavior

**Expected Results:**
- Message appears immediately (optimistic)
- Message shows pending state
- Message is removed when send fails
- Error toast appears

#### Test 4.2: Network Recovery
**Steps:**
1. Send message while offline
2. Reconnect internet
3. Send another message

**Expected Results:**
- Failed message is removed
- New message sends successfully
- No duplicate messages

### 5. Performance Testing

#### Test 5.1: Large Message Volume
**Steps:**
1. Create conversation with 1000+ messages
2. Open conversation
3. Scroll through messages
4. Monitor browser performance

**Expected Results:**
- Initial load is fast (<2 seconds)
- Scrolling is smooth
- Memory usage is reasonable
- No browser crashes

#### Test 5.2: Concurrent Users
**Steps:**
1. Open same conversation in 5+ browser windows
2. Send messages simultaneously
3. Monitor real-time updates

**Expected Results:**
- All windows update correctly
- No performance degradation
- Messages appear in correct order

### 6. Error Scenarios

#### Test 6.1: Invalid Conversation Access
**Steps:**
1. Try to access conversation user is not part of
2. Try to access non-existent conversation

**Expected Results:**
- Access denied error
- Proper error message displayed
- User redirected appropriately

#### Test 6.2: Database Errors
**Steps:**
1. Temporarily disable Supabase
2. Try to send message
3. Try to load messages

**Expected Results:**
- Graceful error handling
- User-friendly error messages
- Retry functionality works

## Testing Tools

### Browser DevTools
- **Network Tab**: Monitor API calls and responses
- **Console**: Check for JavaScript errors
- **Performance Tab**: Monitor rendering performance
- **Application Tab**: Check local storage and session storage

### Supabase Dashboard
- **Table Editor**: Verify data is stored correctly
- **Logs**: Monitor database queries and errors
- **Realtime**: Check subscription status

### Test Data Generation
```sql
-- Create test conversation
INSERT INTO conversations (user_a, user_b) 
VALUES ('user-a-uuid', 'user-b-uuid');

-- Create test messages
INSERT INTO messages (conversation_id, sender_id, content, created_at)
SELECT 
  'conversation-uuid',
  'user-a-uuid',
  'Test message ' || generate_series,
  now() - (generate_series || ' minutes')::interval
FROM generate_series(1, 100);
```

## Common Issues and Solutions

### Issue: Messages not appearing
**Check:**
- RLS policies are correct
- User is participant in conversation
- Real-time subscription is active
- Network connection is stable

### Issue: Pagination not working
**Check:**
- `before` parameter is correct timestamp format
- Database index exists on `(conversation_id, created_at DESC)`
- API route is returning correct `nextCursor`

### Issue: Real-time updates not working
**Check:**
- Supabase realtime is enabled
- User is authenticated
- Subscription is properly set up
- No firewall blocking WebSocket connections

### Issue: Performance problems
**Check:**
- Database indexes are optimized
- Message limit is reasonable (40 initial, 20 for pagination)
- No memory leaks in React components
- Efficient re-rendering

## Automated Testing

### Unit Tests
```typescript
// Test pagination hook
describe('useMessagePagination', () => {
  it('should load initial messages', async () => {
    // Test implementation
  });
  
  it('should handle pagination correctly', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
// Test API endpoints
describe('Messages API', () => {
  it('should fetch messages with pagination', async () => {
    // Test implementation
  });
  
  it('should create new messages', async () => {
    // Test implementation
  });
});
```

### E2E Tests
```typescript
// Test complete chat flow
describe('Chat Feature', () => {
  it('should allow users to chat', async () => {
    // Test implementation
  });
});
```

## Performance Benchmarks

### Expected Performance
- **Initial Load**: < 2 seconds for 40 messages
- **Pagination**: < 1 second for 20 older messages
- **Real-time Updates**: < 500ms for new messages
- **Memory Usage**: < 50MB for 1000 messages
- **Scroll Performance**: 60fps smooth scrolling

### Monitoring
- Use browser performance tools
- Monitor Supabase query performance
- Check network request timing
- Monitor memory usage over time

## Test Checklist

- [ ] Basic message sending/receiving
- [ ] Message validation
- [ ] Cursor-based pagination
- [ ] Scroll behavior
- [ ] Real-time updates
- [ ] Optimistic UI
- [ ] Error handling
- [ ] Performance with large volumes
- [ ] Multiple users
- [ ] Network resilience
- [ ] Mobile responsiveness
- [ ] Accessibility compliance
