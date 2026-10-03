import { BaseAPI } from './api.js'

const subjectApi = new BaseAPI('subjects')
const examApi = new BaseAPI('exams')
const planApi = new BaseAPI('lesson_plans')
const slideApi = new BaseAPI('slides')

export async function getSubjects({ onlyActive = false } = {}) {
  const list = await subjectApi.getAll()
  const sorted = list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'))
  return onlyActive ? sorted.filter(s => s.status !== 'inactive') : sorted
}

export async function getSubjectMap() {
  const list = await subjectApi.getAll()
  return Object.fromEntries(list.map(s => [s.id, s.name]))
}

export async function createSubject(data) {
  const existing = await subjectApi.getAll()
  if (existing.some(s => (s.code || '').toLowerCase() === data.code.trim().toLowerCase())) {
    throw new Error('Mã môn học đã tồn tại.')
  }
  return subjectApi.store({
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    description: data.description || '',
    status: data.status || 'active'
  })
}

export async function updateSubject(id, data) {
  const existing = await subjectApi.getAll()
  if (existing.some(s => s.id !== id && (s.code || '').toLowerCase() === data.code.trim().toLowerCase())) {
    throw new Error('Mã môn học đã tồn tại.')
  }
  return subjectApi.update(id, {
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
    description: data.description || '',
    status: data.status || 'active'
  })
}

export async function deleteSubject(id) {
  const [exams, plans, slides] = await Promise.all([examApi.getAll(), planApi.getAll(), slideApi.getAll()])
  const used = [...exams, ...plans, ...slides].some(x => x.subjectId === id)
  if (used) throw new Error('Môn học đang được sử dụng bởi đề thi hoặc tài liệu, không thể xóa.')
  return subjectApi.delete(id)
}
