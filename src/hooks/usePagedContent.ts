import { useEffect, useMemo, useState } from 'react'

interface SourceEntry {
  sourcePath: string
}

interface PagedContentState<T> {
  key: string
  items: T[]
  error: Error | null
}

export function usePagedContent<TEntry extends SourceEntry, TItem>(
  entries: readonly TEntry[],
  loadPage: (entries: readonly TEntry[]) => Promise<TItem[]>,
) {
  const key = useMemo(() => entries.map((entry) => entry.sourcePath).join('\n'), [entries])
  const [state, setState] = useState<PagedContentState<TItem>>({ key: '', items: [], error: null })

  useEffect(() => {
    let active = true
    if (entries.length === 0) {
      setState({ key, items: [], error: null })
      return () => { active = false }
    }

    loadPage(entries).then(
      (items) => {
        if (active) setState({ key, items, error: null })
      },
      (error: unknown) => {
        if (active) {
          setState({
            key,
            items: [],
            error: error instanceof Error ? error : new Error(String(error)),
          })
        }
      },
    )

    return () => { active = false }
  }, [key, loadPage])

  return {
    items: state.key === key ? state.items : [],
    error: state.key === key ? state.error : null,
    isLoading: state.key !== key,
  }
}
