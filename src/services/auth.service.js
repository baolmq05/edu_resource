import { BaseAPI } from './api.js'
import { hashPassword } from '@/utils/helpers'
import { setCurrentUser, currentUser } from '@/stores/authState'

const userApi = new BaseAPI('users')

async function findByEmail(email) {
  const clean = email.trim().toLowerCase()
  const users = await userApi.getAll()
  return users.find(u => (u.email || '').toLowerCase() === clean) || null
}

export async function login(email, password) {
  let user
  try {
    user = await findByEmail(email)
  } catch {
    throw new Error('Không thể kết nối máy chủ. Vui lòng kiểm tra đường truyền internet.')
  }
  if (!user || user.password !== (await hashPassword(password))) {
    throw new Error('Email hoặc mật khẩu không chính xác.')
  }
  if (user.status === 'pending') {
    throw new Error('Tài khoản giáo viên của bạn đang chờ Quản trị viên (Admin) phê duyệt. Vui lòng liên hệ Admin nhà trường.')
  }
  if (user.status === 'inactive') {
    throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.')
  }
  setCurrentUser(user)
  return user
}

export async function register({ displayName, email, password, phone = '' }) {
  const existing = await findByEmail(email)
  if (existing) throw new Error('Địa chỉ email này đã được đăng ký.')
  if (password.length < 6) throw new Error('Mật khẩu cần tối thiểu 6 ký tự.')

  const uid = `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
  const data = {
    uid,
    displayName: displayName.trim(),
    email: email.trim().toLowerCase(),
    password: await hashPassword(password),
    role: 'teacher',
    status: 'pending',
    classId: '',
    phone: (phone || '').trim(),
    createdAt: new Date().toISOString()
  }
  const saved = await userApi.setWithId(uid, data)
  return saved
}

export async function logout() {
  setCurrentUser(null)
}

export async function changePassword(userId, oldPassword, newPassword) {
  const user = await userApi.getOne(userId)
  if (!user) throw new Error('Không tìm thấy tài khoản.')
  if (user.password !== (await hashPassword(oldPassword))) {
    throw new Error('Mật khẩu hiện tại không đúng.')
  }
  if (newPassword.length < 6) throw new Error('Mật khẩu mới cần tối thiểu 6 ký tự.')
  await userApi.update(userId, { password: await hashPassword(newPassword) })
}

export async function updateProfile(userId, { displayName, phone }) {
  const updated = await userApi.update(userId, {
    displayName: displayName.trim(),
    phone: (phone || '').trim()
  })
  setCurrentUser({ ...currentUser.value, ...updated })
}

/** Đồng bộ lại thông tin người dùng (role / lớp / trạng thái) từ Firebase */
export async function refreshCurrentUser() {
  if (!currentUser.value?.uid) return
  try {
    const fresh = await userApi.getOne(currentUser.value.uid)
    if (!fresh || fresh.status === 'inactive' || fresh.status === 'pending') {
      setCurrentUser(null)
      return
    }
    setCurrentUser(fresh)
  } catch {
    // giữ nguyên phiên hiện tại khi mất mạng
  }
}
