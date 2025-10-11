# Manual Testing Checklist for Chat Feature

## Pre-Test Setup

### 1. Environment Setup
- [ ] Development server is running (`npm run dev`)
- [ ] Supabase is configured and connected
- [ ] Database tables exist (conversations, messages, users, connections)
- [ ] RLS policies are enabled and working
- [ ] Real-time subscriptions are enabled in Supabase

### 2. Test Data Setup
- [ ] Run `scripts/setup-test-chat-data.sql` in Supabase SQL Editor
- [ ] Verify test users exist in auth.users table
- [ ] Verify test connections are accepted
- [ ] Verify test conversation exists
- [ ] Verify test messages exist (100+ messages)

### 3. Test Users
- [ ] User A: testuserA@example.com (ID: 11111111-1111-1111-1111-111111111111)
- [ ] User B: testuserB@example.com (ID: 22222222-2222-2222-2222-222222222222)
- [ ] User C: testuserC@example.com (ID: 33333333-3333-3333-3333-333333333333)

## Test Scenarios

### Scenario 1: Basic Chat Functionality

#### Test 1.1: Login and Navigation
- [ ] Login as User A
- [ ] Navigate to `/chat`
- [ ] Verify conversation list loads
- [ ] Verify test conversation appears
- [ ] Click on test conversation
- [ ] Verify chat interface loads

#### Test 1.2: Send Message
- [ ] Type message: "Hello, this is a test message"
- [ ] Press Enter or click Send button
- [ ] Verify message appears immediately (optimistic UI)
- [ ] Verify message shows correct sender name
- [ ] Verify message shows correct timestamp
- [ ] Verify message shows pending state initially

#### Test 1.3: Receive Message
- [ ] Open another browser window/incognito
- [ ] Login as User B
- [ ] Navigate to same conversation
- [ ] Verify User A's message appears
- [ ] Verify message is not marked as pending
- [ ] Send reply: "Hi! I received your message"
- [ ] Switch back to User A's window
- [ ] Verify User B's message appears in real-time

### Scenario 2: Cursor-Based Pagination

#### Test 2.1: Initial Load
- [ ] Open conversation with 100+ messages
- [ ] Check browser Network tab
- [ ] Verify API call: `GET /api/messages?conversationId=X&limit=40`
- [ ] Verify only latest 40 messages load
- [ ] Verify messages are ordered newest first
- [ ] Verify no `before` parameter in first request

#### Test 2.2: Scroll Pagination
- [ ] Scroll to top of chat
- [ ] Verify loading indicator appears
- [ ] Check browser Network tab
- [ ] Verify API call: `GET /api/messages?conversationId=X&limit=20&before=timestamp`
- [ ] Verify older messages are prepended
- [ ] Verify scroll position is maintained
- [ ] Verify loading indicator disappears

#### Test 2.3: Multiple Pagination Requests
- [ ] Scroll to top multiple times
- [ ] Verify each request loads 20 more messages
- [ ] Verify no duplicate messages
- [ ] Verify messages are in correct chronological order
- [ ] Verify pagination stops when no more messages

### Scenario 3: Real-Time Updates

#### Test 3.1: Live Message Updates
- [ ] Open conversation in two browser windows
- [ ] Send message from User A
- [ ] Verify message appears in User B's window immediately
- [ ] Verify no page refresh required
- [ ] Verify message appears at bottom of chat
- [ ] Verify real-time subscription is working

#### Test 3.2: Multiple Messages
- [ ] Send 5 messages rapidly from User A
- [ ] Verify all messages appear in User B's window
- [ ] Verify messages are in correct order
- [ ] Verify no messages are lost
- [ ] Verify no duplicate messages

### Scenario 4: Optimistic UI and Error Handling

#### Test 4.1: Optimistic Message Sending
- [ ] Send a message
- [ ] Immediately disconnect internet (or use browser dev tools)
- [ ] Verify message appears immediately (optimistic)
- [ ] Verify message shows pending state
- [ ] Reconnect internet
- [ ] Verify message is removed when send fails
- [ ] Verify error toast appears

#### Test 4.2: Network Recovery
- [ ] Send message while offline
- [ ] Reconnect internet
- [ ] Send another message
- [ ] Verify failed message is removed
- [ ] Verify new message sends successfully
- [ ] Verify no duplicate messages

### Scenario 5: Message Validation

#### Test 5.1: Empty Messages
- [ ] Try sending empty message
- [ ] Verify message is rejected
- [ ] Verify no API call is made
- [ ] Verify input field is cleared

#### Test 5.2: Long Messages
- [ ] Send message with 1000+ characters
- [ ] Verify message is accepted
- [ ] Verify message displays correctly
- [ ] Verify message is stored correctly

#### Test 5.3: Special Characters
- [ ] Send message with emojis: "Hello! 👋 How are you? 😊"
- [ ] Send message with special characters: "Test @#$%^&*()_+-=[]{}|;':\",./<>?"
- [ ] Send message with newlines
- [ ] Verify all messages display correctly

### Scenario 6: Read Status

#### Test 6.1: Message Read Status
- [ ] Send message from User A
- [ ] Verify message shows single checkmark (sent)
- [ ] Switch to User B's window
- [ ] Verify message shows double checkmark (read)
- [ ] Switch back to User A's window
- [ ] Verify read status is updated

