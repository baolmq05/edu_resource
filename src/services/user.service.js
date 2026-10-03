import { BaseAPI } from './api.js'
import { hashPassword } from '@/utils/helpers'

const userApi = new BaseAPI('users')
const classApi = new BaseAPI('classes')
const resultApi = new BaseAPI('exam_results')

export async function getUsers() {
  const list = await userApi.getAll()
  return list.map(({ password: _pw, ...u }) => u)
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'vi'))
}

export async function getUserById(id) {
  const u = await userApi.getOne(id)
  if (!u) return null
  const { password: _pw, ...safe } = u
  return safe
}

export async function createUser(data) {
  const email = data.email.trim().toLowerCase()
  const all = await userApi.getAll()
  if (all.some(u => (u.email || '').toLowerCase() === email)) {
    throw new Error('Địa chỉ email này đã được sử dụng.')
  }
  if (!data.password || data.password.length < 6) throw new Error('Mật khẩu cần tối thiểu 6 ký tự.')
  const uid = `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
  return userApi.setWithId(uid, {
    uid,
    displayName: data.displayName.trim(),
    email,
    password: await hashPassword(data.password),
    role: data.role,
    status: data.status || 'active',
    classId: data.role === 'student' ? data.classId || '' : '',
    phone: data.phone || '',
    createdAt: new Date().toISOString()
  })
}

export async function updateUser(id, data) {
  const payload = {
    displayName: data.displayName.trim(),
    role: data.role,
    status: data.status,
    classId: data.role === 'student' ? data.classId || '' : '',
    phone: data.phone || ''
  }
  if (data.password) {
    if (data.password.length < 6) throw new Error('Mật khẩu cần tối thiểu 6 ký tự.')
    payload.password = await hashPassword(data.password)
  }
  const result = await userApi.update(id, payload)
  // Nếu không còn là giáo viên thì gỡ khỏi các lớp phụ trách
  if (data.role !== 'teacher') await removeTeacherFromClasses(id)
  return result
}

export async function setUserStatus(id, status) {
  return userApi.update(id, { status })
}

/** Sinh mật khẩu tạm ngẫu nhiên (bỏ ký tự dễ nhầm 0/O, 1/l/I), dùng crypto an toàn */
export function generateTempPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, b => chars[b % chars.length]).join('')
}

/** Admin đặt lại mật khẩu: trả về mật khẩu tạm (chỉ hiển thị một lần), DB chỉ lưu hash */
export async function resetUserPassword(id) {
  const tempPassword = generateTempPassword()
  await userApi.update(id, { password: await hashPassword(tempPassword) })
  return tempPassword
}

async function removeTeacherFromClasses(teacherId) {
  const classes = await classApi.getAll()
  await Promise.all(
    classes
      .filter(c => Array.isArray(c.teacherIds) && c.teacherIds.includes(teacherId))
      .map(c => classApi.update(c.id, { teacherIds: c.teacherIds.filter(t => t !== teacherId) }))
  )
}

export async function deleteUser(id) {
  const results = await resultApi.getAll()
  await Promise.all(results.filter(r => r.studentId === id).map(r => resultApi.delete(r.id)))
  await removeTeacherFromClasses(id)
  return userApi.delete(id)
}
