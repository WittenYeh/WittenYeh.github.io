## Module responsibility

`src/mvr_data/manifest.py` owns `manifest.yaml`. It combines JSON Schema validation with format-version checks and Arrow dtype normalization.

## Loading and validation

`manifest_json_schema()` locates `manifest-v1.schema.json` in the source tree or installed package data and caches it. `validate_manifest_data()` then:

1. Requires a mapping at the document root.
2. Applies the Draft 2020-12 JSON Schema.
3. Checks the format name and supported major version.
4. Parses the embedded vector dtype to reject unsupported physical types.

Validation errors include the failing manifest path, making CLI reports actionable. `load_manifest()` also converts missing files and invalid YAML into consistent `ValueError` messages.

## Creating manifests

`empty_manifest()` records the required `data_name` and `data_version`, then
initializes the three table declarations with zero rows and no shards. Embedded
packages must provide `dimension`, `dtype`, and `scoring`; raw packages reject
embedded-only scoring settings. Ground-truth judgments are self-describing
rows, so the manifest no longer needs Top-K, score-name, or score-order fields.

`canonical_manifest_dtype()` ensures aliases such as `float` are recorded with a stable spelling such as `float32`.

## Atomic writes

`write_manifest()` validates before writing. It serializes YAML to a temporary file in the package directory, then uses `os.replace()` to publish it atomically. A failed write therefore does not leave a partially rewritten manifest at the final path.
