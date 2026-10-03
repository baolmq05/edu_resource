import { BaseAPI } from './api.js'
import { uid } from '@/utils/helpers'

const examApi = new BaseAPI('exams')
const resultApi = new BaseAPI('exam_results')

/* ------------------------------------------------------------------ */
/* ĐỀ THI                                                              */
/* ------------------------------------------------------------------ */

export function normalizeQuestion(q, index = 0) {
  return {
    ...q,
    options: Array.isArray(q.options) ? q.options : [],
    correctAnswer: q.correctAnswer ?? (q.type === 'multiple_choice' ? [] : ''),
    points: Number(q.points) || 1,
    order: q.order ?? index + 1
  }
}

export function normalizeExam(e) {
  // Bỏ các câu tự luận cũ (hệ thống không còn hỗ trợ loại câu này)
  const questions = (Array.isArray(e.questions) ? e.questions : [])
    .filter(q => q.type !== 'essay')
    .map(normalizeQuestion)
    .sort((a, b) => a.order - b.order)
  return { ...e, questions }
}

/** Lấy danh sách đề theo phạm vi quyền của người dùng */
export async function getExams(user) {
  const all = (await examApi.getAll()).map(normalizeExam)
  let list = all
  if (user?.role === 'student') {
    // Học sinh chỉ xem được bài kiểm tra thuộc lớp mình đang ở hiện tại hoặc bài kiểm tra toàn trường
    list = all.filter(e => e.status === 'published' && (e.classId === 'all' || !e.classId || (user.classId && e.classId === user.classId)))
  } else if (user?.role === 'teacher') {
    // Giảng viên cũng chỉ xem được các bài kiểm tra do chính mình tạo ra
    list = all.filter(e => e.createdBy === user.uid)
  }
  return list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
}

export async function getExamById(id) {
  const e = await examApi.getOne(id)
  return e ? normalizeExam(e) : null
}

function buildPayload(data) {
  return {
    title: data.title.trim(),
    description: data.description || '',
    subjectId: data.subjectId,
    classId: data.classId,
    grade: Number(data.grade),
    duration: Number(data.duration),
    startAt: data.startAt || '',
    endAt: data.endAt || '',
    showAnswers: Boolean(data.showAnswers),
    status: data.status || 'draft',
    questions: (data.questions || []).map((q, i) => ({
      id: q.id || uid('q'),
      content: q.content,
      type: q.type,
      options: q.options || [],
      correctAnswer: q.correctAnswer ?? '',
      points: Number(q.points) || 1,
      order: i + 1
    }))
  }
}

export async function createExam(data, user) {
  return examApi.store({ ...buildPayload(data), createdBy: user.uid })
}

export async function updateExam(id, data) {
  return examApi.update(id, buildPayload(data))
}

export async function setExamStatus(id, status) {
  return examApi.update(id, { status })
}

export async function copyExam(exam, user) {
  return examApi.store({
    ...buildPayload({ ...exam, title: `${exam.title} (Bản sao)`, status: 'draft' }),
    createdBy: user.uid
  })
}

export async function deleteExam(id) {
  const results = await resultApi.getAll()
  await Promise.all(results.filter(r => r.examId === id).map(r => resultApi.delete(r.id)))
  return examApi.delete(id)
}

/* ------------------------------------------------------------------ */
/* CHẤM ĐIỂM                                                            */
/* ------------------------------------------------------------------ */

export function isAnswered(answer) {
  if (Array.isArray(answer)) return answer.length > 0
  return answer !== undefined && answer !== null && String(answer).trim() !== ''
}

export function isCorrect(question, answer) {
  if (!isAnswered(answer)) return false
  if (question.type === 'multiple_choice') {
    const correct = [...(question.correctAnswer || [])].sort()
    const given = [...(Array.isArray(answer) ? answer : [answer])].sort()
    return correct.length === given.length && correct.every((v, i) => v === given[i])
  }
  return String(answer) === String(question.correctAnswer)
}

export function gradeExam(exam, answers = {}) {
  let score = 0
  let maxScore = 0
  let correctCount = 0
  let wrongCount = 0

  for (const q of exam.questions) {
    maxScore += q.points
    if (isCorrect(q, answers[q.id])) {
      correctCount++
      score += q.points
    } else {
      wrongCount++
    }
  }
  return { score, maxScore, correctCount, wrongCount }
}

export function scoreTo10(result) {
  if (!result || !result.maxScore) return 0
  return Math.round((result.score / result.maxScore) * 100) / 10
}

/* ------------------------------------------------------------------ */
/* KẾT QUẢ / BÀI LÀM                                                    */
/* ------------------------------------------------------------------ */

