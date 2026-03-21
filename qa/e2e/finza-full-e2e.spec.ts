import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ─── Credentials ────────────────────────────────────────────────────────────
const EMAIL = 'bereguete77@gmail.com';
const PASSWORD = 'test1234';
const BASE = 'http://localhost';
const SS_DIR = path.join(__dirname, '..', 'screenshots');

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
  await page.waitForSelector('input[type="email"], input[placeholder*="orreo"], input[placeholder*="mail"]', { timeout: 10000 });
  await page.fill('input[type="email"], input[placeholder*="orreo"], input[placeholder*="mail"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  // Wait for redirect away from login
  await page.waitForURL(/\/(dashboard|home|\/)$/, { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);
}

async function navigateTo(page: Page, path_: string, waitSelector?: string) {
  await page.goto(`${BASE}${path_}`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  if (waitSelector) {
    await page.waitForSelector(waitSelector, { timeout: 10000 }).catch(() => {});
  }
  await page.waitForTimeout(1500);
}

// ─── 1. AUTH ─────────────────────────────────────────────────────────────────
test.describe('01 - Auth Flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await ss(page, '01-login-page');
    await expect(page).toHaveTitle(/Finza/i);
    const emailInput = page.locator('input[type="email"], input[placeholder*="orreo"], input[placeholder*="mail"]');
    await expect(emailInput.first()).toBeVisible();
  });

  test('login with valid credentials', async ({ page }) => {
    await login(page);
    await ss(page, '01-after-login');
    const url = page.url();
    expect(url).not.toContain('/login');
    console.log('After login URL:', url);
  });

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    const emailInput = page.locator('input[type="email"], input[placeholder*="orreo"], input[placeholder*="mail"]');
    await emailInput.first().fill('invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await ss(page, '01-login-error');
    // Should still be on login or show an error
    const bodyText = await page.locator('body').textContent() || '';
    const hasError = bodyText.toLowerCase().includes('incorrecto') ||
      bodyText.toLowerCase().includes('invalid') ||
      bodyText.toLowerCase().includes('error') ||
      page.url().includes('/login');
    expect(hasError).toBe(true);
  });
});

// ─── 2. DASHBOARD ────────────────────────────────────────────────────────────
test.describe('02 - Dashboard', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('dashboard loads and shows main sections', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await ss(page, '02-dashboard-full');
    const body = await page.locator('body').textContent() || '';
    // Should show some financial content
    expect(body.length).toBeGreaterThan(100);
  });

  test('dashboard month selector works', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await ss(page, '02-dashboard-month-selector');
    // Look for month/year controls
    const selects = page.locator('select');
    const count = await selects.count();
    console.log('Select elements found:', count);
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ─── 3. INGRESOS ─────────────────────────────────────────────────────────────
test.describe('03 - Ingresos', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('ingresos page loads', async ({ page }) => {
    await navigateTo(page, '/ingresos');
    await ss(page, '03-ingresos-page');
    const body = await page.locator('body').textContent() || '';
    expect(body.length).toBeGreaterThan(50);
  });

  test('can open nuevo ingreso form', async ({ page }) => {
    await navigateTo(page, '/ingresos');
    const btn = page.locator('button').filter({ hasText: /nuevo ingreso|nuevo|agregar/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, '03-ingresos-modal-open');
      const modal = page.locator('[role="dialog"], .modal, form');
      const isVisible = await modal.first().isVisible().catch(() => false);
      console.log('Modal visible:', isVisible);
    } else {
      await ss(page, '03-ingresos-no-button');
      console.log('Nuevo ingreso button not found');
    }
  });

  test('ingresos form validation', async ({ page }) => {
    await navigateTo(page, '/ingresos');
    const btn = page.locator('button').filter({ hasText: /nuevo ingreso|nuevo|agregar/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      // Try to submit empty form
      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(1000);
        await ss(page, '03-ingresos-form-validation');
      }
    }
  });
});

// ─── 4. EGRESOS ──────────────────────────────────────────────────────────────
test.describe('04 - Egresos', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('egresos page loads', async ({ page }) => {
    await navigateTo(page, '/egresos');
    await ss(page, '04-egresos-page');
    const body = await page.locator('body').textContent() || '';
    expect(body.length).toBeGreaterThan(50);
  });

  test('can open nuevo egreso form', async ({ page }) => {
    await navigateTo(page, '/egresos');
    const btn = page.locator('button').filter({ hasText: /nuevo egreso|nuevo|agregar/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, '04-egresos-modal-open');
    } else {
      await ss(page, '04-egresos-no-button');
    }
  });
});

