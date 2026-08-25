-- Migration: align Marketing Sales WhatsApp device roster with the
-- pre-deploy readiness directive (Nisa / Jessica / Diaz / Irma).
--
-- Context: when the backend boots with the new SALES_DEVICES array it
-- already auto-creates SALES-NISA / SALES-JESSICA / SALES-DIAZ /
-- SALES-IRMA rows (see SalesDeviceManager.bootstrapDevice). This
-- migration cleans up the obsolete legacy rows so the device roster
-- contains exactly the four authoritative Sales identities.
--
-- The legacy rows are CASCADE-linked to self_qr_normalized_events and
-- self_qr_history_runs. Any historical observation tied to the legacy
-- Luthfi/Annisa/Ami/Mutmah devices is dropped as part of this roster
-- realignment. We only ever wipe rows for the four stale internalCodes
-- listed below — no other self_qr_devices row is touched.

DELETE FROM self_qr_devices WHERE "internalCode" IN (
  'SALES-ANNISA',
  'SALES-AMI',
  'SALES-MUTMAH',
  'SALES-LUTHFI'
);
