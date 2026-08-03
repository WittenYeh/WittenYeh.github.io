## APIs

The package root exports two transport functions:

### `pack_data`

```python
pack_data(
    source: str | os.PathLike[str],
    destination: str | os.PathLike[str],
    *,
    compression_level: int = 10,
    validate: bool = True,
) -> Path
```

Creates a reproducible `.tar.zst` transport archive. By default, packing stops
if detailed package validation fails.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `source` | `str \| os.PathLike[str]` | Root directory of the data package to archive. |
| `destination` | `str \| os.PathLike[str]` | New archive path; an existing target is never overwritten. |
| `compression_level` | `int` | Zstandard compression level. Defaults to `10`. |
| `validate` | `bool` | Run detailed validation before packing. Defaults to `True`. |

**Returns**

The path to the created archive.

### `unpack_data`

```python
unpack_data(
    source: str | os.PathLike[str],
    destination: str | os.PathLike[str],
) -> Path
```

Safely extracts an MVR-Data `.tar.zst` archive into a new or empty directory.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `source` | `str \| os.PathLike[str]` | Path to the archive to extract. |
| `destination` | `str \| os.PathLike[str]` | New or empty extraction directory. |

**Returns**

The resolved destination directory.

Both functions refuse to overwrite existing non-empty targets.

## Implementation

Packing performs detailed validation by default, sorts entries, and rejects
symlinks and special files. It normalizes user/group IDs and names, timestamps,
modes, and PAX headers, then streams the tar archive through Zstandard. A
temporary file plus `os.replace()` provides atomic publication.

Extraction treats the archive as untrusted input. It rejects absolute paths,
parent traversal, NUL bytes, duplicate members, links, devices, special files,
and paths escaping the destination. Files are created exclusively. On failure,
the newly created destination is removed so callers cannot mistake a partial
extraction for a complete package.