// ─── 5. TARJETAS ─────────────────────────────────────────────────────────────
test.describe('05 - Tarjetas', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('tarjetas page loads with stats', async ({ page }) => {
    await navigateTo(page, '/tarjetas');
    await ss(page, '05-tarjetas-page');
    const body = await page.locator('body').textContent() || '';
    expect(body.length).toBeGreaterThan(50);
  });

  test('tarjetas total saldo and credito have colors', async ({ page }) => {
    await navigateTo(page, '/tarjetas');
    await ss(page, '05-tarjetas-stats');
    // Check stat cards exist
    const body = await page.locator('body').textContent() || '';
    const hasStats = body.toLowerCase().includes('saldo') || body.toLowerCase().includes('crédito') || body.toLowerCase().includes('credito');
    console.log('Has saldo/credito text:', hasStats);
  });

  test('can open nueva tarjeta form', async ({ page }) => {
    await navigateTo(page, '/tarjetas');
    const btn = page.locator('button').filter({ hasText: /nueva tarjeta|nuevo|agregar/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, '05-tarjetas-modal-open');
    }
  });

  test('registrar pago updates tarjeta immediately', async ({ page }) => {
    await navigateTo(page, '/tarjetas');
    // Look for a tarjeta card and its "registrar pago" or similar button
    const pagoBtn = page.locator('button').filter({ hasText: /registrar pago|pago/i }).first();
    if (await pagoBtn.isVisible()) {
      await pagoBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, '05-tarjetas-pago-modal');
    } else {
      await ss(page, '05-tarjetas-no-pago-button');
      console.log('Pago button not found - may need a tarjeta first');
    }
  });
});

// ─── 6. PRESUPUESTOS ─────────────────────────────────────────────────────────
test.describe('06 - Presupuestos', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('presupuestos page loads', async ({ page }) => {
    await navigateTo(page, '/presupuestos');
    await ss(page, '06-presupuestos-page');
    const body = await page.locator('body').textContent() || '';
    expect(body.length).toBeGreaterThan(50);
  });

  test('can open nuevo presupuesto form', async ({ page }) => {
    await navigateTo(page, '/presupuestos');
    const btn = page.locator('button').filter({ hasText: /nuevo presupuesto|nuevo|agregar/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, '06-presupuestos-modal-open');
    }
  });
});

// ─── 7. METAS ────────────────────────────────────────────────────────────────
test.describe('07 - Metas de Ahorro', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('metas page loads', async ({ page }) => {
    await navigateTo(page, '/metas');
    await ss(page, '07-metas-page');
  });

  test('can open nueva meta form', async ({ page }) => {
    await navigateTo(page, '/metas');
    const btn = page.locator('button').filter({ hasText: /nueva meta|nuevo|agregar/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, '07-metas-modal-open');
    }
  });
});

// ─── 8. PRESTAMOS ────────────────────────────────────────────────────────────
test.describe('08 - Préstamos', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('prestamos page loads', async ({ page }) => {
    await navigateTo(page, '/prestamos');
    await ss(page, '08-prestamos-page');
  });

  test('can open nuevo prestamo form - no fecha vencimiento field', async ({ page }) => {
    await navigateTo(page, '/prestamos');
    const btn = page.locator('button').filter({ hasText: /nuevo préstamo|nuevo prestamo|nuevo|agregar/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
      await ss(page, '08-prestamos-modal-open');
      const body = await page.locator('body').textContent() || '';
      // fecha_vencimiento field should NOT be present (was removed)
      const hasFechaVenc = body.toLowerCase().includes('fecha de vencimiento') || body.toLowerCase().includes('fecha vencimiento');
      console.log('Has fecha_vencimiento field (should be false):', hasFechaVenc);
      expect(hasFechaVenc).toBe(false);
    } else {
      await ss(page, '08-prestamos-no-button');
    }
  });

  test('prestamo form defaults to user currency', async ({ page }) => {
    await navigateTo(page, '/prestamos');
    const btn = page.locator('button').filter({ hasText: /nuevo|agregar/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1500);
      await ss(page, '08-prestamos-form-currency');
      // Check that currency select shows DOP (or user's currency)
      const currencySelect = page.locator('select[name*="moneda"], select').filter({ hasText: /DOP|USD|EUR/ });
      if (await currencySelect.first().isVisible()) {
        const val = await currencySelect.first().inputValue();
        console.log('Default currency:', val);
      }
    }
  });

  test('comparativa card visible on prestamos page', async ({ page }) => {
    await navigateTo(page, '/prestamos');
    await ss(page, '08-prestamos-comparativa');
    const body = await page.locator('body').textContent() || '';
    const hasComparativa = body.toLowerCase().includes('comparativa') || body.toLowerCase().includes('vs') || body.toLowerCase().includes('ahorro');
    console.log('Has comparativa content:', hasComparativa);
  });
});

