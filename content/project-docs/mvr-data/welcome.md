MVR-Data defines how multi-vector retrieval data is organized at runtime and
packaged for interchange using Apache Arrow. This repository contains the
specification, Python reference implementation, command-line tools, and
synthetic tests. It does **not** contain any published data.

MVR-Data supports two self-contained package types:

Here, an **object** means one retrievable content item (for example, an
illustrated article, a video clip, an audio recording, or another multimodal
form).

- **Raw data:** A Raw package stores the original content of base and query
  objects. Each object can contain one or more ordered text, image, audio,
  video, or other components, and their files are kept inside the package.
- **Embedded data:** An Embedded package stores vector representations of base
  and query objects. Each object keeps its ID and has one or more embedding
  vectors; every vector in the package has the same dimension.

**Object ID rule:** If Raw and Embedded packages describe the same collection,
the same base or query object **must use the same `object_id` in both packages**.
For example, a Raw base object named `obj-42` must also be `obj-42` in the
Embedded base table. Row positions do not need to match; `object_id` is the
link between original content and its vectors.

Both kinds use the same long-form ground-truth table. Each row is one judged
query-object pair and records its relevance level, data split, judgment
source, and annotation pool. Tables are sharded Arrow IPC files; packages can
optionally be transported as reproducible `tar.zst` archives.

## Data schemas

The `base` and `query` tables use the same object schema within each package
kind. All listed fields are required.

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

### Ground-truth data

Each row represents one query-object pair for which a relevance judgment has
been completed:

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `query_id` | `string` | Unique ID of the query object, such as `q001`. |
| `object_id` | `string` | Unique ID of an object in the `base` table, such as `obj_17`. |
| `relevance` | `int16` | Non-negative relevance level; for example, `2` means highly relevant. |
| `split_type` | `string` | Data split containing the judgment, such as `test`. |
| `judgment_source` | `string` | How the label was produced, such as `human` or `adjudicated`. |
| `pool_id` | `string` | Candidate annotation pool that produced the pair, such as `pool_v1`. |

## Manifest

Every package includes a `manifest.yaml`. Arrow files store object and
ground-truth rows, while the manifest stores package-wide settings and indexes
the Arrow shards.

| Field | Manifest type | Meaning |
| --- | --- | --- |
| `format`, `format_version` | String | Identify the MVR-Data format and version. |
| `kind` | String | Selects a `raw` or `embedded` package. |
| `data_name`, `data_version` | String | Identify the logical collection and its version. |
| `tables` | Mapping (object) | Contains exactly the `base`, `query`, and `ground_truth` table entries. |
| `tables.<name>` | Mapping (object) | Records the table's total row count and, for each shard, its path, row count, and SHA-256 digest. |
| `vector` | Mapping (object) | Required only for Embedded data; stores `dimension`, `dtype`, and `scoring`, plus optional `quantization`. |

Here, `<name>` means one of the three fixed keys: `base`, `query`, or
`ground_truth`. Both `tables.<name>` and `vector` are YAML mappings validated as
JSON objects, not Arrow `struct` fields. Their keys are constrained by the
Manifest JSON Schema; designated extension mappings such as
`scoring.parameters`, `quantization`, and top-level `extensions` hold more
flexible key-value data.

A small Embedded manifest might look like this. The `base` table has three rows
in total: two in its first shard and one in its second shard.

```yaml
format: mvr-data
format_version: 1.0.0
kind: embedded
data_name: example/tiny
data_version: "1"
description: A small multi-vector retrieval example.
license: Apache-2.0
source: https://example.org/tiny-mvr

tables:
  base:
    rows: 3
    shards:
      - path: base/part-00000.arrow
        rows: 2
        sha256: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
      - path: base/part-00001.arrow
        rows: 1
        sha256: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
  query:
    rows: 1
    shards:
      - path: query/part-00000.arrow
        rows: 1
        sha256: cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
  ground_truth:
    rows: 2
    shards:
      - path: ground_truth/part-00000.arrow
        rows: 2
        sha256: dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd

vector:
  dimension: 2
  dtype: float32
  scoring:
    scheme: chamfer
    parameters:
      pairwise_similarity: dot_product
      query_aggregation: sum
    reference: ColBERT-style late interaction
    description: Sum of each query vector's maximum similarity to any base vector.
```

