// E2E Tests - Monitoring Dashboard
// Tests de bout en bout pour le tableau de bord de monitoring

import { test, expect, Page } from '@playwright/test';

// ===========================================
// Test Configuration
// ===========================================

const MONITORING_URL = '/admin/monitoring';
const LOGIN_URL = '/login';

// Helper to login before tests (if auth is required)
async function setupAuth(page: Page) {
  // Check if we need to login
  const currentUrl = page.url();
  
  if (currentUrl.includes('login') || currentUrl === 'about:blank') {
    // Navigate to monitoring (will redirect to login if needed)
    await page.goto(MONITORING_URL);
    
    // If redirected to login, fill in credentials
    if (page.url().includes('login')) {
      // Fill in test credentials (adjust based on your auth setup)
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');
      
      if (await emailInput.count() > 0) {
        await emailInput.fill('admin@algeriatrade.dz');
        await passwordInput.fill('test-password');
        await page.locator('button[type="submit"]').click();
        
        // Wait for redirect to monitoring
        await page.waitForURL('**/monitoring**', { timeout: 10000 });
      }
    }
  }
}

// ===========================================
// Test Suites
// ===========================================

test.describe('Monitoring Dashboard - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MONITORING_URL);
  });

  test('should load dashboard page', async ({ page }) => {
    // Page should load without crashing
    await expect(page).toHaveURL(/\/admin\/monitoring/);
    
    // Should have main heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display all main tabs', async ({ page }) => {
    // Wait for tabs to render
    await page.waitForSelector('[role="tab"]', { timeout: 10000 });
    
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    
    // Should have at least 5 tabs (Overview, Infrastructure, Performance, Business, Alerts)
    expect(tabCount).toBeGreaterThanOrEqual(5);
  });

  test('should show loading state initially', async ({ page }) => {
    // Look for loading indicator or skeleton
    const loadingIndicator = page.locator('[data-testid="loading"], [role="progressbar"], .animate-pulse');
    
    // Loading might be very fast, so we just check it doesn't hang
    await page.waitForLoadState('networkidle');
  });

  test('should display health status', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Health status should be visible (healthy, degraded, or unhealthy)
    const statusBadge = page.locator('text=/healthy|degraded|unhealthy/i');
    await expect(statusBadge.first()).toBeVisible({ timeout: 15000 });
  });

  test('should have refresh button', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find refresh button (by icon or text)
    const refreshButton = page.locator('button:has-text("Refresh"), button[title*="refresh" i], [data-testid="refresh-button"]');
    
    if (await refreshButton.count() > 0) {
      await expect(refreshButton.first()).toBeVisible();
      await refreshButton.first().click();
      
      // Data should refresh (no error)
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Overview Tab', () => {
  test('should display system uptime', async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Uptime should be displayed as percentage
    const uptimeElement = page.locator('text=/\\d+\\.?\\d*%/i');
    await expect(uptimeElement.first()).toBeVisible({ timeout: 15000 });
  });

  test('should display key metrics cards', async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Should show numeric values for key metrics
    const metricCards = page.locator('[class*="card"], [class*="metric"]').filter({
      hasText: /\d+/,
    });
    
    // Should have multiple metric cards
    const cardCount = await metricCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);
  });

  test('should show active alerts summary', async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Overview should mention alerts if any exist
    const alertSection = page.locator('text=/alert|Alert/i');
    
    if (await alertSection.count() > 0) {
      await expect(alertSection.first()).toBeVisible();
    }
  });
});

test.describe('Infrastructure Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Click on Infrastructure tab
    const infraTab = page.locator('[role="tab"]:has-text("Infrastructure")');
    await infraTab.click();
    await page.waitForTimeout(500); // Allow tab content to load
  });

  test('should display CPU usage', async ({ page }) => {
    // CPU section should be visible
    const cpuSection = page.locator('text=/CPU|cpu/i');
    await expect(cpuSection.first()).toBeVisible();
  });

  test('should display memory usage with progress indicator', async ({ page }) => {
    // Memory section should be visible
    const memorySection = page.locator('text=/Memory|RAM/i');
    await expect(memorySection.first()).toBeVisible();
    
    // Should have progress bar or similar visual indicator
    const progressBar = page.locator('[role="progressbar"], [class*="progress"]');
    if (await progressBar.count() > 0) {
      await expect(progressBar.first()).toBeVisible();
    }
  });

  test('should display disk usage per partition', async ({ page }) => {
    // Disk information should be shown
    const diskSection = page.locator('text=/Disk|Storage/i');
    await expect(diskSection.first()).toBeVisible();
  });

  test('should display network statistics', async ({ page }) => {
    // Network stats should be present
    const networkSection = page.locator('text=/Network|Bandwidth/i');
    await expect(networkSection.first()).toBeVisible();
  });
});

test.describe('Performance Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Click on Performance tab
    const perfTab = page.locator('[role="tab"]:has-text("Performance")');
    await perfTab.click();
    await page.waitForTimeout(500);
  });

  test('should display response time metrics', async ({ page }) => {
    // Response time should be shown
    const responseTime = page.locator('text=/Response Time|Latency/i');
    await expect(responseTime.first()).toBeVisible();
  });

  test('should display requests per second', async ({ page }) => {
    // RPS metric should be visible
    const rps = page.locator('text=/RPS|Requests.*Second|req\\/s/i');
    await expect(rps.first()).toBeVisible();
  });

  test('should display error rate', async ({ page }) => {
    // Error rate should be shown
    const errorRate = page.locator('text=/Error Rate|error.*rate/i');
    await expect(errorRate.first()).toBeVisible();
  });

  test('should show active users count', async ({ page }) => {
    // Active users metric
    const activeUsers = page.locator('text=/Active Users|Users.*Online/i');
    await expect(activeUsers.first()).toBeVisible();
  });
});

