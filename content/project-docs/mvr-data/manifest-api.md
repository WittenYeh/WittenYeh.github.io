Include `<mvr_data/manifest.hpp>` directly or use
`<mvr_data/mvr_data.hpp>`. Manifest loading returns Arrow `Result<T>` errors;
successful accessors expose immutable views whose lifetimes are tied to their
owning objects.

## Example

Load an Embedded Manifest and inspect its base-table binding:

```cpp
#include <mvr_data/manifest.hpp>

#include <arrow/api.h>

#include <filesystem>

auto inspect(const std::filesystem::path& root) -> arrow::Status {
    ARROW_ASSIGN_OR_RAISE(auto manifest, mvr_data::Manifest::load(root));

    if (manifest.package_kind() != mvr_data::PackageKind::embedded) {
        return arrow::Status::Invalid("expected an Embedded package");
    }

    const auto& vector = manifest.vector_config().value();
    const auto& base = manifest.table_info(mvr_data::TableRole::base());
    // Use vector.dimension, vector.dtype, vector.scoring, base.schema, and
    // base.shards while `manifest` remains alive.
    return arrow::Status::OK();
}
```

## `mvr_data::PackageKind` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
enum class PackageKind {
    raw,
    embedded
};
```

Identifies the package's physical object representation. `raw` selects the Raw
component schema; `embedded` selects the dimension- and dtype-parameterized
vector schema. Ground truth has the same schema for both values.

**Parameters**

None.

## `mvr_data::TableRole` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
class TableRole final;
```

Immutable value object for one of the three fixed Manifest table bindings. It
cannot be constructed from arbitrary strings; use `base()`, `query()`, or
`ground_truth()` so downstream role dispatch remains exhaustive.

**Parameters**

None.

## `mvr_data::TableRole::base` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
static constexpr auto base() noexcept -> TableRole;
```

Creates the role for retrieval-candidate objects and the Manifest `base` key.

**Parameters**

None.

**Returns**

`mvr_data::TableRole` — the base-table role.

## `mvr_data::TableRole::query` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
static constexpr auto query() noexcept -> TableRole;
```

Creates the role for retrieval-query objects and the Manifest `query` key.

**Parameters**

None.

**Returns**

`mvr_data::TableRole` — the query-table role.

## `mvr_data::TableRole::ground_truth` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
static constexpr auto ground_truth() noexcept -> TableRole;
```

Creates the role for long-form relevance judgments and the Manifest
`ground_truth` key.

**Parameters**

None.

**Returns**

`mvr_data::TableRole` — the ground-truth table role.

## `mvr_data::TableRole::name` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
constexpr auto name() const -> std::string_view;
```

Returns the role's canonical Manifest key. Every value produced by the public
factories maps to exactly one of `base`, `query`, or `ground_truth`.

**Parameters**

None.

**Returns**

`std::string_view` — a view of a static canonical key. It does not depend on
the lifetime of this `TableRole`.

## `mvr_data::operator==(TableRole, TableRole)` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
friend constexpr auto operator==(
    const TableRole&,
    const TableRole&
) noexcept -> bool = default;
```

Compares two roles by their fixed logical value. C++ also supplies the
corresponding `operator!=` rewrite from this equality operator.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| first operand | `const TableRole&` | Role on the left side of the comparison. |
| second operand | `const TableRole&` | Role on the right side of the comparison. |

**Returns**

`bool` — `true` when both operands designate the same table binding.

## `mvr_data::TableInfo` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
struct TableInfo;
```

Aggregate containing the canonical Arrow schema and ordered shard paths for
one resolved Manifest table binding. A `Manifest` owns one instance for each
fixed table role.

**Parameters**

None.

## `mvr_data::TableInfo::schema` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
std::shared_ptr<arrow::Schema> schema;
```

Canonical, non-null Arrow schema required of every shard in this binding.
Manifest loading selects the Raw or Embedded object schema for base and query,
and the ground-truth schema for ground truth.

**Parameters**

None.

## `mvr_data::TableInfo::shards` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
std::vector<std::string> shards;
```

Portable package-relative Arrow shard paths in logical read order. Manifest
loading validates each spelling but does not check that the file exists;
`DataReader::get_batched_scanner` resolves the files later.

**Parameters**

None.

## `mvr_data::VectorConfig` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
struct VectorConfig;
```

Aggregate containing the package-wide vector representation declared by an
Embedded Manifest. Raw Manifests do not expose a vector configuration.

**Parameters**

None.

## `mvr_data::VectorConfig::dimension` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
std::int32_t dimension{0};
```

Number of scalar values in every base and query vector. A successfully loaded
Embedded Manifest always has a value of at least `1`; `0` is only the
aggregate's standalone default.

**Parameters**

None.

## `mvr_data::VectorConfig::dtype` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
std::shared_ptr<arrow::DataType> dtype;
```

Canonical Arrow numeric type shared by every vector in the package. A
successfully loaded Embedded Manifest stores a non-null supported type; a
default-constructed standalone aggregate stores `nullptr`.

**Parameters**

None.

## `mvr_data::VectorConfig::scoring` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
std::string scoring;
```

Non-empty publisher-defined scoring scheme identifier from `vector.scoring`.
The core records this value but does not interpret or execute the scoring
scheme.

