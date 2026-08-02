## Module responsibility

`src/mvr_dataset/checksums.py` implements whole-package SHA-256 integrity records in `checksums.sha256`.

## Hashing and file discovery

`sha256_file()` streams files in one-megabyte chunks and returns both the hexadecimal digest and byte size. `package_files()` recursively discovers regular files, ignores symlinks and the checksum file itself, and sorts paths by their POSIX package-relative spelling. The stable ordering makes generated checksum files reproducible.

## Writing checksums

`write_checksums()` emits the conventional format:

```text
<64-character-sha256>  <relative/path>
```

It writes through a temporary file and uses `os.replace()` so readers never observe a partial checksum list.

## Parsing and verification

The parser requires lowercase hexadecimal digests, two spaces between digest and path, unique entries, and safe relative POSIX paths without parent traversal.

`verify_checksums()` compares the expected and actual path sets before hashing shared files. It returns human-readable errors for missing files, unlisted files, and digest mismatches; an empty list means success. Returning all errors lets both the Python API and CLI present a complete integrity report.
