import { google } from 'googleapis'

async function authorize(req) {
  const uid = req.headers['x-user-id']
  if (!uid) return { ok: false, status: 401, message: 'Thiếu thông tin đăng nhập.' }
  try {
    const dbUrl = process.env.FIREBASE_DB_URL || 'https://eduresource-ad12d-default-rtdb.asia-southeast1.firebasedatabase.app'
    const r = await fetch(`${dbUrl}/users/${encodeURIComponent(uid)}.json`)
    const user = await r.json()
    if (!user || user.status === 'inactive' || !['teacher', 'admin'].includes(user.role)) {
      return { ok: false, status: 403, message: 'Bạn không có quyền xóa tệp.' }
    }
    return { ok: true, user }
  } catch {
    return { ok: false, status: 502, message: 'Không thể xác thực người dùng.' }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const authCheck = await authorize(req)
  if (!authCheck.ok) {
    return res.status(authCheck.status).json({ message: authCheck.message })
  }

  const { fileId } = req.body || {}
  if (!fileId) return res.status(400).json({ message: 'Thiếu fileId.' })

  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
  } = process.env

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    return res.status(500).json({ message: 'Chưa cấu hình biến môi trường Google Drive.' })
  }

  try {
    const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    oauth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN })
    const drive = google.drive({ version: 'v3', auth: oauth })

    await drive.files.delete({ fileId })
    return res.status(200).json({ ok: true, fileId })
  } catch (err) {
    if (err?.code === 404 || err?.status === 404) {
      return res.status(200).json({ ok: true, notFound: true })
    }
    console.error('Lỗi khi xóa file trên Drive:', err)
    return res.status(500).json({ message: 'Không thể xóa tệp trên Google Drive: ' + (err.message || err) })
  }
}
