import multer from 'multer'
import { Readable } from 'node:stream'
import { google } from 'googleapis'

export const config = {
  api: {
    bodyParser: false, // Bắt buộc để multer có thể đọc raw multipart stream trên Vercel
  },
}

const TYPE_FOLDERS = {
  lesson_plans: 'Kế hoạch bài dạy',
  slides: 'Slide bài dạy',
  sample_exams: 'Ngân hàng đề mẫu',
}

const escapeQuery = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const folderCache = new Map()

async function ensureFolder(drive, name, parentId) {
  const key = `${parentId}/${name}`
  if (folderCache.has(key)) return folderCache.get(key)

  const found = await drive.files.list({
    q: `name='${escapeQuery(name)}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1,
  })
  let id = found.data.files?.[0]?.id
  if (!id) {
    const created = await drive.files.create({
      requestBody: { name, parents: [parentId], mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    })
    id = created.data.id
  }
  folderCache.set(key, id)
  return id
}

async function authorize(req) {
  const uid = req.headers['x-user-id']
  if (!uid) return { ok: false, status: 401, message: 'Thiếu thông tin đăng nhập.' }
  try {
    const dbUrl = process.env.FIREBASE_DB_URL || 'https://eduresource-ad12d-default-rtdb.asia-southeast1.firebasedatabase.app'
    const r = await fetch(`${dbUrl}/users/${encodeURIComponent(uid)}.json`)
    const user = await r.json()
    if (!user || user.status === 'inactive' || !['teacher', 'admin'].includes(user.role)) {
      return { ok: false, status: 403, message: 'Bạn không có quyền tải tệp lên.' }
    }
    return { ok: true, user }
  } catch {
    return { ok: false, status: 502, message: 'Không thể xác thực người dùng.' }
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4.5 * 1024 * 1024 }, // Giới hạn serverless function của Vercel
})

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result)
      return resolve(result)
    })
  })
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

  // 1. Kiểm tra quyền
  const authCheck = await authorize(req)
  if (!authCheck.ok) {
    return res.status(authCheck.status).json({ message: authCheck.message })
  }

  // 2. Parse file multipart
  try {
    await runMiddleware(req, res, upload.single('file'))
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Tệp vượt quá giới hạn 4.5 MB trên Vercel.' })
    }
    return res.status(400).json({ message: err.message || 'Lỗi nhận tệp.' })
  }

  const file = req.file
  const type = req.body?.type
  const subjectName = req.body?.subjectName

  if (!file) return res.status(400).json({ message: 'Chưa chọn tệp.' })
  if (!TYPE_FOLDERS[type]) return res.status(400).json({ message: 'Loại tài liệu không hợp lệ.' })

  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
    DRIVE_ROOT_FOLDER_ID,
  } = process.env

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !DRIVE_ROOT_FOLDER_ID) {
    return res.status(500).json({ message: 'Chưa cấu hình biến môi trường Google Drive trên Vercel.' })
  }

  try {
    const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    oauth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN })
    const drive = google.drive({ version: 'v3', auth: oauth })

    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const typeFolder = await ensureFolder(drive, TYPE_FOLDERS[type], DRIVE_ROOT_FOLDER_ID)
    const subject = (subjectName || '').trim()
    const targetFolder = subject ? await ensureFolder(drive, subject, typeFolder) : typeFolder

    const created = await drive.files.create({
      requestBody: { name: originalName, parents: [targetFolder] },
      media: { mimeType: file.mimetype, body: Readable.from(file.buffer) },
      fields: 'id,name,mimeType,webViewLink',
    })

    // Cấp quyền ai có link cũng xem được
    await drive.permissions.create({
      fileId: created.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    })

    return res.status(200).json({
      fileId: created.data.id,
      fileName: created.data.name,
      fileUrl: created.data.webViewLink,
      mimeType: created.data.mimeType,
    })
  } catch (err) {
    console.error('Lỗi tải file lên Drive:', err)
    return res.status(500).json({ message: 'Không thể tải tệp lên Google Drive: ' + (err.message || err) })
  }
}
