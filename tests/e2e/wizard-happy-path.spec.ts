/**
 * Persona 1 — "Casual Chip-Clicker" (Marta, 34)
 *
 * Full happy-path through the DashboardWizard using chips only.
 * Goal: 10-day Southeast Asia trip, 2 vibes, 2 people, $50-100/day, no anchor.
 *
 * NOTE: These tests require the app to be running at http://localhost:5173
 * and a valid authenticated session. Because the app uses Firebase Auth,
 * full E2E auth is skipped here — tests validate the wizard UI contract
 * (copy, chips, states, transitions) rather than Firestore writes.
 *
 * To run: npx playwright test wizard-happy-path.spec.ts --headed
 */
import { test, expect } from '@playwright/test';

test.describe('Wizard Happy Path (P1 — Chip-Clicker)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('wizard header shows "Your travel planner" not "Trip Planner AI"', async ({ page }) => {
    const header = page.locator('.wizard-header__title');
    await expect(header).toBeVisible({ timeout: 10_000 });
    await expect(header).toHaveText('Your travel planner');
    await expect(header).not.toHaveText('Trip Planner AI');
  });

  test('initial greeting is displayed in wizard panel', async ({ page }) => {
    const firstBubble = page.locator('.wizard-bubble--bot').first();
    await expect(firstBubble).toBeVisible({ timeout: 10_000 });
    await expect(firstBubble).toContainText('Where are you dreaming');
  });

  test('bot label is ✦ not AI', async ({ page }) => {
    const label = page.locator('.wizard-message__label').first();
    await expect(label).toBeVisible({ timeout: 10_000 });
    await expect(label).toHaveText('✦');
  });

  test('destination chips are rendered', async ({ page }) => {
    const chips = page.locator('.wizard-chip');
    await expect(chips.first()).toBeVisible({ timeout: 10_000 });
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('clicking "Southeast Asia" chip advances to duration step', async ({ page }) => {
    await page.locator('.wizard-chip', { hasText: 'Southeast Asia' }).click();
    // Bot should reply with destination comment
    await expect(page.locator('.wizard-bubble--bot').nth(1)).toBeVisible({ timeout: 8_000 });
    // Duration chips should appear
    await expect(page.locator('.wizard-chip', { hasText: '7 days' })).toBeVisible({ timeout: 8_000 });
  });

  test('clicking "10 days" chip advances to vibe step', async ({ page }) => {
    await page.locator('.wizard-chip', { hasText: 'Southeast Asia' }).click();
    await page.locator('.wizard-chip', { hasText: '10 days' }).click();
    // Vibe chips should appear
    await expect(page.locator('.wizard-chip', { hasText: 'Slow & deep' })).toBeVisible({ timeout: 8_000 });
  });

  test('vibe multi-select shows Continue button after selection', async ({ page }) => {
    await page.locator('.wizard-chip', { hasText: 'Southeast Asia' }).click();
    await page.locator('.wizard-chip', { hasText: '10 days' }).click();
    await page.locator('.wizard-chip--toggle', { hasText: 'Food-obsessed' }).click();
    await page.locator('.wizard-chip--toggle', { hasText: 'Nature first' }).click();
    await expect(page.locator('.wizard-chip--confirm')).toBeVisible({ timeout: 4_000 });
    await expect(page.locator('.wizard-chip--confirm')).toContainText('Continue with 2');
  });

  test('completing vibe step advances to group step', async ({ page }) => {
    await page.locator('.wizard-chip', { hasText: 'Southeast Asia' }).click();
    await page.locator('.wizard-chip', { hasText: '10 days' }).click();
    await page.locator('.wizard-chip--toggle', { hasText: 'Food-obsessed' }).click();
    await page.locator('.wizard-chip--confirm').click();
    await expect(page.locator('.wizard-chip', { hasText: '2 people' })).toBeVisible({ timeout: 8_000 });
  });

  test('completing group step advances to budget step', async ({ page }) => {
    await page.locator('.wizard-chip', { hasText: 'Southeast Asia' }).click();
    await page.locator('.wizard-chip', { hasText: '10 days' }).click();
    await page.locator('.wizard-chip--toggle', { hasText: 'Food-obsessed' }).click();
    await page.locator('.wizard-chip--confirm').click();
    await page.locator('.wizard-chip', { hasText: '2 people' }).click();
    await expect(page.locator('.wizard-chip', { hasText: 'Skip' })).toBeVisible({ timeout: 8_000 });
  });

  test('completing budget step shows anchor step', async ({ page }) => {
    await page.locator('.wizard-chip', { hasText: 'Southeast Asia' }).click();
    await page.locator('.wizard-chip', { hasText: '10 days' }).click();
    await page.locator('.wizard-chip--toggle', { hasText: 'Food-obsessed' }).click();
    await page.locator('.wizard-chip--confirm').click();
    await page.locator('.wizard-chip', { hasText: '2 people' }).click();
    await page.locator('.wizard-chip', { hasText: '$60–100/day' }).click();
    await expect(page.locator('.wizard-chip', { hasText: 'Nope, all open' })).toBeVisible({ timeout: 8_000 });
  });

  test('anchor "Nope" shows generating step with journey language not skeleton', async ({ page }) => {
    await page.locator('.wizard-chip', { hasText: 'Southeast Asia' }).click();
    await page.locator('.wizard-chip', { hasText: '10 days' }).click();
    await page.locator('.wizard-chip--toggle', { hasText: 'Food-obsessed' }).click();
    await page.locator('.wizard-chip--confirm').click();
    await page.locator('.wizard-chip', { hasText: '2 people' }).click();
    await page.locator('.wizard-chip', { hasText: '$60–100/day' }).click();
    await page.locator('.wizard-chip', { hasText: 'Nope, all open' }).click();

    // Bot should say "mapping out your … journey" not "building your … skeleton"
    const botMessages = page.locator('.wizard-bubble--bot');
    const lastBotMessage = botMessages.last();
    await expect(lastBotMessage).toContainText('mapping out', { timeout: 6_000 });
    await expect(page.locator('.wizard-generating')).toBeVisible({ timeout: 6_000 });
  });

  test('generating step does NOT contain "skeleton" jargon', async ({ page }) => {
    await page.locator('.wizard-chip', { hasText: 'Southeast Asia' }).click();
    await page.locator('.wizard-chip', { hasText: '10 days' }).click();
    await page.locator('.wizard-chip--toggle', { hasText: 'Food-obsessed' }).click();
    await page.locator('.wizard-chip--confirm').click();
    await page.locator('.wizard-chip', { hasText: '2 people' }).click();
    await page.locator('.wizard-chip', { hasText: '$60–100/day' }).click();
    await page.locator('.wizard-chip', { hasText: 'Nope, all open' }).click();

    await expect(page.locator('.wizard-generating')).toBeVisible({ timeout: 6_000 });

    // "Building X-day structure" is replaced by "Creating your X-day itinerary"
    const wizardPage = page.locator('.dashboard-wizard');
    const text = await wizardPage.innerText();
    expect(text).not.toContain('skeleton');
  });
});
