Include `<mvr_data/data_writer.hpp>` directly or use
`<mvr_data/mvr_data.hpp>`. `DataWriter` builds all three logical tables from
Arrow RecordBatches, writes IPC File shards, and publishes a new package only
after its Manifest and checksum list are complete.

For Raw data, this interface writes the object table but does not ingest the
files named by `components[].payload_uri`. A workflow that adds those assets
after `finish` must run `Checksum::refresh` again; populated Raw packages do not
yet have one-step atomic publication through this API alone.

## Example

Build one Embedded package while choosing the base-table shard boundary
explicitly and consuming the query table as one complete shard:

```cpp
#include <mvr_data/data_writer.hpp>

#include <arrow/api.h>

#include <filesystem>
#include <memory>

auto write_package(
    const std::filesystem::path& root,
    const std::shared_ptr<arrow::RecordBatch>& base_batch,
    const std::shared_ptr<arrow::RecordBatchReader>& query_batches
) -> arrow::Status {
    mvr_data::PackageConfig config;
    config.package_kind = mvr_data::PackageKind::embedded;
    config.data_name = "example/embeddings";
    config.data_version = "1";
    config.vector_config = mvr_data::VectorConfig{
        128,
        arrow::float32(),
        "chamfer"
    };

    ARROW_ASSIGN_OR_RAISE(
        auto writer,
        mvr_data::DataWriter::open(root, std::move(config))
    );
    ARROW_RETURN_NOT_OK(
        writer->write_batch(mvr_data::TableRole::base(), base_batch)
    );
    ARROW_ASSIGN_OR_RAISE(
        auto base_shard,
        writer->finish_shard(mvr_data::TableRole::base())
    );
    ARROW_ASSIGN_OR_RAISE(
        auto query_shard,
        writer->write_shard(mvr_data::TableRole::query(), query_batches)
    );
    return writer->finish();
}
```

Both inputs must use the exact canonical schema selected by `config`. Base and
query use the Raw or Embedded object schema; ground truth always uses the
ground-truth schema.

## `mvr_data::PackageConfig` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
struct PackageConfig;
```

Aggregate containing the metadata needed to create a new package. `open`
serializes it into an initial Manifest, then reuses `DataReader::open` to parse
that Manifest and construct the canonical schemas used for subsequent writes.

**Parameters**

None.

## `mvr_data::PackageConfig::format_version` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::string format_version{"1.0.0"};
```

Publisher-declared descriptive package-format version written to
`manifest.json`. Like Manifest loading, writer creation does not use this value
as a compatibility gate.

**Parameters**

None.

## `mvr_data::PackageConfig::package_kind` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
PackageKind package_kind{PackageKind::raw};
```

Selects the canonical object schema for both base and query: Raw components or
Embedded vectors. Ground truth is unaffected.

**Parameters**

None.

## `mvr_data::PackageConfig::data_name` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::string data_name;
```

Logical collection name written to the Manifest. It must be non-empty when
`DataWriter::open` validates the initial Manifest.

**Parameters**

None.

## `mvr_data::PackageConfig::data_version` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::string data_version;
```

Publisher-defined collection version written to the Manifest. It must be
non-empty.

**Parameters**

None.

## `mvr_data::PackageConfig::description` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::optional<std::string> description;
```

Optional human-readable package description. An unengaged optional omits the
Manifest field.

**Parameters**

None.

## `mvr_data::PackageConfig::license` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::optional<std::string> license;
```

Optional package license declaration. The writer records but does not
interpret the value.

**Parameters**

None.

## `mvr_data::PackageConfig::source` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::optional<std::string> source;
```

Optional package source declaration. The writer records it without treating
it as a filesystem path or URL.

**Parameters**

None.

## `mvr_data::PackageConfig::vector_config` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::optional<VectorConfig> vector_config;
```

Package-wide vector settings for Embedded data. Embedded writer creation
requires an engaged value with a non-null supported dtype, positive dimension,
and non-empty scoring identifier. Raw writer creation does not serialize this
field.

**Parameters**

None.

## `mvr_data::PackageConfig::extensions` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::optional<nlohmann::json::object_t> extensions;
```

Optional namespaced publisher metadata written as the Manifest `extensions`
object. MVR-Data assigns no core semantics to its members.

