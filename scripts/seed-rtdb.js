/**
 * Seed Firebase Realtime Database cho EduResource.
 * Chạy: node scripts/seed-rtdb.js
 *
 * CẢNH BÁO: script ghi đè TOÀN BỘ dữ liệu gốc của database.
 *
 * Collections: users, subjects, classes, exams, exam_results, lesson_plans, slides
 * - Câu hỏi nằm trong từng đề: exams/{id}/questions
 * - Câu trả lời nằm trong bài làm:  exam_results/{id}/answers
 */
import { createHash } from 'node:crypto'

const BASE_URL = 'https://eduresource-ad12d-default-rtdb.asia-southeast1.firebasedatabase.app'

const sha = p => createHash('sha256').update(p).digest('hex')
const PASSWORD = sha('123456')
const day = 24 * 60 * 60 * 1000
const iso = offset => new Date(Date.now() + offset).toISOString()
const now = iso(0)

const stamp = obj => ({ ...obj, createdAt: now, updatedAt: now })

/* ---------------- subjects ---------------- */
const subjectList = [
  ['sub_toan', 'Toán', 'TOAN'],
  ['sub_van', 'Ngữ Văn', 'VAN'],
  ['sub_anh', 'Tiếng Anh', 'ANH'],
  ['sub_ly', 'Vật Lý', 'LY'],
  ['sub_hoa', 'Hóa Học', 'HOA'],
  ['sub_sinh', 'Sinh Học', 'SINH'],
  ['sub_su', 'Lịch Sử', 'SU'],
  ['sub_dia', 'Địa Lý', 'DIA']
]
const subjects = Object.fromEntries(
  subjectList.map(([id, name, code]) => [id, stamp({ name, code, description: `Môn ${name}`, status: 'active' })])
)

/* ---------------- users ---------------- */
const userList = [
  ['u_admin', 'Quản trị viên', 'admin@school.edu.vn', 'admin', ''],
  ['u_an', 'Nguyễn Văn An', 'teacher@school.edu.vn', 'teacher', ''],
  ['u_binh', 'Lê Thị Bình', 'gv.binh@school.edu.vn', 'teacher', ''],
  ['u_bich', 'Trần Thị Bích', 'student@school.edu.vn', 'student', 'c_10a1'],
  ['u_cuong', 'Phạm Quốc Cường', 'hs.cuong@school.edu.vn', 'student', 'c_10a1'],
  ['u_dung', 'Hoàng Thùy Dung', 'hs.dung@school.edu.vn', 'student', 'c_10a1'],
  ['u_em', 'Vũ Minh Em', 'hs.em@school.edu.vn', 'student', 'c_10a2'],
  ['u_phuc', 'Đặng Gia Phúc', 'hs.phuc@school.edu.vn', 'student', 'c_10a2'],
  ['u_giang', 'Bùi Hương Giang', 'hs.giang@school.edu.vn', 'student', 'c_11a1']
]
const users = Object.fromEntries(
  userList.map(([uid, displayName, email, role, classId]) => [
    uid,
    stamp({ uid, displayName, email, password: PASSWORD, role, status: 'active', classId, phone: '' })
  ])
)

/* ---------------- classes ---------------- */
const classes = {
  c_10a1: stamp({ name: '10A1', grade: 10, schoolYear: '2025-2026', teacherIds: ['u_an'], status: 'active' }),
  c_10a2: stamp({ name: '10A2', grade: 10, schoolYear: '2025-2026', teacherIds: ['u_an', 'u_binh'], status: 'active' }),
  c_11a1: stamp({ name: '11A1', grade: 11, schoolYear: '2025-2026', teacherIds: ['u_binh'], status: 'active' })
}

/* ---------------- exams (câu hỏi nằm trong đề) ---------------- */
const opt = (...contents) => contents.map((content, i) => ({ id: 'ABCD'[i], content }))

const midtermQuestions = [
  { id: 'q1', type: 'single_choice', content: 'Giá trị của 2 + 3 × 4 là bao nhiêu?', options: opt('14', '20', '24', '10'), correctAnswer: 'A', points: 2, order: 1 },
  { id: 'q2', type: 'single_choice', content: 'Nghiệm của phương trình x² - 5x + 6 = 0 là:', options: opt('x = 1 và x = 6', 'x = 2 và x = 3', 'x = -2 và x = -3', 'x = 1 và x = 5'), correctAnswer: 'B', points: 2, order: 2 },
  { id: 'q3', type: 'multiple_choice', content: 'Những số nào sau đây là số nguyên tố?', options: opt('2', '9', '11', '15'), correctAnswer: ['A', 'C'], points: 2, order: 3 },
  { id: 'q4', type: 'true_false', content: 'Tổng ba góc trong một tam giác bằng 180°.', options: [], correctAnswer: 'true', points: 2, order: 4 }
]

