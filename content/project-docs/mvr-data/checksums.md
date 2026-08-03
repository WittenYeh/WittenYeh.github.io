## APIs

The package root exports two checksum functions:

| API | Role |
| --- | --- |
| `write_checksums(root)` | Regenerates `checksums.sha256` and returns its path. |
| `verify_checksums(root)` | Returns all integrity errors; an empty list means success. |

## Implementation

File discovery recursively selects regular package files, excludes symlinks
and `checksums.sha256` itself, and sorts POSIX-relative paths for reproducible
output. Files are hashed in one-megabyte chunks and written as:

```text
<64-character-sha256>  <relative/path>
```

Writing uses a temporary file followed by `os.replace()`. Verification requires
lowercase SHA-256 values, two spaces before each safe relative path, and unique
entries. It compares expected and actual path sets before hashing common files,
then reports missing, unlisted, and modified files together.
