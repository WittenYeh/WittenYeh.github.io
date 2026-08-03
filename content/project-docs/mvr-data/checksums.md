The package root exports two checksum functions:

## `write_checksums` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/checksums.py "View source on GitHub")

```python
write_checksums(root: str | os.PathLike[str]) -> Path
```

Recomputes every package-file digest and atomically replaces
`checksums.sha256`.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `str \| os.PathLike[str]` | Root directory of the data package. |

**Returns**

The path to the regenerated `checksums.sha256` file.

### Implementation

File discovery recursively selects regular package files, excludes symlinks
and `checksums.sha256` itself, and sorts POSIX-relative paths for reproducible
output. Files are hashed in one-megabyte chunks and written as:

```text
<64-character-sha256>  <relative/path>
```

The checksum file is published atomically through a temporary file and
`os.replace()`.

## `verify_checksums` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/checksums.py "View source on GitHub")

```python
verify_checksums(root: str | os.PathLike[str]) -> list[str]
```

Compares `checksums.sha256` with the package's current regular files and
collects every integrity error it finds.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `str \| os.PathLike[str]` | Root directory of the data package. |

**Returns**

A list of human-readable errors. An empty list means verification succeeded.

### Implementation

Parsing requires lowercase SHA-256 values, two spaces before each safe relative
path, and unique entries. Verification compares expected and actual path sets
before hashing common files, then reports missing, unlisted, and modified files
together.