**Parameters**

None.

## `mvr_data::WriterOptions` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
using WriterOptions = arrow::ipc::IpcWriteOptions;
```

Direct alias for Apache Arrow's IPC write options. `DataWriter` passes one
copied options value to every `arrow::ipc::MakeFileWriter` call, so callers can
use Arrow's native alignment, compression, threading, dictionary, and metadata
version controls without an MVR-Data wrapper.

The default argument `{}` uses Arrow's default member initializers. The Python
`WriterOptions()` constructor produces `IpcWriteOptions::Defaults()` and
exposes the simple scalar compatibility and dictionary controls.

**Parameters**

None.

## `mvr_data::ShardInfo` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
struct ShardInfo;
```

Aggregate returned after one Arrow IPC shard has been closed and registered in
its table's ordered Manifest binding.

**Parameters**

None.

## `mvr_data::ShardInfo::path` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::string path;
```

Portable package-relative path recorded in the Manifest, such as
`base/part-00000.arrow`.

**Parameters**

None.

## `mvr_data::ShardInfo::num_record_batches` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::int64_t num_record_batches{0};
```

Number of RecordBatches written to the completed IPC file. Zero-row batches
still contribute to this count.

**Parameters**

None.

## `mvr_data::ShardInfo::num_rows` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::int64_t num_rows{0};
```

Sum of `num_rows()` across the shard's written RecordBatches.

**Parameters**

None.

## `mvr_data::DataWriter` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
class DataWriter final;
```

Factory-created, batch-oriented builder for a new MVR-Data package. Each table
role can have one independent active shard. Explicit shard completion controls
dataset partitioning without materializing a complete table in memory.

The writer owns a sibling staging directory until successful publication. It
is neither copyable nor movable; share the `std::shared_ptr<DataWriter>`
returned by `open` when multiple owners need the same handle.

**Parameters**

None.

## `mvr_data::DataWriter::open` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
static auto open(
    const std::filesystem::path& root,
    PackageConfig config,
    WriterOptions options = {}
) -> arrow::Result<std::shared_ptr<DataWriter>>;
```

Opens a builder for a package path that does not exist. The method resolves the
existing parent directory, creates a uniquely named sibling staging directory,
writes an initial empty-table Manifest, and opens that staging package through
`DataReader`. This reuses the reader's Manifest validation and canonical schema
construction for both Raw and Embedded writers.

`root` remains absent until `finish` succeeds. Creating two writers for the
same final path is therefore possible before publication; only one can publish
successfully because the final existence check and rename reject replacement.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `const std::filesystem::path&` | Final package directory. Its parent must already exist and resolve to a directory, and the final path must not exist. |
| `config` | `mvr_data::PackageConfig` | Package metadata consumed by value. Invalid required Manifest fields or Embedded vector settings return a non-OK status. |
| `options` | `mvr_data::WriterOptions` | Arrow IPC settings copied into the writer and reused for every output shard. Defaults to Arrow's normal IPC settings. |

**Returns**

`arrow::Result<std::shared_ptr<mvr_data::DataWriter>>` — a writer backed by an
unpublished staging directory, or a non-OK path, creation, Manifest, or schema
status.

## `mvr_data::DataWriter::write_batch` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
auto write_batch(
    TableRole role,
    const std::shared_ptr<arrow::RecordBatch>& batch
) -> arrow::Status;
```

Appends one batch to `role`'s active shard. The first batch after `open` or
`finish_shard` lazily creates the next IPC file; later calls for the same role
reuse that file. Other roles maintain independent active files.

The batch must be non-null, pass `ValidateFull()`, and have metadata-aware
exact schema equality with the role's canonical schema. The writer delegates
IPC serialization to Arrow and does not perform higher-level checks such as
object-ID uniqueness, ground-truth foreign keys, or relevance semantics.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `role` | `mvr_data::TableRole` | Table binding that receives the batch: base, query, or ground truth. |
| `batch` | `const std::shared_ptr<arrow::RecordBatch>&` | Non-null batch using the exact canonical schema for `role`. The shared pointer only needs to remain valid for the call. |

**Returns**

`arrow::Status` — `OK` after Arrow writes the batch, or the first finished-state,
null-input, schema, batch-validation, directory, file, or IPC error.