const quizQuestions = [
  { id: 'q1', type: 'single_choice', content: 'Đạo hàm của hàm số y = x² là:', options: opt('x', '2x', 'x²', '2'), correctAnswer: 'B', points: 2, order: 1 },
  { id: 'q2', type: 'single_choice', content: 'Giá trị của sin(90°) bằng:', options: opt('0', '1/2', '1', '-1'), correctAnswer: 'C', points: 2, order: 2 },
  { id: 'q3', type: 'true_false', content: 'Số 0 là số tự nhiên chẵn.', options: [], correctAnswer: 'true', points: 2, order: 3 },
  { id: 'q4', type: 'multiple_choice', content: 'Hàm số nào sau đây đồng biến trên R?', options: opt('y = 2x + 1', 'y = -x', 'y = x + 5', 'y = 3 - x'), correctAnswer: ['A', 'C'], points: 4, order: 4 }
]

const englishQuestions = [
  { id: 'q1', type: 'single_choice', content: 'She ___ to school every day.', options: opt('go', 'goes', 'going', 'gone'), correctAnswer: 'B', points: 5, order: 1 },
  { id: 'q2', type: 'single_choice', content: 'Choose the synonym of "big":', options: opt('small', 'tiny', 'large', 'short'), correctAnswer: 'C', points: 5, order: 2 }
]

const physicsQuestions = [
  { id: 'q1', type: 'single_choice', content: 'Đơn vị của lực trong hệ SI là:', options: opt('Joule', 'Newton', 'Watt', 'Pascal'), correctAnswer: 'B', points: 5, order: 1 },
  { id: 'q2', type: 'true_false', content: 'Vận tốc là đại lượng vô hướng.', options: [], correctAnswer: 'false', points: 5, order: 2 }
]

const exams = {
  exam_toan_giuaky: stamp({
    title: 'Kiểm tra giữa kỳ Toán 10',
    description: 'Bài kiểm tra giữa học kỳ I',
    subjectId: 'sub_toan', classId: 'c_10a1', grade: 10, duration: 45,
    createdBy: 'u_an', status: 'published',
    startAt: iso(-1 * day), endAt: iso(30 * day), showAnswers: true,
    questions: midtermQuestions
  }),
  exam_toan_15p: stamp({
    title: 'Kiểm tra 15 phút Toán 10',
    description: 'Kiểm tra nhanh đạo hàm và lượng giác',
    subjectId: 'sub_toan', classId: 'c_10a1', grade: 10, duration: 15,
    createdBy: 'u_an', status: 'closed',
    startAt: iso(-10 * day), endAt: iso(-8 * day), showAnswers: false,
    questions: quizQuestions
  }),
  exam_anh_10a2: stamp({
    title: 'Kiểm tra Tiếng Anh 10A2',
    description: 'Ngữ pháp và từ vựng cơ bản',
    subjectId: 'sub_anh', classId: 'c_10a2', grade: 10, duration: 20,
    createdBy: 'u_binh', status: 'published',
    startAt: iso(-1 * day), endAt: iso(14 * day), showAnswers: true,
    questions: englishQuestions
  }),
  exam_ly_nhap: stamp({
    title: 'Kiểm tra Vật Lý chương 1',
    description: 'Đề nháp chưa xuất bản',
    subjectId: 'sub_ly', classId: 'c_10a2', grade: 10, duration: 30,
    createdBy: 'u_an', status: 'draft',
    startAt: iso(2 * day), endAt: iso(9 * day), showAnswers: false,
    questions: physicsQuestions
  }),
  exam_toantruong_chung: stamp({
    title: 'Khảo sát chất lượng đầu năm - Toàn trường',
    description: 'Bài kiểm tra khảo sát năng lực chung dành cho toàn thể học sinh trong trường',
    subjectId: 'sub_toan', classId: 'all', grade: 0, duration: 45,
    createdBy: 'u_an', status: 'published',
    startAt: iso(-2 * day), endAt: iso(20 * day), showAnswers: true,
    questions: midtermQuestions
  })
}

/* ---------------- exam_results (answers nằm trong bài làm) ---------------- */
const result = (o) => stamp({ submittedAt: iso(-8.5 * day), durationSeconds: 600, status: 'submitted', ...o })

