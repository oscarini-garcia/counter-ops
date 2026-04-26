export function generateEntryId(memberId) {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 6)
  return `${memberId}_${ts}_${rand}`
}