## `mvr_data::DataWriter::finish_shard` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
auto finish_shard(TableRole role)
    -> arrow::Result<ShardInfo>;
```

Closes `role`'s current Arrow writer and output stream, registers its portable
path in Manifest order, and returns its counts. The next `write_batch` for that
role opens `part-NNNNN.arrow` using the next sequential index.

This method defines explicit batch-to-shard boundaries. It returns an invalid
status when the package is already finished or the selected role has no active
shard.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `role` | `mvr_data::TableRole` | Table whose active shard should be closed and registered. |

**Returns**

`arrow::Result<mvr_data::ShardInfo>` — the completed shard path and counts, or
the first state, IPC-close, or output-close error.

## `mvr_data::DataWriter::write_shard` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
auto write_shard(
    TableRole role,
    const std::shared_ptr<arrow::RecordBatchReader>& batches
) -> arrow::Result<ShardInfo>;
```

Consumes one RecordBatchReader to end-of-stream and writes the entire stream as
one IPC shard. Its declared schema must exactly match the role's canonical
schema; every yielded batch then follows the same validation and Arrow write
path as `write_batch`.

The selected role must not already have an active shard. An empty stream is
rejected because no shard file is created; a stream containing a zero-row batch
is non-empty and can produce a shard.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `role` | `mvr_data::TableRole` | Table binding that receives the new shard. |
| `batches` | `const std::shared_ptr<arrow::RecordBatchReader>&` | Non-null stream with the role's exact canonical schema. It is consumed completely before the method returns. |

**Returns**

`arrow::Result<mvr_data::ShardInfo>` — the closed shard summary, or the first
finished-state, active-shard, null-input, schema, stream, validation, IPC, or
close error.

## `mvr_data::DataWriter::finish` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
auto finish() -> arrow::Status;
```

Closes any active base, query, and ground-truth shards; rewrites
`manifest.json` with every registered path; reopens the staged Manifest through
`DataReader`; generates `checksums.sha256` with `Checksum::refresh`; and renames
the sibling staging directory to `root`. Because publication is a same-parent
directory rename, consumers do not observe a partially built target package.

Successful calls are idempotent. If the final path appears before publication,
the method returns `AlreadyExists` and does not replace it.

**Parameters**

None.

**Returns**

`arrow::Status` — `OK` after atomic publication or after an earlier successful
call, otherwise the first shard-close, Manifest, checksum, target-existence, or
rename error.

## `mvr_data::DataWriter::DataWriter(const DataWriter&)` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
DataWriter(const DataWriter&) = delete;
```

Copy construction is disabled because one writer exclusively owns its staged
files and active Arrow output streams. Share the factory's smart pointer
instead.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| source writer | `const mvr_data::DataWriter&` | Writer that would otherwise be copied. The declaration is deleted and cannot be called. |

## `mvr_data::DataWriter::operator=(const DataWriter&)` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
auto operator=(const DataWriter&)
    -> DataWriter& = delete;
```

Copy assignment is disabled for the same ownership reason as copy
construction.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| source writer | `const mvr_data::DataWriter&` | Writer that would otherwise be assigned. The declaration is deleted and cannot be called. |

## `mvr_data::DataWriter::DataWriter(DataWriter&&)` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
DataWriter(DataWriter&&) = delete;
```

Move construction is disabled so the staging-directory cleanup responsibility
and active Arrow streams never migrate between writer objects.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| source writer | `mvr_data::DataWriter&&` | Writer that would otherwise be moved. The declaration is deleted and cannot be called. |

## `mvr_data::DataWriter::operator=(DataWriter&&)` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
auto operator=(DataWriter&&)
    -> DataWriter& = delete;
```

Move assignment is disabled.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| source writer | `mvr_data::DataWriter&&` | Writer that would otherwise replace this object. The declaration is deleted and cannot be called. |

## `mvr_data::DataWriter::~DataWriter` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
~DataWriter();
```

Removes the unpublished staging directory and its files when a writer is
destroyed before a successful `finish`. A successfully published package is
left untouched.

Destroying a writer is cleanup, not publication: callers must invoke `finish`
and check its status when they intend to keep the package.

**Parameters**

None.
