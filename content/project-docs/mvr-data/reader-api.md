Include `<mvr_data/data_reader.hpp>` directly or use
`<mvr_data/mvr_data.hpp>`. `DataReader` uses Arrow-native results, schemas,
record batches, and tables without translating them into a second data model.

## Example

Stream the base table and propagate both setup-time and read-time failures:

```cpp
#include <mvr_data/data_reader.hpp>

#include <arrow/api.h>

#include <filesystem>
#include <memory>

auto scan_base(const std::filesystem::path& root) -> arrow::Status {
    ARROW_ASSIGN_OR_RAISE(auto reader, mvr_data::DataReader::open(root));
    ARROW_ASSIGN_OR_RAISE(
        auto scanner,
        reader->get_batched_scanner(mvr_data::TableRole::base())
    );

    while (true) {
        std::shared_ptr<arrow::RecordBatch> batch;
        ARROW_RETURN_NOT_OK(scanner->ReadNext(&batch));
        if (batch == nullptr) {
            return arrow::Status::OK();
        }
        // Process `batch` before reading the next one.
    }
}
```

## `mvr_data::DataReader` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
class DataReader final;
```

Factory-created handle for a canonical package root and its validated typed
Manifest. It exposes table bindings as either a streaming Arrow
`RecordBatchReader` or a fully materialized Arrow `Table`.

Reader objects are movable but not copyable. `open` normally returns a
`std::shared_ptr<DataReader>`, so copying that smart pointer shares the same
reader handle without copying the object.

**Parameters**

None.

## `mvr_data::DataReader::open` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
static auto open(const std::filesystem::path& root)
    -> arrow::Result<std::shared_ptr<DataReader>>;
```

Canonicalizes an existing package directory and loads its `manifest.json`
through `Manifest::load`. A successful reader therefore owns an absolute,
symlink-resolved root plus convention-valid typed metadata.

Opening does not resolve Arrow shard files, read their schemas, validate row
contents, or verify `checksums.sha256`; those operations are deferred or
explicit as documented by the scanner and checksum APIs.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `const std::filesystem::path&` | Existing package directory. It may be relative or contain symlinks; canonicalization must resolve it to a directory. The reference only needs to remain valid for the call. |

**Returns**

`arrow::Result<std::shared_ptr<mvr_data::DataReader>>` — a shared reader
handle, or a non-OK Arrow status when the root cannot be canonicalized or the
Manifest cannot be loaded.

## `mvr_data::DataReader::root_path` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
auto root_path() const noexcept
    -> const std::filesystem::path&;
```

Returns the canonical package root established by `open`.

**Parameters**

None.

**Returns**

`const std::filesystem::path&` — a reference valid for the lifetime of this
reader.

## `mvr_data::DataReader::manifest` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
auto manifest() const noexcept -> const Manifest&;
```

Returns the validated, strongly typed Manifest loaded when this reader was
opened.

**Parameters**

None.

**Returns**

`const mvr_data::Manifest&` — a read-only reference valid for the lifetime of
this reader.

## `mvr_data::DataReader::get_batched_scanner` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
auto get_batched_scanner(TableRole role) const
    -> arrow::Result<std::shared_ptr<arrow::RecordBatchReader>>;
```

Creates a streaming Arrow reader for one bound table. Before returning, it
resolves every listed shard to a canonical regular file below the package
root. During iteration it memory-maps one shard at a time, emits RecordBatches
in Manifest shard order, requires metadata-aware equality with the canonical
table schema, and runs `ValidateFull()` on each batch.

An empty shard list produces a valid scanner that immediately reaches the end
while retaining the canonical schema. File-open, IPC, schema, and batch errors
encountered after construction are returned by `ReadNext()`.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `role` | `mvr_data::TableRole` | Manifest binding to scan: base, query, or ground truth. Passed by value. |

**Returns**

`arrow::Result<std::shared_ptr<arrow::RecordBatchReader>>` — a scanner with the
canonical table schema, or a non-OK Arrow status if metadata is unusable or a
shard path cannot be safely resolved.

## `mvr_data::DataReader::read_table` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
auto read_table(TableRole role) const
    -> arrow::Result<std::shared_ptr<arrow::Table>>;
```

Creates the same validated scanner as `get_batched_scanner`, consumes it to
completion, and combines its batches into one Arrow Table. This is convenient
for random access and table-level Arrow operations, but the complete logical
table must fit in memory.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `role` | `mvr_data::TableRole` | Manifest binding to materialize: base, query, or ground truth. Passed by value. |

**Returns**

`arrow::Result<std::shared_ptr<arrow::Table>>` — the complete table, including
a zero-row table for an empty binding, or the first path, I/O, IPC, schema,
batch-validation, or materialization error.

## `mvr_data::DataReader::DataReader(const DataReader&)` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
DataReader(const DataReader& other) = delete;
```

Copy construction is disabled for reader resource handles. Share the
`std::shared_ptr<DataReader>` returned by `open`, or explicitly move a reader
object instead.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `other` | `const mvr_data::DataReader&` | Reader that would otherwise be copied. The declaration is deleted and cannot be called. |

## `mvr_data::DataReader::operator=(const DataReader&)` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
auto operator=(const DataReader& other)
    -> DataReader& = delete;
```

Copy assignment is disabled for reader resource handles. Share the factory's
smart pointer or use move assignment.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `other` | `const mvr_data::DataReader&` | Reader that would otherwise be copied. The declaration is deleted and cannot be called. |

## `mvr_data::DataReader::DataReader(DataReader&&)` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
DataReader(DataReader&& other) noexcept = default;
```

Move-constructs a reader by transferring its canonical root and Manifest
without reopening the package. The moved-from object remains destructible and
assignable but should not be used for reading until assigned a new value.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `other` | `mvr_data::DataReader&&` | Reader whose owned state is transferred. |

## `mvr_data::DataReader::operator=(DataReader&&)` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
auto operator=(DataReader&& other) noexcept
    -> DataReader& = default;
```

Replaces this reader's state by moving the canonical root and Manifest from
`other`, without reopening either package.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `other` | `mvr_data::DataReader&&` | Reader whose owned state replaces this object's state. |

**Returns**

`mvr_data::DataReader&` — this reader after the transfer.

## `mvr_data::DataReader::~DataReader` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_reader.hpp "View source on GitHub")

```cpp
~DataReader() = default;
```

Releases the reader-owned path and Manifest using their normal destructors.
The reader itself does not keep every shard open.

**Parameters**

None.
