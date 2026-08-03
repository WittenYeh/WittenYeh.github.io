## APIs

The package root exports two stable Manifest APIs:

### `load_manifest`

```python
load_manifest(root: str | os.PathLike[str]) -> dict[str, Any]
```

Loads `manifest.yaml`, validates it, and returns the parsed Manifest mapping.
`root` may point to either a package directory or directly to its
`manifest.yaml` file.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `str \| os.PathLike[str]` | Package root or `manifest.yaml` path. |

**Returns**

The validated Manifest as a `dict[str, Any]`.

### `validate_manifest_data`

```python
validate_manifest_data(data: Any) -> dict[str, Any]
```

Validates an in-memory value against the Manifest JSON Schema and MVR-Data
format rules. The value must be a mapping.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `data` | `Any` | In-memory value to validate as an MVR-Data Manifest. |

**Returns**

The same validated Manifest mapping.

## Example

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