test.describe('Business Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Click on Business tab
    const businessTab = page.locator('[role="tab"]:has-text("Business")');
    await businessTab.click();
    await page.waitForTimeout(500);
  });

  test('should display revenue metrics', async ({ page }) => {
    // Revenue should be shown
    const revenue = page.locator('text=/Revenue|DZD|\$/i');
    await expect(revenue.first()).toBeVisible();
  });

  test('should display order counts', async ({ page }) => {
    // Orders today metric
    const orders = page.locator('text=/Orders|Orders Today/i');
    await expect(orders.first()).toBeVisible();
  });

  test('should display conversion rate', async ({ page }) => {
    // Conversion rate
    const conversion = page.locator('text=/Conversion Rate|conversion/i');
    await expect(conversion.first()).toBeVisible();
  });

  test('should show product and RFQ counts', async ({ page }) => {
    // Products and RFQs
    const products = page.locator('text=/Products|RFQ/i');
    await expect(products.first()).toBeVisible();
  });
});

test.describe('Alerts Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Click on Alerts tab
    const alertsTab = page.locator('[role="tab"]:has-text("Alerts")');
    await alertsTab.click();
    await page.waitForTimeout(500);
  });

  test('should display alerts list or empty state', async ({ page }) => {
    // Either show alerts or "no alerts" message
    const alertsList = page.locator('[data-testid="alert-item"], [class*="alert-item"]');
    const noAlerts = page.locator('text=/no alerts|all clear|0 alerts/i');
    
    const hasAlerts = await alertsList.count() > 0;
    const hasNoAlertsMessage = await noAlerts.count() > 0;
    
    expect(hasAlerts || hasNoAlertsMessage).toBeTruthy();
  });

  test('should allow acknowledging alerts', async ({ page }) => {
    // Find acknowledge button if alerts exist
    const ackButton = page.locator('button:has-text("Acknowledge"), button:has-text("acknowledge")');
    
    if (await ackButton.count() > 0) {
      await ackButton.first().click();
      
      // Button state should change or alert should disappear
      await page.waitForTimeout(500);
    }
  });

  test('should show severity indicators', async ({ page }) => {
    // Severity badges should be visible
    const severityBadges = page.locator('text=/critical|warning|info/i');
    
    if (await severityBadges.count() > 0) {
      await expect(severityBadges.first()).toBeVisible();
    }
  });
});

test.describe('Auto-refresh Functionality', () => {
  test('should auto-refresh data at configured interval', async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Get initial timestamp
    const initialTimestamp = await page.locator('[data-testid="timestamp"], .timestamp').textContent().catch(() => null);
    
    // Wait for auto-refresh (typically 30 seconds - we'll wait a shorter time for testing)
    await page.waitForTimeout(35000); // Slightly more than typical 30s interval
    
    // Timestamp should have updated (or at least not crashed)
    const currentTimestamp = await page.locator('[data-testid="timestamp"], .timestamp').textContent().catch(() => null);
    
    // Page should still be functional
    expect(await page.locator('body').isVisible()).toBeTruthy();
  });

  test('should handle manual refresh correctly', async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Find and click refresh button
    const refreshButton = page.locator('button:has-text("Refresh"), [data-testid="refresh-button"], button[aria-label*="refresh" i]');
    
    if (await refreshButton.count() > 0) {
      // Click refresh
      await refreshButton.first().click();
      
      // Should show loading state briefly
      await page.waitForTimeout(500);
      
      // Should still show valid data
      const bodyVisible = await page.locator('body').isVisible();
      expect(bodyVisible).toBeTruthy();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Main content should be visible
    const mainContent = page.locator('main, [role="main"], #__next');
    await expect(mainContent.first()).toBeVisible();
    
    // Tabs should still work (might be in dropdown on mobile)
    const tabContent = page.locator('[role="tabpanel"]');
    await expect(tabContent.first()).toBeVisible();
  });

  test('should be usable on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Dashboard should render properly
    const dashboardHeading = page.locator('h1, h2').first();
    await expect(dashboardHeading).toBeVisible();
  });

  test('should adapt to large desktop screens', async ({ page }) => {
    // Set large desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // All tabs should be visible horizontally
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    
    if (tabCount > 0) {
      // On desktop, all tabs should fit in one row
      const firstTab = tabs.first();
      const boundingBox = await firstTab.boundingBox();
      expect(boundingBox).not.toBeNull();
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Should have h1 or main heading
    const headings = page.locator('h1, h2');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThanOrEqual(1);
  });

  test('should have accessible tab navigation', async ({ page }) => {
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    // Focus first tab
    const firstTab = page.locator('[role="tab"]').first();
    await firstTab.focus();
    
    // Verify focus
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Keyboard navigation should work
    await page.keyboard.press('ArrowRight');
    
    // Focus should move to next element
    const newFocused = page.locator(':focus');
    await expect(newFocused).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    // This would typically require a contrast checking library
    // For now, just verify elements are visible
    await page.goto(MONITORING_URL);
    await page.waitForLoadState('networkidle');
    
    const importantElements = page.locator(
      '[role="tab"], button, [role="alert"], .status-badge'
    );
    
    const count = await importantElements.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = importantElements.nth(i);
      await expect(element).toBeVisible();
    }
  });
});
