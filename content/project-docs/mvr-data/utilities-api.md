Include `<mvr_data/checksum.hpp>` or `<mvr_data/filesystem.hpp>` directly, or
use `<mvr_data/mvr_data.hpp>`. Both utility classes are stateless and expose
only static operations.

## Example

Verify the exact package file set, then resolve a Manifest shard without
allowing traversal or a symlink escape:

```cpp
#include <mvr_data/mvr_data.hpp>

#include <arrow/api.h>

#include <filesystem>

auto verify_and_resolve(const std::filesystem::path& root)
    -> arrow::Result<std::filesystem::path> {
    ARROW_RETURN_NOT_OK(mvr_data::Checksum::verify(root));
    ARROW_ASSIGN_OR_RAISE(
        auto canonical_root,
        mvr_data::FileSystem::canonical_directory(root, "package root")
    );
    return mvr_data::FileSystem::resolve_regular_file(
        canonical_root,
        "base/part-00000.arrow"
    );
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

## `mvr_data::FileSystem` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/filesystem.hpp "View source on GitHub")

```cpp
class FileSystem final;
```

Stateless path-validation and resolution operations shared by package APIs.
The class cannot be instantiated; use its static methods.

**Parameters**

None.

## `mvr_data::FileSystem::canonical_directory` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/filesystem.hpp "View source on GitHub")

```cpp
static auto canonical_directory(
    const std::filesystem::path& path,
    std::string_view description
) -> arrow::Result<std::filesystem::path>;
```

Resolves an existing path with `std::filesystem::canonical`, then requires the
result to be a directory. The returned path is absolute, normalized, and has
its symlinks resolved according to the host filesystem.

`description` is used only to make diagnostics identify the caller's concept,
for example `"package root"`.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `path` | `const std::filesystem::path&` | Existing directory to canonicalize. Relative paths and symlinks are accepted when they resolve successfully. |
| `description` | `std::string_view` | Non-owning noun inserted into error messages. The view only needs to remain valid for the call. |

**Returns**

`arrow::Result<std::filesystem::path>` — the canonical directory; an Arrow I/O
status when resolution or inspection fails; or `arrow::Status::Invalid` when
the resolved path is not a directory.

## `mvr_data::FileSystem::is_safe_relative_path` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/filesystem.hpp "View source on GitHub")

```cpp
static auto is_safe_relative_path(std::string_view value) -> bool;
```

Performs a platform-independent lexical check for a portable package-relative
POSIX path. It rejects an empty value, a leading `/`, NUL, backslash, URI-like
scheme prefixes, and any empty, `.` or `..` component. It does not access the
filesystem or determine whether the target exists.

Examples accepted by the format include `base/part-00000.arrow` and
`assets/sha256/ab/<digest>`.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `std::string_view` | Candidate package-relative spelling using `/` separators. The view only needs to remain valid for the call. |

**Returns**

`bool` — `true` when the spelling passes every lexical safety rule; `false`
otherwise.

## `mvr_data::FileSystem::is_within` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/filesystem.hpp "View source on GitHub")

```cpp
static auto is_within(
    const std::filesystem::path& root,
    const std::filesystem::path& candidate
) -> bool;
```

Tests component-wise containment: `root` must be a complete prefix of
`candidate`. Equality counts as containment. This avoids string-prefix errors
such as treating `/data/pkg-other` as a child of `/data/pkg`.

The function does not canonicalize either operand. Callers use canonical paths
when containment must account for `..` components or symlinks.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `const std::filesystem::path&` | Expected canonical root path. |
| `candidate` | `const std::filesystem::path&` | Expected canonical path to test against the root. |

**Returns**

`bool` — `true` when `candidate` equals `root` or is component-wise below it.

## `mvr_data::FileSystem::resolve_regular_file` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/filesystem.hpp "View source on GitHub")

```cpp
static auto resolve_regular_file(
    const std::filesystem::path& root,
    std::string_view relative
) -> arrow::Result<std::filesystem::path>;
```

Combines a canonical package root with a lexically safe relative path,
canonicalizes the result, requires it to remain below the root, and requires
the target to be a regular file. A symlink may resolve to a file inside the
package; a symlink escape is rejected.

This method assumes `root` is already canonical. Use `canonical_directory`
first for a caller-supplied package path.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `const std::filesystem::path&` | Canonical package directory used as the containment boundary. |
| `relative` | `std::string_view` | Portable package-relative file path. It must pass `is_safe_relative_path`; the view only needs to remain valid for the call. |

**Returns**

`arrow::Result<std::filesystem::path>` — the canonical regular-file path;
`arrow::Status::Invalid` for an unsafe spelling, escape, or non-file target; or
an Arrow I/O status when filesystem resolution or inspection fails.
