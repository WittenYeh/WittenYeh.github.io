## APIs

`schema.py` currently exposes no stable package-level APIs: none of its symbols
are re-exported from `mvr_data.__init__`. Most users should construct, read, or
validate data through `RawDataWriter`, `EmbeddedDataWriter`, `open_data()`, and
`validate_data()` instead of depending on PyArrow schema details.

The module provides the following internal callable surface for the reader,
writer, validator, and advanced low-level integrations:

| Name | Role |
| --- | --- |
| `parse_vector_dtype(name)` | Resolves a supported numeric dtype name to a PyArrow type. |
| `canonical_dtype_name(dtype)` | Converts a supported PyArrow type to its canonical manifest spelling. |
| `embedded_object_schema(dimension, dtype)` | Builds the exact Embedded base/query schema. |
| `expected_schema(kind, table, manifest)` | Returns the required schema for one package table. |

`RAW_OBJECT_SCHEMA` and `GROUND_TRUTH_SCHEMA` are reusable schema constants,
while `FORMAT_NAME`, `FORMAT_VERSION`, and `TABLE_NAMES` define format identity
and table names. Direct imports from `mvr_data.schema` should be treated as
internal until these names are promoted to the documented package API.

## Implementation

`schema.py` is the single source of truth for physical Arrow layouts. Its
private `_required()` helper makes every format field non-nullable.

- Raw base/query rows contain an `object_id` and an ordered `list<struct>` of
  components. An object is one retrievable item, such as an illustrated
  article, audio recording, or video.
- Embedded base/query rows contain an `object_id` and a
  `large_list<fixed_size_list<T, dimension>>`. Vector count may vary by object,
  but dtype and dimension are fixed by the manifest.
- Ground-truth rows use one shared schema containing `query_id`, `object_id`,
  `relevance`, `split_type`, `judgment_source`, and `pool_id`.

The dtype helpers accept only fixed-width integer or floating-point Arrow
types. `expected_schema()` dispatches by package kind and table name, derives
Embedded schemas from `manifest.vector`, and rejects unknown inputs. Readers,
writers, and validators reuse this result so every shard is produced and
checked against the same canonical schema.
