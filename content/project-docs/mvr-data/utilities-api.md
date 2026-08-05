Include `<mvr_data/checksum.hpp>` directly, or use
`<mvr_data/mvr_data.hpp>`. `Checksum` is stateless and exposes only static
operations. Filesystem helpers are implementation details and are not part of
the public API.

## Example

Verify the exact package file set before opening it:

```cpp
#include <mvr_data/mvr_data.hpp>

#include <filesystem>

auto verify_package(const std::filesystem::path& root) -> arrow::Status {
    return mvr_data::Checksum::verify(root);
}
```

## `mvr_data::Checksum` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/checksum.hpp "View source on GitHub")

```cpp
class Checksum final;
```

Stateless whole-package SHA-256 operations backed by LibRHash. The class cannot
be instantiated; use its static refresh and verification methods.

Checksums cover regular non-symlink files below the canonical package root.
Directory symlinks are not followed, symlink entries are ignored, and
`checksums.sha256` never hashes itself.

**Parameters**

None.

## `mvr_data::Checksum::refresh` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/checksum.hpp "View source on GitHub")

```cpp
static auto refresh(const std::filesystem::path& root)
    -> arrow::Status;
```

Canonicalizes the package directory, enumerates covered files in sorted
portable relative-path order, calculates lowercase SHA-256 digests without
loading complete files into memory, and replaces `checksums.sha256` with
GNU-style lines separated by two spaces.

Call this only after all other package files have reached their distributable
state. A later file addition, removal, or byte change makes verification fail.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `const std::filesystem::path&` | Existing package directory whose complete regular-file set should be recorded. The path may be relative or contain symlinks. |

**Returns**

`arrow::Status` — `OK` after the checksum list is finalized, or the first
canonicalization, enumeration, hashing, creation, write, or close error.

## `mvr_data::Checksum::verify` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/checksum.hpp "View source on GitHub")

```cpp
static auto verify(const std::filesystem::path& root)
    -> arrow::Status;
```

Canonicalizes the package directory, parses `checksums.sha256`, and requires
an exact one-to-one match between listed paths and the current covered files.
It recalculates every digest and returns on the first mismatch or I/O failure.

Verification is not invoked by `Manifest::load` or `DataReader::open`. Call it
explicitly when detecting package modification or corruption is required.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `const std::filesystem::path&` | Existing package directory containing a readable `checksums.sha256`. The path may be relative or contain symlinks. |

**Returns**

`arrow::Status` — `OK` only when checksum syntax, the package file set, and all
digests match; otherwise the first invalid-data, I/O, or hashing status.
