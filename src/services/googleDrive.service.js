const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof process !== 'undefined' ? process.env : {})
const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID || '21056405426-o8olnghtkndljkn8c3ff7ns03tmv4msj.apps.googleusercontent.com'
const GOOGLE_API_KEY = env.VITE_GOOGLE_API_KEY || ''

/**
 * Trích xuất Google Drive File ID từ nhiều định dạng URL khác nhau hoặc chuỗi ID trực tiếp
 * Hỗ trợ:
 * - https://drive.google.com/file/d/{id}/view
 * - https://docs.google.com/document/d/{id}/edit
 * - https://docs.google.com/presentation/d/{id}/edit
 * - https://docs.google.com/spreadsheets/d/{id}/edit
 * - https://drive.google.com/open?id={id}
 * - Chuỗi fileId thô
 */
export function extractDriveFileId(input) {
  if (!input) return ''
  const trimmed = input.trim()

  // Match /d/{fileId}
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]{15,})/)
  if (matchD && matchD[1]) {
    return matchD[1]
  }

  // Match id={fileId}
  const matchQuery = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{15,})/)
  if (matchQuery && matchQuery[1]) {
    return matchQuery[1]
  }

  // Kiểm tra nếu người dùng paste trực tiếp File ID (thường từ 20-50 ký tự base64url)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return trimmed
  }

  return trimmed
}

/**
 * Tạo URL xem trước có thể nhúng iframe
 */
export function getDrivePreviewUrl(fileId, type = 'general') {
  if (!fileId) return ''
  const id = extractDriveFileId(fileId)
  if (type === 'presentation' || type === 'slide') {
    return `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`
  }
  if (type === 'document' || type === 'doc') {
    return `https://docs.google.com/document/d/${id}/preview`
  }
  return `https://drive.google.com/file/d/${id}/preview`
}

/**
 * Tạo URL mở trực tiếp trên Google Drive
 */
export function getDriveViewUrl(fileId) {
  if (!fileId) return ''
  const id = extractDriveFileId(fileId)
  return `https://drive.google.com/file/d/${id}/view?usp=sharing`
}

/**
 * Tạo URL tải về trực tiếp từ Google Drive
 */
export function getDriveDirectDownloadUrl(fileId) {
  if (!fileId) return ''
  const id = extractDriveFileId(fileId)
  return `https://drive.google.com/uc?export=download&id=${id}`
}

/**
 * Khởi tạo Google Picker API
 */
export function openGoogleDrivePicker({ onSelect, onError }) {
  if (!window.google?.accounts?.oauth2 || !window.gapi) {
    if (onError) {
      onError('Thư viện Google API đang tải hoặc chưa sẵn sàng. Bạn có thể dán trực tiếp đường link Google Drive.')
    }
    return
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
      callback: (response) => {
        if (response.error) {
          if (onError) onError(response.error)
          return
        }

        window.gapi.load('picker', () => {
          const pickerBuilder = new window.google.picker.PickerBuilder()
            .addView(window.google.picker.ViewId.DOCS)
            .setOAuthToken(response.access_token)
            .setDeveloperKey(GOOGLE_API_KEY)
            .setCallback((data) => {
              if (data.action === window.google.picker.Action.PICKED) {
                const doc = data.docs[0]
                onSelect({
                  fileId: doc.id,
                  fileName: doc.name,
                  fileUrl: doc.url,
                  mimeType: doc.mimeType,
                  fileSize: doc.sizeBytes ? `${(doc.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : 'Tài liệu Drive'
                })
              }
            })

          const picker = pickerBuilder.build()
          picker.setVisible(true)
        })
      }
    })

    tokenClient.requestAccessToken({ prompt: '' })
  } catch (err) {
    if (onError) {
      onError(err.message || 'Không thể mở Google Drive Picker')
    }
  }
}



/* ------------------------------------------------------------------ */
/* UPLOAD LÊN GOOGLE DRIVE DÙNG CHUNG (qua server/)                     */
/* ------------------------------------------------------------------ */

/**
 * Gửi tệp từ máy lên server, server tải vào Drive chung của trường và trả về link.
 * @param {File} file
 * @param {{ type: 'lesson_plans'|'slides', subjectName?: string, userId: string }} meta
 * @param {(percent:number) => void} [onProgress]
 */
export function uploadFileToDrive(file, meta, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('type', meta.type)
    form.append('subjectName', meta.subjectName || '')
    form.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/upload')
    xhr.setRequestHeader('x-user-id', meta.userId)
    xhr.upload.onprogress = e => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let body = {}
      try { body = JSON.parse(xhr.responseText) } catch { /* bỏ qua */ }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body)
      else reject(new Error(body.message || 'Tải tệp lên thất bại.'))
    }
    xhr.onerror = () => reject(new Error('Không kết nối được máy chủ tải tệp. Hãy chạy server (cd server && npm start).'))
    xhr.send(form)
  })
}

/**
 * Xóa tệp trên Google Drive dùng chung của trường.
 * @param {string} fileId
 * @param {string} [userId]
 */
export async function deleteDriveFile(fileId, userId) {
  if (!fileId) return
  const id = extractDriveFileId(fileId)
  if (!id) return

  try {
    const res = await fetch('/api/delete-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId || ''
      },
      body: JSON.stringify({ fileId: id })
    })
    return await res.json()
  } catch (err) {
    console.warn('Không thể gửi yêu cầu xóa tệp tới máy chủ Drive:', err)
  }
}