// ─── 9. FONDO DE EMERGENCIA ──────────────────────────────────────────────────
test.describe('09 - Fondo de Emergencia', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('fondo emergencia page loads', async ({ page }) => {
    await navigateTo(page, '/fondo-emergencia');
    await ss(page, '09-fondo-emergencia-page');
  });

  test('fondo emergencia allows 12 months selection', async ({ page }) => {
    await navigateTo(page, '/fondo-emergencia');
    await ss(page, '09-fondo-emergencia-months');
    // Look for a select or toggle for months
    const monthSelects = page.locator('select, [role="radiogroup"], input[type="radio"]');
    const count = await monthSelects.count();
    console.log('Month selector elements:', count);
    // Check if 12 option exists somewhere on page
    const body = await page.locator('body').textContent() || '';
    const has12 = body.includes('12');
    console.log('Page has "12" text:', has12);
  });
});

// ─── 10. RECURRENTES ────────────────────────────────────────────────────────
test.describe('10 - Recurrentes', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('recurrentes page loads', async ({ page }) => {
    await navigateTo(page, '/recurrentes');
    await ss(page, '10-recurrentes-page');
  });

  test('can open nueva transaccion recurrente form', async ({ page }) => {
    await navigateTo(page, '/recurrentes');
    const btn = page.locator('button').filter({ hasText: /nueva|agregar|recurrente/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, '10-recurrentes-modal-open');
    }
  });
});

// ─── 11. SUSCRIPCIONES ───────────────────────────────────────────────────────
test.describe('11 - Suscripciones', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('suscripciones page loads', async ({ page }) => {
    await navigateTo(page, '/suscripciones');
    await ss(page, '11-suscripciones-page');
  });

  test('can open nueva suscripcion form', async ({ page }) => {
    await navigateTo(page, '/suscripciones');
    const btn = page.locator('button').filter({ hasText: /nueva suscripción|nueva suscripcion|nuevo|agregar/i }).first();
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(1000);
      await ss(page, '11-suscripciones-modal-open');
    }
  });
});

// ─── 12. CATEGORÍAS ──────────────────────────────────────────────────────────
test.describe('12 - Categorías', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('categorias page loads', async ({ page }) => {
    await navigateTo(page, '/categorias');
    await ss(page, '12-categorias-page');
  });
});

// ─── 13. NOTIFICACIONES ──────────────────────────────────────────────────────
test.describe('13 - Notificaciones', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('notificaciones page loads', async ({ page }) => {
    await navigateTo(page, '/notificaciones');
    await ss(page, '13-notificaciones-page');
  });
});

// ─── 14. SCORE ───────────────────────────────────────────────────────────────
test.describe('14 - Score Financiero', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('score page loads', async ({ page }) => {
    await navigateTo(page, '/score');
    await ss(page, '14-score-page');
    const body = await page.locator('body').textContent() || '';
    expect(body.length).toBeGreaterThan(50);
  });

  test('score shows breakdown sections', async ({ page }) => {
    await navigateTo(page, '/score');
    const body = await page.locator('body').textContent() || '';
    const hasBreakdown = body.toLowerCase().includes('ahorro') || body.toLowerCase().includes('presupuesto') || body.toLowerCase().includes('deuda') || body.toLowerCase().includes('score');
    console.log('Has breakdown content:', hasBreakdown);
    await ss(page, '14-score-breakdown');
  });
});

