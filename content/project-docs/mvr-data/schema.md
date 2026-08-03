## Stable package concepts

An **object** is one retrievable content item, such as an illustrated article,
an audio recording, a video, or another multimodal item.

- **Raw data** stores base and query objects as one or more ordered content
  components whose payloads live inside the package.
- **Embedded data** stores base and query object IDs with one or more ordered
  vectors. Dimension and numeric dtype are fixed package-wide.
- **Ground-truth data** stores judged query-object pairs with their relevance,
  split, judgment source, and annotation pool.

If Raw and Embedded packages describe the same collection, the same base or
query object must use the same `object_id` in both packages. Row positions do
not need to match; the ID is the link between content and vectors.

## Raw base and query tables

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `object_id` | `string` | Unique object identifier within the table. |
| `components` | `list<struct>` | One or more ordered content components of an object. |
| `components[].component_id` | `string` | Component identifier, unique within the object. |
| `components[].modality` | `string` | Extensible modality such as `text`, `image`, `audio`, or `video`. |
| `components[].media_type` | `string` | MIME type such as `text/plain` or `image/png`. |
| `components[].payload_uri` | `string` | Package-local content-addressed payload URI. |

## Embedded base and query tables

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `object_id` | `string` | Unique object identifier within the table. |
| `vectors` | `large_list<fixed_size_list<T, dimension>>` | One or more ordered vectors using the package-wide dtype and dimension. |

## Ground-truth table

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `query_id` | `string` | ID of an object in the query table. |
| `object_id` | `string` | ID of an object in the base table. |
| `relevance` | `int16` | Non-negative relevance level. |
| `split_type` | `string` | Data split such as `test`. |
| `judgment_source` | `string` | Label source such as `human` or `adjudicated`. |
| `pool_id` | `string` | Candidate annotation-pool identifier. |

## Manifest

Every package contains `manifest.yaml`. Arrow files store object and
ground-truth rows, while the Manifest:

- identifies the format, package kind, logical data name, and version;
- indexes the `base`, `query`, and `ground_truth` Arrow shards;
- records each table's total row count and each shard's path, rows, and digest;
- stores package-wide dimension, dtype, and scoring settings for Embedded data.

The JSON Schema under the repository's `schemas/` directory remains the
normative machine-readable Manifest contract during the implementation rewrite.

A minimal Embedded Manifest retains this structure:

```yaml
format: mvr-data
format_version: 1.0.0
kind: embedded
data_name: example/tiny
data_version: "1"
tables:
  base: {rows: 0, shards: []}
  query: {rows: 0, shards: []}
  ground_truth: {rows: 0, shards: []}
vector:
  dimension: 128
  dtype: float32
  scoring:
    scheme: chamfer
```
