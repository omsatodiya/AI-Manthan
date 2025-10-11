// Browser Console Tests for Chat Feature
// Copy and paste these functions into browser console for testing

// Test 1: Check if chat components are loaded
function testChatComponents() {
  console.log("🧪 Testing Chat Components...");

  // Check if ChatComponent is available
  const chatComponent =
    document.querySelector('[data-testid="chat-component"]') ||
    document.querySelector(".chat-component") ||
    document.querySelector('[class*="chat"]');

  if (chatComponent) {
    console.log("✅ Chat component found");
    console.log("📊 Component:", chatComponent);
  } else {
    console.log("❌ Chat component not found");
  }

  // Check if messages are loaded
  const messages =
    document.querySelectorAll('[data-testid="message"]') ||
    document.querySelectorAll('[class*="message"]');

  console.log(`📊 Messages found: ${messages.length}`);

  // Check if input field exists
  const input =
    document.querySelector('input[placeholder*="message"]') ||
    document.querySelector('textarea[placeholder*="message"]');

  if (input) {
    console.log("✅ Message input found");
  } else {
    console.log("❌ Message input not found");
  }

  // Check if send button exists
  const sendButton =
    document.querySelector('button[type="submit"]') ||
    document.querySelector('button[aria-label*="send"]') ||
    document.querySelector('button[title*="send"]');

  if (sendButton) {
    console.log("✅ Send button found");
  } else {
    console.log("❌ Send button not found");
  }
}

// Test 2: Test message sending
function testMessageSending() {
  console.log("🧪 Testing Message Sending...");

  const input =
    document.querySelector('input[placeholder*="message"]') ||
    document.querySelector('textarea[placeholder*="message"]');

  if (!input) {
    console.log("❌ Message input not found");
    return;
  }

  const testMessage = `Test message from console - ${new Date().toISOString()}`;

  // Simulate typing
  input.value = testMessage;
  input.dispatchEvent(new Event("input", { bubbles: true }));

  // Find and click send button
  const sendButton =
    document.querySelector('button[type="submit"]') ||
    document.querySelector('button[aria-label*="send"]') ||
    document.querySelector('button[title*="send"]');

  if (sendButton) {
    sendButton.click();
    console.log("✅ Message sent:", testMessage);
  } else {
    console.log("❌ Send button not found");
  }
}

// Test 3: Test scroll behavior
function testScrollBehavior() {
  console.log("🧪 Testing Scroll Behavior...");

  const scrollContainer =
    document.querySelector("[data-radix-scroll-area-viewport]") ||
    document.querySelector(".scroll-area") ||
    document.querySelector('[class*="scroll"]');

  if (!scrollContainer) {
    console.log("❌ Scroll container not found");
    return;
  }

  // Get initial scroll position
  const initialScrollTop = scrollContainer.scrollTop;
  console.log(`📊 Initial scroll position: ${initialScrollTop}`);

  // Scroll to top
  scrollContainer.scrollTop = 0;
  console.log("✅ Scrolled to top");

  // Wait a bit and check if pagination triggered
  setTimeout(() => {
    const afterScrollTop = scrollContainer.scrollTop;
    console.log(`📊 Scroll position after: ${afterScrollTop}`);

    // Check if loading indicator appeared
    const loadingIndicator =
      document.querySelector('[class*="loading"]') ||
      document.querySelector('[class*="spinner"]') ||
      document.querySelector('[aria-label*="loading"]');

    if (loadingIndicator) {
      console.log("✅ Loading indicator found");
    } else {
      console.log("ℹ️ No loading indicator found");
    }
  }, 1000);
}

// Test 4: Test real-time updates
function testRealTimeUpdates() {
  console.log("🧪 Testing Real-Time Updates...");

  // Check if WebSocket connection exists
  const wsConnections = window.WebSocket
    ? "WebSocket available"
    : "WebSocket not available";
  console.log(`📊 WebSocket: ${wsConnections}`);

  // Check if Supabase client is available
  if (window.supabase) {
    console.log("✅ Supabase client found");
  } else {
    console.log("❌ Supabase client not found");
  }

  // Monitor for new messages
  const messageContainer =
    document.querySelector('[class*="message"]')?.parentElement;
  if (messageContainer) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          console.log("✅ New message detected:", mutation.addedNodes.length);
        }
      });
    });

    observer.observe(messageContainer, { childList: true });
    console.log("✅ Real-time observer started");

    // Stop observer after 30 seconds
    setTimeout(() => {
      observer.disconnect();
      console.log("⏹️ Real-time observer stopped");
    }, 30000);
  } else {
    console.log("❌ Message container not found");
  }
}

