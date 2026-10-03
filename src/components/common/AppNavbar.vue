<template>
  <nav class="navbar navbar-expand-lg sticky-top border-bottom py-2 bg-white">
    <div class="container-xl">
      <router-link to="/"
        class="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark fs-5 text-decoration-none">
        <span class="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded p-1"
          style="width: 32px; height: 32px;">
          <i class="bi bi-mortarboard-fill fs-6"></i>
        </span>
        <span>EduResource</span>
      </router-link>

      <button class="navbar-toggler border-0 p-1" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain"
        aria-controls="navbarMain" aria-expanded="false" aria-label="Chuyển đổi menu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div id="navbarMain" class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-1">
          <li class="nav-item">
            <router-link to="/" class="nav-link" exact-active-class="active">Trang chủ</router-link>
          </li>
          <template v-if="isAuthenticated">
            <li class="nav-item">
              <router-link to="/exams" class="nav-link" active-class="active">Bài kiểm tra</router-link>
            </li>
            <li v-if="isStudent" class="nav-item">
              <router-link to="/results" class="nav-link" active-class="active">Kết quả</router-link>
            </li>
            <li v-if="!isAdmin" class="nav-item">
              <router-link to="/classes" class="nav-link" active-class="active">Lớp học</router-link>
            </li>
            <li class="nav-item">
              <router-link to="/resources" class="nav-link" active-class="active">Tài liệu & Đề mẫu</router-link>
            </li>
            <li v-if="isAdmin" class="nav-item">
              <router-link to="/admin" class="nav-link" active-class="active">Quản trị</router-link>
            </li>
            <li v-if="!isAdmin" class="nav-item">
              <router-link to="/dashboard" class="nav-link" active-class="active">Tổng quan</router-link>
            </li>
          </template>
        </ul>

        <div class="d-flex align-items-center gap-2 pt-2 pt-lg-0">
          <div v-if="isAuthenticated" class="dropdown">
            <button id="user-menu-btn"
              class="btn btn-outline-dark btn-sm dropdown-toggle d-flex align-items-center gap-2" type="button"
              data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle"></i>
              <span class="fw-medium text-truncate" style="max-width: 140px;">{{ currentUser.displayName }}</span>
              <span class="badge bg-dark">{{ roleLabel }}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border mt-2">
              <li class="px-3 py-2 border-bottom">
                <div class="fw-semibold">{{ currentUser.displayName }}</div>
                <div class="small text-muted text-truncate">{{ currentUser.email }}</div>
              </li>
              <li>
                <router-link to="/profile" class="dropdown-item py-2">
                  <i class="bi bi-person me-2"></i>Hồ sơ cá nhân
                </router-link>
              </li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li>
                <button type="button" class="dropdown-item py-2 text-danger" @click="showLogoutConfirm = true">
                  <i class="bi bi-box-arrow-right me-2"></i>Đăng xuất
                </button>
              </li>
            </ul>
          </div>

          <template v-else>
            <router-link to="/login" class="btn btn-outline-dark btn-sm">Đăng nhập</router-link>
            <router-link to="/register" class="btn btn-dark btn-sm">Đăng ký</router-link>
          </template>
        </div>
      </div>
    </div>
  </nav>

  <ConfirmModal :is-open="showLogoutConfirm" title="Đăng xuất" message="Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?"
    confirm-text="Đăng xuất" variant="dark" @confirm="handleLogout" @cancel="showLogoutConfirm = false" />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentUser, isAuthenticated, isAdmin, isStudent } from '@/stores/authState'
import { logout } from '@/services/auth.service'
import { ROLE_LABELS } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const router = useRouter()
const toast = useToast()
const showLogoutConfirm = ref(false)

const roleLabel = computed(() => ROLE_LABELS[currentUser.value?.role] || '')

const handleLogout = async () => {
  showLogoutConfirm.value = false
  await logout()
  toast.success('Đã đăng xuất.')
  router.push('/login')
}
</script>

<style scoped>
/* User dropdown */
.dropdown-menu>li:first-child {
  background-color: #fff !important;
  color: #212529;
}

.dropdown-menu>li:first-child:hover {
  background-color: #fff !important;
  color: #212529;
}

.dropdown-menu>li:first-child .text-muted {
  color: #6c757d !important;
}
</style>