# EduResource Manager - Nền tảng Quản lý Giáo dục & Thi Trực tuyến

Hệ thống Web App hoàn chỉnh phục vụ giáo viên, học sinh và cán bộ quản trị trường học. Dự án được thiết kế theo phong cách tối giản **Monochrome (Trắng - Đen - Xám)**, chuyên nghiệp, tối ưu hóa giao diện và trải nghiệm người dùng với **Bootstrap 5**, kết nối trực tiếp với **Firebase Realtime Database REST API**:

> **Database URL**: `https://eduresource-ad12d-default-rtdb.asia-southeast1.firebasedatabase.app/`

---

## 1. Cấu trúc 9 Collections trong Firebase RTDB

Dữ liệu được tổ chức chuẩn hóa và liên kết chặt chẽ:

1. **`users`**: `{ uid, displayName, email, role, status, createdAt, updatedAt }` (ID = Firebase Auth UID)
2. **`subjects`**: `{ name, code, description, status, createdAt, updatedAt }` (Toán, Ngữ Văn, Tiếng Anh, Vật Lý, Hóa Học, Sinh Học, Lịch Sử, Địa Lý, Tin Học)
3. **`questions`**: `{ content, type: 'multiple_choice', subjectId, grade, topic, difficulty, options: [{ id, content }], correctAnswer, createdBy, status }`
4. **`exams`**: `{ title, description, subjectId, grade, duration, createdBy, status, startAt, endAt }`
5. **`exam_questions`**: Quan hệ N-N giữa Bài thi và Câu hỏi: `{ examId, questionId, order, points, createdAt }`
6. **`exam_results`**: Kết quả bài thi của học sinh: `{ examId, studentId, score, totalQuestions, correctCount, passed, timeSpentSeconds, submittedAt }`
7. **`exam_answers`**: Chi tiết từng câu trả lời: `{ resultId, examId, questionId, selectedAnswer, isCorrect, points }`
8. **`lesson_plans`**: Kế hoạch bài dạy (Metadata liên kết Google Drive): `{ title, subjectId, grade, topic, teacherId, fileId, fileName, fileUrl, mimeType, createdAt }`
9. **`slides`**: Slide bài giảng điện tử (Metadata liên kết Google Slides): `{ title, subjectId, grade, topic, teacherId, fileId, fileName, fileUrl, mimeType, slideCount, createdAt }`

---

## 1. Tính năng nổi bật

### 1.1. Ngân hàng câu hỏi (Question Bank)
* Phân loại đa tầng: Môn học (Toán, Lý, Hóa, Văn, Anh, Tin...), Khối lớp (10, 11, 12, THCS), Chủ đề bài dạy và Độ khó (Dễ, Trung bình, Khó).
* Câu hỏi trắc nghiệm chuẩn hóa 4 lựa chọn, đánh dấu đáp án đúng trực quan và cung cấp lời giải thích chi tiết.
* Tìm kiếm nội dung theo từ khóa, lọc tổ hợp nhiều tiêu chí, phân trang dữ liệu mượt mà.
* Thêm mới, chỉnh sửa, xóa câu hỏi với modal xác nhận.

### 1.2. Kỳ thi & Bài kiểm tra trực tuyến (Online Exams)
* **Dành cho Giáo viên**:
  * Tạo đề thi từ ngân hàng câu hỏi chỉ với vài thao tác chọn lựa (Question Picker Modal).
  * Tùy chỉnh thời gian làm bài (phút), thang điểm tổng (tự động phân bổ điểm/câu) và tỷ lệ điểm đạt (%).
  * Sắp xếp thứ tự câu hỏi trong đề, xuất bản (Publish) hoặc lưu nháp (Draft).
* **Dành cho Học sinh**:
  * Giao diện làm bài thi chuyên dụng với **Đồng hồ đếm ngược (Countdown Timer)** chính xác đến từng giây.
  * Thanh tiến độ (% câu hỏi đã làm), bảng số câu hỏi (Palette) trực quan giúp chuyển nhanh câu hỏi.
  * Tự động nộp bài khi hết giờ hoặc nộp bài chủ động qua **Bootstrap Modal xác nhận**.
  * Chấm điểm tự động và xem lại bài giải chi tiết (đáp án đúng hiển thị màu xanh, lựa chọn sai hiển thị màu đỏ kèm lời giải chi tiết).

