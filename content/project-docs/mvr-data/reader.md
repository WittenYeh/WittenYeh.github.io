`open_data` and `DataReader` are exported from the package root:

## `DataReader` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/reader.py "View source on GitHub")

```python
DataReader(path: str | os.PathLike[str])
```

Constructs a streaming reader and loads the package's validated Manifest.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `str \| os.PathLike[str]` | Root directory of the data package. |

## `open_data` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/reader.py "View source on GitHub")

```python
open_data(path: str | os.PathLike[str]) -> DataReader
```

Convenience function that opens a package and returns a `DataReader`.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `str \| os.PathLike[str]` | Root directory of the data package. |

**Returns**

A `DataReader` for the package.

## `DataReader.iter_base` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/reader.py "View source on GitHub")

```python
DataReader.iter_base() -> Iterator[pyarrow.RecordBatch]
```

Streams base-table record batches in Manifest shard order.

**Parameters**

None.

**Returns**

An iterator of `pyarrow.RecordBatch` values.

## `DataReader.iter_queries` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/reader.py "View source on GitHub")

```python
DataReader.iter_queries() -> Iterator[pyarrow.RecordBatch]
```

Streams query-table record batches in Manifest shard order.

**Parameters**

None.

**Returns**

An iterator of `pyarrow.RecordBatch` values.

## `DataReader.iter_ground_truth` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/reader.py "View source on GitHub")

```python
DataReader.iter_ground_truth() -> Iterator[pyarrow.RecordBatch]
```

Streams ground-truth record batches in Manifest shard order.

**Parameters**

None.

**Returns**

An iterator of `pyarrow.RecordBatch` values.

## `DataReader.iter_batches` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/reader.py "View source on GitHub")

```python
DataReader.iter_batches(table: str) -> Iterator[pyarrow.RecordBatch]
```

Streams record batches from any canonical package table.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `table` | `str` | One of `base`, `query`, or `ground_truth`. |

**Returns**

An iterator of schema-checked `pyarrow.RecordBatch` values.

### Implementation

The reader rejects empty or remote shard paths, NUL bytes, backslashes,
absolute paths, parent traversal, and paths outside the package or requested
table. It then follows Manifest shard order, memory-maps each Arrow IPC file,
and requires its schema—including metadata—to match the canonical schema before
yielding batches. Memory use therefore remains proportional to one batch.

## `DataReader.read_table` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/reader.py "View source on GitHub")

```python
DataReader.read_table(table: str) -> pyarrow.Table
```

Materializes one complete package table in memory.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `table` | `str` | One of `base`, `query`, or `ground_truth`. |

**Returns**

The complete schema-checked `pyarrow.Table`.

Iterator methods are preferred for benchmark-scale data; `read_table()` is a
convenience for smaller packages and analysis workflows.
