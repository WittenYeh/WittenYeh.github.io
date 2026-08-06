Include `<mvr_data/data_writer.hpp>` directly or use
`<mvr_data/mvr_data.hpp>`. `DataWriter` copies a user-authored Manifest
byte-for-byte, builds fixed-layout Arrow IPC File shards, generates
whole-package checksums, and publishes the completed package atomically.

The Manifest is authoritative for semantic metadata only and must not contain a
`tables` field. `DataWriter` generates package-relative paths such as
`base/part-00000.arrow`; readers later discover the contiguous files from the
three fixed role directories.

For Raw data, this interface writes the object table but does not ingest the
files named by `components[].payload_uri`. A workflow that adds those assets
after `finish` must run `Checksum::refresh` again; populated Raw packages do not
yet have one-step atomic publication through this API alone.

## Example

Build one Embedded package from an existing semantic Manifest. It defines the
package and vector metadata but no shard paths or counts:

```cpp
#include <mvr_data/data_writer.hpp>

#include <arrow/api.h>

#include <filesystem>
#include <memory>

auto write_package(
    const std::filesystem::path& root,
    const std::filesystem::path& manifest_path,
    const std::shared_ptr<arrow::RecordBatch>& base_batch,
    const std::shared_ptr<arrow::RecordBatchReader>& query_batches
) -> arrow::Status {
    ARROW_ASSIGN_OR_RAISE(
        auto writer,
        mvr_data::DataWriter::open(root, manifest_path)
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

Base and query inputs must use the exact Raw or Embedded schema selected by the
Manifest. Ground-truth inputs always use the canonical judgment schema.

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

Aggregate returned after one generated Arrow IPC shard has been closed.

**Parameters**

None.

## `mvr_data::ShardInfo::path` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
std::string path;
```

Portable package-relative path generated for the selected role, such as
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
role can have one independent active shard. Calls to `finish_shard` divide
batch groups into consecutively named files for that role without materializing
a complete table in memory or maintaining a Manifest index.

The writer owns a sibling staging directory until successful publication. It
is neither copyable nor movable; share the `std::shared_ptr<DataWriter>`
returned by `open` when multiple owners need the same handle.

**Parameters**

None.

## `mvr_data::DataWriter::open` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
static auto open(
    const std::filesystem::path& root,
    const std::filesystem::path& manifest_path,
    WriterOptions options = {}
) -> arrow::Result<std::shared_ptr<DataWriter>>;
```

Opens a builder for a package path that does not exist. The method resolves the
existing parent directory, creates a uniquely named sibling staging directory,
copies `manifest_path` to its canonical package name `manifest.json`, and opens
the staged package through `DataReader`. This reuses existing Manifest parsing,
validation, and canonical schema construction.

The Manifest must not contain the legacy `tables` field. Its package kind and
vector settings select the writer's per-role schemas, while the file itself is
preserved byte-for-byte. `root` remains absent until `finish` succeeds.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `const std::filesystem::path&` | Final package directory. Its parent must already exist and resolve to a directory, and the final path must not exist. |
| `manifest_path` | `const std::filesystem::path&` | Existing readable user-authored semantic Manifest. Its required metadata and vector settings must pass normal Manifest validation, and it must not contain `tables`. |
| `options` | `mvr_data::WriterOptions` | Arrow IPC settings copied into the writer and reused for every output shard. Defaults to Arrow's normal IPC settings. |

**Returns**

`arrow::Result<std::shared_ptr<mvr_data::DataWriter>>` — a writer backed by an
unpublished staging directory, or a non-OK path, copy, Manifest, or schema
status.

## `mvr_data::DataWriter::write_batch` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
auto write_batch(
    TableRole role,
    const std::shared_ptr<arrow::RecordBatch>& batch
) -> arrow::Status;
```

Appends one batch to `role`'s active shard. When no shard is active, the method
lazily opens the role's next generated `role/part-NNNNN.arrow` path. Later
calls for the same role reuse that file; other roles maintain independent
active files.

The batch must be non-null, pass `ValidateFull()`, and have metadata-aware
exact schema equality with the role's canonical schema. The writer delegates
IPC serialization to Arrow and does not perform higher-level checks such as
object-ID uniqueness, ground-truth foreign keys, or relevance semantics.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `role` | `mvr_data::TableRole` | Fixed table role that receives the batch: base, query, or ground truth. |
| `batch` | `const std::shared_ptr<arrow::RecordBatch>&` | Non-null batch using the exact canonical schema for `role`. The shared pointer only needs to remain valid for the call. |

**Returns**

`arrow::Status` — `OK` after Arrow writes the batch, or the first finished-state,
null-input, schema, batch-validation, directory, file, or IPC error.

## `mvr_data::DataWriter::finish_shard` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
auto finish_shard(TableRole role)
    -> arrow::Result<ShardInfo>;
```

Closes `role`'s current Arrow writer and output stream and returns its generated
path and counts. A later `write_batch` opens the role's next consecutively
numbered path.

This method defines how batches are divided across shards. It returns an
invalid status when the package is already finished or the selected role has
no active shard.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `role` | `mvr_data::TableRole` | Table whose active shard should be closed. |

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

Consumes one RecordBatchReader to end-of-stream and writes the entire stream to
the role's next generated path as one IPC shard. Its declared schema must
exactly match the role's canonical schema; every yielded batch follows the
same validation and Arrow write path as `write_batch`.

The selected role must not already have an active shard. An empty stream is
valid and produces a schema-only IPC file with zero batches and zero rows.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `role` | `mvr_data::TableRole` | Fixed table role that receives the next generated shard. |
| `batches` | `const std::shared_ptr<arrow::RecordBatchReader>&` | Non-null stream with the role's exact canonical schema. It is consumed completely before the method returns. |

**Returns**

`arrow::Result<mvr_data::ShardInfo>` — the closed shard summary, or the first
finished-state, active-shard, null-input, schema, stream, validation, IPC, or
close error.

## `mvr_data::DataWriter::finish` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/data_writer.hpp "View source on GitHub")

```cpp
auto finish() -> arrow::Status;
```

Closes any active base, query, and ground-truth shards, then reopens the staged
package through `DataReader` to validate the fixed directory layout. The copied
Manifest is read for validation but never serialized or rewritten, so all of
its bytes remain unchanged.

The method generates `checksums.sha256` with `Checksum::refresh` and renames the
sibling staging directory to `root`. Because publication is a same-parent
directory rename, consumers do not observe a partially built target package.
Successful calls are idempotent. If the final path appears before publication,
the method returns `AlreadyExists` and does not replace it.

**Parameters**

None.

**Returns**

`arrow::Status` — `OK` after atomic publication or after an earlier successful
call, otherwise the first shard-close, layout-validation, checksum,
target-existence, or rename error.

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
