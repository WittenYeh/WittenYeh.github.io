## APIs

The package root exports `RawComponent`, `RawDataWriter`, and
`EmbeddedDataWriter`. Both writers are intended to be used as context managers.

### `RawComponent` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
RawComponent(
    component_id: str,
    source: str | os.PathLike[str],
    modality: str,
    media_type: str,
)
```

Describes one local payload that a `RawDataWriter` will copy into the package.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `component_id` | `str` | Non-empty component ID, unique within its object. |
| `source` | `str \| os.PathLike[str]` | Existing local payload file. |
| `modality` | `str` | Extensible modality token, such as `text`, `image`, `audio`, or `video`. |
| `media_type` | `str` | MIME type of the payload, such as `text/plain` or `image/png`. |

### `RawDataWriter` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
RawDataWriter(
    path: str | os.PathLike[str],
    *,
    data_name: str,
    data_version: str = "1",
    shard_rows: int = 50_000,
    description: str | None = None,
    license: str | None = None,
    source: str | None = None,
    extensions: Mapping[str, Any] | None = None,
)
```

Constructs a writer for Raw base/query objects and their local payload assets.
The target directory must be new or empty.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `str \| os.PathLike[str]` | New or empty package directory. |
| `data_name` | `str` | Logical name stored in the Manifest. |
| `data_version` | `str` | Logical data version. Defaults to `"1"`. |
| `shard_rows` | `int` | Maximum buffered rows per Arrow shard. Defaults to `50_000`. |
| `description` | `str \| None` | Optional package description. |
| `license` | `str \| None` | Optional license identifier or statement. |
| `source` | `str \| None` | Optional source or provenance string. |
| `extensions` | `Mapping[str, Any] \| None` | Optional namespaced Manifest extensions. |

### `RawDataWriter.add_base` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
RawDataWriter.add_base(
    object_id: str,
    components: Iterable[RawComponent],
) -> None
```

Adds one Raw object to the base table while preserving component order.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `object_id` | `str` | Non-empty ID, unique within the base table. |
| `components` | `Iterable[RawComponent]` | One or more ordered local payload components. |

### `RawDataWriter.add_query` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
RawDataWriter.add_query(
    object_id: str,
    components: Iterable[RawComponent],
) -> None
```

Adds one Raw object to the query table while preserving component order.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `object_id` | `str` | Non-empty ID, unique within the query table. |
| `components` | `Iterable[RawComponent]` | One or more ordered local payload components. |

### `EmbeddedDataWriter` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
EmbeddedDataWriter(
    path: str | os.PathLike[str],
    *,
    dimension: int,
    dtype: str,
    scoring: Mapping[str, Any],
    quantization: Mapping[str, Any] | None = None,
    data_name: str,
    data_version: str = "1",
    shard_rows: int = 50_000,
    description: str | None = None,
    license: str | None = None,
    source: str | None = None,
    extensions: Mapping[str, Any] | None = None,
)
```

Constructs a writer for Embedded base/query objects with package-wide vector
settings. The target directory must be new or empty.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `str \| os.PathLike[str]` | New or empty package directory. |
| `dimension` | `int` | Positive number of scalar values in every vector. |
| `dtype` | `str` | Fixed-width integer or floating Arrow dtype, such as `float32`. |
| `scoring` | `Mapping[str, Any]` | Scoring definition containing at least a non-empty `scheme`. |
| `quantization` | `Mapping[str, Any] \| None` | Optional package-level quantization metadata. |
| `data_name` | `str` | Logical name stored in the Manifest. |
| `data_version` | `str` | Logical data version. Defaults to `"1"`. |
| `shard_rows` | `int` | Maximum buffered rows per Arrow shard. Defaults to `50_000`. |
| `description` | `str \| None` | Optional package description. |
| `license` | `str \| None` | Optional license identifier or statement. |
| `source` | `str \| None` | Optional source or provenance string. |
| `extensions` | `Mapping[str, Any] \| None` | Optional namespaced Manifest extensions. |

### `EmbeddedDataWriter.add_base` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
EmbeddedDataWriter.add_base(
    object_id: str,
    vectors: Iterable[Iterable[Any]],
) -> None
```

Adds one Embedded object and its ordered vectors to the base table.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `object_id` | `str` | Non-empty ID, unique within the base table. |
| `vectors` | `Iterable[Iterable[Any]]` | One or more vectors matching the package dimension and dtype. |

### `EmbeddedDataWriter.add_query` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
EmbeddedDataWriter.add_query(
    object_id: str,
    vectors: Iterable[Iterable[Any]],
) -> None
```

Adds one Embedded object and its ordered vectors to the query table.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `object_id` | `str` | Non-empty ID, unique within the query table. |
| `vectors` | `Iterable[Iterable[Any]]` | One or more vectors matching the package dimension and dtype. |

### `RawDataWriter.add_ground_truth` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
RawDataWriter.add_ground_truth(
    query_id: str,
    object_id: str,
    relevance: int,
    *,
    split_type: str,
    judgment_source: str,
    pool_id: str,
) -> None
```

Adds one judged query-object pair to a Raw package's ground-truth table.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `query_id` | `str` | ID of an existing object in the query table. |
| `object_id` | `str` | ID of an existing object in the base table. |
| `relevance` | `int` | Relevance level from `0` through `32767`. |
| `split_type` | `str` | Non-empty data split label, such as `test`. |
| `judgment_source` | `str` | Non-empty label source, such as `human`. |
| `pool_id` | `str` | Non-empty candidate-pool identifier. |

### `EmbeddedDataWriter.add_ground_truth` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
EmbeddedDataWriter.add_ground_truth(
    query_id: str,
    object_id: str,
    relevance: int,
    *,
    split_type: str,
    judgment_source: str,
    pool_id: str,
) -> None
```

Adds one judged query-object pair to an Embedded package's ground-truth table.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `query_id` | `str` | ID of an existing object in the query table. |
| `object_id` | `str` | ID of an existing object in the base table. |
| `relevance` | `int` | Relevance level from `0` through `32767`. |
| `split_type` | `str` | Non-empty data split label, such as `test`. |
| `judgment_source` | `str` | Non-empty label source, such as `human`. |
| `pool_id` | `str` | Non-empty candidate-pool identifier. |

### `RawDataWriter.close` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
RawDataWriter.close() -> None
```

Flushes all buffered rows, writes the final Manifest, and refreshes package
checksums. Calling `close()` again has no effect. A successful `with` block
calls this method automatically.

**Parameters**

None.

### `EmbeddedDataWriter.close` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/writer.py "View source on GitHub")

```python
EmbeddedDataWriter.close() -> None
```

Flushes all buffered rows, writes the final Manifest, and refreshes package
checksums. Calling `close()` again has no effect. A successful `with` block
calls this method automatically.

**Parameters**

None.

## Implementation

The shared writer lifecycle refuses to overwrite a non-empty directory,
buffers rows by table, and flushes at `shard_rows`. Each flush uses the
canonical Arrow schema, writes a Zstandard-compressed IPC shard through a
temporary file, records its row count and SHA-256 in the manifest, and
atomically publishes it. Closing flushes all tables, writes the manifest, and
refreshes package checksums.

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