export function normalizeResult(r) {
  return { ...r, answers: r.answers || {} }
}

export async function getResults(filter = {}) {
  let list = (await resultApi.getAll()).map(normalizeResult)
  if (filter.examId) list = list.filter(r => r.examId === filter.examId)
  if (filter.studentId) list = list.filter(r => r.studentId === filter.studentId)
  if (filter.classId) list = list.filter(r => r.classId === filter.classId)
  return list.sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0))
}

export async function getResultById(id) {
  const r = await resultApi.getOne(id)
  return r ? normalizeResult(r) : null
}

/** Kiểm tra học sinh có được vào làm đề hay không */
export function checkTakeAccess(exam, user, existingResult) {
  if (!user || user.role !== 'student') return { ok: false, reason: 'Chỉ học sinh mới được làm bài kiểm tra.' }
  if (!exam) return { ok: false, reason: 'Không tìm thấy đề thi.' }
  const isForStudent = exam.classId === 'all' || !exam.classId || (user.classId && exam.classId === user.classId)
  if (!isForStudent) {
    return { ok: false, reason: 'Bài kiểm tra này không thuộc lớp của bạn.' }
  }
  if (existingResult && existingResult.status !== 'in_progress') {
    return { ok: false, reason: 'Bạn đã nộp bài này rồi.' }
  }
  // Bài đang làm dở: cho vào lại, hệ thống sẽ tự động nộp nếu đã hết giờ
  if (existingResult && existingResult.status === 'in_progress') return { ok: true }
  if (exam.status !== 'published') return { ok: false, reason: 'Đề thi chưa được xuất bản hoặc đã đóng.' }
  const now = Date.now()
  if (exam.startAt && now < new Date(exam.startAt).getTime()) {
    return { ok: false, reason: 'Chưa đến thời gian bắt đầu làm bài.' }
  }
  if (exam.endAt && now > new Date(exam.endAt).getTime()) {
    return { ok: false, reason: 'Đã hết thời gian làm bài của đề này.' }
  }
  if (!exam.questions.length) return { ok: false, reason: 'Đề thi chưa có câu hỏi.' }
  return { ok: true }
}

export async function getAttempt(examId, studentId) {
  const list = await getResults({ examId, studentId })
  return list[0] || null
}

export async function startAttempt(exam, user) {
  const created = await resultApi.store({
    examId: exam.id,
    studentId: user.uid,
    classId: user.classId,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    submittedAt: '',
    durationSeconds: 0,
    score: 0,
    maxScore: exam.questions.reduce((s, q) => s + q.points, 0),
    correctCount: 0,
    wrongCount: 0
  })
  return normalizeResult(created)
}

export async function saveDraftAnswers(resultId, answers) {
  return resultApi.update(resultId, { answers })
}

export async function submitAttempt(result, exam, answers, auto = false) {
  const graded = gradeExam(exam, answers)
  const submittedAt = new Date()
  const payload = {
    answers,
    status: auto ? 'auto_submitted' : 'submitted',
    submittedAt: submittedAt.toISOString(),
    durationSeconds: Math.max(0, Math.round((submittedAt - new Date(result.startedAt)) / 1000)),
    ...graded
  }
  await resultApi.update(result.id, payload)
  return { ...result, ...payload }
}

export function resultStatusInfo(result) {
  if (!result) return { label: 'Chưa làm', badge: 'bg-light text-secondary border' }
  if (result.status === 'in_progress') return { label: 'Đang làm', badge: 'bg-light text-dark border' }
  if (result.status === 'auto_submitted') return { label: 'Tự động nộp', badge: 'bg-dark text-white' }
  return { label: 'Đã nộp', badge: 'bg-dark text-white' }
}

/** Thống kê kết quả của một đề */
export function computeExamStats(exam, results) {
  const submitted = results.filter(r => r.status !== 'in_progress')
  const avg = submitted.length
    ? submitted.reduce((s, r) => s + scoreTo10(r), 0) / submitted.length
    : 0
  const perQuestion = exam.questions
    .map(q => {
      const correct = submitted.filter(r => isCorrect(q, r.answers[q.id])).length
      return { question: q, correct, wrong: submitted.length - correct }
    })
  const totalCorrect = perQuestion.reduce((s, p) => s + p.correct, 0)
  const totalAnswered = perQuestion.reduce((s, p) => s + p.correct + p.wrong, 0)
  return {
    submittedCount: submitted.length,
    average: Math.round(avg * 100) / 100,
    correctRate: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    perQuestion
  }
}
