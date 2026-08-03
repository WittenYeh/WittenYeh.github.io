> **Rewrite in progress.** The previous Python reference implementation and
> its `src/` directory have been removed. The repository currently provides no
> installable library, CLI, C++ API, or Python API. Its format specification,
> schemas, examples, and behavioral tests remain as inputs to the new design.

MVR-Data defines how multi-vector retrieval data is organized at runtime and
packaged for interchange using Apache Arrow. It covers Raw multimodal content,
Embedded multi-vector representations, and long-form relevance judgments.

## Target architecture

The replacement implementation will have one shared native core:

- a **header-only C++ API** under `include/mvr_data/`;
- a compiled **pybind11 Python extension** that exposes the same behavior to
  Python without invoking a subprocess;
- Apache Arrow C++ for schemas, arrays, record batches, IPC, and memory sharing;
- a CMake `INTERFACE` target for C++ consumers;
- Doxygen comments in the public C++ headers and generated C++ API reference;
- Python modules that remain thin adapters rather than a second implementation.

MVR-Data will remain a reference implementation rather than a distributed data
engine. Exact object-ID and ground-truth indexes may be held in memory, and the
documentation will state those assumptions explicitly.

Although MVR-Data itself will be header-only for C++ consumers, Apache Arrow is
a compiled dependency, and the Python extension must still be built as a native
module.

The intended language symmetry looks like the following. This is a design
sketch only—the names below are not available during the rewrite and are not
yet a stable API:

```python
from mvr_data import open_data

reader = open_data("example-data")
```

## What remains in the repository

| Path | Purpose during the rewrite |
| --- | --- |
| `docs/` | Normative and explanatory format documentation. |
| `schemas/` | Manifest JSON Schema. |
| `examples/` | Example Raw and Embedded Manifests. |
| `tests/` | Behavioral requirements retained from the previous implementation. |
| `include/` | Planned header-only C++ API location; not created yet. |
| `python/` | Planned pybind11 binding location; not created yet. |

The retained tests are not expected to run until the replacement Python module
is introduced.

## Rewrite sequence

1. Define public C++ types, the status/error model, and a CMake `INTERFACE`
   target.
2. Implement schemas, Manifest handling, and Arrow IPC reading in headers.
3. Add Raw and Embedded writers plus exact in-memory validation.
4. Bind the C++ API through pybind11 while preserving a concise Python surface.
5. Re-enable the behavioral tests and publish installation and API references.

Until those steps land, MVR-Data should be treated as a format and design
workspace rather than a usable software release. The [Data Format](./schema)
chapter records the concepts that remain stable during the rewrite.
