<template>
  <div class="container-xl py-4">
    <h1 class="h4 fw-bold mb-4">Hồ sơ cá nhân</h1>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <div v-else class="row g-4">
      <div class="col-12 col-lg-6">
        <div class="card p-4">
          <h2 class="h6 fw-bold mb-3">Thông tin tài khoản</h2>
          <form @submit.prevent="saveProfile">
            <div class="mb-3">
              <label for="pf-email" class="form-label small fw-semibold">Email</label>
              <input id="pf-email" :value="currentUser.email" class="form-control" disabled />
            </div>
            <div class="row g-3 mb-3">
              <div class="col-6">
                <label class="form-label small fw-semibold">Vai trò</label>
                <input :value="ROLE_LABELS[currentUser.role]" class="form-control" disabled />
              </div>
              <div v-if="isStudent" class="col-6">
                <label class="form-label small fw-semibold">Lớp hiện tại</label>
                <input :value="className || 'Chưa được xếp lớp'" class="form-control" disabled />
              </div>
            </div>
            <div class="mb-3">
              <label for="pf-name" class="form-label small fw-semibold">Họ và tên</label>
              <input id="pf-name" v-model="profile.displayName" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="pf-phone" class="form-label small fw-semibold">Số điện thoại</label>
              <input id="pf-phone" v-model="profile.phone" class="form-control" />
            </div>
            <button type="submit" class="btn btn-dark btn-sm" :disabled="savingProfile">
              <span v-if="savingProfile" class="spinner-border spinner-border-sm me-1"></span>Lưu thông tin
            </button>
          </form>
        </div>
      </div>

      <div class="col-12 col-lg-6">
        <div class="card p-4">
          <h2 class="h6 fw-bold mb-3">Đổi mật khẩu</h2>
          <form @submit.prevent="submitPassword">
            <div class="mb-3">
              <label for="pw-old" class="form-label small fw-semibold">Mật khẩu hiện tại</label>
              <input id="pw-old" v-model="pw.old" type="password" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="pw-new" class="form-label small fw-semibold">Mật khẩu mới</label>
              <input id="pw-new" v-model="pw.next" type="password" class="form-control" required minlength="6" />
            </div>
            <div class="mb-3">
              <label for="pw-confirm" class="form-label small fw-semibold">Nhập lại mật khẩu mới</label>
              <input id="pw-confirm" v-model="pw.confirm" type="password" class="form-control" required />
            </div>
            <button type="submit" class="btn btn-dark btn-sm" :disabled="savingPw">
              <span v-if="savingPw" class="spinner-border spinner-border-sm me-1"></span>Đổi mật khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { currentUser, isStudent } from '@/stores/authState'
import { updateProfile, changePassword } from '@/services/auth.service'
import { getClassById } from '@/services/class.service'
import { ROLE_LABELS } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const toast = useToast()
const loading = ref(true)
const error = ref('')
const className = ref('')
const savingProfile = ref(false)
const savingPw = ref(false)

const profile = reactive({ displayName: '', phone: '' })
const pw = reactive({ old: '', next: '', confirm: '' })

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    profile.displayName = currentUser.value.displayName
    profile.phone = currentUser.value.phone || ''
    if (isStudent.value && currentUser.value.classId) {
      const c = await getClassById(currentUser.value.classId)
      className.value = c ? `${c.name} (${c.schoolYear})` : ''
    }
  } catch {
    error.value = 'Không thể tải thông tin hồ sơ.'
  } finally {
    loading.value = false
  }
}

const saveProfile = async () => {
  savingProfile.value = true
  try {
    await updateProfile(currentUser.value.uid, profile)
    toast.success('Đã cập nhật thông tin cá nhân.')
  } catch {
    toast.error('Không thể cập nhật thông tin.')
  } finally {
    savingProfile.value = false
  }
}

const submitPassword = async () => {
  if (pw.next !== pw.confirm) {
    toast.warning('Mật khẩu mới nhập lại không trùng khớp.')
    return
  }
  savingPw.value = true
  try {
    await changePassword(currentUser.value.uid, pw.old, pw.next)
    toast.success('Đã đổi mật khẩu.')
    pw.old = pw.next = pw.confirm = ''
  } catch (err) {
    toast.error(err.message)
  } finally {
    savingPw.value = false
  }
}

onMounted(load)
</script>