**Parameters**

None.

## `mvr_data::Manifest` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
class Manifest final;
```

Read-only, strongly typed view of a convention-valid `manifest.json`.
Construction is factory-only: `load` parses metadata, constructs canonical
schemas, and validates package-relative shard path spellings before returning
the value.

**Parameters**

None.

## `mvr_data::Manifest::load` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
static auto load(const std::filesystem::path& root)
    -> arrow::Result<Manifest>;
```

Opens `root / "manifest.json"`, parses JSON, converts required and optional
fields to their declared types, selects canonical table schemas, and rejects
unsafe shard path strings. Embedded loading additionally validates a positive
dimension, a supported exact dtype spelling, and a non-empty scoring string.

The loader intentionally treats `format_version` as descriptive, ignores
unknown fields, and does not resolve shard files, verify package checksums, or
validate Arrow row contents. It does not canonicalize `root`; use
`DataReader::open` when canonical package-root ownership is desired.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `root` | `const std::filesystem::path&` | Package directory expected to contain a readable `manifest.json`. The reference only needs to remain valid for the call. |

**Returns**

`arrow::Result<mvr_data::Manifest>` — the typed Manifest, or a non-OK Arrow
status for an unreadable file, malformed JSON, missing or mistyped fields,
invalid Embedded settings, or unsafe shard paths.

## `mvr_data::Manifest::format_version` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto format_version() const noexcept -> std::string_view;
```

Returns the publisher-declared descriptive package-format version. The loader
does not use this string as a compatibility gate.

**Parameters**

None.

**Returns**

`std::string_view` — a view valid for the lifetime of this Manifest.

## `mvr_data::Manifest::package_kind` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto package_kind() const noexcept -> PackageKind;
```

Returns the physical representation selected by the Manifest's exact `kind`
string. Loading accepts only `raw` or `embedded`.

**Parameters**

None.

**Returns**

`mvr_data::PackageKind` — `PackageKind::raw` or
`PackageKind::embedded`.

## `mvr_data::Manifest::data_name` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto data_name() const noexcept -> std::string_view;
```

Returns the non-empty publisher-defined name of the logical collection.

**Parameters**

None.

**Returns**

`std::string_view` — a view valid for the lifetime of this Manifest.

## `mvr_data::Manifest::data_version` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto data_version() const noexcept -> std::string_view;
```

Returns the non-empty publisher-defined version of the logical collection.

**Parameters**

None.

**Returns**

`std::string_view` — a view valid for the lifetime of this Manifest.

## `mvr_data::Manifest::description` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto description() const noexcept
    -> const std::optional<std::string>&;
```

Returns the optional human-readable package description without copying its
string.

**Parameters**

None.

**Returns**

`const std::optional<std::string>&` — an engaged optional when the Manifest
contains a string `description`, otherwise `std::nullopt`; the reference is
valid for the lifetime of this Manifest.

## `mvr_data::Manifest::license` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto license() const noexcept
    -> const std::optional<std::string>&;
```

Returns the optional publisher-declared package license without interpreting
its spelling.

**Parameters**

None.

**Returns**

`const std::optional<std::string>&` — the license string when present,
otherwise `std::nullopt`; the reference is valid for the lifetime of this
Manifest.

## `mvr_data::Manifest::source` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto source() const noexcept
    -> const std::optional<std::string>&;
```

Returns the optional publisher-declared data source without interpreting it as
a URL or filesystem path.

**Parameters**

None.

**Returns**

`const std::optional<std::string>&` — the source string when present,
otherwise `std::nullopt`; the reference is valid for the lifetime of this
Manifest.

## `mvr_data::Manifest::table_info` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto table_info(TableRole role) const noexcept
    -> const TableInfo&;
```

Returns the canonical schema and ordered shard paths bound to one fixed role.
Base and query use the package-kind object schema; ground truth always uses the
canonical judgment schema.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `role` | `mvr_data::TableRole` | Role created by `TableRole::base()`, `query()`, or `ground_truth()`. Passed by value. |

**Returns**

`const mvr_data::TableInfo&` — a reference valid for the lifetime of this
Manifest.

## `mvr_data::Manifest::vector_config` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto vector_config() const noexcept
    -> const std::optional<VectorConfig>&;
```

Returns the package-wide vector dimension, dtype, and scoring metadata for an
Embedded package. Raw packages have no vector configuration, even if an
unrecognized `vector` field appears in their JSON.

**Parameters**

None.

**Returns**

`const std::optional<mvr_data::VectorConfig>&` — an engaged optional for
Embedded data or `std::nullopt` for Raw data; the reference is valid for the
lifetime of this Manifest.

## `mvr_data::Manifest::extensions` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/manifest.hpp "View source on GitHub")

```cpp
auto extensions() const noexcept
    -> const std::optional<nlohmann::json::object_t>&;
```

Returns optional namespaced publisher metadata. Loading requires
`extensions`, when present, to be a JSON object but assigns no core semantics
to its members.

**Parameters**

None.

**Returns**

`const std::optional<nlohmann::json::object_t>&` — the extension mapping when
present or `std::nullopt`; the reference is valid for the lifetime of this
Manifest.
