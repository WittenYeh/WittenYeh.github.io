## APIs

The package root exports the validation function and report types:

| API | Role |
| --- | --- |
| `validate_data(path, detail=False)` | Returns a complete `ValidationReport`. |
| `ValidationReport` | Stores package kind, row counts, issues, and the derived `valid` state. |
| `ValidationIssue` | Records severity, code, message, and optional package path. |

```python
from mvr_data import validate_data

report = validate_data("tiny-mvr", detail=True)
if not report.valid:
    print(report.as_dict())
```

`as_dict()` makes reports suitable for JSON automation as well as human CLI
output.

## Implementation

Validation loads the manifest, resolves every shard safely, checks exact Arrow
schemas and row counts, then validates object IDs, vectors or components, Raw
asset references, and ground-truth references and judgments. It continues
where safe so one run can report multiple independent problems.

With `detail=True`, it additionally recomputes manifest shard hashes, verifies
Raw payloads against the digest encoded in `payload_uri`, and compares
`checksums.sha256` with every regular package file. The equivalent CLI forms
are `mvrdata validate -d <path>` and `mvrdata validate --detail <path>`.
