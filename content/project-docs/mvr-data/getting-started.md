## Prerequisites

The current native project requires:

- CMake 3.25 or newer;
- a C++20 compiler;
- Git and network access during the first configure, because CMake downloads
  pinned third-party source archives;
- enough build time and disk space to compile static Apache Arrow.

CMake currently pins Apache Arrow 24.0.0, nlohmann/json 3.12.0, and LibRHash
1.4.6. It deliberately builds those sources locally instead of discovering
system packages. The C++ interface target does not yet have export/install
rules. The Python build does install its native extension into a wheel, but no
prebuilt package index release is published yet.

## Build and test the repository

Clone the repository, configure it, build the active C++ format test, and run
CTest:

```command
git clone https://github.com/WittenYeh/MVR-Data.git
cd MVR-Data
cmake -S . -B build -DBUILD_TESTING=ON
cmake --build build --parallel
ctest --test-dir build --output-on-failure
```

The first configure downloads and prepares the pinned dependencies. Later
builds reuse CMake's populated dependency tree unless the build directory is
recreated.

Set `MVR_DATA_BUILD_PYTHON=ON` to compile the native Python module as part of a
development build. The reproducible compiler environment, source-install
command, and Python examples are in [Python Binding](/projects/mvr-data/python-binding).

## Consume the CMake target

Until installation rules are added, make MVR-Data part of the same CMake build
with `add_subdirectory`, then link the interface target:

```cmake
cmake_minimum_required(VERSION 3.25)
project(example LANGUAGES C CXX)

add_subdirectory(path/to/MVR-Data)

add_executable(example main.cpp)
target_link_libraries(example PRIVATE MVRData::mvr_data)
```

The target requests C++20 and propagates the MVR-Data headers plus its Arrow,
nlohmann/json, and LibRHash link requirements. Include the umbrella header for
the complete public surface:

```cpp
#include <mvr_data/mvr_data.hpp>
```

Individual headers such as `<mvr_data/data_reader.hpp>` are also public when a
translation unit needs a narrower dependency.

## Open and materialize a table

MVR-Data follows Arrow's `Status` and `Result<T>` error model. The following
function opens a package, loads its validated Manifest, and materializes the
base table:

```cpp
#include <mvr_data/mvr_data.hpp>

#include <arrow/api.h>

#include <filesystem>
#include <memory>

auto read_base(const std::filesystem::path& package_root)
    -> arrow::Result<std::shared_ptr<arrow::Table>> {
    ARROW_ASSIGN_OR_RAISE(auto reader, mvr_data::DataReader::open(package_root));
    return reader->read_table(mvr_data::TableRole::base());
}
```

`DataReader::open` canonicalizes the package root, reads `manifest.json`, and
discovers the fixed role directories. `read_table` then resolves the discovered
shard paths, checks each shard's exact Arrow schema, validates each RecordBatch,
and holds the complete table in memory.

## Stream record batches

For a table that should not be materialized all at once, request a batched
scanner and consume it through Arrow's `RecordBatchReader` interface:

```cpp
ARROW_ASSIGN_OR_RAISE(
    auto scanner,
    reader->get_batched_scanner(mvr_data::TableRole::query())
);

while (true) {
    std::shared_ptr<arrow::RecordBatch> batch;
    ARROW_RETURN_NOT_OK(scanner->ReadNext(&batch));
    if (batch == nullptr) {
        break;
    }
    // Process this validated RecordBatch.
}
```

Shard paths are resolved before the scanner is returned. Shard files are then
memory-mapped one at a time and batches are emitted in numeric filename order.
I/O or schema failures discovered while streaming are returned by the scanner.

## Build a package by batch and shard

`DataWriter` keeps each role's current Arrow IPC shard open while batches are
appended. Call `finish_shard` when a shard boundary is reached, or pass a
complete `RecordBatchReader` to `write_shard`. The input Manifest contains only
semantic metadata and no `tables` field; the writer generates fixed-layout
shard paths as data is supplied:

```cpp
ARROW_ASSIGN_OR_RAISE(
    auto writer,
    mvr_data::DataWriter::open(output_root, manifest_path)
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
ARROW_RETURN_NOT_OK(writer->finish());
```

The final output path must not exist. It stays absent while the writer uses a
sibling staging directory. `open` copies and validates the user-authored
Manifest. `finish` preserves that file byte-for-byte, validates the generated
`role/part-NNNNN.arrow` layout, writes the checksum list, and publishes the
directory with a same-parent rename. The [Writer API](/projects/mvr-data/writer-api)
documents exact schema, lifecycle, and error contracts.

## Inspect typed Manifest metadata

The reader owns a typed, read-only `Manifest`:

```cpp
const auto& manifest = reader->manifest();

if (manifest.package_kind() == mvr_data::PackageKind::embedded) {
    const auto& vector = manifest.vector_config().value();
    const auto dimension = vector.dimension;
    const auto dtype = vector.dtype;
    const auto& scoring = vector.scoring;
}

const auto& base_schema = manifest.table_schema(mvr_data::TableRole::base());
const auto& base = reader->table_info(mvr_data::TableRole::base());
```

String views, optionals, and schema references returned by Manifest accessors
refer to Manifest-owned storage. `DataReader::table_info` instead returns a
reader-owned discovery snapshot. Do not retain either reference after its
owning object is destroyed.

## Verify package integrity

Opening a reader does not verify `checksums.sha256`. Perform that independent
check when package integrity is part of the trust boundary:

```cpp
ARROW_RETURN_NOT_OK(mvr_data::Checksum::verify(package_root));
ARROW_ASSIGN_OR_RAISE(auto reader, mvr_data::DataReader::open(package_root));
```

Publishers modifying an existing package can replace the checksum list after
all package files are finalized:

```cpp
ARROW_RETURN_NOT_OK(mvr_data::Checksum::refresh(package_root));
```

Both operations cover every regular non-symlink package file except the
checksum list itself. The [Integrity API](/projects/mvr-data/utilities-api) records
their complete contracts. `DataWriter::finish` performs checksum refresh
automatically for a newly built package.
