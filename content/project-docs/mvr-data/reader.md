## APIs

`open_data` and `DataReader` are exported from the package root:

| API | Role |
| --- | --- |
| `open_data(path)` | Opens a package and returns a `DataReader`. |
| `reader.iter_base()` | Streams base-table `RecordBatch` values. |
| `reader.iter_queries()` | Streams query-table `RecordBatch` values. |
| `reader.iter_ground_truth()` | Streams ground-truth `RecordBatch` values. |
| `reader.iter_batches(table)` | Streams any named package table. |
| `reader.read_table(table)` | Materializes one complete table as `pyarrow.Table`. |

Iterator methods are preferred for benchmark-scale data; `read_table()` is a
convenience for smaller packages and analysis workflows.

## Implementation

`DataReader` resolves the package root, loads the validated manifest, and
records the Raw or Embedded kind. Before opening a shard, path validation
rejects empty or remote paths, NUL bytes, backslashes, absolute paths, parent
traversal, paths outside the package, and paths outside the requested table.

`iter_batches()` follows manifest shard order, memory-maps each Arrow IPC file,
and requires its schema—including metadata—to match the canonical expected
schema before yielding record batches. Memory usage therefore stays
proportional to a batch rather than the complete table. `read_table()` simply
collects the same iterator into one Arrow table.
