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

`DataReader::open` canonicalizes the package root and reads `manifest.json`.
`read_table` then resolves the bound shard paths, checks each shard's exact
Arrow schema, validates each RecordBatch, and holds the complete table in
memory.

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
memory-mapped one at a time and batches are emitted in Manifest shard order.
I/O or schema failures discovered while streaming are returned by the scanner.

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

const auto& base = manifest.table_info(mvr_data::TableRole::base());
```

String views, optionals, and table information returned by accessors refer to
storage owned by the Manifest. Do not retain those references after the
Manifest or its owning reader is destroyed.

## Verify package integrity

Opening a reader does not verify `checksums.sha256`. Perform that independent
check when package integrity is part of the trust boundary:

```cpp
ARROW_RETURN_NOT_OK(mvr_data::Checksum::verify(package_root));
ARROW_ASSIGN_OR_RAISE(auto reader, mvr_data::DataReader::open(package_root));
```

Publishers can replace the checksum list after all package files are finalized:

```cpp
ARROW_RETURN_NOT_OK(mvr_data::Checksum::refresh(package_root));
```

Both operations cover every regular non-symlink package file except the
checksum list itself. The [Integrity & Filesystem API](/projects/mvr-data/utilities-api) records
their complete contracts.
