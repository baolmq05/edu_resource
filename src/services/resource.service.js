import { BaseAPI } from './api.js'
import { extractDriveFileId, getDriveViewUrl, deleteDriveFile } from './googleDrive.service.js'

/** type: 'lesson_plans' | 'slides' | 'sample_exams' */
const apis = {
  lesson_plans: new BaseAPI('lesson_plans'),
  slides: new BaseAPI('slides'),
  sample_exams: new BaseAPI('sample_exams')
}

export async function getResources(type, user) {
  const list = await apis[type].getAll()
  return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

function buildPayload(data) {
  const fileId = extractDriveFileId(data.fileId || data.fileUrl)
  return {
    title: data.title.trim(),
    subjectId: data.subjectId,
    grade: Number(data.grade),
    classId: data.classId || '',
    topic: data.topic || '',
    description: data.description || '',
    fileId,
    fileName: data.fileName || data.title,
    fileUrl: data.fileUrl || getDriveViewUrl(fileId),
    mimeType: data.mimeType || ''
  }
}

export async function createResource(type, data, user) {
  return apis[type].store({ ...buildPayload(data), teacherId: user.uid })
}

export async function updateResource(type, id, data) {
  return apis[type].update(id, buildPayload(data))
}

export async function deleteResource(type, id, fileId, user) {
  const res = await apis[type].delete(id)
  if (fileId) {
    try {
      await deleteDriveFile(fileId, user?.uid)
    } catch (e) {
      console.warn('Xóa file trên Drive thất bại:', e)
    }
  }
  return res
}

