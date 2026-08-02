## Shared writer lifecycle

`src/mvr_dataset/writer.py` implements `_DatasetWriter`, the common lifecycle behind raw and embedded writers. Construction refuses to overwrite a non-empty directory, creates table directories, and initializes a valid empty manifest.

Rows are buffered per table. When `shard_rows` is reached, `_flush()` converts the buffer using the exact Arrow schema, writes a Zstandard-compressed IPC file through a temporary path, atomically renames it, hashes it, and updates manifest row and shard metadata.

Closing flushes every table, writes the manifest, and generates whole-package checksums. The context manager only finalizes when the `with` block exits without an exception.

## RawDatasetWriter

`RawDatasetWriter` accepts `RawComponent` values. It validates component IDs, modality tokens, MIME types, and source files. Each source file is hashed and copied to:

```text
assets/sha256/<first-two-digest-characters>/<full-digest>
```

Existing assets with the same digest are reused, providing package-local deduplication.

## EmbeddedDatasetWriter

`EmbeddedDatasetWriter` parses and canonicalizes the requested dtype, requires at least one vector per object, and verifies every vector dimension. Float16 values are explicitly converted to NumPy half-float scalars to satisfy nested PyArrow conversion behavior.

## Ground-truth invariants

`add_ground_truth()` verifies that query and base references exist, candidates are unique, ranks are contiguous, scores are finite and correctly ordered, and each query has exactly the required result count. Query IDs must arrive in ascending order, which guarantees canonical output without a global in-memory sort. Once ground-truth writing starts, no more base or query objects may be added.
