// WebSocket handler par campagne. Path : /_ws/campaign/<campaignId>
import { joinRoom, leaveRoom, broadcast } from '~/server/utils/wsHub'

function extractCampaignId(url: string | undefined): number | null {
  if (!url) return null
  const m = url.match(/_ws\/campaign\/(\d+)/)
  if (!m) return null
  const n = parseInt(m[1])
  return isNaN(n) ? null : n
}

export default defineWebSocketHandler({
  open(peer) {
    const url = (peer as any).request?.url || (peer as any).url || ''
    const campaignId = extractCampaignId(String(url))
    if (!campaignId) {
      try { peer.send(JSON.stringify({ type: 'error', message: 'Invalid campaign id' })) } catch {}
      peer.close?.(1008, 'Invalid path')
      return
    }
    ;(peer as any)._campaignId = campaignId
    joinRoom(campaignId, peer as any)
    try {
      peer.send(JSON.stringify({ type: 'hello', campaignId }))
    } catch {}
  },
  message(peer, message) {
    // Ping/pong manuel pour keep-alive : le client envoie "ping", on répond "pong"
    const text = typeof message === 'string' ? message : message.text?.() ?? ''
    if (text === 'ping') {
      try { peer.send(JSON.stringify({ type: 'pong' })) } catch {}
    }
  },
  close(peer) {
    const cid = (peer as any)._campaignId
    if (typeof cid === 'number') leaveRoom(cid, peer as any)
  },
  error(peer) {
    const cid = (peer as any)._campaignId
    if (typeof cid === 'number') leaveRoom(cid, peer as any)
  }
})