### 1.3. Kho Kế hoạch bài dạy (Lesson Plans)
* Tách biệt rõ ràng: **Database (Firebase Firestore)** lưu metadata, **File Storage (Google Drive)** lưu trữ tệp thực tế.
* Hỗ trợ tìm kiếm, lọc theo môn học, lớp, chủ đề.
* Xem trước tài liệu trực tiếp qua **Google Drive Preview Modal** (nhúng iframe tài liệu).
* Mở tệp trực tiếp trong tab mới của Google Drive hoặc tải về máy chỉ với một click.
* Đăng tải giáo án mới thông qua liên kết Google Drive hoặc Google Picker API.

### 1.4. Kho Slide bài dạy & Bài giảng điện tử (Teaching Slides)
* Lưu trữ và phân loại các bài giảng trình chiếu Google Slides / PowerPoint.
* Tích hợp tính năng **Trình chiếu trực tiếp (Presentation Mode)** nhúng khung phát Google Slides ngay trên website.
* Hỗ trợ giáo viên và học sinh tải về hoặc mở trực tiếp trên Google Drive.

### 1.5. Bảng điều khiển (Dashboard)
* Tự động cá nhân hóa theo vai trò người dùng:
  * **Giáo viên**: Thống kê số câu hỏi, bài thi đã tạo, danh sách bài kiểm tra gần đây và điểm số các bài thi học sinh vừa nộp.
  * **Học sinh**: Danh sách bài thi đang mở cần làm, lịch sử điểm số và liên kết xem lại bài làm.
  * **Quản trị viên**: Số liệu toàn hệ thống và các lối tắt điều hành nhanh.

### 1.6. Trung tâm Quản trị (Admin Panel)
* Phân quyền bảo mật cao: Chỉ tài khoản có vai trò `admin` mới được truy cập `/admin`.
* Quản lý người dùng: Tìm kiếm, lọc theo vai trò (Admin / Teacher / Student), cập nhật vai trò, khóa/mở khóa tài khoản và xóa người dùng.
* Quản trị tập trung toàn bộ câu hỏi, bài kiểm tra, kế hoạch bài dạy và slide trên hệ thống.

---

## 2. Công nghệ sử dụng

* **Frontend**: Vue.js 3 (Composition API, `<script setup>`), Vite
* **Styling**: Bootstrap 5.3.8 + Bootstrap Icons 1.13.1 (Monochrome palette: `#FFFFFF`, `#111827`, `#E5E7EB`)
* **Routing & Guards**: Vue Router (Bảo vệ tuyến đường theo trạng thái đăng nhập và vai trò: Guest, Student, Teacher, Admin)
* **Backend Database**: Firebase Firestore
* **Authentication**: Firebase Authentication
* **File Storage**: Google Drive API (OAuth 2.0 Client & Google Picker)
* **Demo Engine**: Tích hợp sẵn bộ dữ liệu mẫu chuẩn chương trình giáo dục Việt Nam, hoạt động 100% ngay cả khi chưa kết nối Firebase/Drive.

---

## 3. Cài đặt & Chạy ứng dụng

### Yêu cầu hệ thống:
* Node.js >= 20.0.0
* npm >= 10.0.0

### Các bước cài đặt:

```bash
# 1. Clone repository hoặc di chuyển vào thư mục dự án
cd edu_resource_manager

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Sao chép tệp biến môi trường
cp .env.example .env

# 4. Khởi động môi trường phát triển (Dev server)
npm run dev
```

Ứng dụng sẽ khả dụng tại: `http://localhost:5173/`

### Xây dựng bản phát hành (Production Build):

```bash
npm run build
```

---

## 4. Tài khoản Demo sẵn có

Hệ thống được tích hợp bộ chuyển đổi vai trò nhanh trên Navbar và trang Đăng nhập để trải nghiệm:

