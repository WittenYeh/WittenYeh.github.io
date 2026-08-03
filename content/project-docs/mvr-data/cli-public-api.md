## Command-line interface

`src/mvr_data/cli.py` defines the `mvrdata` command with `argparse`. `build_parser()` registers six subcommands:

| Command | Implementation behavior |
| --- | --- |
| `init` | Validates raw/embedded arguments and creates an empty package skeleton. |
| `inspect` | Summarizes manifest metadata, counts, vector settings, or discovered raw modalities. |
| `validate` | Prints a validation report as text or JSON. |
| `checksum` | Verifies checksums or refreshes them with `-r` / `--refresh`. |
| `pack` | Creates a reproducible archive, with validation enabled by default. |
| `unpack` | Safely extracts a transport archive. |

`main()` dispatches commands and converts expected `OSError` and `ValueError` failures into concise stderr messages. Exit code `0` means success, `1` means validation or checksum failure, and `2` means invalid input or an operational error.

## Stable Python API

`src/mvr_data/__init__.py` re-exports the supported public surface:

- `open_data` and `DataReader`;
- `RawDataWriter`, `RawComponent`, and `EmbeddedDataWriter`;
- validation report types and `validate_data`;
- checksum, pack, and unpack functions.

It also declares `__version__ = "0.1.0"`. Keeping imports here separates supported entry points from internal helpers that may change.

## Package entry point

`pyproject.toml` connects the terminal command to the Python dispatcher:

```toml
[project.scripts]
mvrdata = "mvr_data.cli:main"
```

The adjacent `src/mvr_data.egg-info/` directory is generated packaging metadata. It records dependencies, distribution inputs, the console entry point, and the top-level import name; it does not implement data behavior.