const exam_results = {
  res_bich_15p: result({
    examId: 'exam_toan_15p', studentId: 'u_bich', classId: 'c_10a1', startedAt: iso(-8.6 * day),
    answers: { q1: 'B', q2: 'C', q3: 'true', q4: ['A', 'C'] },
    score: 10, maxScore: 10, correctCount: 4, wrongCount: 0
  }),
  res_cuong_15p: result({
    examId: 'exam_toan_15p', studentId: 'u_cuong', classId: 'c_10a1', startedAt: iso(-8.6 * day),
    answers: { q1: 'B', q2: 'A', q3: 'true', q4: ['A'] },
    score: 4, maxScore: 10, correctCount: 2, wrongCount: 2
  }),
  res_dung_giuaky: result({
    examId: 'exam_toan_giuaky', studentId: 'u_dung', classId: 'c_10a1',
    startedAt: iso(-0.2 * day), submittedAt: iso(-0.18 * day), durationSeconds: 1500,
    answers: { q1: 'A', q2: 'A', q3: ['A', 'C'], q4: 'true' },
    score: 6, maxScore: 8, correctCount: 3, wrongCount: 1
  })
}

/* ---------------- lesson_plans & slides ---------------- */
const SAMPLE_FILE = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
const drive = (title, extra) => ({
  title, fileId: SAMPLE_FILE, fileName: `${title}.docx`,
  fileUrl: `https://drive.google.com/file/d/${SAMPLE_FILE}/view?usp=sharing`,
  mimeType: 'application/vnd.google-apps.document', description: '', ...extra
})

const lesson_plans = {
  lp_1: stamp(drive('KHBD: Hàm số bậc nhất', { subjectId: 'sub_toan', grade: 10, classId: '', topic: 'Hàm số', teacherId: 'u_an' })),
  lp_2: stamp(drive('KHBD: Phương trình bậc hai', { subjectId: 'sub_toan', grade: 10, classId: 'c_10a1', topic: 'Phương trình', teacherId: 'u_an' })),
  lp_3: stamp(drive('KHBD: Present Simple Tense', { subjectId: 'sub_anh', grade: 10, classId: 'c_10a2', topic: 'Ngữ pháp', teacherId: 'u_binh' }))
}

const slides = {
  sl_1: stamp(drive('Slide: Mệnh đề và tập hợp', { subjectId: 'sub_toan', grade: 10, classId: '', topic: 'Mệnh đề', teacherId: 'u_an', mimeType: 'application/vnd.google-apps.presentation' })),
  sl_2: stamp(drive('Slide: Động học chất điểm', { subjectId: 'sub_ly', grade: 10, classId: 'c_10a2', topic: 'Cơ học', teacherId: 'u_an', mimeType: 'application/vnd.google-apps.presentation' })),
  sl_3: stamp(drive('Slide: Unit 1 - Family Life', { subjectId: 'sub_anh', grade: 10, classId: 'c_10a2', topic: 'Từ vựng', teacherId: 'u_binh', mimeType: 'application/vnd.google-apps.presentation' }))
}

const sample_exams = {
  se_1: stamp(drive('Đề ôn tập giữa kỳ 1 Toán 10 (Có lời giải chi tiết)', { subjectId: 'sub_toan', grade: 10, classId: '', topic: 'Ôn tập giữa kỳ', teacherId: 'u_an' })),
  se_2: stamp(drive('Đề thi thử học kỳ 1 Tiếng Anh 10 (Format mới 2026)', { subjectId: 'sub_anh', grade: 10, classId: '', topic: 'Thi thử học kỳ 1', teacherId: 'u_binh' })),
  se_3: stamp(drive('Bộ 5 đề ôn luyện Vật Lý 10 - Chuyển động cơ học', { subjectId: 'sub_ly', grade: 10, classId: 'c_10a1', topic: 'Cơ học', teacherId: 'u_an' }))
}

const data = { users, subjects, classes, exams, exam_results, lesson_plans, slides, sample_exams }

const res = await fetch(`${BASE_URL}/.json`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})

if (!res.ok) {
  console.error('Seed thất bại:', res.status, await res.text())
  process.exit(1)
}

console.log('Seed thành công:')
for (const [name, value] of Object.entries(data)) {
  console.log(` - ${name}: ${Object.keys(value).length} bản ghi`)
}
console.log('\nTài khoản demo (mật khẩu 123456):')
console.log(' admin@school.edu.vn | teacher@school.edu.vn | student@school.edu.vn')
