## Module responsibility

`src/mvr_dataset/schema.py` is the physical-format authority. It defines the format name and version, the three table names, every canonical Arrow schema, and the supported numeric vector dtypes. Readers, writers, and validators all call this module so that schema rules have one source of truth.

## Raw objects and ground truth

`RAW_OBJECT_SCHEMA` stores an `object_id`, an ordered `large_list` of components, and string metadata. Each component contains its ID, modality, MIME type, package-local URI, byte size, binary SHA-256 digest, and metadata.

`GROUND_TRUTH_SCHEMA` stores one row per ranked result:

| Field | Arrow type | Meaning |
| --- | --- | --- |
| `query_id` | string | Query object reference. |
| `base_id` | string | Retrieved base object reference. |
| `rank` | uint32 | One-based rank. |
| `score` | float64 | Publisher-provided score. |
| `relevance_grade` | nullable int16 | Optional graded relevance. |

Required fields are explicitly non-nullable.

## Embedded objects

`embedded_object_schema(dimension, dtype)` constructs the schema at runtime. An object contains a `large_list` of vectors, and each vector is a fixed-size list with the manifest's declared dimension. This represents a variable number of vectors per object without allowing inconsistent vector widths.

`parse_vector_dtype()` accepts numeric Arrow aliases, rejects variable-width or non-numeric types, and `canonical_dtype_name()` converts the result to a stable manifest spelling.

## Schema dispatch

`expected_schema(kind, table, manifest)` selects the ground-truth schema or the correct raw/embedded object schema. Any unknown kind or table raises immediately. This function is the common boundary used before Arrow data is accepted or emitted.
