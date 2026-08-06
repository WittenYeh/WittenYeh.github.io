MVR-Data is a package format and reference library for multi-vector retrieval
data. It keeps original multimodal objects, vector representations, and
long-form relevance judgments in explicit Arrow tables so publishers and
consumers share the same identities and physical schemas.

## Package model

Every package is a self-contained directory with a `manifest.json`, zero or
more Arrow IPC File shards in each fixed table-role directory, and a
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
`include/mvr_data/` and a compiled `mvr_data` Python package under `python/`:

- canonical Raw, Embedded, and ground-truth Arrow schema factories;
- conversion between manifest dtype names and Arrow numeric types;
- convention-based JSON Manifest loading into strongly typed metadata;
- package readers that discover fixed-layout shards, stream validated
  RecordBatches, or materialize a table;
- package writers that assemble each table by batch or complete batch stream;
- automatic contiguous shard naming plus explicit batch-to-shard boundaries;
- byte-preserving semantic Manifest copying and whole-package checksum generation;
- atomic publication of a completed new package directory;
- sorted whole-package SHA-256 checksum generation and verification;
- safe package-relative path validation and symlink-aware file resolution;
- the CMake interface target `MVRData::mvr_data`;
- same-named Python classes and methods implemented by a native pybind11
  extension;
- native PyArrow schemas, dtypes, readers, and tables exchanged through
  Arrow's C Data and C Stream capsule protocols;
- inline Python type stubs and a `py.typed` marker.

MVR-Data itself is header-only, but Apache Arrow and LibRHash are compiled
dependencies. The current CMake project fetches pinned dependency sources and
builds them locally.

## Current boundaries

The native API is a compact reference implementation, not a distributed data
engine or full semantic validator. Opening or writing a package validates
Manifest shape, vector settings, canonical schemas, and Arrow batch invariants;
it does not enforce object-ID uniqueness, ground-truth foreign keys, relevance
semantics, or every format-level row constraint. Reader opening also does not
implicitly verify `checksums.sha256`.

`DataWriter` writes Raw and Embedded Arrow tables, but the current interface
does not copy the package-local payload files referenced by Raw
`components[].payload_uri`. A higher-level Raw dataset workflow must add those
assets after publication and refresh `checksums.sha256`, so the current writer
does not provide one-step atomic publication of a populated Raw package. There
is no public CLI or full semantic validator. Its Manifest input is a semantic
document without a `tables` field; shard paths are generated while writing and
discovered from fixed role directories while reading. Python package
installation builds a platform-specific extension from source; a prebuilt
package index release is not published yet. Some retained Python tests continue
to describe the future CLI and higher-level object-by-object writer rather than
the active binding.

## Documentation map

- [Getting Started](/projects/mvr-data/getting-started) configures and uses the current C++
  target.
- [Python Binding](/projects/mvr-data/python-binding) builds and uses the native
  `mvr_data` package.
- [Data Format](/projects/mvr-data/schema) describes the interoperable package contract.
- [Schema API](/projects/mvr-data/schema-api), [Manifest API](/projects/mvr-data/manifest-api), [Reader
  API](/projects/mvr-data/reader-api), [Writer API](/projects/mvr-data/writer-api), and [Integrity API](/projects/mvr-data/utilities-api) document
  every explicitly declared public native interface.
