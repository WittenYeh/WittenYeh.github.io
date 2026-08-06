The `mvr_data` package is a thin pybind11 layer over the C++20 reference
implementation. It does not shell out or reimplement format behavior in
Python. Public classes and methods keep the C++ names, while Arrow values are
presented as native PyArrow objects.

## Create the build environment

The repository includes a reproducible Conda environment with Python 3.12,
GCC/G++ through `cxx-compiler`, CMake, Ninja, pybind11, scikit-build-core,
PyArrow 24, and pytest:

```command
git clone https://github.com/WittenYeh/MVR-Data.git
cd MVR-Data
conda env create -f environment.yml
conda activate mvr-data
```

The package metadata supports Python 3.10 or newer and PyArrow 14 or newer.
The checked-in environment pins the versions used for the project's clean
build and compatibility tests, including a modern C++ runtime for the native
module.

## Build and install

Build a platform-specific wheel from the checkout and install it into the
active environment:

```command
python -m pip install . --no-build-isolation
```

The first build fetches the pinned Apache Arrow, nlohmann/json, and LibRHash
sources through CMake and compiles them locally. `--no-build-isolation` reuses
the compiler-facing pybind11 and scikit-build-core packages from the Conda
environment. PyArrow remains a runtime dependency.

For an in-tree development build with both test suites enabled:

```command
cmake -S . -B build -G Ninja \
  -DMVR_DATA_BUILD_PYTHON=ON \
  -DBUILD_TESTING=ON
cmake --build build --parallel
ctest --test-dir build --output-on-failure
PYTHONPATH="$PWD/build/python" python -m pytest -q tests/test_python_bindings.py
```

## Same-named public surface

Importing `mvr_data` exposes `PackageKind`, `TableRole`, `TableInfo`,
`VectorConfig`, `PackageConfig`, `WriterOptions`, `ShardInfo`, `Manifest`,
`Schema`, `DataReader`, `DataWriter`, and `Checksum`. Each corresponds directly
to the C++ type with that name, and
methods such as `Manifest.load`, `DataReader.open`,
`DataReader.get_batched_scanner`, `DataReader.read_table`,
`DataWriter.open`, `DataWriter.write_batch`, `DataWriter.finish_shard`,
`DataWriter.write_shard`, `DataWriter.finish`,
`Checksum.refresh`, and `Checksum.verify` retain their C++ method names.

The source-linked [Schema API](/projects/mvr-data/schema-api), [Manifest
API](/projects/mvr-data/manifest-api), [Reader API](/projects/mvr-data/reader-api),
[Writer API](/projects/mvr-data/writer-api), and [Integrity
API](/projects/mvr-data/utilities-api) define the
shared behavioral contracts. Python signatures and return annotations are
kept in the package's [inline type stubs](https://github.com/WittenYeh/MVR-Data/blob/main/python/mvr_data/__init__.pyi).

Python accepts `str`, `os.PathLike[str]`, and `pathlib.Path` wherever the C++
API accepts `std::filesystem::path`. C++ `std::optional` results become either
their value or `None`, table shard vectors become `list[str]`, and Manifest
extensions become ordinary nested Python dictionaries and values.

## Arrow interoperability

The binding maps Arrow values without a Python-side schema model:

| C++ type | Python type |
| --- | --- |
| `arrow::DataType` | `pyarrow.DataType` |
| `arrow::Schema` | `pyarrow.Schema` |
| `arrow::RecordBatch` | `pyarrow.RecordBatch` |
| `arrow::RecordBatchReader` | `pyarrow.RecordBatchReader` |
| `arrow::Table` | `pyarrow.Table` |

Schemas and dtypes cross the extension boundary through the Arrow C Data
PyCapsule protocol. Batch readers use the Arrow C Stream protocol. This avoids
serialization between the statically linked C++ core and the PyArrow runtime,
and allows Arrow buffers to be shared without a serialization copy.

PyArrow types can also be passed back into the native API:

```python
import pyarrow as pa

import mvr_data

dtype = mvr_data.Schema.parse_vector_dtype("float32")
assert dtype == pa.float32()

schema = mvr_data.Schema.make_embedded_object_schema(
    dimension=128,
    dtype=pa.float32(),
)
assert isinstance(schema, pa.Schema)
```

