export const GRADES = [10, 11, 12]

export const ROLE_LABELS = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  student: 'Học sinh'
}

export const QUESTION_TYPES = {
  single_choice: 'Trắc nghiệm một đáp án',
  multiple_choice: 'Trắc nghiệm nhiều đáp án',
  true_false: 'Đúng / Sai'
}

export const EXAM_STATUS = {
  draft: { label: 'Nháp', badge: 'bg-light text-dark border' },
  published: { label: 'Đã xuất bản', badge: 'bg-dark text-white' },
  closed: { label: 'Đã đóng', badge: 'bg-secondary text-white' }
}

export async function hashPassword(password) {
  const data = new TextEncoder().encode(password)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  return isNaN(date) ? '—' : date.toLocaleDateString('vi-VN')
}

export function formatDateTime(d) {
  if (!d) return '—'
  const date = new Date(d)
  return isNaN(date) ? '—' : date.toLocaleString('vi-VN', { hour12: false })
}

/** ISO -> giá trị cho <input type="datetime-local"> */
export function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d)) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Giá trị datetime-local -> ISO */
export function fromLocalInput(value) {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d) ? '' : d.toISOString()
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m} phút ${String(r).padStart(2, '0')} giây`
}

export function paginate(list, page, size = 10) {
  return list.slice((page - 1) * size, page * size)
}

export function uid(prefix = 'q') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
