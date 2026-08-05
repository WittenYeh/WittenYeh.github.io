MVR-Data is a package format and reference library for multi-vector retrieval
data. It keeps original multimodal objects, vector representations, and
long-form relevance judgments in explicit Arrow tables so publishers and
consumers share the same identities and physical schemas.

## Package model

Every package is a self-contained directory with a `manifest.json`, zero or
more Arrow IPC File shards for each table binding, and a
`checksums.sha256` file. A package has exactly one physical kind:

- **Raw** packages store ordered components for each base and query object.
  Component payloads are content-addressed files below `assets/`.
- **Embedded** packages store one or more ordered vectors for each base and
  query object. Dimension and numeric dtype are fixed package-wide.
- Both kinds store **ground truth** as long-form query-object judgments with a
  relevance level, split, judgment source, and annotation pool.

Raw and Embedded packages remain independent. When they describe the same
logical collection, matching objects use the same `object_id`; consumers join
the two representations by ID rather than row position.

## Available now

The repository currently provides a header-only C++20 interface under
`include/mvr_data/`:

- canonical Raw, Embedded, and ground-truth Arrow schema factories;
- conversion between manifest dtype names and Arrow numeric types;
- convention-based JSON Manifest loading into strongly typed metadata;
- package readers that stream validated RecordBatches or materialize a table;
- sorted whole-package SHA-256 checksum generation and verification;
- safe package-relative path validation and symlink-aware file resolution;
- the CMake interface target `MVRData::mvr_data`.

MVR-Data itself is header-only, but Apache Arrow and LibRHash are compiled
dependencies. The current CMake project fetches pinned dependency sources and
builds them locally.

## Current boundaries

The native API is a compact reference implementation, not a distributed data
engine. It reads existing packages but does not yet provide a public writer or
full semantic validator. In particular, opening a package validates Manifest
shape, vector settings, shard path spelling, and canonical schemas; it does not
by itself verify `checksums.sha256`, object-ID uniqueness, ground-truth foreign
keys, or every format-level row constraint.

Python bindings and repository installation/export rules are still planned.
The retained Python tests describe intended future behavior and are not a
currently importable Python API. Use the C++ reference chapters for the API
that exists today.

## Documentation map

- [Getting Started](/projects/mvr-data/getting-started) configures and uses the current C++
  target.
- [Data Format](/projects/mvr-data/schema) describes the interoperable package contract.
- [Schema API](/projects/mvr-data/schema-api), [Manifest API](/projects/mvr-data/manifest-api), [Reader
  API](/projects/mvr-data/reader-api), and [Integrity & Filesystem API](/projects/mvr-data/utilities-api) document
  every explicitly declared public native interface.
