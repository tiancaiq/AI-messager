# Frozen pre-migration evidence

pre-migration.json was captured from the running, unmodified registry/engine at
a77f476b532c6ddd81eadbca835b312425fd4f1c on 2026-09-17 before Phase 7 edits.
It includes source-file SHA-256 values, all 21 normalized definitions, 21 integration
context/plan pairs and 132 direct probes, including one-sided conflicts,
deduplication, ranking and both 12-rule caps. Source hashes describe the original
working files (including their line endings).

This is historical test evidence, not an editable production registry. Never regenerate
it from migrated data to fix a failure. Intentional behavior revisions must retain
the historical evidence and explain new expectations in separate tests.
