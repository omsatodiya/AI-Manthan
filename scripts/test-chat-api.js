// Test script for Chat API endpoints
// Run with: node scripts/test-chat-api.js

const BASE_URL = "http://localhost:3000";

// Test data
const TEST_CONVERSATION_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TEST_USER_A_ID = "11111111-1111-1111-1111-111111111111";
const TEST_USER_B_ID = "22222222-2222-2222-2222-222222222222";

// Helper function to make API requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error("Request failed:", error);
    return { response: null, data: null, error };
  }
}

// Test 1: Get messages (first page)
async function testGetMessages() {
  console.log("\n🧪 Test 1: Get messages (first page)");

  const { response, data } = await makeRequest(
    `${BASE_URL}/api/messages?conversationId=${TEST_CONVERSATION_ID}&limit=40`
  );

  if (response && response.ok) {
    console.log("✅ Success");
    console.log(`📊 Messages returned: ${data.messages.length}`);
    console.log(`📊 Has more: ${data.pagination.hasMore}`);
    console.log(`📊 Next cursor: ${data.pagination.nextCursor}`);

    if (data.messages.length > 0) {
      const latestMessage = data.messages[0];
      console.log(`📝 Latest message: "${latestMessage.content}"`);
      console.log(`⏰ Created at: ${latestMessage.createdAt}`);
    }

    return data.pagination.nextCursor;
  } else {
    console.log("❌ Failed");
    console.log("Error:", data?.error || "Unknown error");
    return null;
  }
}

// Test 2: Get messages with pagination
async function testGetMessagesWithPagination(before) {
  console.log("\n🧪 Test 2: Get messages with pagination");

  if (!before) {
    console.log("⏭️ Skipping - no cursor available");
    return;
  }

  const { response, data } = await makeRequest(
    `${BASE_URL}/api/messages?conversationId=${TEST_CONVERSATION_ID}&limit=20&before=${before}`
  );

  if (response && response.ok) {
    console.log("✅ Success");
    console.log(`📊 Messages returned: ${data.messages.length}`);
    console.log(`📊 Has more: ${data.pagination.hasMore}`);
    console.log(`📊 Next cursor: ${data.pagination.nextCursor}`);

    if (data.messages.length > 0) {
      const oldestMessage = data.messages[data.messages.length - 1];
      console.log(`📝 Oldest message: "${oldestMessage.content}"`);
      console.log(`⏰ Created at: ${oldestMessage.createdAt}`);
    }
  } else {
    console.log("❌ Failed");
    console.log("Error:", data?.error || "Unknown error");
  }
}

// Test 3: Create conversation
async function testCreateConversation() {
  console.log("\n🧪 Test 3: Create conversation");

  const { response, data } = await makeRequest(
    `${BASE_URL}/api/conversations`,
    {
      method: "POST",
      body: JSON.stringify({
        otherUserId: TEST_USER_B_ID,
      }),
    }
  );

  if (response && response.ok) {
    console.log("✅ Success");
    console.log(`📊 Conversation ID: ${data.conversation.id}`);
    console.log(`👤 User A: ${data.conversation.userA.fullName}`);
    console.log(`👤 User B: ${data.conversation.userB.fullName}`);
    return data.conversation.id;
  } else {
    console.log("❌ Failed");
    console.log("Error:", data?.error || "Unknown error");
    return null;
  }
}

// Test 4: Send message
async function testSendMessage(conversationId) {
  console.log("\n🧪 Test 4: Send message");

  const testMessage = `Test message from API - ${new Date().toISOString()}`;

  const { response, data } = await makeRequest(`${BASE_URL}/api/messages`, {
    method: "POST",
    body: JSON.stringify({
      conversationId: conversationId || TEST_CONVERSATION_ID,
      content: testMessage,
    }),
  });

  if (response && response.ok) {
    console.log("✅ Success");
    console.log(`📝 Message ID: ${data.message.id}`);
    console.log(`📝 Content: "${data.message.content}"`);
    console.log(`👤 Sender: ${data.message.sender.fullName}`);
    console.log(`⏰ Created at: ${data.message.createdAt}`);
    return data.message.id;
  } else {
    console.log("❌ Failed");
    console.log("Error:", data?.error || "Unknown error");
    return null;
  }
}

// Test 5: Mark messages as read
async function testMarkMessagesAsRead(conversationId) {
  console.log("\n🧪 Test 5: Mark messages as read");

  const { response, data } = await makeRequest(
    `${BASE_URL}/api/messages/read`,
    {
      method: "PATCH",
      body: JSON.stringify({
        conversationId: conversationId || TEST_CONVERSATION_ID,
      }),
    }
  );

  if (response && response.ok) {
    console.log("✅ Success");
    console.log(`📊 Messages marked as read: ${data.count}`);
  } else {
    console.log("❌ Failed");
    console.log("Error:", data?.error || "Unknown error");
  }
}

// Test 6: Error handling
async function testErrorHandling() {
  console.log("\n🧪 Test 6: Error handling");

  // Test invalid conversation ID
  const { response, data } = await makeRequest(
    `${BASE_URL}/api/messages?conversationId=invalid-id&limit=40`
  );

  if (response && !response.ok) {
    console.log("✅ Error handling works");
    console.log(`📊 Status: ${response.status}`);
    console.log(`📝 Error: ${data?.error || "Unknown error"}`);
  } else {
    console.log("❌ Error handling failed");
  }
}

// Test 7: Performance test
async function testPerformance() {
  console.log("\n🧪 Test 7: Performance test");

  const startTime = Date.now();

  const { response, data } = await makeRequest(
    `${BASE_URL}/api/messages?conversationId=${TEST_CONVERSATION_ID}&limit=40`
  );

  const endTime = Date.now();
  const duration = endTime - startTime;

  if (response && response.ok) {
    console.log("✅ Success");
    console.log(`⏱️ Response time: ${duration}ms`);
    console.log(`📊 Messages returned: ${data.messages.length}`);

    if (duration > 2000) {
      console.log("⚠️ Warning: Response time is slow (>2s)");
    } else if (duration > 1000) {
      console.log("⚠️ Notice: Response time is moderate (>1s)");
    } else {
      console.log("✅ Response time is good (<1s)");
    }
  } else {
    console.log("❌ Failed");
    console.log("Error:", data?.error || "Unknown error");
  }
}

// Main test runner
async function runTests() {
  console.log("🚀 Starting Chat API Tests");
  console.log("=".repeat(50));

  try {
    // Test 1: Get messages
    const nextCursor = await testGetMessages();

    // Test 2: Pagination
    await testGetMessagesWithPagination(nextCursor);

    // Test 3: Create conversation
    const newConversationId = await testCreateConversation();

    // Test 4: Send message
    await testSendMessage(newConversationId);

    // Test 5: Mark as read
    await testMarkMessagesAsRead(newConversationId);

    // Test 6: Error handling
    await testErrorHandling();

    // Test 7: Performance
    await testPerformance();

    console.log("\n" + "=".repeat(50));
    console.log("🎉 All tests completed!");
  } catch (error) {
    console.error("\n💥 Test runner failed:", error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testGetMessages,
  testGetMessagesWithPagination,
  testCreateConversation,
  testSendMessage,
  testMarkMessagesAsRead,
  testErrorHandling,
  testPerformance,
};
