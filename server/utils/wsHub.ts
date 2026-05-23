// Hub WebSocket : maintient les rooms par campagne et permet de broadcaster
// les changements depuis n'importe quel handler HTTP.

type Peer = { send: (data: string) => void; close?: () => void }

const rooms = new Map<number, Set<Peer>>()

export function joinRoom(campaignId: number, peer: Peer) {
  let room = rooms.get(campaignId)
  if (!room) {
    room = new Set()
    rooms.set(campaignId, room)
  }
  room.add(peer)
}

export function leaveRoom(campaignId: number, peer: Peer) {
  const room = rooms.get(campaignId)
  if (!room) return
  room.delete(peer)
  if (room.size === 0) rooms.delete(campaignId)
}

export interface WsEvent {
  type: string
  data?: unknown
}

export function broadcast(campaignId: number | string, event: WsEvent, excludePeer?: Peer) {
  const id = typeof campaignId === 'string' ? parseInt(campaignId) : campaignId
  if (!id || isNaN(id)) return
  const room = rooms.get(id)
  if (!room) return
  const payload = JSON.stringify(event)
  for (const peer of room) {
    if (peer === excludePeer) continue
    try {
      peer.send(payload)
    } catch {
      // ignore: peer probably disconnected
    }
  }
}

export function roomSize(campaignId: number): number {
  return rooms.get(campaignId)?.size ?? 0
}
