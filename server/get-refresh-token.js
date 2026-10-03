/**
 * Chạy MỘT LẦN để lấy GOOGLE_REFRESH_TOKEN của tài khoản Google dùng chung.
 *   cd server && npm run token
 * Rồi đăng nhập bằng tài khoản Google chung của trường và copy token vào server/.env
 */
import 'dotenv/config'
import http from 'node:http'
import { google } from 'googleapis'

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Hãy điền GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong server/.env trước.')
  process.exit(1)
}

const REDIRECT = 'http://localhost:5678/rest/oauth2-credential/callback' // đã đăng ký sẵn trên OAuth client
const oauth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, REDIRECT)

const url = oauth.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive']
})

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/rest/oauth2-credential/callback')) return res.end()
  const code = new URL(req.url, REDIRECT).searchParams.get('code')
  try {
    const { tokens } = await oauth.getToken(code)
    res.end('Xong! Quay lại cửa sổ terminal để copy refresh token.')
    console.log('\nGOOGLE_REFRESH_TOKEN=' + tokens.refresh_token + '\n')
  } catch (e) {
    res.end('Lỗi: ' + e.message)
    console.error(e.message)
  }
  server.close()
})

server.listen(5678, () => {
  console.log('Mở link sau trong trình duyệt và đăng nhập bằng tài khoản Google chung:\n')
  console.log(url + '\n')
})
