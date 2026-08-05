This chapter summarizes the normative format-v1 contract implemented by the
current C++ headers. The repository's `docs/` directory remains the detailed
format specification when interoperability requirements and implementation
behavior differ in scope.

## Package layout

An MVR-Data package is a directory containing JSON metadata, Arrow IPC File
shards, and a whole-package checksum list:

```text
data/
  manifest.json
  checksums.sha256
  base/part-00000.arrow
  query/part-00000.arrow
  ground_truth/part-00000.arrow
  assets/sha256/ab/ab...       # Raw packages only
```

A package is either `raw` or `embedded`; it never mixes both object schemas and
does not depend on another package. Compression and transport containers are
outside the format.

Paths stored in Manifests and Arrow rows use `/` separators and are relative to
the package root. Empty components, `.`, `..`, absolute paths, backslashes, NUL
bytes, URI schemes, and symlinks that escape the package are forbidden. Raw
payloads live below `assets/`, so a valid package never requires a remote
download.

## Objects and table bindings

An **object** is one retrievable item: for example, an illustrated article,
audio recording, video clip, or another multimodal unit. Format v1 defines
three physical Arrow schemas:

1. Raw objects;
2. Embedded objects;
3. Ground-truth judgments.

The Manifest keys `base`, `query`, and `ground_truth` are fixed logical table
bindings, not additional schema kinds. Base and query shards share the object
schema selected by the package kind. Ground-truth shards always use the
ground-truth schema.

When independent Raw and Embedded packages describe the same collection,
matching base or query objects keep the same `object_id`. Row order may differ;
consumers join content and vectors by ID.

## Manifest

`manifest.json` must be valid JSON with unique publisher-authored object keys.
Its required core shape is:

```json
{
  "format_version": "1.0.0",
  "kind": "raw",
  "data_name": "example/raw",
  "data_version": "1",
  "tables": {
    "base": ["base/part-00000.arrow"],
    "query": ["query/part-00000.arrow"],
    "ground_truth": ["ground_truth/part-00000.arrow"]
  }
}
```

Each table value is an ordered array of portable, package-relative Arrow shard
paths. Empty arrays are allowed. Shards conventionally use
`part-NNNNN.arrow`; row counts come from Arrow, and digests appear only in
`checksums.sha256`.

`data_name` and `data_version` are non-empty publisher-defined identifiers.
Raw and Embedded packages for the same logical collection should use the same
values. Optional `description`, `license`, and `source` fields are strings.
`extensions`, when present, is an object for namespaced publisher metadata;
core behavior must not depend on it. Unknown fields are ignored by the
reference reader for forward compatibility.

For Embedded packages, `vector` is required:

```json
{
  "vector": {
    "dimension": 128,
    "dtype": "float32",
    "scoring": "chamfer"
  }
}
```

`dimension` is a positive signed 32-bit integer. `dtype` is one of `float16`,
`float32`, `float64`, `int8`, `uint8`, `int16`, `uint16`, `int32`, `uint32`,
`int64`, or `uint64`. `scoring` is a non-empty publisher-defined identifier.
The format records that identifier but does not implement or standardize the
scoring calculation.

`format_version` is descriptive metadata: the current reader preserves it but
does not reject a Manifest solely because of its value.

## Raw object schema

Raw base and query tables use this exact non-nullable Arrow layout:

```text
object_id: string not null
components: list<item: struct<
  component_id: string not null,
  modality: string not null,
  media_type: string not null,
  payload_uri: string not null
> not null> not null
```

`object_id` is non-empty and unique within its table. Base and query IDs use
separate namespaces, so the same string may occur once in each. Every object
has one or more ordered components, and `component_id` is non-empty and unique
inside that object.

`modality` is an extensible lowercase token such as `text`, `image`, `audio`,
or `video`; `media_type` is the payload's MIME type. Every payload, including
text, is a file. Its URI has the form
`assets/sha256/<first-two-hex>/<full-sha256>`, locating the package-local bytes
and encoding their content digest.

## Embedded object schema

Embedded base and query tables use a schema parameterized by package-wide
dimension `D` and dtype `T`:

```text
object_id: string not null
vectors: large_list<item: fixed_size_list<item: T, D> not null> not null
```

Every object has one or more ordered vectors. Vector count may vary by row;
each vector has exactly `D` scalar values of the declared type. The Arrow
`large_list` stores offsets plus contiguous fixed-size vector values, similar
to a CSR row layout but without a column-index array.

The format does not prescribe cosine, dot product, L2, Chamfer, ColBERT
sum-of-max, or another aggregation. Reproducing a publisher's scores requires
understanding its declared scoring identifier and any extension metadata.

## Ground-truth schema

Both package kinds use the same exact non-nullable judgment schema:

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `query_id` | `string` | Existing object ID in the query table. |
| `object_id` | `string` | Existing object ID in the base table. |
| `relevance` | `int16` | Non-negative graded relevance level. |
| `split_type` | `string` | Split such as `train`, `validation`, or `test`. |
| `judgment_source` | `string` | Label source such as `human` or `adjudicated`. |
| `pool_id` | `string` | Candidate judgment-pool identifier. |

Each row is one judgment, not a ranked retrieval result. `relevance` is in the
inclusive range `0..32767`, with larger values meaning greater relevance. The
three descriptive strings are non-empty, and
`(query_id, object_id, split_type, pool_id)` is unique. When the base table is
non-empty, every query has at least one judgment. Row order has no semantic
meaning.

## Arrow shard requirements

Every shard uses the Arrow IPC **file** format, not the IPC stream format.
Shards may use IPC body compression. All shards bound to one table have the
exact canonical schema, including field nullability and metadata. Core tables
do not accept arbitrary additional columns in format v1.

The C++ scanner memory-maps one shard at a time, checks metadata-aware schema
equality, and calls Arrow's full RecordBatch validation before returning each
batch. These structural checks do not replace semantic validation of IDs,
non-empty lists, relevance bounds, or payload digests.

## Integrity

`checksums.sha256` contains sorted GNU-style lines for every regular
non-symlink package file except itself:

```text
<64 lowercase SHA-256 hex characters>  <package-relative path>
```

Verification requires the list and package file set to match exactly and each
digest to match the current bytes. Raw publishers also ensure that every
`payload_uri` embeds the digest of its referenced payload.

Checksum verification is explicit. `Manifest::load` and `DataReader::open` do
not invoke it automatically.

## Compatibility policy

A minor format version may add optional Manifest metadata but cannot change
core Arrow fields, nullability, or semantics. An incompatible schema or
semantic change requires a new major version. Readers should ignore unknown
Manifest fields; custom metadata belongs in a namespaced `extensions` entry.

Because the current implementation treats `format_version` as descriptive,
applications that enforce a supported-version policy must compare
`Manifest::format_version()` themselves.
