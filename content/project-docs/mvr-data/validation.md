## Report model

`src/mvr_data/validation.py` returns structured results instead of stopping at the first error. `ValidationIssue` records severity, code, message, and optional path. `ValidationReport` stores issues and discovered row counts; its `valid` property is false whenever an error is present.

This model supports both human CLI output and JSON automation.

## Validation pipeline

`validate_data(path, deep=False)` performs validation in stages:

1. Confirm the package is a directory and load its manifest.
2. Resolve every declared shard safely.
3. Verify Arrow schemas and declared row counts.
4. Check object IDs and non-empty vectors or components.
5. Validate raw component IDs, modalities, MIME types, asset URIs, and asset presence.
6. Validate ground-truth references, canonical ordering, result counts, ranks, duplicate candidates, finite scores, and score order.

The validator continues where safe, allowing one run to expose multiple independent problems.

## Deep validation

With `deep=True`, shard hashes are recomputed, every raw asset is verified against the digest encoded in its `payload_uri`, and `checksums.sha256` is compared with every regular package file. Deep mode costs additional I/O but verifies content integrity rather than structure alone.

```python
from mvr_data import validate_data

report = validate_data("tiny-mvr", deep=True)
if not report.valid:
    print(report.as_dict())
```