The repeated-character SHA-256 values above are illustrative placeholders; a
writer records the actual digest of each generated Arrow shard.

The dimension and dtype are also reflected in each Embedded Arrow shard's
physical vector schema; scoring remains package-level metadata in the manifest.

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

```command
$ mvrdata init raw-example --kind raw --data-name example/raw
```

```output
raw-example
```

```command
$ mvrdata init embedded-example --kind embedded --data-name example/embedded \
    --dimension 128 --dtype float32 --scoring-scheme chamfer
```

```output
embedded-example
```

`--data-name` sets the collection name stored in `manifest.yaml`. Raw and
Embedded packages for the same collection should use the same `data_name` and
`data_version`.

Embedded packages require a vector dimension, numeric dtype, and scoring
scheme. Raw packages store ordered content components instead.

### 2. Inspect package metadata

`inspect` reads the manifest and shards without modifying them. It summarizes
the data name, kind, row and shard counts, and vector settings.

```command
$ mvrdata inspect embedded-example
```

```output
example/embedded @ 1
  kind=embedded format=1.0.0
  base=0, query=0, ground_truth=0
  base_shards=0, query_shards=0, ground_truth_shards=0
  dimension=128 dtype=float32 scoring=chamfer
```

### 3. Validate the package

`validate` checks the manifest, Arrow schemas, row counts, object IDs, and
ground-truth judgments and references. `-d` (or `--detail`) additionally
hashes every shard, raw payload, and package file to verify stored integrity
data.

```command
$ mvrdata validate embedded-example
```

```output
valid: /path/to/embedded-example
  base=0, query=0, ground_truth=0
```

```command
$ mvrdata validate -d embedded-example
```

```output
valid: /path/to/embedded-example
  base=0, query=0, ground_truth=0
```

### 4. Verify or refresh checksums

`checksum` verifies `checksums.sha256`; `-r` (or `--refresh`) regenerates it
from the current package files.

```command
$ mvrdata checksum embedded-example
```

```output
checksums valid
```

```command
$ mvrdata checksum -r embedded-example
```

```output
/path/to/embedded-example/checksums.sha256
```

### 5. Create a transport archive

`pack` performs detailed validation by default and creates a reproducible
`tar.zst` archive. It refuses to overwrite an existing destination.

```command
$ mvrdata pack embedded-example embedded-example.tar.zst
```

```output
/path/to/embedded-example.tar.zst
```

### 6. Extract an archive safely

`unpack` extracts regular files into a new or empty directory while rejecting
unsafe paths, links, duplicate members, and special files.

```command
$ mvrdata unpack embedded-example.tar.zst restored-example
```

```output
/path/to/restored-example
```

A successful command returns exit code `0`. Validation or checksum failures
return `1`; invalid arguments and operational errors return `2`.

After `init`, use the Python writers to populate a new package safely:

```python
from mvr_data import EmbeddedDataWriter

with EmbeddedDataWriter(
    "tiny-mvr",
    data_name="example/tiny",
    dimension=2,
    dtype="float32",
    scoring={"scheme": "chamfer"},
) as writer:
    writer.add_base("obj-1", [[1.0, 0.0], [0.5, 0.5]])
    writer.add_query("query-1", [[1.0, 0.0]])
    writer.add_ground_truth(
        "query-1",
        "obj-1",
        2,
        split_type="test",
        judgment_source="human",
        pool_id="pool_v1",
    )
```

See [the v1 format specification](https://github.com/WittenYeh/MVR-Data/blob/main/docs/format-v1.md), the
[Raw format](https://github.com/WittenYeh/MVR-Data/blob/main/docs/raw-data.md), and the
[Embedded format](https://github.com/WittenYeh/MVR-Data/blob/main/docs/embedded-data.md) for normative details.

## Python API

The stable public entry points are:

- `open_data(path)` and the reader's `iter_base()`, `iter_queries()`, and
  `iter_ground_truth()` methods;
- `load_manifest(path)` and `validate_manifest_data(data)`;
- `RawDataWriter` and `EmbeddedDataWriter`;
- `validate_data(path, detail=False)`, which returns a structured report;
- `pack_data`, `unpack_data`, `write_checksums`, and `verify_checksums`.

## Development

```bash
pytest
```

The committed examples are manifests only. Tests generate disposable, tiny
packages at runtime so this repository remains data-free.
