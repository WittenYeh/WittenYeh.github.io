## Module responsibility

`src/mvr_data/schema.py` is the physical-format authority. It defines the format name and version, the three table names, every canonical Arrow schema, and the supported numeric vector dtypes. Readers, writers, and validators all call this module so that schema rules have one source of truth.

## Canonical definitions

`RAW_OBJECT_SCHEMA` defines raw base and query objects. `embedded_object_schema(dimension, dtype)` constructs the vector-only equivalent from manifest settings, allowing a variable vector count while fixing every vector's width and numeric type. `GROUND_TRUTH_SCHEMA` is shared by both package kinds and stores `query_id`, `base_id`, one-based `rank`, `score`, and an optional `relevance_grade`.

`object_id` is the logical link between the two representations. When a Raw
and an Embedded package describe the same collection, the same object must keep
the same `object_id` in the corresponding base or query table. Implementations
must not use row position to match raw content with vectors because row order
can differ between packages.

## Type checks and dispatch

`parse_vector_dtype()` accepts supported numeric Arrow aliases, while `canonical_dtype_name()` produces stable manifest names. `expected_schema(kind, table, manifest)` then selects the exact schema for a table and rejects unknown package kinds or table names before data is read or written.
