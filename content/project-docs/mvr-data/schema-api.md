Include `<mvr_data/schema.hpp>` directly or use the umbrella header
`<mvr_data/mvr_data.hpp>`. All functions are static and report fallible
operations with `arrow::Result<T>`.

## Example

Construct an Embedded object schema from the exact dtype spelling stored in a
Manifest:

```cpp
#include <mvr_data/schema.hpp>

#include <arrow/api.h>

auto make_schema() -> arrow::Result<std::shared_ptr<arrow::Schema>> {
    ARROW_ASSIGN_OR_RAISE(
        auto dtype,
        mvr_data::Schema::parse_vector_dtype("float32")
    );
    return mvr_data::Schema::make_embedded_object_schema(128, dtype);
}
```

## `mvr_data::Schema` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/schema.hpp "View source on GitHub")

```cpp
class Schema final;
```

Stateless namespace-like class for canonical format-v1 Arrow schema factories
and Embedded vector dtype conversion. It cannot be instantiated; call its
static methods instead.

**Parameters**

None.

## `mvr_data::Schema::make_raw_object_schema` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/schema.hpp "View source on GitHub")

```cpp
static auto make_raw_object_schema()
    -> std::shared_ptr<arrow::Schema>;
```

Constructs the canonical schema shared by the base and query bindings of a Raw
package. Both top-level fields are non-nullable. `components` is an ordered
Arrow list whose non-null struct items contain non-null `component_id`,
`modality`, `media_type`, and `payload_uri` strings.

**Parameters**

None.

**Returns**

`std::shared_ptr<arrow::Schema>` — the canonical Raw object schema. Callers
should treat the returned schema as immutable.

## `mvr_data::Schema::make_embedded_object_schema` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/schema.hpp "View source on GitHub")

```cpp
static auto make_embedded_object_schema(
    std::int32_t dimension,
    const std::shared_ptr<arrow::DataType>& dtype
) -> arrow::Result<std::shared_ptr<arrow::Schema>>;
```

Builds the canonical schema shared by the base and query bindings of an
Embedded package. Each row contains a non-null object ID and a non-null
`large_list` of non-null fixed-size vectors. Every vector contains exactly
`dimension` non-null scalar values of `dtype`; vector count may vary by row.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `dimension` | `std::int32_t` | Number of scalar values in every vector. Must be at least `1`. |
| `dtype` | `const std::shared_ptr<arrow::DataType>&` | Non-null Arrow numeric type. Accepted IDs are half/32/64-bit float and signed or unsigned 8/16/32/64-bit integer. Boolean and other Arrow types are rejected. |

**Returns**

`arrow::Result<std::shared_ptr<arrow::Schema>>` — the parameterized Embedded
object schema, or `arrow::Status::Invalid` when the dimension or dtype is not
supported.

## `mvr_data::Schema::make_ground_truth_schema` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/schema.hpp "View source on GitHub")

```cpp
static auto make_ground_truth_schema()
    -> std::shared_ptr<arrow::Schema>;
```

Constructs the canonical ground-truth schema used by both package kinds. Its
six non-null fields are `query_id: string`, `object_id: string`,
`relevance: int16`, `split_type: string`, `judgment_source: string`, and
`pool_id: string`.

This factory defines physical structure only. It does not verify foreign keys,
relevance bounds, non-empty strings, or judgment uniqueness in a RecordBatch.

**Parameters**

None.

**Returns**

`std::shared_ptr<arrow::Schema>` — the canonical ground-truth schema. Callers
should treat the returned schema as immutable.

## `mvr_data::Schema::parse_vector_dtype` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/schema.hpp "View source on GitHub")

```cpp
static auto parse_vector_dtype(std::string_view name)
    -> arrow::Result<std::shared_ptr<arrow::DataType>>;
```

Converts an exact format-v1 Manifest dtype spelling into Arrow's canonical
`DataType`. Matching is case-sensitive and does not trim whitespace. Aliases
such as `float`, `double`, and `halffloat` are not accepted.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `name` | `std::string_view` | One of `float16`, `float32`, `float64`, `int8`, `uint8`, `int16`, `uint16`, `int32`, `uint32`, `int64`, or `uint64`. The view only needs to remain valid for the call. |

**Returns**

`arrow::Result<std::shared_ptr<arrow::DataType>>` — Arrow's canonical type
instance, or `arrow::Status::Invalid` for every other spelling.

## `mvr_data::Schema::canonical_dtype_name` [source](https://github.com/WittenYeh/MVR-Data/blob/main/include/mvr_data/schema.hpp "View source on GitHub")

```cpp
static auto canonical_dtype_name(const arrow::DataType& dtype)
    -> arrow::Result<std::string>;
```

Performs the reverse conversion from a supported Arrow numeric type to its
exact format-v1 Manifest spelling.

**Parameters**

| Name | Type | Description |
| --- | --- | --- |
| `dtype` | `const arrow::DataType&` | Arrow type whose type ID must be one of the eleven supported Embedded vector types. |

**Returns**

`arrow::Result<std::string>` — the canonical lowercase dtype name, or
`arrow::Status::Invalid` when the Arrow type is unsupported.