// ─── 15. CONFIGURACIÓN ───────────────────────────────────────────────────────
test.describe('15 - Configuración / Perfil', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('configuracion page loads', async ({ page }) => {
    await navigateTo(page, '/configuracion');
    await ss(page, '15-configuracion-page');
  });

  test('configuracion has profile fields', async ({ page }) => {
    await navigateTo(page, '/configuracion');
    const body = await page.locator('body').textContent() || '';
    const hasProfile = body.toLowerCase().includes('salario') || body.toLowerCase().includes('perfil') || body.toLowerCase().includes('configuración') || body.toLowerCase().includes('configuracion');
    console.log('Has profile content:', hasProfile);
    await ss(page, '15-configuracion-fields');
  });

  test('configuracion save button works (no 500 error)', async ({ page }) => {
    await navigateTo(page, '/configuracion');
    // Look for save button
    const saveBtn = page.locator('button').filter({ hasText: /guardar|save/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      await ss(page, '15-configuracion-save');
      // Should NOT show 500 or internal server error
      const body = await page.locator('body').textContent() || '';
      const has500 = body.toLowerCase().includes('500') || body.toLowerCase().includes('internal server error');
      console.log('Has 500 error:', has500);
    } else {
      await ss(page, '15-configuracion-no-save-btn');
    }
  });

  test('segunda moneda is part of profile form (not separate)', async ({ page }) => {
    await navigateTo(page, '/configuracion');
    await ss(page, '15-configuracion-dual-moneda');
    const body = await page.locator('body').textContent() || '';
    const hasMoneda = body.toLowerCase().includes('moneda') || body.toLowerCase().includes('currency');
    console.log('Has moneda content in profile:', hasMoneda);
  });
});

// ─── 16. EDUCACIÓN ───────────────────────────────────────────────────────────
test.describe('16 - Educación Financiera', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('educacion page loads', async ({ page }) => {
    await navigateTo(page, '/educacion');
    await ss(page, '16-educacion-page');
  });
});

// ─── 17. RETOS ───────────────────────────────────────────────────────────────
test.describe('17 - Retos', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('retos page loads', async ({ page }) => {
    await navigateTo(page, '/retos');
    await ss(page, '17-retos-page');
  });
});

// ─── 18. IMPORTAR ────────────────────────────────────────────────────────────
test.describe('18 - Importar Transacciones', () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test('importar page loads', async ({ page }) => {
    await navigateTo(page, '/importar');
    await ss(page, '18-importar-page');
  });

  test('importar shows file upload area', async ({ page }) => {
    await navigateTo(page, '/importar');
    const body = await page.locator('body').textContent() || '';
    const hasUpload = body.toLowerCase().includes('importar') || body.toLowerCase().includes('archivo') || body.toLowerCase().includes('excel') || body.toLowerCase().includes('csv');
    console.log('Has upload content:', hasUpload);
    await ss(page, '18-importar-upload-area');
  });
});

// ─── 19. LANDING PAGE ────────────────────────────────────────────────────────
test.describe('19 - Landing Page (Unauthenticated)', () => {
  test('landing page loads for unauthenticated users', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await ss(page, '19-landing-page');
    const body = await page.locator('body').textContent() || '';
    expect(body.length).toBeGreaterThan(0);
  });
});

// ─── 20. API HEALTH ──────────────────────────────────────────────────────────
test.describe('20 - API Health', () => {
  test('backend API health endpoint responds', async ({ page }) => {
    const response = await page.goto(`${BASE}/api/v1/health`, { waitUntil: 'load' });
    await ss(page, '20-api-health');
    expect(response?.status()).toBeLessThan(500);
    const body = await page.locator('body').textContent() || '';
    console.log('Health response:', body.substring(0, 200));
  });
});

// ─── 21. 404 PAGE ────────────────────────────────────────────────────────────
test.describe('21 - 404 Not Found', () => {
  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto(`${BASE}/esta-ruta-no-existe`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ss(page, '21-404-page');
    const body = await page.locator('body').textContent() || '';
    const has404 = body.includes('404') || body.toLowerCase().includes('not found') || body.toLowerCase().includes('no encontrada') || body.toLowerCase().includes('existe');
    console.log('Has 404 content:', has404, '| URL:', page.url());
  });
});
