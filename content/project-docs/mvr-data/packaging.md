## APIs

The package root exports two transport functions:

| API | Role |
| --- | --- |
| `pack_data(source, destination, compression_level=10, validate=True)` | Creates a reproducible `.tar.zst` archive and returns its path. |
| `unpack_data(source, destination)` | Safely extracts an archive and returns the package directory. |

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
