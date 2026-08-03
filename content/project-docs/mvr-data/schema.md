## Canonical Arrow schemas

`schema.py` is the single source of truth for physical Arrow layouts. Schema
construction makes every format field non-nullable.

- Raw base/query rows contain an `object_id` and an ordered `list<struct>` of
  components. An object is one retrievable item, such as an illustrated
  article, audio recording, or video.
- Embedded base/query rows contain an `object_id` and a
  `large_list<fixed_size_list<T, dimension>>`. Vector count may vary by object,
  but dtype and dimension are fixed by the manifest.
- Ground-truth rows use one shared schema containing `query_id`, `object_id`,
  `relevance`, `split_type`, `judgment_source`, and `pool_id`.

Vector dtype handling accepts only fixed-width integer or floating-point Arrow
types and normalizes aliases to stable manifest spellings. Schema dispatch
selects by package kind and table name, derives Embedded layouts from
`manifest.vector`, and rejects unknown inputs. Readers, writers, and validators
reuse the same definitions so every shard is produced and checked consistently.
