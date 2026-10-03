<template>
  <div class="container py-5">
    <div class="row justify-content-center">
      <div class="col-12 col-sm-10 col-md-8 col-lg-5">
        <div class="text-center mb-4">
          <div class="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded mb-2" style="width: 48px; height: 48px;">
            <i class="bi bi-person-badge fs-4"></i>
          </div>
          <h1 class="h3 fw-bold mb-1">Đăng ký tài khoản giáo viên</h1>
          <p class="text-muted small">Dành cho Thầy/Cô tham gia giảng dạy và quản lý lớp học</p>
        </div>

        <!-- Trạng thái sau khi đăng ký thành công -->
        <div v-if="registeredSuccess" class="card p-4 text-center">
          <div class="text-success mb-3">
            <i class="bi bi-check-circle-fill display-4"></i>
          </div>
          <h2 class="h5 fw-bold mb-2">Đăng ký thành công!</h2>
          <p class="text-muted small mb-3">
            Tài khoản giáo viên của <strong>{{ registeredName }}</strong> đã được gửi lên hệ thống và đang ở trạng thái <span class="badge bg-warning text-dark border border-warning">Chờ duyệt</span>.
          </p>
          <div class="alert alert-light border small text-start mb-4">
            <i class="bi bi-info-circle me-1 text-primary"></i>
            Quản trị viên (Admin) nhà trường sẽ xem xét và kích hoạt tài khoản của bạn. Sau khi được duyệt, bạn có thể đăng nhập để tạo bài kiểm tra, quản lý lớp và tài liệu.
          </div>
          <router-link to="/login" class="btn btn-dark w-100 py-2">
            Đến trang đăng nhập
          </router-link>
        </div>

        <!-- Form đăng ký -->
        <div v-else class="card p-4">
          <!-- Thông báo cho học sinh -->
          <div class="alert alert-light border small text-muted mb-3 py-2 px-3">
            <i class="bi bi-info-circle me-1 text-dark"></i>
            <strong>Lưu ý:</strong> Học sinh không tự đăng ký tài khoản. Tài khoản học sinh do Admin hoặc Giáo viên tạo và phân lớp trực tiếp.
          </div>

          <form @submit.prevent="handleRegister">
            <div class="mb-3">
              <label for="reg-name" class="form-label fw-semibold small">Họ và tên giáo viên</label>
              <input id="reg-name" v-model="displayName" type="text" class="form-control" placeholder="Thầy/Cô Nguyễn Văn A" required />
            </div>
            <div class="mb-3">
              <label for="reg-email" class="form-label fw-semibold small">Email công vụ / cá nhân</label>
              <input id="reg-email" v-model="email" type="email" class="form-control" placeholder="giaovien@school.edu.vn" required />
            </div>
            <div class="mb-3">
              <label for="reg-phone" class="form-label fw-semibold small">Số điện thoại (tùy chọn)</label>
              <input id="reg-phone" v-model="phone" type="tel" class="form-control" placeholder="0901234567" />
            </div>
            <div class="mb-3">
              <label for="reg-password" class="form-label fw-semibold small">Mật khẩu (tối thiểu 6 ký tự)</label>
              <input id="reg-password" v-model="password" type="password" class="form-control" required minlength="6" />
            </div>
            <div class="mb-4">
              <label for="reg-confirm" class="form-label fw-semibold small">Nhập lại mật khẩu</label>
              <input id="reg-confirm" v-model="confirmPassword" type="password" class="form-control" required />
            </div>
            <button id="register-submit" type="submit" class="btn btn-dark w-100 py-2" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>Gửi đăng ký tài khoản
            </button>
          </form>
          <div class="text-center mt-3 pt-3 border-top small text-muted">
            Đã có tài khoản?
            <router-link to="/login" class="fw-semibold text-dark">Đăng nhập</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { register } from '@/services/auth.service'
import { useToast } from '@/composables/useToast'

const toast = useToast()

const displayName = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const registeredSuccess = ref(false)
const registeredName = ref('')

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    toast.warning('Mật khẩu nhập lại không trùng khớp.')
    return
  }
  loading.value = true
  try {
    const user = await register({
      displayName: displayName.value,
      email: email.value,
      password: password.value,
      phone: phone.value
    })
    registeredName.value = user.displayName
    registeredSuccess.value = true
    toast.success('Đăng ký tài khoản giáo viên thành công! Vui lòng chờ Admin duyệt.')
  } catch (err) {
    toast.error(err.message)
  } finally {
    loading.value = false
  }
}
</script>
