## Module responsibility

`src/mvr_data/packaging.py` transports a directory package as a reproducible `.tar.zst` archive while treating extraction as a security boundary.

## Reproducible packing

`pack_data()` performs detailed data validation by default and refuses to overwrite an existing destination. Archive entries are sorted, and symlinks or special files are rejected.

For reproducibility, every tar entry receives normalized metadata:

- user and group IDs are zero;
- user and group names are empty;
- timestamps are zero;
- modes are fixed to `0755` for directories and `0644` for files;
- PAX headers are cleared.

The tar stream is compressed with Zstandard and written to a temporary file before atomic publication. If any step fails, the temporary archive is removed.

## Safe extraction

`unpack_data()` requires an empty destination. `_safe_member_path()` rejects absolute paths, parent traversal, NUL bytes, and resolved paths outside the destination. Duplicate archive entries, links, devices, and other special members are forbidden.

Regular files are created with exclusive mode so existing files cannot be silently replaced. If extraction fails, the newly created destination is removed, preventing callers from mistaking a partial package for a complete one.
