## What MVR-Datasets provides

MVR-Datasets is a versioned interchange format for multi-vector retrieval benchmarks. It supports two package kinds:

- **Raw** packages store ordered text, image, audio, video, or other components in a local content-addressed asset store.
- **Embedded** packages store a variable number of fixed-dimensional vectors for every base and query object.

Both kinds include ranked, object-level ground truth. The repository contains the specification, Python reference implementation, CLI, examples, and tests; it does not include a published dataset.

## Install

Python 3.10 or newer is required.

```bash
git clone https://github.com/WittenYeh/MVR-Datasets.git
cd MVR-Datasets
python -m pip install -e .
```

For development:

```bash
python -m pip install -e '.[dev]'
pytest
```

## Create an embedded dataset

Use `EmbeddedDatasetWriter` when vectors have already been computed:

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

The context manager writes compressed Arrow shards, `manifest.yaml`, and `checksums.sha256` when it closes successfully.

## Create a raw dataset

Use `RawDatasetWriter` when source media must remain in the package. Assets are deduplicated by SHA-256.

```python
from mvr_dataset import RawComponent, RawDatasetWriter

with RawDatasetWriter("raw-mvr", dataset_id="example/raw", top_k=1) as writer:
    writer.add_base("doc-1", [
        RawComponent("image-1", "photo.jpg", "image", "image/jpeg")
    ])
    writer.add_query("query-1", [
        RawComponent("text-1", "query.txt", "text", "text/plain")
    ])
    writer.add_ground_truth("query-1", [("doc-1", 1.0)])
```

Add every base and query object before adding ground truth. Object IDs must be unique, vectors must match the declared dimension, and ground-truth queries must be added in ascending ID order. Each query needs exactly `min(top_k, base_count)` ranked results.

## Read a dataset

Readers stream record batches in manifest shard order:

```python
from mvr_dataset import open_dataset

dataset = open_dataset("tiny-mvr")

for batch in dataset.iter_base():
    print(batch.to_pylist())

queries = dataset.read_table("query")
```

Use `iter_base()`, `iter_queries()`, and `iter_ground_truth()` for large datasets. `read_table()` materializes a complete table in memory.

## Inspect, validate, and distribute

```bash
mvr inspect tiny-mvr
mvr validate tiny-mvr
mvr validate --deep tiny-mvr
mvr checksum --write tiny-mvr
mvr pack tiny-mvr tiny-mvr.tar.zst
mvr unpack tiny-mvr.tar.zst restored-tiny-mvr
```

Use `--json` with `inspect` or `validate` for machine-readable output. Packing performs deep validation by default.

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

For normative field definitions, see the [format v1 specification](https://github.com/WittenYeh/MVR-Datasets/blob/main/docs/format-v1.md).
