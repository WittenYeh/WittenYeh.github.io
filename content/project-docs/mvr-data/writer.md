## APIs

The package root exports three writer types:

| API | Role |
| --- | --- |
| `RawComponent(...)` | Describes one local Raw payload with its component ID, source path, modality, and MIME type. |
| `RawDataWriter(path, ...)` | Builds Raw base/query objects from ordered `RawComponent` values. |
| `EmbeddedDataWriter(path, dimension=..., dtype=..., scoring=..., ...)` | Builds Embedded base/query objects with package-wide vector settings. |

Both writers support `add_base()`, `add_query()`, `add_ground_truth()`, and
`close()`, and are intended to be used as context managers. Shared constructor
settings include `data_name`, `data_version`, `shard_rows`, description,
license, source, and extensions. Embedded writers additionally accept optional
quantization metadata.

## Implementation

The private `_DataWriter` owns the shared lifecycle. It refuses to overwrite a
non-empty directory, buffers rows by table, and flushes at `shard_rows`. Each
flush uses the canonical Arrow schema, writes a Zstandard-compressed IPC shard
through a temporary file, records its row count and SHA-256 in the manifest,
and atomically publishes it. Closing flushes all tables, writes the manifest,
and refreshes package checksums.

`RawDataWriter` validates component IDs, modalities, MIME types, and source
files. Payloads are deduplicated by SHA-256 under:

```text
assets/sha256/<first-two-digest-characters>/<full-digest>
```

`EmbeddedDataWriter` canonicalizes the numeric dtype, requires at least one
vector per object, and enforces the manifest dimension. Ground-truth insertion
requires existing query/base IDs, relevance from 0 through 32767, non-empty
annotations, and a unique `(query_id, object_id, split_type, pool_id)` tuple.
Once judgments begin, base and query objects can no longer be added.
