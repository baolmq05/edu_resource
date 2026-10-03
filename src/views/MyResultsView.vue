<template>
  <div class="container-xl py-4">
    <h1 class="h4 fw-bold mb-1">Kết quả của tôi</h1>
    <p class="text-muted small mb-3">Lịch sử các bài kiểm tra bạn đã làm.</p>

    <div class="card p-3 mb-3">
      <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Tìm theo tên bài kiểm tra..." />
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="!filtered.length" icon="bi bi-clipboard-check" title="Chưa có kết quả" description="Bạn chưa làm bài kiểm tra nào." action-text="Xem bài kiểm tra" action-icon="bi bi-card-checklist" @action="$router.push('/exams')" />

    <div v-else class="card overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Bài kiểm tra</th><th>Nộp lúc</th><th>Thời gian làm</th><th>Đúng / Sai</th><th>Điểm</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="r in paged" :key="r.id">
              <td>
                <div class="fw-medium">{{ r.examTitle }}</div>
                <span class="badge" :class="resultStatusInfo(r).badge">{{ resultStatusInfo(r).label }}</span>
              </td>
              <td class="small">{{ formatDateTime(r.submittedAt) }}</td>
              <td class="small">{{ r.status === 'in_progress' ? '—' : formatDuration(r.durationSeconds) }}</td>
              <td class="small">{{ r.status === 'in_progress' ? '—' : `${r.correctCount} / ${r.wrongCount}` }}</td>
              <td class="fw-bold">{{ r.status === 'in_progress' ? '—' : `${scoreTo10(r)}/10` }}</td>
              <td class="text-end">
                <router-link v-if="r.status !== 'in_progress'" :to="`/results/${r.id}`" class="btn btn-outline-dark btn-sm">Chi tiết</router-link>
                <router-link v-else :to="`/exams/${r.examId}/take`" class="btn btn-dark btn-sm">Tiếp tục</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Pagination v-model:current-page="page" :total-items="filtered.length" :page-size="PAGE_SIZE" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { currentUser } from '@/stores/authState'
import { getResults, getExamById, scoreTo10, resultStatusInfo } from '@/services/exam.service'
import { formatDateTime, formatDuration, paginate } from '@/utils/helpers'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'

const PAGE_SIZE = 10
const loading = ref(true)
const error = ref('')
const results = ref([])
const search = ref('')
const page = ref(1)

const filtered = computed(() => {
  const s = search.value.trim().toLowerCase()
  return results.value.filter(r => !s || r.examTitle.toLowerCase().includes(s))
})
const paged = computed(() => paginate(filtered.value, page.value, PAGE_SIZE))
watch(search, () => { page.value = 1 })

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const list = await getResults({ studentId: currentUser.value.uid })
    const titles = {}
    await Promise.all(
      [...new Set(list.map(r => r.examId))].map(async id => {
        const e = await getExamById(id)
        titles[id] = e?.title || '(Đề đã bị xóa)'
      })
    )
    results.value = list.map(r => ({ ...r, examTitle: titles[r.examId] }))
  } catch {
    error.value = 'Không thể tải lịch sử bài làm.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
