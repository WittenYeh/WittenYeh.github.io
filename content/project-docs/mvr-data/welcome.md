MVR-Data defines how multi-vector retrieval data is organized at runtime and
packaged for interchange using Apache Arrow. This repository contains the
specification, Python reference implementation, command-line tools, and
synthetic tests. It does **not** contain any published data.

MVR-Data supports two self-contained package types:

- **Raw data:** A Raw package stores the original content of base and query
  objects. Each object can contain one or more ordered text, image, audio,
  video, or other components, and their files are kept inside the package.
- **Embedded data:** An Embedded package stores vector representations of base
  and query objects. Each object keeps its ID and has one or more embedding
  vectors; every vector in the package has the same dimension.

**Object ID rule:** If Raw and Embedded packages describe the same collection,
the same base or query object **must use the same `object_id` in both packages**.
For example, a Raw base object named `doc-42` must also be `doc-42` in the
Embedded base table. Row positions do not need to match; `object_id` is the
link between original content and its vectors.

Both kinds contain an object-level, ranked ground-truth table. Tables are
sharded Arrow IPC files; packages can optionally be transported as reproducible
`tar.zst` archives.

## Data schemas

The `base` and `query` tables use the same object schema within each package
kind. All listed fields are required unless noted otherwise.

### Raw data

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `object_id` | `string` | Unique object identifier within the table. |
| `components` | `list<struct>` | One or more ordered content components of an object. |
| `components[].component_id` | `string` | Component identifier, unique within the object. |
| `components[].modality` | `string` | Extensible modality such as `text`, `image`, `audio`, or `video`. |
| `components[].media_type` | `string` | MIME type of the stored payload, such as `text/plain` or `image/png`. |
| `components[].payload_uri` | `string` | Package-local, content-addressed URI that encodes the payload's SHA-256 digest. |

### Embedded data

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `object_id` | `string` | Unique object identifier within the table. |
| `vectors` | `large_list<fixed_size_list<T, dimension>>` | One or more ordered vectors; their numeric dtype `T` and dimension are fixed package-wide by the manifest. |

## Install

```bash
python -m pip install -e '.[dev]'
```

## CLI quick start

The following examples show the default human-readable output. Reported paths
may be absolute on your machine.

### 1. Create an empty package

`init` creates the directory layout, `manifest.yaml`, and `checksums.sha256`.
It does not add base objects, queries, vectors, or ground truth.

```console
$ mvrdata init raw-example --kind raw --data-id example/raw --top-k 10
raw-example
$ mvrdata init embedded-example --kind embedded --data-id example/embedded \
    --dimension 128 --dtype float32 --scoring-scheme chamfer --top-k 10
embedded-example
```

Embedded packages require a vector dimension, numeric dtype, and scoring
scheme. Raw packages store ordered content components instead.

### 2. Inspect package metadata

`inspect` reads the manifest and shards without modifying them. It summarizes
the data identity, kind, row and shard counts, and vector settings.

```console
$ mvrdata inspect embedded-example
example/embedded @ 1
  kind=embedded format=1.0.0
  base=0, query=0, ground_truth=0
  base_shards=0, query_shards=0, ground_truth_shards=0
  dimension=128 dtype=float32 scoring=chamfer
```

### 3. Validate the package

`validate` checks the manifest, Arrow schemas, row counts, object IDs, and
ground-truth references and rankings. `--deep` additionally hashes every shard,
raw payload, and package file to verify stored integrity data.

```console
$ mvrdata validate embedded-example
valid: /path/to/embedded-example
  base=0, query=0, ground_truth=0
$ mvrdata validate --deep embedded-example
valid: /path/to/embedded-example
  base=0, query=0, ground_truth=0
```

### 4. Verify or refresh checksums

`checksum` verifies `checksums.sha256`; `--write` regenerates it from the
current package files.

```console
$ mvrdata checksum embedded-example
checksums valid
$ mvrdata checksum --write embedded-example
/path/to/embedded-example/checksums.sha256
```

### 5. Create a transport archive

`pack` deep-validates the package by default and creates a reproducible
`tar.zst` archive. It refuses to overwrite an existing destination.

```console
$ mvrdata pack embedded-example embedded-example.tar.zst
/path/to/embedded-example.tar.zst
```

### 6. Extract an archive safely

`unpack` extracts regular files into a new or empty directory while rejecting
unsafe paths, links, duplicate members, and special files.

```console
$ mvrdata unpack embedded-example.tar.zst restored-example
/path/to/restored-example
```

A successful command returns exit code `0`. Validation or checksum failures
return `1`; invalid arguments and operational errors return `2`.

After `init`, use the Python writers to populate a new package safely:

```python
from mvr_data import EmbeddedDataWriter

with EmbeddedDataWriter(
    "tiny-mvr",
    data_id="example/tiny",
    dimension=2,
    dtype="float32",
    scoring={"scheme": "chamfer"},
    top_k=1,
) as writer:
    writer.add_base("doc-1", [[1.0, 0.0], [0.5, 0.5]])
    writer.add_query("query-1", [[1.0, 0.0]])
    writer.add_ground_truth("query-1", [("doc-1", 0.98)])
```

See [the v1 format specification](https://github.com/WittenYeh/MVR-Data/blob/main/docs/format-v1.md), the
[Raw format](https://github.com/WittenYeh/MVR-Data/blob/main/docs/raw-data.md), and the
[Embedded format](https://github.com/WittenYeh/MVR-Data/blob/main/docs/embedded-data.md) for normative details.

## Python API

The stable public entry points are:

- `open_data(path)` and the reader's `iter_base()`, `iter_queries()`, and
  `iter_ground_truth()` methods;
- `RawDataWriter` and `EmbeddedDataWriter`;
- `validate_data(path, deep=False)`, which returns a structured report;
- `pack_data`, `unpack_data`, `write_checksums`, and `verify_checksums`.

## Development

```bash
pytest
```

The committed examples are manifests only. Tests generate disposable, tiny
packages at runtime so this repository remains data-free.
