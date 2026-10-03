import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, userRole } from '@/stores/authState'
import { useToast } from '@/composables/useToast'

const STAFF = ['teacher', 'admin']

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue'), meta: { title: 'Trang chủ - EduResource' } },
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { title: 'Đăng nhập - EduResource', guestOnly: true } },
  { path: '/register', name: 'register', component: () => import('@/views/RegisterView.vue'), meta: { title: 'Đăng ký - EduResource', guestOnly: true } },

  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: 'Bảng điều khiển - EduResource', requiresAuth: true } },
  { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue'), meta: { title: 'Hồ sơ cá nhân - EduResource', requiresAuth: true } },

  { path: '/exams', name: 'exams', component: () => import('@/views/ExamsView.vue'), meta: { title: 'Bài kiểm tra - EduResource', requiresAuth: true } },
  { path: '/exams/create', name: 'exam-create', component: () => import('@/views/ExamEditView.vue'), meta: { title: 'Tạo bài kiểm tra mới - EduResource', requiresAuth: true, roles: STAFF } },
  { path: '/exams/:id/edit', name: 'exam-edit', component: () => import('@/views/ExamEditView.vue'), meta: { title: 'Chỉnh sửa bài kiểm tra - EduResource', requiresAuth: true, roles: STAFF } },
  { path: '/exams/:id/take', name: 'exam-take', component: () => import('@/views/ExamTakeView.vue'), meta: { title: 'Làm bài kiểm tra - EduResource', requiresAuth: true, roles: ['student'] } },
  { path: '/exams/:id/results', name: 'exam-results', component: () => import('@/views/ExamResultsView.vue'), meta: { title: 'Kết quả lớp - EduResource', requiresAuth: true, roles: STAFF } },

  { path: '/results', name: 'my-results', component: () => import('@/views/MyResultsView.vue'), meta: { title: 'Kết quả của tôi - EduResource', requiresAuth: true, roles: ['student'] } },
  { path: '/results/:id', name: 'result-detail', component: () => import('@/views/ResultDetailView.vue'), meta: { title: 'Chi tiết bài làm - EduResource', requiresAuth: true } },

  { path: '/resources', name: 'resources', component: () => import('@/views/ResourcesView.vue'), meta: { title: 'Tài liệu & Slide - EduResource', requiresAuth: true } },
  { path: '/classes', name: 'classes', component: () => import('@/views/ClassesView.vue'), meta: { title: 'Lớp học - EduResource', requiresAuth: true } },
  { path: '/classes/:id', name: 'class-detail', component: () => import('@/views/ClassDetailView.vue'), meta: { title: 'Chi tiết lớp - EduResource', requiresAuth: true } },

  {
    path: '/admin',
    component: () => import('@/views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      { path: '', name: 'admin-home', component: () => import('@/views/admin/AdminHomeView.vue'), meta: { title: 'Quản trị - EduResource' } },
      { path: 'users', name: 'admin-users', component: () => import('@/views/admin/AdminUsersView.vue'), meta: { title: 'Quản lý người dùng - EduResource' } },
      { path: 'classes', name: 'admin-classes', component: () => import('@/views/ClassesView.vue'), meta: { title: 'Quản lý lớp học - EduResource' } },
      { path: 'subjects', name: 'admin-subjects', component: () => import('@/views/admin/AdminSubjectsView.vue'), meta: { title: 'Quản lý môn học - EduResource' } }
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach(to => {
  if (to.meta.title) document.title = to.meta.title
  const toast = useToast()

  if (to.matched.some(r => r.meta.requiresAuth) && !isAuthenticated.value) {
    toast.warning('Vui lòng đăng nhập để truy cập chức năng này.')
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  const roleRecord = [...to.matched].reverse().find(r => r.meta.roles)
  if (roleRecord && !roleRecord.meta.roles.includes(userRole.value)) {
    toast.error('Bạn không có quyền truy cập trang này.')
    return '/dashboard'
  }

  if (to.matched.some(r => r.meta.guestOnly) && isAuthenticated.value) {
    return '/dashboard'
  }
})

export default router
