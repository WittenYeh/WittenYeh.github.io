The installed `mvrdata` entry point provides six commands:

## `mvrdata init` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/cli.py "View source on GitHub")

```bash
mvrdata init PATH --kind {raw,embedded} --data-name NAME \
  [--data-version VERSION] \
  [--dimension DIMENSION --dtype DTYPE --scoring-scheme SCHEME]
```

Creates an empty Raw or Embedded package with its directory layout, Manifest,
and checksum file.

**Parameters**

| Name | Description |
| --- | --- |
| `PATH` | New or empty package directory. |
| `--kind` | Required package kind: `raw` or `embedded`. |
| `--data-name` | Required logical data name. |
| `--data-version` | Logical data version. Defaults to `1`. |
| `--dimension` | Vector dimension; required only for Embedded data. |
| `--dtype` | Vector dtype; required only for Embedded data. |
| `--scoring-scheme` | Scoring-scheme identifier; required only for Embedded data. |

## `mvrdata inspect` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/cli.py "View source on GitHub")

```bash
mvrdata inspect PATH [--json]
```

Summarizes Manifest identity, table row counts, shard counts, and vector or Raw
modality information.

**Parameters**

| Name | Description |
| --- | --- |
| `PATH` | Root directory of the data package. |
| `--json` | Emit machine-readable JSON instead of terminal text. |

## `mvrdata validate` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/cli.py "View source on GitHub")

```bash
mvrdata validate PATH [-d | --detail] [--json]
```

Validates a data package and reports every recoverable issue.

**Parameters**

| Name | Description |
| --- | --- |
| `PATH` | Root directory of the data package. |
| `-d`, `--detail` | Also recompute shard, payload, and package checksums. |
| `--json` | Emit the complete validation report as JSON. |

## `mvrdata checksum` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/cli.py "View source on GitHub")

```bash
mvrdata checksum PATH [-r | --refresh]
```

Verifies `checksums.sha256`, or regenerates it from the current package files.

**Parameters**

| Name | Description |
| --- | --- |
| `PATH` | Root directory of the data package. |
| `-r`, `--refresh` | Regenerate `checksums.sha256` instead of verifying it. |

## `mvrdata pack` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/cli.py "View source on GitHub")

```bash
mvrdata pack SOURCE DESTINATION \
  [--compression-level LEVEL] [--no-validate]
```

Creates a reproducible `.tar.zst` transport archive.

**Parameters**

| Name | Description |
| --- | --- |
| `SOURCE` | Root directory of the data package. |
| `DESTINATION` | New archive path. |
| `--compression-level` | Zstandard compression level. Defaults to `10`. |
| `--no-validate` | Skip the default detailed package validation. |

## `mvrdata unpack` [source](https://github.com/WittenYeh/MVR-Data/blob/main/src/mvr_data/cli.py "View source on GitHub")

```bash
mvrdata unpack SOURCE DESTINATION
```

Safely extracts a `.tar.zst` transport archive.

**Parameters**

| Name | Description |
| --- | --- |
| `SOURCE` | Path to the archive. |
| `DESTINATION` | New or empty extraction directory. |

Exit code `0` means success, `1` means validation or checksum failure, and `2`
means invalid input or an operational error.

## Package APIs

`mvr_data.__init__` defines the stable Python surface:

- [Manifest](/projects/mvr-data/manifest): `load_manifest` and
  `validate_manifest_data`.
- [Reader](/projects/mvr-data/reader): `open_data` and `DataReader`.
- [Writer](/projects/mvr-data/writer): `RawComponent`, `RawDataWriter`, and
  `EmbeddedDataWriter`.
- [Validation](/projects/mvr-data/validation): `validate_data`,
  `ValidationIssue`, and `ValidationReport`.
- [Checksum](/projects/mvr-data/checksums): `write_checksums` and
  `verify_checksums`.
- [Packaging](/projects/mvr-data/packaging): `pack_data` and `unpack_data`.

Each linked chapter documents the public prototypes, descriptions, parameters,
and return values without repeating those signatures here.

The package currently provides no native C++ API; the format itself remains
language-independent and can be consumed through Apache Arrow implementations.