#### Test 6.2: Multiple Recipients
- [ ] Create conversation with 3+ users
- [ ] Send message from User A
- [ ] Verify read status updates for all recipients
- [ ] Verify read status is accurate

### Scenario 7: Performance Testing

#### Test 7.1: Large Message Volume
- [ ] Open conversation with 1000+ messages
- [ ] Measure initial load time (should be < 2 seconds)
- [ ] Scroll through messages
- [ ] Verify scrolling is smooth (60fps)
- [ ] Monitor memory usage
- [ ] Verify no browser crashes

#### Test 7.2: Concurrent Users
- [ ] Open same conversation in 5+ browser windows
- [ ] Send messages simultaneously
- [ ] Verify all windows update correctly
- [ ] Verify no performance degradation
- [ ] Verify messages appear in correct order

### Scenario 8: Error Scenarios

#### Test 8.1: Invalid Access
- [ ] Try to access conversation user is not part of
- [ ] Verify access denied error
- [ ] Verify proper error message
- [ ] Verify user is redirected appropriately

#### Test 8.2: Non-existent Conversation
- [ ] Try to access non-existent conversation ID
- [ ] Verify 404 error
- [ ] Verify proper error handling
- [ ] Verify user-friendly error message

#### Test 8.3: Database Errors
- [ ] Temporarily disable Supabase
- [ ] Try to send message
- [ ] Try to load messages
- [ ] Verify graceful error handling
- [ ] Verify user-friendly error messages
- [ ] Verify retry functionality works

### Scenario 9: Mobile Responsiveness

#### Test 9.1: Mobile Layout
- [ ] Test on mobile device or browser dev tools
- [ ] Verify chat interface is responsive
- [ ] Verify messages display correctly
- [ ] Verify input field is accessible
- [ ] Verify send button is accessible

#### Test 9.2: Touch Interactions
- [ ] Test scrolling on mobile
- [ ] Test sending messages on mobile
- [ ] Verify touch interactions work correctly
- [ ] Verify keyboard appears correctly

### Scenario 10: Edge Cases

#### Test 10.1: Rapid Message Sending
- [ ] Send 10 messages rapidly
- [ ] Verify all messages are sent
- [ ] Verify messages are in correct order
- [ ] Verify no messages are lost
- [ ] Verify UI remains responsive

#### Test 10.2: Large Message Content
- [ ] Send message with maximum allowed content
- [ ] Verify message is accepted
- [ ] Verify message displays correctly
- [ ] Verify message is stored correctly

#### Test 10.3: Special Message Types
- [ ] Send message with only spaces
- [ ] Send message with only newlines
- [ ] Send message with HTML tags
- [ ] Verify all messages are handled correctly

## Browser Testing

### Chrome
- [ ] Test all scenarios in Chrome
- [ ] Verify Chrome-specific features work
- [ ] Check Chrome DevTools integration

### Firefox
- [ ] Test all scenarios in Firefox
- [ ] Verify Firefox-specific features work
- [ ] Check Firefox DevTools integration

### Safari
- [ ] Test all scenarios in Safari
- [ ] Verify Safari-specific features work
- [ ] Check Safari DevTools integration

### Edge
- [ ] Test all scenarios in Edge
- [ ] Verify Edge-specific features work
- [ ] Check Edge DevTools integration

## Performance Monitoring

### Network Performance
- [ ] Monitor API response times
- [ ] Verify pagination requests are efficient
- [ ] Check for unnecessary API calls
- [ ] Monitor WebSocket connection stability

### Memory Usage
- [ ] Monitor memory usage over time
- [ ] Verify no memory leaks
- [ ] Check for efficient re-rendering
- [ ] Monitor component lifecycle

### CPU Usage
- [ ] Monitor CPU usage during scrolling
- [ ] Verify smooth animations
- [ ] Check for efficient event handling
- [ ] Monitor real-time updates performance

## Accessibility Testing

### Keyboard Navigation
- [ ] Test tab navigation
- [ ] Test Enter key for sending
- [ ] Test Escape key behavior
- [ ] Verify focus management

### Screen Reader
- [ ] Test with screen reader
- [ ] Verify message content is readable
- [ ] Verify interface elements are accessible
- [ ] Check ARIA labels

### Color Contrast
- [ ] Verify color contrast ratios
- [ ] Test with color blindness simulators
- [ ] Verify text is readable
- [ ] Check focus indicators

## Security Testing

### Authentication
- [ ] Verify users can only access their conversations
- [ ] Test with invalid authentication
- [ ] Verify session management
- [ ] Check for authentication bypass

### Authorization
- [ ] Verify RLS policies work correctly
- [ ] Test with different user roles
- [ ] Verify conversation access controls
- [ ] Check for privilege escalation

### Data Validation
- [ ] Test SQL injection attempts
- [ ] Test XSS attempts
- [ ] Verify input sanitization
- [ ] Check for data leakage

## Final Verification

### Functionality
- [ ] All core features work correctly
- [ ] No critical bugs found
- [ ] Performance meets requirements
- [ ] Error handling is robust

### User Experience
- [ ] Interface is intuitive
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Overall experience is smooth

### Documentation
- [ ] All features are documented
- [ ] API endpoints are documented
- [ ] Error codes are documented
- [ ] Usage examples are provided

## Sign-off

- [ ] **Developer**: All tests passed
- [ ] **QA**: All scenarios verified
- [ ] **Product Owner**: Requirements met
- [ ] **Ready for Production**: ✅
