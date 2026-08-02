MVR Dataset Format is a versioned, Arrow-based interchange format for
multi-vector retrieval benchmarks. This repository contains the specification,
Python reference implementation, command-line tools, and synthetic tests. It
does **not** contain any published dataset.

Two self-contained package kinds are defined:

- **Raw datasets** contain base/query objects whose ordered text, image, audio,
  video, or other components are stored as local, content-addressed assets.
- **Embedded datasets** contain only object identifiers and a variable number
  of fixed-dimensional vectors per object.

Both kinds contain an object-level, ranked ground-truth table. Tables are
sharded Arrow IPC files; packages can optionally be transported as reproducible
`tar.zst` archives.

## Dataset schemas

The `base` and `query` tables use the same object schema within each package
kind. All listed fields are required unless noted otherwise.

### Raw dataset

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `object_id` | `string` | Unique object identifier within the table. |
| `components` | `list<struct>` | One or more ordered content components of an object. |
| `components[].component_id` | `string` | Component identifier, unique within the object. |
| `components[].modality` | `string` | Extensible modality such as `text`, `image`, `audio`, or `video`. |
| `components[].media_type` | `string` | MIME type of the stored payload, such as `text/plain` or `image/png`. |
| `components[].payload_uri` | `string` | Package-local, content-addressed URI that encodes the payload's SHA-256 digest. |

### Embedded dataset

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `object_id` | `string` | Unique object identifier within the table. |
| `vectors` | `large_list<fixed_size_list<T, dimension>>` | One or more ordered vectors; their numeric dtype `T` and dimension are fixed package-wide by the manifest. |

## Install

```bash
python -m pip install -e '.[dev]'
```

## CLI quick start

```bash
# Create package skeletons
mvr init raw-example --kind raw --dataset-id example/raw --top-k 10
mvr init embedded-example --kind embedded --dataset-id example/embedded \
  --dimension 128 --dtype float32 --scoring-scheme chamfer --top-k 10

# Inspect and validate a populated package
mvr inspect embedded-example
mvr validate embedded-example
mvr validate --deep embedded-example

# Maintain integrity data and create a transport archive
mvr checksum --write embedded-example
mvr pack embedded-example embedded-example.tar.zst
mvr unpack embedded-example.tar.zst restored-example
```

The initializer creates an empty package. Use the Python writers to populate a
new package safely:

```python
from mvr_dataset import EmbeddedDatasetWriter

with EmbeddedDatasetWriter(
    "tiny-mvr",
    dataset_id="example/tiny",
    dimension=2,
    dtype="float32",
    scoring={"scheme": "chamfer"},
    top_k=1,
) as writer:
    writer.add_base("doc-1", [[1.0, 0.0], [0.5, 0.5]])
    writer.add_query("query-1", [[1.0, 0.0]])
    writer.add_ground_truth("query-1", [("doc-1", 0.98)])
```

See [the v1 format specification](https://github.com/WittenYeh/MVR-Datasets/blob/main/docs/format-v1.md), the
[Raw format](https://github.com/WittenYeh/MVR-Datasets/blob/main/docs/raw-dataset.md), and the
[Embedded format](https://github.com/WittenYeh/MVR-Datasets/blob/main/docs/embedded-dataset.md) for normative details.

## Python API

The stable public entry points are:

- `open_dataset(path)` and the reader's `iter_base()`, `iter_queries()`, and
  `iter_ground_truth()` methods;
- `RawDatasetWriter` and `EmbeddedDatasetWriter`;
- `validate_dataset(path, deep=False)`, which returns a structured report;
- `pack_dataset`, `unpack_dataset`, `write_checksums`, and `verify_checksums`.

## Development

```bash
pytest
```

The committed examples are manifests only. Tests generate disposable, tiny
packages at runtime so this repository remains dataset-free.
