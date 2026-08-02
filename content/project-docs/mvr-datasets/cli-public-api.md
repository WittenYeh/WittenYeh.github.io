## Command-line interface

`src/mvr_dataset/cli.py` defines the `mvr` command with `argparse`. `build_parser()` registers six subcommands:

| Command | Implementation behavior |
| --- | --- |
| `init` | Validates raw/embedded arguments and creates an empty package skeleton. |
| `inspect` | Summarizes manifest metadata, counts, vector settings, or discovered raw modalities. |
| `validate` | Prints a validation report as text or JSON. |
| `checksum` | Verifies checksums or rewrites them with `--write`. |
| `pack` | Creates a reproducible archive, with validation enabled by default. |
| `unpack` | Safely extracts a transport archive. |

`main()` dispatches commands and converts expected `OSError` and `ValueError` failures into concise stderr messages. Exit code `0` means success, `1` means validation or checksum failure, and `2` means invalid input or an operational error.

## Stable Python API

`src/mvr_dataset/__init__.py` re-exports the supported public surface:

- `open_dataset` and `DatasetReader`;
- `RawDatasetWriter`, `RawComponent`, and `EmbeddedDatasetWriter`;
- validation report types and `validate_dataset`;
- checksum, pack, and unpack functions.

It also declares `__version__ = "0.1.0"`. Keeping imports here separates supported entry points from internal helpers that may change.

## Package entry point

`pyproject.toml` connects the terminal command to the Python dispatcher:

```toml
[project.scripts]
mvr = "mvr_dataset.cli:main"
```

The adjacent `src/mvr_dataset_format.egg-info/` directory is generated packaging metadata. It records dependencies, distribution inputs, the console entry point, and the top-level import name; it does not implement dataset behavior.