RecordBatches passed to `DataWriter.write_batch` use the Arrow C Array capsule
protocol. Readers passed to `DataWriter.write_shard` use the C Stream protocol,
so neither path serializes through Python objects first.

## Stream or materialize a table

Open a package with the same factory and table-role names used in C++:

```python
from pathlib import Path

import mvr_data

package = Path("/data/example")
mvr_data.Checksum.verify(package)

reader = mvr_data.DataReader.open(package)
base_role = mvr_data.TableRole.base()

for batch in reader.get_batched_scanner(base_role):
    consume(batch)
```

`get_batched_scanner` returns a `pyarrow.RecordBatchReader`. It preserves
Manifest shard order and keeps the C++ reader's lazy, one-shard-at-a-time I/O
behavior. Errors discovered while advancing the stream are raised by the
PyArrow reader.

Use `read_table` only when the complete table fits in memory:

```python
base = reader.read_table(mvr_data.TableRole.base())
print(base.schema)
print(base.num_rows)
```

The result is a `pyarrow.Table`, so downstream PyArrow operations work without
an MVR-Data-specific adapter.

## Build a package

The same batch and shard lifecycle is available from Python. Construct input
batches with the canonical PyArrow schema, then publish once all roles are
complete:

```python
import pyarrow as pa

import mvr_data

schema = mvr_data.Schema.make_embedded_object_schema(2, pa.float32())
base_batch = pa.record_batch(
    [
        pa.array(["base-1"], type=pa.string()),
        pa.array([[[1.0, 0.0]]], type=schema.field("vectors").type),
    ],
    schema=schema,
)

config = mvr_data.PackageConfig(
    mvr_data.PackageKind.embedded,
    "example/embeddings",
    "1",
    vector_config=mvr_data.VectorConfig(2, pa.float32(), "chamfer"),
)
writer = mvr_data.DataWriter.open("/data/new-package", config)
writer.write_batch(mvr_data.TableRole.base(), base_batch)
base_info = writer.finish_shard(mvr_data.TableRole.base())
writer.finish()

print(base_info.path, base_info.num_record_batches, base_info.num_rows)
```

`write_shard(role, batches)` accepts a `pyarrow.RecordBatchReader` and consumes
it as one shard. `finish()` also closes any role still active, writes
`manifest.json` and `checksums.sha256`, and atomically publishes the final
directory. A published package can immediately be opened with `DataReader`.

## Read typed Manifest metadata

Manifest accessors use the same names as their C++ counterparts:

```python
manifest = reader.manifest()

print(manifest.data_name(), manifest.data_version())
print(manifest.table_info(mvr_data.TableRole.query()).shards)

if manifest.package_kind() == mvr_data.PackageKind.embedded:
    vector = manifest.vector_config()
    assert vector is not None
    print(vector.dimension, vector.dtype, vector.scoring)
```

`TableInfo.schema` and `VectorConfig.dtype` are PyArrow values. Optional
description, license, source, vector configuration, and extensions accessors
return `None` when their Manifest fields are absent.

## Python exceptions

Non-OK Arrow statuses become familiar Python exception categories:

| Arrow status | Python exception |
| --- | --- |
| Invalid | `ValueError` |
| I/O error | `OSError` |
| Type error | `TypeError` |
| Key error | `KeyError` |
| Index error | `IndexError` |
| Capacity error | `OverflowError` |
| Out of memory | `MemoryError` |
| Already exists | `FileExistsError` |
| Not implemented | `NotImplementedError` |
| Other failures | `RuntimeError` |

Potentially blocking Manifest, package, shard, checksum, and filesystem
operations release the Python GIL while the C++ work runs. Error messages retain
the original Arrow status text for diagnosis.

## Static typing

The wheel includes `mvr_data/__init__.pyi` and a `py.typed` marker. Type
checkers therefore see concrete PyArrow return types, optional Manifest fields,
path-like inputs, and the same-named class methods without separate stub
installation.

The package does not yet provide a CLI, full semantic validator, or a
higher-level object-by-object writer. `DataWriter` operates on complete Arrow
RecordBatches and RecordBatchReaders; Raw payload files referenced by those
batches must be added separately and followed by `Checksum.refresh`.
