The package root exports the validation function and report types:

## `validate_data` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/validation.py "View source on GitHub")

```python
validate_data(
    path: str | os.PathLike[str],
    *,
    detail: bool = False,
) -> ValidationReport
```

Validates package structure, Arrow schemas, row content, IDs, and ground-truth
references without stopping after the first recoverable error.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `str \| os.PathLike[str]` | Root directory of the data package. |
| `detail` | `bool` | Also recompute shard, payload, and package checksums. Defaults to `False`. |

**Returns**

A complete `ValidationReport`.

### Implementation

Validation loads the Manifest, resolves every shard safely, checks exact Arrow
schemas and row counts, then validates object IDs, vectors or components, Raw
asset references, and ground-truth references and judgments. It continues where
safe so one run can report multiple independent problems. With `detail=True`,
it also recomputes shard hashes, verifies Raw payloads against `payload_uri`, and
compares `checksums.sha256` with every regular package file.

## `ValidationIssue` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/validation.py "View source on GitHub")

```python
ValidationIssue(
    severity: str,
    code: str,
    message: str,
    path: str | None = None,
)
```

Represents one validation error or warning.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `severity` | `str` | Issue level, normally `error` or `warning`. |
| `code` | `str` | Stable machine-readable issue category. |
| `message` | `str` | Human-readable explanation. |
| `path` | `str \| None` | Optional package-relative location. |

## `ValidationIssue.as_dict` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/validation.py "View source on GitHub")

```python
ValidationIssue.as_dict() -> dict[str, Any]
```

Serializes the issue to a JSON-compatible mapping.

**Parameters**

None.

**Returns**

A mapping containing `severity`, `code`, `message`, and `path` when present.

## `ValidationReport` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/validation.py "View source on GitHub")

```python
ValidationReport(
    path: str,
    kind: str | None = None,
    issues: list[ValidationIssue] = <factory>,
    counts: dict[str, int] = <factory>,
)
```

Collects the package kind, observed table row counts, and all validation issues.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `str` | Package path represented by the report. |
| `kind` | `str \| None` | Parsed package kind, or `None` before a Manifest is available. |
| `issues` | `list[ValidationIssue]` | Initial issues; defaults to a fresh empty list. |
| `counts` | `dict[str, int]` | Initial table counts; defaults to a fresh empty mapping. |

## `ValidationReport.valid` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/validation.py "View source on GitHub")

```python
ValidationReport.valid -> bool
```

Derived property that is `True` when the report contains no error-level issue.

**Parameters**

None.

## `ValidationReport.error` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/validation.py "View source on GitHub")

```python
ValidationReport.error(
    code: str,
    message: str,
    path: str | None = None,
) -> None
```

Appends an error-level `ValidationIssue` to the report.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `code` | `str` | Stable machine-readable issue category. |
| `message` | `str` | Human-readable explanation. |
| `path` | `str \| None` | Optional package-relative location. |

## `ValidationReport.warning` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/validation.py "View source on GitHub")

```python
ValidationReport.warning(
    code: str,
    message: str,
    path: str | None = None,
) -> None
```

Appends a warning-level `ValidationIssue` to the report.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `code` | `str` | Stable machine-readable issue category. |
| `message` | `str` | Human-readable explanation. |
| `path` | `str \| None` | Optional package-relative location. |

## `ValidationReport.as_dict` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/validation.py "View source on GitHub")

```python
ValidationReport.as_dict() -> dict[str, Any]
```

Serializes the complete report to a JSON-compatible mapping.

**Parameters**

None.

**Returns**

A mapping containing `path`, `kind`, `valid`, `counts`, and serialized `issues`.

## Example

```python
from mvr_data import validate_data

report = validate_data("tiny-mvr", detail=True)
if not report.valid:
    print(report.as_dict())
```

`as_dict()` makes reports suitable for JSON automation as well as human CLI
output.
