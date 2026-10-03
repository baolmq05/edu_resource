import { ref, computed } from 'vue'

const STORAGE_KEY = 'edu_current_user'

function loadSavedUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export const currentUser = ref(loadSavedUser())

export const isAuthenticated = computed(() => Boolean(currentUser.value && currentUser.value.uid))
export const userRole = computed(() => currentUser.value?.role || 'guest')
export const isAdmin = computed(() => currentUser.value?.role === 'admin')
export const isTeacherRole = computed(() => currentUser.value?.role === 'teacher')
export const isStudent = computed(() => currentUser.value?.role === 'student')
/** Giáo viên hoặc Admin */
export const isStaff = computed(() => isTeacherRole.value || isAdmin.value)

export function setCurrentUser(user) {
  if (user) {
    // Không bao giờ lưu mật khẩu ở phía client
    const { password: _pw, ...safe } = user
    currentUser.value = safe
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
  } else {
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEY)
  }
}
