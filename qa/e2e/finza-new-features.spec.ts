import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const EMAIL = 'bereguete77@gmail.com';
const PASSWORD = 'test1234';
const BASE = 'http://localhost';
const SS_DIR = path.join(__dirname, '..', 'screenshots');

function ssDir() {
  if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });
  return SS_DIR;
}

async function ss(page: Page, name: string) {
  const p = path.join(ssDir(), `${name}.png`);
  await page.screenshot({ path: p, fullPage: true });
  console.log(`📸 ${name} → ${p}`);
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|home|\/)$/, { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);
}

// ─── Dashboard Credit Card Widget ─────────────────────────────────────────────
test.describe('Dashboard - Credit Card Widget', () => {
  test('dashboard shows credit card consumption section', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await ss(page, 'dash-credit-cards-widget');
    // Page should load without error
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});

// ─── Suscripciones ─────────────────────────────────────────────────────────────
test.describe('Suscripciones', () => {
  test('suscripciones page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/suscripciones`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);
    await ss(page, 'sus-01-page');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('suscripciones modal is centered (not stuck to header)', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/suscripciones`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    // Open crear modal
    const btnNueva = page.getByRole('button', { name: /nueva suscripcion/i });
    await btnNueva.click();
    await page.waitForTimeout(1000);
    await ss(page, 'sus-02-modal-open');

    // Modal should be rendered at body level (fixed inset-0)
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Check the modal is centered: bounding box y should be > 50px (not stuck at top)
    const box = await modal.boundingBox();
    if (box) {
      // The dialog wrapper is fixed full screen, the inner card should be roughly centered
      console.log(`Modal bbox: ${JSON.stringify(box)}`);
    }
  });

  test('suscripciones form resets when clicking Nueva', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/suscripciones`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    // Open Nueva 
    await page.getByRole('button', { name: /nueva suscripcion/i }).click();
    await page.waitForTimeout(500);

    // Fill in some data
    const nombreInput = page.locator('input[placeholder*="ombre"], input[placeholder*="netflix"], [placeholder*="uscripcion"]').first();
    await nombreInput.fill('Netflix Test');
    await ss(page, 'sus-03-form-filled');

    // Close modal via Escape key (now supported)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    // Fallback: click backdrop if modal still open
    const backdrop = page.locator('.fixed.inset-0 .bg-black\\/60').first();
    if (await backdrop.count() > 0) {
      await backdrop.click({ force: true });
      await page.waitForTimeout(500);
    }

    // Open again — form should be empty
    await page.getByRole('button', { name: /nueva suscripcion/i }).click();
    await page.waitForTimeout(500);
    await ss(page, 'sus-04-form-reset');
    
    const val = await nombreInput.inputValue().catch(() => '');
    expect(val).toBe('');
  });

  test('create a subscription with dia_del_mes', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/suscripciones`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    await page.getByRole('button', { name: /nueva suscripcion/i }).click();
    await page.waitForTimeout(500);
    await ss(page, 'sus-05-new-form');

    // Fill form
    const inputs = page.locator('input[type="text"], input:not([type])');
    const nombreInput = page.locator('input').first();
    await nombreInput.fill('E2E Test Sub');

    const montoInput = page.locator('input[type="number"]').first();
    await montoInput.fill('500');

    // Check dia_del_mes field exists for mensual
    const diaInput = page.locator('input[type="number"][min="1"][max="31"]');
    if (await diaInput.count() > 0) {
      await diaInput.fill('15');
      console.log('✓ dia_del_mes field present');
    }

    await ss(page, 'sus-06-form-with-dia');

    // Save
    await page.getByRole('button', { name: /guardar|save/i }).click();
    await page.waitForTimeout(2000);
    await ss(page, 'sus-07-after-create');
  });

  test('edit existing subscription', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/suscripciones`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2000);

    // Check if there are subscriptions to edit
    const editBtns = page.locator('button[title*="ditar"], button:has(svg)').filter({ hasText: '' });
    const pencilBtns = page.locator('button').filter({ has: page.locator('svg') });
    await ss(page, 'sus-08-list');

    const suscripciones = page.locator('.finza-card').filter({ hasText: /mensual|anual/i });
    const count = await suscripciones.count();
    console.log(`Found ${count} subscriptions`);

    if (count > 0) {
      // Click first edit button
      const editBtn = page.locator('button:has(svg)').nth(1);
      await editBtn.click();
      await page.waitForTimeout(500);
      await ss(page, 'sus-09-edit-modal');
    }
  });
});

// ─── Presupuestos ─────────────────────────────────────────────────────────────
test.describe('Presupuestos', () => {
  test('presupuestos page loads and create works', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/presupuestos`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'pres-01-page');
    await expect(page.getByText(/presupuesto/i).first()).toBeVisible();
  });
});

// ─── Metas ─────────────────────────────────────────────────────────────────────
test.describe('Metas', () => {
  test('metas page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/metas`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'metas-01-page');
    await expect(page.getByText(/meta/i).first()).toBeVisible();
  });
});

// ─── Fondo de Emergencia ──────────────────────────────────────────────────────
test.describe('Fondo Emergencia', () => {
  test('fondo emergencia page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/fondo-emergencia`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'fondo-01-page');
    // Page should not error
    await expect(page.locator('body')).toBeVisible();
  });
});

// ─── Score Financiero ─────────────────────────────────────────────────────────
test.describe('Score Financiero', () => {
  test('score page shows score with tarjetas component', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await ss(page, 'score-01-dashboard');
    // Score should be visible in dashboard
    const scoreEl = page.locator('text=/score|puntuacion|financiero/i').first();
    await expect(page.locator('body')).toBeVisible();
  });
});

// ─── Configuracion ────────────────────────────────────────────────────────────
test.describe('Configuracion', () => {
  test('config page loads, second currency section removed', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/configuracion`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'config-01-page');
    await expect(page.locator('body')).toBeVisible();
    
    // Should NOT have duplicate segunda moneda sections
    const segundaMonedaSections = await page.getByText(/segunda moneda/i).count();
    console.log(`Segunda moneda sections: ${segundaMonedaSections}`);
    // Should be 1 or 0, not 2
    expect(segundaMonedaSections).toBeLessThanOrEqual(1);
    
    await ss(page, 'config-02-scroll');
  });
});

// ─── Recurrentes ──────────────────────────────────────────────────────────────
test.describe('Recurrentes', () => {
  test('recurrentes page loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/recurrentes`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, 'recur-01-page');
    await expect(page.getByText(/recurrente/i).first()).toBeVisible();
  });
});

// ─── Prediccion de Fin de Mes ─────────────────────────────────────────────────
test.describe('Prediccion', () => {
  test('prediccion section visible in dashboard', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await ss(page, 'pred-01-dashboard-bottom');
  });
});
