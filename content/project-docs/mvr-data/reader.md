## Module responsibility

`src/mvr_data/reader.py` provides a small streaming interface over a package. `open_data(path)` returns a `DataReader`, which resolves the package root, loads the manifest, and records whether the data is raw or embedded.

## Safe shard resolution

Before opening a shard, `_resolve_shard()` rejects empty paths, NUL bytes, backslashes, URI schemes, absolute paths, parent traversal, and paths outside the expected table directory. It also resolves the candidate against the package root to prevent escaping through path normalization.

## Streaming Arrow batches

`iter_batches(table)` selects the exact expected schema, then follows the shard order declared in the manifest. Each shard is memory-mapped and opened as an Arrow IPC file. The stored schema must match exactly, including metadata, before any record batch is yielded.

Convenience methods expose the three tables:

```python
reader.iter_base()
reader.iter_queries()
reader.iter_ground_truth()
```

This design keeps memory proportional to a record batch rather than the full
collection size.

## Materialized reads

`read_table(table)` collects all streamed batches into one `pyarrow.Table`. It
is convenient for small packages and analysis code, but callers working with
benchmark-scale data should retain the iterator API to avoid unnecessary
memory use.
