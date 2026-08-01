## Overview

MVR-Datasets defines a versioned, Arrow-based interchange format for multi-vector retrieval benchmarks. A package is either:

- **Raw** — base and query objects contain ordered media components. Payloads are copied into a local, content-addressed asset store.
- **Embedded** — base and query objects contain a variable number of fixed-dimensional vectors.

Both kinds store ranked, object-level ground truth. The repository provides the format specification, a Python reference implementation, CLI tools, examples, and tests; it does not ship a published dataset.

## Install

MVR-Datasets requires Python 3.10 or newer.

```bash
git clone https://github.com/WittenYeh/MVR-Datasets.git
cd MVR-Datasets
python -m pip install -e .
```

Install the test dependency when developing the format:

```bash
python -m pip install -e '.[dev]'
pytest
```

## Create an embedded dataset

Use `EmbeddedDatasetWriter` when vectors have already been computed. Add all base and query objects before adding ground truth.

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

The context manager flushes Arrow shards, writes `manifest.yaml`, and creates `checksums.sha256` when it closes successfully.

## Create a raw dataset

Use `RawDatasetWriter` and `RawComponent` when the package should retain source media. Files are deduplicated by SHA-256.

```python
from mvr_dataset import RawComponent, RawDatasetWriter

with RawDatasetWriter(
    "raw-mvr",
    dataset_id="example/raw",
    top_k=1,
) as writer:
    writer.add_base("doc-1", [
        RawComponent("image-1", "photo.jpg", "image", "image/jpeg")
    ])
    writer.add_query("query-1", [
        RawComponent("text-1", "query.txt", "text", "text/plain")
    ])
    writer.add_ground_truth("query-1", [("doc-1", 1.0)])
```

Object IDs must be unique and non-empty. Each raw object needs at least one component; each embedded object needs at least one vector of the declared dimension. Ground-truth query IDs must be added in ascending order, and each query needs exactly `min(top_k, number_of_base_objects)` ranked results in the manifest's score order.

## Read a dataset

Readers stream record batches in manifest shard order. Use `read_table()` only when the complete table fits in memory.

```python
from mvr_dataset import open_dataset

dataset = open_dataset("tiny-mvr")
print(dataset.kind, dataset.manifest["dataset_id"])

for batch in dataset.iter_base():
    print(batch.to_pylist())

queries = dataset.read_table("query")
```

Available streaming methods are `iter_base()`, `iter_queries()`, and `iter_ground_truth()`.

## Inspect, validate, and distribute

```bash
# Show metadata, row counts, and shard counts
mvr inspect tiny-mvr

# Check schemas, IDs, row counts, and ground truth
mvr validate tiny-mvr

# Also hash shards/assets and verify the whole-package checksum list
mvr validate --deep tiny-mvr

# Rewrite or verify checksums.sha256
mvr checksum --write tiny-mvr
mvr checksum tiny-mvr

# Create and safely extract a reproducible archive
mvr pack tiny-mvr tiny-mvr.tar.zst
mvr unpack tiny-mvr.tar.zst restored-tiny-mvr
```

`mvr init` can create an empty package skeleton, but the Python writers are the safer way to populate a package:

```bash
mvr init embedded-empty --kind embedded --dataset-id example/empty \
  --dimension 128 --dtype float32 --scoring-scheme chamfer --top-k 10
```

Add `--json` to `mvr inspect` or `mvr validate` for machine-readable output. Packing performs deep validation by default; use `--no-validate` only when validation has already been handled elsewhere.

## Package layout

```text
dataset/
├── manifest.yaml
├── checksums.sha256
├── base/part-*.arrow
├── query/part-*.arrow
├── ground_truth/part-*.arrow
└── assets/sha256/<prefix>/<digest>   # raw packages only
```

`manifest.yaml` identifies the format and dataset, declares table shards and row counts, describes ground-truth ranking, and records vector configuration for embedded packages. Arrow IPC shards use Zstandard compression. `checksums.sha256` covers every regular package file except itself.

## CLI reference

| Command | Purpose |
| --- | --- |
| `mvr init` | Create an empty raw or embedded package skeleton. |
| `mvr inspect` | Print package metadata, table counts, and vector or modality details. |
| `mvr validate` | Check manifest, Arrow schemas, row semantics, and ground truth. |
| `mvr checksum` | Verify the package checksum list, or rewrite it with `--write`. |
| `mvr pack` | Produce a deterministic `.tar.zst` transport archive. |
| `mvr unpack` | Extract an archive while rejecting traversal, links, and special files. |

## Source guide

All implementation code is under `src/mvr_dataset/`.

| File | Responsibility |
| --- | --- |
| `__init__.py` | Defines the stable public API and package version. |
| `checksums.py` | Hashes files, writes and parses `checksums.sha256`, and reports missing, extra, or changed files. |
| `cli.py` | Implements the `mvr` entry point and the `init`, `inspect`, `validate`, `checksum`, `pack`, and `unpack` commands. |
| `manifest.py` | Loads YAML, validates it against the v1 JSON Schema, creates empty manifests, normalizes dtypes, and writes manifests atomically. |
| `packaging.py` | Creates reproducible Zstandard-compressed tar archives and safely extracts them without links or path traversal. |
| `reader.py` | Resolves shard paths safely and streams schema-checked Arrow record batches in manifest order. |
| `schema.py` | Defines format constants, canonical raw and ground-truth Arrow schemas, embedded schemas, and supported numeric dtypes. |
| `validation.py` | Produces structured validation reports for manifests, shards, objects, raw assets, ranked ground truth, and optional deep checksums. |
| `writer.py` | Implements raw and embedded writers, ID and ground-truth rules, asset deduplication, Arrow sharding, and atomic finalization. |

The adjacent `src/mvr_dataset_format.egg-info/` files are generated packaging metadata: `PKG-INFO` stores the package description, `SOURCES.txt` lists distribution inputs, `entry_points.txt` registers the `mvr` command, `requires.txt` records dependencies, `top_level.txt` names the import package, and `dependency_links.txt` is a legacy dependency-link placeholder. They do not implement dataset behavior.

## Further reference

- [Format v1 specification](https://github.com/WittenYeh/MVR-Datasets/blob/main/docs/format-v1.md)
- [Raw dataset format](https://github.com/WittenYeh/MVR-Datasets/blob/main/docs/raw-dataset.md)
- [Embedded dataset format](https://github.com/WittenYeh/MVR-Datasets/blob/main/docs/embedded-dataset.md)
- [MVR-Datasets on GitHub](https://github.com/WittenYeh/MVR-Datasets)
