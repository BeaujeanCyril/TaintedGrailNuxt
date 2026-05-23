// Composable client : connecte un WebSocket à /_ws/campaign/<id>,
// permet de s'abonner à des events typés, gère reconnect et keepalive.

interface WsEvent {
  type: string
  data?: unknown
  campaignId?: number
  message?: string
}

export function useCampaignSync(campaignId: number | string) {
  const connected = useState<boolean>(`tg-ws-connected-${campaignId}`, () => false)
  const handlers = new Map<string, Set<(payload: unknown) => void>>()
  let socket: WebSocket | null = null
  let reconnectAttempts = 0
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let stopped = false

  function url(): string {
    if (typeof window === 'undefined') return ''
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${window.location.host}/_ws/campaign/${campaignId}`
  }

  function on(type: string, fn: (payload: unknown) => void) {
    let set = handlers.get(type)
    if (!set) {
      set = new Set()
      handlers.set(type, set)
    }
    set.add(fn)
    return () => set!.delete(fn)
  }

  function emit(evt: WsEvent) {
    const set = handlers.get(evt.type)
    if (!set) return
    for (const fn of set) {
      try { fn(evt.data) } catch (e) { console.error('[ws handler]', e) }
    }
  }

  function clearPing() {
    if (pingTimer) { clearInterval(pingTimer); pingTimer = null }
  }
  function startPing() {
    clearPing()
    pingTimer = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        try { socket.send('ping') } catch {}
      }
    }, 30_000)
  }

  function scheduleReconnect() {
    if (stopped) return
    if (reconnectTimer) return
    const delay = Math.min(30_000, 500 * 2 ** Math.min(reconnectAttempts, 6))
    reconnectAttempts++
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }

  function connect() {
    if (typeof window === 'undefined') return
    if (stopped) return
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return

    try {
      socket = new WebSocket(url())
    } catch (e) {
      scheduleReconnect()
      return
    }

    socket.onopen = () => {
      reconnectAttempts = 0
      connected.value = true
      startPing()
    }
    socket.onmessage = (ev) => {
      try {
        const evt = JSON.parse(ev.data) as WsEvent
        if (evt.type === 'pong' || evt.type === 'hello') return
        emit(evt)
      } catch {
        // ignore non-JSON
      }
    }
    socket.onclose = () => {
      connected.value = false
      clearPing()
      socket = null
      scheduleReconnect()
    }
    socket.onerror = () => {
      // onclose will follow
    }
  }

  function disconnect() {
    stopped = true
    clearPing()
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    if (socket) {
      try { socket.close() } catch {}
      socket = null
    }
    connected.value = false
  }

  return { connect, disconnect, on, connected: readonly(connected) }
}
