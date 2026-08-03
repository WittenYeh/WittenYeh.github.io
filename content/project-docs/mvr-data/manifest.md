The package root exports two stable Manifest APIs:

## `load_manifest` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/manifest.py "View source on GitHub")

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

## `validate_manifest_data` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/manifest.py "View source on GitHub")

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

### Implementation

Validation applies the Draft 2020-12 JSON Schema, checks the MVR-Data format
name and supported major version, and verifies the Embedded vector dtype.
Errors retain the failing Manifest path so callers can locate invalid values.

## Example

```python
from mvr_data import load_manifest, validate_manifest_data

manifest = load_manifest("tiny-mvr")
validate_manifest_data(manifest)
```