| Vai trò | Email đăng nhập | Mật khẩu mẫu | Họ và tên |
| :--- | :--- | :--- | :--- |
| **Giáo viên (Teacher)** | `teacher@school.edu.vn` | `123456` | Thầy Nguyễn Văn An |
| **Học sinh (Student)** | `student@school.edu.vn` | `123456` | Trần Thị Bích |
| **Quản trị viên (Admin)** | `admin@school.edu.vn` | `123456` | Quản trị viên Hệ thống |

---

## 5. Hướng dẫn cấu hình Firebase

1. Truy cập [Firebase Console](https://console.firebase.google.com/) và tạo một dự án mới (hoặc chọn dự án có sẵn).
2. **Kích hoạt Authentication**:
   * Vào **Build** -> **Authentication** -> **Get started**.
   * Trong tab **Sign-in method**, bật nhà cung cấp **Email/Password**.
3. **Kích hoạt Cloud Firestore**:
   * Vào **Build** -> **Firestore Database** -> **Create database**.
   * Chọn vùng máy chủ gần nhất (ví dụ: `asia-southeast1`).
   * Sao chép toàn bộ nội dung từ tệp `firestore.rules` trong dự án dán vào tab **Rules** trên Firebase Console và nhấn **Publish**.
4. **Lấy cấu hình Web App**:
   * Vào **Project settings** (biểu tượng bánh răng) -> tab **General** -> cuộn xuống phần **Your apps** -> chọn biểu tượng **Web (`</>`)**.
   * Đăng ký app và sao chép các thông số cấu hình vào tệp `.env`:
     ```env
     VITE_FIREBASE_API_KEY=AIzaSy...
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
     VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef...
     ```

---

## 6. Hướng dẫn cấu hình Google Drive API

Hệ thống đã được nạp sẵn thông số OAuth Client của dự án Google Cloud:
* **Client ID**: `21056405426-o8olnghtkndljkn8c3ff7ns03tmv4msj.apps.googleusercontent.com`
* **Project ID**: `primal-seeker-508604-e6`

### Để kích hoạt Google Drive Picker trên trình duyệt:
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn dự án `primal-seeker-508604-e6`.
3. Vào **APIs & Services** -> **Enabled APIs & Services** -> Bấm **+ ENABLE APIS AND SERVICES** -> Tìm và bật 2 API:
   * **Google Drive API**
   * **Google Picker API**
4. Vào **APIs & Services** -> **Credentials**:
   * Chọn Client ID OAuth 2.0 Web Client.
   * Thêm nguồn gốc JavaScript được ủy quyền (Authorized JavaScript origins):
     * `http://localhost:5173`
     * `http://localhost:5678` (hoặc domain production của bạn)
5. Tạo một **API Key** trong menu Credentials để sử dụng Google Picker API (tùy chọn) và điền vào `.env`:
   ```env
   VITE_GOOGLE_API_KEY=AIzaSy...
   ```
6. **Cách đính kèm tệp linh hoạt cho Giáo viên**:
   * Giáo viên có thể dán trực tiếp bất kỳ link chia sẻ nào từ Google Drive (Google Docs, Google Slides, Google Sheets hoặc file PDF/Word).
   * Hệ thống tự động phân tích và trích xuất `fileId`, tự động tạo liên kết nhúng xem trước (Iframe Preview) và liên kết tải về trực tiếp.

---

## 7. Cấu trúc thư mục dự án

```text
src/
├── assets/
│   └── main.css                  # Thiết lập bảng màu Monochrome, biến CSS & override Bootstrap
├── components/
│   ├── common/
│   │   ├── AppNavbar.vue         # Thanh điều hướng đáp ứng (Mobile collapse, profile & vai trò)
│   │   ├── AppFooter.vue         # Chân trang tối giản, bản quyền & liên kết nhanh
│   │   ├── AppToast.vue          # Hệ thống thông báo nổi toàn cục (Bootstrap Toast)
│   │   ├── LoadingSpinner.vue    # Chỉ báo tải trạng thái (Bootstrap Spinner)
│   │   ├── ConfirmModal.vue      # Hộp thoại xác nhận hành vi nguy hiểm (Không dùng confirm mặc định)
│   │   ├── EmptyState.vue        # Trạng thái trống có CTA khi không có dữ liệu
│   │   └── Pagination.vue        # Phân trang dữ liệu chuẩn Bootstrap
│   ├── questions/
│   │   ├── QuestionCard.vue      # Thẻ hiển thị câu hỏi trắc nghiệm
│   │   └── QuestionModal.vue     # Modal tạo/chỉnh sửa câu hỏi trắc nghiệm
│   ├── exams/
│   │   ├── ExamCard.vue          # Thẻ hiển thị thông tin bài kiểm tra
│   │   └── QuestionPickerModal.vue # Modal chọn câu hỏi từ ngân hàng đề vào bài thi
│   ├── drive/
│   │   ├── DrivePickerModal.vue  # Modal liên kết và phân tích File ID Google Drive
│   │   └── DrivePreviewModal.vue # Khung xem trước tài liệu và trình chiếu Google Slides
│   ├── lesson-plans/
│   │   └── LessonPlanModal.vue   # Modal đăng/sửa Kế hoạch bài dạy
│   └── slides/
│       └── SlideModal.vue        # Modal đăng/sửa Slide bài dạy
├── composables/
│   └── useToast.js               # Composable quản lý thông báo phản hồi người dùng
├── router/
│   └── index.js                  # Điều hướng các trang và Route Guards kiểm soát quyền truy cập
├── services/
│   ├── firebase.js               # Khởi tạo Firebase Auth & Firestore
│   ├── auth.service.js           # Xử lý đăng nhập, đăng ký, đăng xuất, quên mật khẩu
│   ├── question.service.js       # CRUD ngân hàng câu hỏi
│   ├── exam.service.js           # CRUD bài kiểm tra, chấm thi tự động và lưu kết quả
│   ├── lessonPlan.service.js     # Quản lý Kế hoạch bài dạy (Metadata Firestore + Google Drive)
│   ├── slide.service.js          # Quản lý Slide bài dạy (Metadata Firestore + Google Drive)
│   ├── googleDrive.service.js    # Trích xuất Drive ID, tạo URL xem trước / tải về & Google Picker
│   ├── user.service.js           # Quản lý người dùng cho khu vực Admin
│   └── mockData.js               # Dữ liệu mẫu chuẩn bị sẵn
├── stores/
│   └── authState.js              # Quản lý trạng thái xác thực và vai trò người dùng
├── views/
│   ├── HomeView.vue              # Trang chủ giới thiệu hệ thống & bài thi nổi bật
│   ├── LoginView.vue             # Trang đăng nhập (Kèm nút đăng nhập nhanh 1-click)
│   ├── RegisterView.vue          # Trang đăng ký với lựa chọn vai trò
│   ├── ForgotPasswordView.vue    # Trang khôi phục mật khẩu
│   ├── DashboardView.vue         # Bảng điều khiển cá nhân hóa theo vai trò
│   ├── QuestionsView.vue         # Quản trị ngân hàng câu hỏi
│   ├── ExamsView.vue             # Danh sách bài kiểm tra trực tuyến
│   ├── ExamCreateView.vue        # Giao diện soạn thảo đề thi cho giáo viên
│   ├── ExamTakeView.vue          # Giao diện làm bài thi trực tuyến với đồng hồ đếm ngược
│   ├── ExamResultView.vue        # Trang báo điểm & xem lại bài thi chi tiết
│   ├── LessonPlansView.vue       # Kho kế hoạch bài dạy
│   ├── SlidesView.vue            # Kho bài giảng điện tử Google Slides
│   └── admin/
│       ├── AdminLayout.vue       # Khung điều hướng khu vực Quản trị Admin
│       ├── AdminUsersView.vue    # Quản trị người dùng & phân quyền
│       ├── AdminQuestionsView.vue # Kiểm duyệt ngân hàng câu hỏi
│       ├── AdminExamsView.vue    # Kiểm duyệt đề thi
│       ├── AdminLessonPlansView.vue # Quản trị metadata kế hoạch bài dạy
│       └── AdminSlidesView.vue   # Quản trị metadata slide bài dạy
├── App.vue                       # Component gốc tích hợp Navbar, RouterView, Footer & Toast
└── main.js                       # Điểm khởi chạy ứng dụng
```
