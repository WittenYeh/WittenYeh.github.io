## APIs

The package root exports two stable Manifest APIs:

| Name | Role |
| --- | --- |
| `load_manifest(root)` | Loads `manifest.yaml` and returns validated data. |
| `validate_manifest_data(data)` | Validates an in-memory manifest mapping. |

```python
from mvr_data import load_manifest, validate_manifest_data

manifest = load_manifest("tiny-mvr")
validate_manifest_data(manifest)
```

## Implementation

Loading first parses YAML, then applies the Draft 2020-12 JSON Schema, checks
the format name and supported major version, and verifies the Embedded vector
dtype. Errors preserve the failing manifest path for actionable reports.

Package construction initializes `base`, `query`, and `ground_truth` with zero
rows and no shards. Embedded manifests require `dimension`, `dtype`, and
`scoring`; dtype aliases are normalized to stable names such as `float32`.

Manifest persistence validates before serialization, writes to a temporary
file, and publishes with `os.replace()`. Callers therefore never observe a
partially rewritten `manifest.yaml`; package writers also keep shard metadata
and checksums synchronized.
