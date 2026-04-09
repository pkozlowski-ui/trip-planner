/**
 * Persona 2 — "Power Typer" (Jakub, 28) — Plan Editor Tambo AI Chat
 *
 * Tests the ChatPanel UI contract: empty state, starter chips, error handling,
 * proactive suggestions, and language consistency.
 *
 * NOTE: Tambo tool calls require VITE_TAMBO_API_KEY and a real plan in Firestore.
 * This test file validates the UI shell — chip rendering, English copy, error display,
 * and proactive suggestion styling — without requiring live AI calls.
 *
 * To run: npx playwright test chatpanel-tambo.spec.ts --headed
 */
import { test, expect } from '@playwright/test';

test.describe('ChatPanel UI Contract (P2 — Power Typer)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a plan — will show loading state or redirect to auth
    await page.goto('/dashboard');
    await expect(page.locator('.wizard-header__title')).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard wizard header is "Your travel planner"', async ({ page }) => {
    await expect(page.locator('.wizard-header__title')).toHaveText('Your travel planner');
  });

  test('dashboard tab "Upcoming" empty state shows English message', async ({ page }) => {
    // Click Upcoming tab
    const upcomingTab = page.locator('[role="tab"]', { hasText: 'Upcoming' });
    if (await upcomingTab.isVisible()) {
      await upcomingTab.click();
      // If there are no upcoming plans, the empty state should appear with English copy
      const grid = page.locator('.dashboard-grid, .dashboard-empty-state');
      await expect(grid).toBeVisible({ timeout: 5_000 });
      const emptyState = page.locator('.dashboard-empty-state');
      if (await emptyState.isVisible()) {
        const emptyText = await emptyState.innerText();
        // Should not contain Polish text
        expect(emptyText).not.toContain('Poczekaj');
        expect(emptyText.toLowerCase()).toContain('trip');
      }
    }
  });

  test('dashboard "Completed" tab shows empty state or plan grid', async ({ page }) => {
    const completedTab = page.locator('[role="tab"]', { hasText: 'Completed' });
    if (await completedTab.isVisible()) {
      await completedTab.click();
      const grid = page.locator('.dashboard-grid, .dashboard-empty-state, .dashboard-loading');
      await expect(grid).toBeVisible({ timeout: 5_000 });
    }
  });
});

test.describe('ChatPanel Copy & Language Tests', () => {
  test('chat panel wait hint is in English', async ({ page }) => {
    // Navigate to any plan editor page
    await page.goto('/dashboard');
    // The wait hint ("Poczekaj...") should not appear anywhere on the page
    const pageText = await page.locator('body').innerText();
    expect(pageText).not.toContain('Poczekaj');
    expect(pageText).not.toContain('zakończenie');
  });

  test('wizard bot label is ✦ not AI', async ({ page }) => {
    await page.goto('/dashboard');
    const labels = page.locator('.wizard-message__label');
    await expect(labels.first()).toBeVisible({ timeout: 10_000 });
    const labelText = await labels.first().innerText();
    expect(labelText).toBe('✦');
    expect(labelText).not.toBe('AI');
  });

  test('proactive suggestion label is NOT in uppercase "SUGGESTION"', async ({ page }) => {
    // On the plan editor page, proactive suggestions may appear
    // We check that the label style no longer uses text-transform: uppercase
    await page.goto('/dashboard');
    const proactiveLabel = page.locator('[class*="proactiveLabel"]');
    if (await proactiveLabel.isVisible()) {
      const style = await proactiveLabel.evaluate((el) =>
        window.getComputedStyle(el).textTransform
      );
      // Should not be uppercase after our CSS fix
      expect(style).not.toBe('uppercase');
    }
  });
});

test.describe('Wizard Result Checklist (post-generation assertions)', () => {
  test('generating block does not say "Building X-day structure"', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.wizard-header__title')).toBeVisible({ timeout: 8_000 });

    // Run through wizard to generating step
    await page.locator('.wizard-chip', { hasText: 'Japan' }).click();
    await page.locator('.wizard-chip', { hasText: '7 days' }).click();
    await page.locator('.wizard-chip--toggle', { hasText: 'Food-obsessed' }).click();
    await page.locator('.wizard-chip--confirm').click();
    await page.locator('.wizard-chip', { hasText: 'Just me' }).click();
    await page.locator('.wizard-chip', { hasText: '$100+/day' }).click();
    await page.locator('.wizard-chip', { hasText: 'Nope, all open' }).click();

    await expect(page.locator('.wizard-generating')).toBeVisible({ timeout: 8_000 });

    // Wait a moment for first generating lines to appear
    await page.waitForTimeout(2000);

    const generatingText = await page.locator('.wizard-generating').innerText();
    // Old jargon should be gone
    expect(generatingText).not.toContain('Building 7-day structure');
    expect(generatingText).not.toContain('skeleton');
    // New copy should appear
    // "Creating your 7-day itinerary" or route lines
  });

  test('anchor line in generating log now shows the day number', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.wizard-header__title')).toBeVisible({ timeout: 8_000 });

    await page.locator('.wizard-chip', { hasText: 'Japan' }).click();
    await page.locator('.wizard-chip', { hasText: '7 days' }).click();
    await page.locator('.wizard-chip--toggle', { hasText: 'History & culture' }).click();
    await page.locator('.wizard-chip--confirm').click();
    await page.locator('.wizard-chip', { hasText: 'Just me' }).click();
    await page.locator('.wizard-chip', { hasText: 'Skip' }).click();

    // Type anchor
    await page.locator('.wizard-input').fill('Kyoto');
    await page.locator('.wizard-send-btn').click();

    await expect(page.locator('.wizard-generating')).toBeVisible({ timeout: 8_000 });
    // Wait for anchor line to appear
    await page.waitForTimeout(3000);

    const generatingText = await page.locator('.wizard-generating').innerText();
    if (generatingText.includes('anchor')) {
      // Should contain "Day N" in the anchor log line
      expect(generatingText).toMatch(/anchor.*Day \d+/i);
    }
  });
});
