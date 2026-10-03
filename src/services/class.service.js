import { BaseAPI } from './api.js'

const classApi = new BaseAPI('classes')
const userApi = new BaseAPI('users')
const examApi = new BaseAPI('exams')

const normalize = c => ({ ...c, teacherIds: Array.isArray(c.teacherIds) ? c.teacherIds : [] })

export async function getClasses() {
  const list = await classApi.getAll()
  return list.map(normalize).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'))
}

/** Lớp mà người dùng được phép truy cập theo vai trò */
export async function getClassesForUser(user) {
  const all = await getClasses()
  if (!user) return []
  if (user.role === 'admin') return all
  if (user.role === 'teacher') return all.filter(c => c.teacherIds.includes(user.uid))
  return all.filter(c => c.id === user.classId)
}

export async function getClassById(id) {
  const c = await classApi.getOne(id)
  return c ? normalize(c) : null
}

export async function createClass(data) {
  return classApi.store({
    name: data.name.trim(),
    grade: Number(data.grade),
    schoolYear: data.schoolYear.trim(),
    teacherIds: data.teacherIds || [],
    status: 'active'
  })
}

export async function updateClass(id, data) {
  const payload = {
    name: data.name.trim(),
    grade: Number(data.grade),
    schoolYear: data.schoolYear.trim(),
    teacherIds: data.teacherIds || []
  }
  return classApi.update(id, payload)
}

export async function deleteClass(id) {
  const exams = await examApi.getAll()
  if (exams.some(e => e.classId === id)) {
    throw new Error('Lớp đang có đề thi, hãy xóa hoặc chuyển đề trước khi xóa lớp.')
  }
  const students = await getClassStudents(id)
  await Promise.all(students.map(s => userApi.update(s.id, { classId: '' })))
  return classApi.delete(id)
}

export async function getClassStudents(classId) {
  const users = await userApi.getAll()
  return users
    .filter(u => u.role === 'student' && u.classId === classId)
    .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'vi'))
}

export async function setStudentClass(studentId, classId) {
  return userApi.update(studentId, { classId: classId || '' })
}

export async function setClassTeachers(classId, teacherIds) {
  return classApi.update(classId, { teacherIds })
}
