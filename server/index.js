import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { Readable } from 'node:stream'
import { google } from 'googleapis'

const {
  PORT = 3001,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  DRIVE_ROOT_FOLDER_ID,
  FIREBASE_DB_URL = 'https://eduresource-ad12d-default-rtdb.asia-southeast1.firebasedatabase.app',
  ALLOWED_ORIGIN = 'http://localhost:5173'
} = process.env

for (const [k, v] of Object.entries({ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, DRIVE_ROOT_FOLDER_ID })) {
  if (!v) {
    console.error(`Thiếu biến môi trường ${k}. Xem server/.env.example`)
    process.exit(1)
  }
}

const cleanFolderId = (DRIVE_ROOT_FOLDER_ID || '').split('?')[0].trim()

// Tài khoản Google DÙNG CHUNG của trường: mọi file đều nằm trong Drive này
const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
oauth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN })
const drive = google.drive({ version: 'v3', auth: oauth })

const TYPE_FOLDERS = {
  lesson_plans: 'Kế hoạch bài dạy',
  slides: 'Slide bài dạy',
  sample_exams: 'Ngân hàng đề mẫu'
}

const escapeQuery = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
const folderCache = new Map()

/** Tìm thư mục con theo tên trong thư mục cha, chưa có thì tạo mới */
async function ensureFolder(name, parentId) {
  const key = `${parentId}/${name}`
  if (folderCache.has(key)) return folderCache.get(key)

  const found = await drive.files.list({
    q: `name='${escapeQuery(name)}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    pageSize: 1
  })
  let id = found.data.files?.[0]?.id
  if (!id) {
    const created = await drive.files.create({
      requestBody: { name, parents: [parentId], mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id'
    })
    id = created.data.id
  }
  folderCache.set(key, id)
  return id
}

/** Chỉ giáo viên / admin đang hoạt động mới được tải lên */
async function authorize(req, res, next) {
  const uid = req.header('x-user-id')
  if (!uid) return res.status(401).json({ message: 'Thiếu thông tin đăng nhập.' })
  try {
    const r = await fetch(`${FIREBASE_DB_URL}/users/${encodeURIComponent(uid)}.json`)
    const user = await r.json()
    if (!user || user.status === 'inactive' || !['teacher', 'admin'].includes(user.role)) {
      return res.status(403).json({ message: 'Bạn không có quyền tải tệp lên.' })
    }
    req.user = { uid, ...user }
    next()
  } catch {
    res.status(502).json({ message: 'Không thể xác thực người dùng.' })
  }
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

const app = express()
app.use(cors({ origin: ALLOWED_ORIGIN }))
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/upload', authorize, upload.single('file'), async (req, res) => {
  try {
    const { file } = req
    const type = req.body.type
    if (!file) return res.status(400).json({ message: 'Chưa chọn tệp.' })
    if (!TYPE_FOLDERS[type]) return res.status(400).json({ message: 'Loại tài liệu không hợp lệ.' })

    // Cấu trúc: <Thư mục gốc> / <Loại tài liệu> / <Môn học> / tệp
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
    const typeFolder = await ensureFolder(TYPE_FOLDERS[type], cleanFolderId)
    const subject = (req.body.subjectName || '').trim()
    const targetFolder = subject ? await ensureFolder(subject, typeFolder) : typeFolder

    const created = await drive.files.create({
      requestBody: { name: originalName, parents: [targetFolder] },
      media: { mimeType: file.mimetype, body: Readable.from(file.buffer) },
      fields: 'id,name,mimeType,webViewLink'
    })

    // Ai có link đều xem được (học sinh không cần tài khoản Google)
    await drive.permissions.create({
      fileId: created.data.id,
      requestBody: { role: 'reader', type: 'anyone' }
    })

    res.json({
      fileId: created.data.id,
      fileName: created.data.name,
      fileUrl: created.data.webViewLink,
      mimeType: created.data.mimeType
    })
  } catch (err) {
    console.error('Upload lỗi:', err?.message || err)
    res.status(500).json({ message: 'Không thể tải tệp lên Google Drive chung.' })
  }
})

app.post('/api/delete-file', authorize, async (req, res) => {
  const { fileId } = req.body || {}
  if (!fileId) return res.status(400).json({ message: 'Thiếu fileId.' })

  try {
    await drive.files.delete({ fileId })
    console.log(`Đã xóa file ${fileId} trên Google Drive`)
    res.json({ ok: true, fileId })
  } catch (err) {
    if (err?.code === 404 || err?.status === 404) {
      console.warn(`File ${fileId} không tồn tại trên Drive hoặc đã bị xóa trước đó.`)
      return res.json({ ok: true, notFound: true })
    }
    console.error('Lỗi khi xóa file trên Drive:', err?.message || err)
    res.status(500).json({ message: 'Không thể xóa tệp trên Google Drive: ' + (err?.message || err) })
  }
})

app.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Tệp quá lớn (tối đa 100 MB).' })
  console.error(err)
  res.status(500).json({ message: 'Lỗi máy chủ.' })
})

app.listen(PORT, async () => {
  console.log(`Drive server chạy tại http://localhost:${PORT}`)
  try {
    const about = await drive.about.get({ fields: 'user' })
    console.log(`[Google Drive] Đã kết nối tài khoản: ${about.data.user?.emailAddress}`)
    console.log(`[Google Drive] Thư mục gốc (Root Folder ID): ${cleanFolderId}`)
  } catch (err) {
    console.error(`[Google Drive] Lỗi kết nối tài khoản Drive:`, err?.message || err)
  }
})