// Test 5: Test performance
function testPerformance() {
  console.log("🧪 Testing Performance...");

  // Measure render time
  const startTime = performance.now();

  // Force a re-render by scrolling
  const scrollContainer =
    document.querySelector("[data-radix-scroll-area-viewport]") ||
    document.querySelector(".scroll-area") ||
    document.querySelector('[class*="scroll"]');

  if (scrollContainer) {
    scrollContainer.scrollTop = 100;
    scrollContainer.scrollTop = 0;

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`⏱️ Render time: ${renderTime.toFixed(2)}ms`);

    if (renderTime > 16) {
      console.log("⚠️ Warning: Render time is slow (>16ms)");
    } else {
      console.log("✅ Render time is good (<16ms)");
    }
  }

  // Check memory usage
  if (performance.memory) {
    const memory = performance.memory;
    console.log(
      `📊 Memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
    );
    console.log(
      `📊 Total memory: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`
    );
  }

  // Count DOM nodes
  const nodeCount = document.querySelectorAll("*").length;
  console.log(`📊 DOM nodes: ${nodeCount}`);

  if (nodeCount > 10000) {
    console.log("⚠️ Warning: High DOM node count");
  } else {
    console.log("✅ DOM node count is reasonable");
  }
}

// Test 6: Test error handling
function testErrorHandling() {
  console.log("🧪 Testing Error Handling...");

  // Test network error simulation
  const originalFetch = window.fetch;
  let errorCount = 0;

  window.fetch = function (...args) {
    if (args[0].includes("/api/messages") && errorCount < 1) {
      errorCount++;
      console.log("🧪 Simulating network error...");
      return Promise.reject(new Error("Network error"));
    }
    return originalFetch.apply(this, args);
  };

  // Try to send a message
  const input =
    document.querySelector('input[placeholder*="message"]') ||
    document.querySelector('textarea[placeholder*="message"]');

  if (input) {
    input.value = "Test error handling";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    const sendButton =
      document.querySelector('button[type="submit"]') ||
      document.querySelector('button[aria-label*="send"]') ||
      document.querySelector('button[title*="send"]');

    if (sendButton) {
      sendButton.click();

      // Check for error message
      setTimeout(() => {
        const errorMessage =
          document.querySelector('[class*="error"]') ||
          document.querySelector('[role="alert"]') ||
          document.querySelector('[aria-live="polite"]');

        if (errorMessage) {
          console.log("✅ Error message displayed");
        } else {
          console.log("❌ No error message found");
        }

        // Restore original fetch
        window.fetch = originalFetch;
        console.log("✅ Network error simulation completed");
      }, 2000);
    }
  }
}

// Test 7: Test accessibility
function testAccessibility() {
  console.log("🧪 Testing Accessibility...");

  // Check for ARIA labels
  const ariaLabels = document.querySelectorAll("[aria-label]");
  console.log(`📊 Elements with ARIA labels: ${ariaLabels.length}`);

  // Check for focus management
  const focusableElements = document.querySelectorAll(
    "button, input, textarea, [tabindex]"
  );
  console.log(`📊 Focusable elements: ${focusableElements.length}`);

  // Check for keyboard navigation
  const input =
    document.querySelector('input[placeholder*="message"]') ||
    document.querySelector('textarea[placeholder*="message"]');

  if (input) {
    input.focus();
    console.log("✅ Input focused");

    // Test Enter key
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    console.log("✅ Enter key test completed");
  }

  // Check for color contrast
  const textElements = document.querySelectorAll("p, span, div");
  let lowContrastCount = 0;

  textElements.forEach((element) => {
    const style = window.getComputedStyle(element);
    const color = style.color;
    const backgroundColor = style.backgroundColor;

    // Simple contrast check (this is a basic implementation)
    if (color === backgroundColor) {
      lowContrastCount++;
    }
  });

  console.log(`📊 Potential contrast issues: ${lowContrastCount}`);
}

// Test 8: Test mobile responsiveness
function testMobileResponsiveness() {
  console.log("🧪 Testing Mobile Responsiveness...");

  // Simulate mobile viewport
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;

  // Set mobile viewport
  Object.defineProperty(window, "innerWidth", { value: 375 });
  Object.defineProperty(window, "innerHeight", { value: 667 });

  // Trigger resize event
  window.dispatchEvent(new Event("resize"));

  console.log("✅ Mobile viewport simulated");

  // Check if layout adapts
  setTimeout(() => {
    const chatComponent =
      document.querySelector('[data-testid="chat-component"]') ||
      document.querySelector(".chat-component") ||
      document.querySelector('[class*="chat"]');

    if (chatComponent) {
      const rect = chatComponent.getBoundingClientRect();
      console.log(`📊 Chat component width: ${rect.width}px`);
      console.log(`📊 Chat component height: ${rect.height}px`);

      if (rect.width <= 375) {
        console.log("✅ Layout adapted for mobile");
      } else {
        console.log("⚠️ Layout may not be mobile-friendly");
      }
    }

    // Restore original viewport
    Object.defineProperty(window, "innerWidth", { value: originalWidth });
    Object.defineProperty(window, "innerHeight", { value: originalHeight });
    window.dispatchEvent(new Event("resize"));

    console.log("✅ Original viewport restored");
  }, 1000);
}

// Run all tests
function runAllTests() {
  console.log("🚀 Starting Browser Console Tests");
  console.log("=".repeat(50));

  testChatComponents();
  setTimeout(() => testMessageSending(), 1000);
  setTimeout(() => testScrollBehavior(), 2000);
  setTimeout(() => testRealTimeUpdates(), 3000);
  setTimeout(() => testPerformance(), 4000);
  setTimeout(() => testErrorHandling(), 5000);
  setTimeout(() => testAccessibility(), 6000);
  setTimeout(() => testMobileResponsiveness(), 7000);

  setTimeout(() => {
    console.log("\n" + "=".repeat(50));
    console.log("🎉 All browser tests completed!");
  }, 8000);
}

// Export functions for individual testing
window.chatTests = {
  testChatComponents,
  testMessageSending,
  testScrollBehavior,
  testRealTimeUpdates,
  testPerformance,
  testErrorHandling,
  testAccessibility,
  testMobileResponsiveness,
  runAllTests,
};

console.log(
  "📝 Chat test functions loaded. Use chatTests.runAllTests() to run all tests."
);
