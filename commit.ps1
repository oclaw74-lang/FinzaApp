cd C:\Users\josu_\Finza\.claude\worktrees\i18n-audit
git add -A
git commit -m "fix: auditoria i18n completa y correccion de bugs generales

- Remove all hardcoded strings from JSX components (prestamos, metas, tarjetas, fondoEmergencia, configuracion, shared)
- Add missing translation keys to es.ts and en.ts:
  * prestamos: status.activo, form.*, pago.*, row.*, resumen.*, detail.*
  * metas: status.cancelada, form.*, contribucion.*, card.*, detail.*, resumen.*
  * tarjetas: subtitle, nuevaTarjeta, editarTarjeta, totalSaldo, disponibleCredito,
              tarjetasActivas, serverError, sinTarjetas, agregarPrimera, sinMovimientos,
              card.*, form.*, movimiento.*, detalle.*, seccion.*
  * fondoEmergencia: mesesShort, porcentajeMeta, coberturaDesc
  * settings: currencyDOP, currencyUSD, currencyEUR
- Fix duplicate code blocks in PagoForm, PrestamoForm, MetaForm, MetaCard,
  MetasResumenCards, ContribucionForm, PrestamoResumenCards, PrestamoRow
- Fix null/undefined handling: (value ?? 0).toFixed(2) in PagoForm and ContribucionForm
- Fix bug: coberturaDesc uses mesesShort key instead of meses (was duplicating 'de gastos')
- Fix (fondo.porcentaje ?? 0).toFixed(1) null coalescing in FondoEmergenciaPage
- Add useTranslation to: PrestamoForm, PagoForm, PrestamoResumenCards, PrestamoRow,
  MetaForm, ContribucionForm, MetaCard, MetaDetail, MetasResumenCards, ProtectedRoute
- Replace window.confirm hardcoded strings with t() calls
- Replace all aria-label, placeholder, label hardcoded strings with t() keys

Closes #152

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
git push origin fix/i18n-traducciones-auditoria
