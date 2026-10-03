<template>
  <div>
    <h1 class="h4 fw-bold mb-4">Tổng quan hệ thống</h1>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />

    <template v-else>
      <div class="row g-3 mb-4">
        <div v-for="s in stats" :key="s.label" class="col-6 col-xl-4">
          <router-link :to="s.to" class="text-decoration-none text-dark">
            <div class="card p-3 h-100">
              <div class="small text-muted"><i :class="[s.icon, 'me-1']"></i>{{ s.label }}</div>
              <div class="h3 fw-bold mb-0">{{ s.value }}</div>
            </div>
          </router-link>
        </div>
      </div>

      <div class="card p-3">
        <div class="fw-semibold mb-2">Lối tắt quản trị</div>
        <div class="d-flex flex-wrap gap-2">
          <router-link to="/admin/users" class="btn btn-outline-dark btn-sm">Quản lý người dùng</router-link>
          <router-link to="/admin/classes" class="btn btn-outline-dark btn-sm">Quản lý lớp</router-link>
          <router-link to="/admin/subjects" class="btn btn-outline-dark btn-sm">Quản lý môn học</router-link>
          <router-link to="/exams" class="btn btn-outline-dark btn-sm">Quản lý đề</router-link>
          <router-link to="/resources" class="btn btn-outline-dark btn-sm">Quản lý tài liệu</router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUsers } from '@/services/user.service'
import { getClasses } from '@/services/class.service'
import { getSubjects } from '@/services/subject.service'
import { getExams, getResults } from '@/services/exam.service'
import { currentUser } from '@/stores/authState'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'

const loading = ref(true)
const error = ref('')
const stats = ref([])

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [users, classes, subjects, exams, results] = await Promise.all([
      getUsers(), getClasses(), getSubjects(), getExams(currentUser.value), getResults()
    ])
    stats.value = [
      { label: 'Tổng số lớp', value: classes.length, icon: 'bi bi-diagram-3', to: '/admin/classes' },
      { label: 'Tổng số giáo viên', value: users.filter(u => u.role === 'teacher').length, icon: 'bi bi-person-video3', to: '/admin/users' },
      { label: 'Tổng số học sinh', value: users.filter(u => u.role === 'student').length, icon: 'bi bi-backpack', to: '/admin/users' },
      { label: 'Tổng số môn học', value: subjects.length, icon: 'bi bi-book', to: '/admin/subjects' },
      { label: 'Tổng số đề', value: exams.length, icon: 'bi bi-card-checklist', to: '/exams' },
      { label: 'Bài kiểm tra đã thực hiện', value: results.filter(r => r.status !== 'in_progress').length, icon: 'bi bi-check2-square', to: '/exams' }
    ]
  } catch {
    error.value = 'Không thể tải số liệu hệ thống.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
