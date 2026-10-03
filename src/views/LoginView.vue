<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-sm-10 col-md-8 col-lg-5">
        <div class="text-center mb-4">
          <div class="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded mb-2" style="width: 48px; height: 48px;">
            <i class="bi bi-mortarboard-fill fs-4"></i>
          </div>
          <h1 class="h3 fw-bold mb-1">Đăng nhập</h1>
          <p class="text-muted small">Hệ thống quản lý học tập và kiểm tra online</p>
        </div>

        <div class="card p-4 mb-3">
          <form @submit.prevent="handleLogin">
            <div class="mb-3">
              <label for="login-email" class="form-label fw-semibold small">Email</label>
              <input id="login-email" v-model="email" type="email" class="form-control" placeholder="name@school.edu.vn" required />
            </div>
            <div class="mb-4">
              <label for="login-password" class="form-label fw-semibold small">Mật khẩu</label>
              <div class="input-group">
                <input id="login-password" v-model="password" :type="showPassword ? 'text' : 'password'" class="form-control" required />
                <button type="button" class="btn btn-outline-secondary" aria-label="Hiện / ẩn mật khẩu" @click="showPassword = !showPassword">
                  <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
            </div>
            <button id="login-submit" type="submit" class="btn btn-dark w-100 py-2" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>Đăng nhập
            </button>
          </form>
          <div class="text-center mt-3 pt-3 border-top small text-muted">
            Chưa có tài khoản giáo viên?
            <router-link to="/register" class="fw-semibold text-dark">Đăng ký tại đây</router-link>
            <div class="mt-1 text-muted" style="font-size: 0.8rem;">
              (Học sinh nhận tài khoản do Thầy/Cô hoặc Quản trị viên cấp)
            </div>
          </div>
        </div>

        <!-- Tài khoản dùng thử / Demo -->
        <div class="card p-3 bg-light border">
          <div class="small fw-semibold mb-2 d-flex align-items-center justify-content-between">
            <span><i class="bi bi-shield-check me-1"></i>Tài khoản trải nghiệm (Mật khẩu: <code>123456</code>)</span>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button
              v-for="d in demos"
              :key="d.email"
              type="button"
              class="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
              :disabled="loading"
              @click="quickLogin(d.email)"
            >
              <i :class="d.icon"></i>
              <span>{{ d.label }}</span>
            </button>
          </div>
          <div class="text-muted mt-2" style="font-size: 0.75rem;">
            * Bấm vào nút vai trò để tự động điền thông tin và đăng nhập nhanh.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '@/services/auth.service'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const demos = [
  { label: 'Quản trị viên (Admin)', email: 'admin@school.edu.vn', icon: 'bi bi-shield-lock' },
  { label: 'Giáo viên', email: 'teacher@school.edu.vn', icon: 'bi bi-person-video3' },
  { label: 'Học sinh', email: 'student@school.edu.vn', icon: 'bi bi-backpack' }
]

const handleLogin = async () => {
  loading.value = true
  try {
    const user = await login(email.value, password.value)
    toast.success(`Xin chào ${user.displayName}`)
    router.push(route.query.redirect || (user.role === 'admin' ? '/admin' : '/dashboard'))
  } catch (err) {
    toast.error(err.message)
  } finally {
    loading.value = false
  }
}

const quickLogin = demoEmail => {
  email.value = demoEmail
  password.value = '123456'
  handleLogin()
}
</script>
