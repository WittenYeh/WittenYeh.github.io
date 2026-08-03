## CLI APIs

The installed `mvrdata` entry point provides six commands:

| Command | Role |
| --- | --- |
| `init` | Creates an empty Raw or Embedded package. |
| `inspect` | Summarizes manifest, table, shard, and vector information. |
| `validate` | Reports structural validation, with `-d` / `--detail` for integrity checks. |
| `checksum` | Verifies checksums, or refreshes them with `-r` / `--refresh`. |
| `pack` | Creates a reproducible `.tar.zst` archive. |
| `unpack` | Safely extracts a transport archive. |

Exit code `0` means success, `1` means validation or checksum failure, and `2`
means invalid input or an operational error.

## Package APIs

`mvr_data.__init__` defines the stable Python surface:

| Area | Exported APIs |
| --- | --- |
| Manifest | `load_manifest`, `validate_manifest_data` |
| Reading | `open_data`, `DataReader` |
| Writing | `RawComponent`, `RawDataWriter`, `EmbeddedDataWriter` |
| Validation | `validate_data`, `ValidationIssue`, `ValidationReport` |
| Integrity | `write_checksums`, `verify_checksums` |
| Transport | `pack_data`, `unpack_data` |

Module-level helpers not re-exported here are internal and may change. The
package currently provides no native C++ API; the format itself remains
language-independent and can be consumed through Apache Arrow implementations.

## Implementation

`pyproject.toml` connects the terminal command to the Python dispatcher:

```toml
[project.scripts]
mvrdata = "mvr_data.cli:main"
```

`build_parser()` defines command arguments and `main()` dispatches to the same
reader, writer, validation, checksum, and packaging functions exposed to
Python. Expected `OSError` and `ValueError` failures are converted to concise
stderr messages. `__init__.py` centralizes supported imports and declares the
package version, while generated `egg-info` metadata does not implement runtime
behavior.
