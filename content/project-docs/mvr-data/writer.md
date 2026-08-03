## Shared writer lifecycle

`src/mvr_data/writer.py` implements `_DataWriter`, the common lifecycle behind raw and embedded writers. Construction refuses to overwrite a non-empty directory, creates table directories, and initializes a valid empty manifest.

Rows are buffered per table. When `shard_rows` is reached, `_flush()` converts the buffer using the exact Arrow schema, writes a Zstandard-compressed IPC file through a temporary path, atomically renames it, hashes it, and updates manifest row and shard metadata.

Closing flushes every table, writes the manifest, and generates whole-package checksums. The context manager only finalizes when the `with` block exits without an exception.

## RawDataWriter

`RawDataWriter` accepts `RawComponent` values. It validates component IDs, modality tokens, MIME types, and source files. Each source file is hashed and copied to:

```text
assets/sha256/<first-two-digest-characters>/<full-digest>
```

Existing assets with the same digest are reused, providing package-local deduplication.

## EmbeddedDataWriter

`EmbeddedDataWriter` parses and canonicalizes the requested dtype, requires at least one vector per object, and verifies every vector dimension. Float16 values are explicitly converted to NumPy half-float scalars to satisfy nested PyArrow conversion behavior.

## Ground-truth invariants

Each `add_ground_truth()` call writes one judged query-document pair. It checks
that `query_id` exists in the query table, `document_id` exists in the base
table, `relevance` is an integer from 0 through 32767, and `split_type`,
`judgment_source`, and `pool_id` are non-empty strings.

The tuple `(query_id, document_id, split_type, pool_id)` must be unique, while
multiple documents can be judged for the same query. Every query must have at
least one judgment when the package contains base objects. Row order is not a
ranking and has no semantic meaning. Once ground-truth writing starts, no more
base or query objects may be added.
