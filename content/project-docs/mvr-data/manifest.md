## APIs

`manifest.py` currently exposes no stable package-level API: its functions are
not re-exported from `mvr_data.__init__`. Writers, readers, and validators use
the following internal interfaces:

| Name | Role |
| --- | --- |
| `load_manifest(root)` | Loads `manifest.yaml` and returns validated data. |
| `validate_manifest_data(data)` | Validates an in-memory manifest mapping. |
| `empty_manifest(...)` | Creates an empty Raw or Embedded manifest. |
| `write_manifest(root, data)` | Validates and atomically writes the manifest. |
| `manifest_json_schema()` | Locates and caches the v1 JSON Schema. |

These names are importable from `mvr_data.manifest`, but should be treated as
internal until promoted to the documented package API.

## Implementation

Loading first parses YAML, then applies the Draft 2020-12 JSON Schema, checks
the format name and supported major version, and verifies the Embedded vector
dtype. Errors preserve the failing manifest path for actionable reports.

`empty_manifest()` initializes `base`, `query`, and `ground_truth` with zero
rows and no shards. Embedded manifests require `dimension`, `dtype`, and
`scoring`; dtype aliases are normalized to stable names such as `float32`.

`write_manifest()` validates before serialization, writes to a temporary file,
and publishes with `os.replace()`. Callers therefore never observe a partially
rewritten `manifest.yaml`.
