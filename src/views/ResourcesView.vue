<template>
  <div class="container-xl py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div>
        <h1 class="h4 fw-bold mb-1">Tài liệu & Ngân hàng đề mẫu</h1>
        <p class="text-muted small mb-0">Kế hoạch bài dạy, slide bài giảng và ngân hàng đề thi mẫu ôn luyện lưu trữ trên Google Drive.</p>
      </div>
      <button v-if="isStaff" id="add-resource-btn" type="button" class="btn btn-dark btn-sm" @click="openForm(null)">
        <i class="bi bi-plus-lg me-1"></i>{{ tab === 'lesson_plans' ? 'Thêm kế hoạch bài dạy' : (tab === 'slides' ? 'Thêm slide' : 'Thêm đề mẫu tự luyện') }}
      </button>
    </div>

    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <ul class="nav nav-tabs border-bottom-0 mb-0">
        <li class="nav-item">
          <button type="button" class="nav-link text-dark" :class="{ active: tab === 'lesson_plans' }" @click="tab = 'lesson_plans'">
            <i class="bi bi-file-earmark-text me-1"></i>Kế hoạch bài dạy ({{ lists.lesson_plans.length }})
          </button>
        </li>
        <li class="nav-item">
          <button type="button" class="nav-link text-dark" :class="{ active: tab === 'slides' }" @click="tab = 'slides'">
            <i class="bi bi-file-earmark-slides me-1"></i>Slide bài dạy ({{ lists.slides.length }})
          </button>
        </li>
        <li class="nav-item">
          <button type="button" class="nav-link text-dark" :class="{ active: tab === 'sample_exams' }" @click="tab = 'sample_exams'">
            <i class="bi bi-file-earmark-check me-1"></i>Ngân hàng đề mẫu ({{ lists.sample_exams.length }})
          </button>
        </li>
      </ul>

      <!-- Bộ lọc phạm vi cho giáo viên/admin -->
      <div v-if="isStaff" class="btn-group btn-group-sm">
        <button
          type="button"
          class="btn"
          :class="scopeFilter === 'all' ? 'btn-dark' : 'btn-outline-dark'"
          @click="scopeFilter = 'all'"
        >
          Tất cả tài liệu ({{ totalCount }})
        </button>
        <button
          type="button"
          class="btn"
          :class="scopeFilter === 'mine' ? 'btn-dark' : 'btn-outline-dark'"
          @click="scopeFilter = 'mine'"
        >
          <i class="bi bi-person-fill me-1"></i>Của tôi đã đăng ({{ myCount }})
        </button>
      </div>
    </div>

    <div class="card p-3 mb-3">
      <div class="row g-2 align-items-center">
        <div class="col-12 col-md-6">
          <input
            v-model="search"
            type="search"
            class="form-control form-control-sm"
            placeholder="Tìm theo tên hoặc chủ đề..."
            aria-label="Tìm kiếm tài liệu"
          />
        </div>
        <div class="col-6 col-md-3">
          <SearchableSelect
            v-model="subjectFilter"
            :options="subjects"
            value-key="id"
            label-key="name"
            placeholder="Mọi môn học"
            search-placeholder="Tìm môn học..."
            :allow-clear="true"
            clear-label="Mọi môn học"
            size="sm"
          />
        </div>
        <div class="col-6 col-md-3">
          <select
            v-model="gradeFilter"
            class="form-select form-select-sm"
            aria-label="Lọc theo khối"
          >
            <option value="">Mọi khối</option>
            <option v-for="g in GRADES" :key="g" :value="String(g)">Khối {{ g }}</option>
          </select>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState
      v-else-if="!filtered.length"
      icon="bi bi-folder2-open"
      title="Chưa có tài liệu"
      :description="scopeFilter === 'mine' ? 'Bạn chưa đăng tài liệu nào thuộc mục này.' : 'Không có tài liệu nào phù hợp với bộ lọc.'"
      :action-text="isStaff ? 'Thêm tài liệu' : ''"
      @action="openForm(null)"
    />

    <div v-else class="card overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th>Tên tài liệu</th>
              <th>Môn / Khối</th>
              <th v-if="!isStudent">Người đăng</th>
              <th>Ngày đăng</th>
              <th class="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in paged" :key="r.id">
              <td>
                <div class="fw-semibold d-flex align-items-center gap-1 flex-wrap">
                  <span>{{ r.title }}</span>
                  <span v-if="isStaff && r.teacherId === currentUser.uid" class="badge bg-dark text-white" style="font-size: 0.7rem;">
                    <i class="bi bi-person-check-fill me-1"></i>Của bạn
                  </span>
                </div>
                <div class="small text-muted">{{ r.topic }}</div>
              </td>
              <td class="small">
                <div>{{ subjectName(r.subjectId) }}</div>
                <div class="text-muted">Khối {{ r.grade }}</div>
              </td>
              <td v-if="!isStudent" class="small">
                <span v-if="r.teacherId === currentUser.uid" class="fw-semibold text-dark">
                  <i class="bi bi-person-fill me-1"></i>Bạn
                </span>
                <span v-else-if="r.teacherId" class="text-muted">
                  <i class="bi bi-person me-1"></i>{{ authorName(r.teacherId) }}
                </span>
                <span v-else class="text-muted">
                  <i class="bi bi-building me-1"></i>Dùng chung
                </span>
              </td>
              <td class="small text-muted">{{ formatDate(r.createdAt) }}</td>
              <td class="text-end text-nowrap">
                <div class="btn-group btn-group-sm">
                  <a :href="getDriveViewUrl(r.fileId)" target="_blank" rel="noopener noreferrer" class="btn btn-outline-dark" title="Mở file trên Google Drive">
                    <i class="bi bi-box-arrow-up-right me-1"></i>Mở file
                  </a>
                  <a :href="getDriveDirectDownloadUrl(r.fileId)" target="_blank" rel="noopener noreferrer" class="btn btn-outline-dark" title="Tải file về máy">
                    <i class="bi bi-download me-1"></i>Tải về
                  </a>
                  <template v-if="canManage(r)">
                    <button type="button" class="btn btn-outline-dark" title="Chỉnh sửa" @click="openForm(r)"><i class="bi bi-pencil"></i></button>
                    <button type="button" class="btn btn-outline-danger" title="Xóa" @click="toDelete = r"><i class="bi bi-trash"></i></button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Pagination v-model:current-page="page" :total-items="filtered.length" :page-size="PAGE_SIZE" />

    <ResourceModal
      :is-open="showForm"
      :type="tab"
      :data="editing"
      :subjects="subjects"
      :submitting="submitting"
      @close="showForm = false"
      @save="save"
    />

    <ConfirmModal
      :is-open="Boolean(toDelete)"
      title="Xóa tài liệu"
      :message="`Bạn có chắc muốn xóa &quot;${toDelete?.title}&quot;? Tệp đính kèm trên Google Drive cũng sẽ được xóa.`"
      confirm-text="Xóa"
      :loading="submitting"
      @confirm="remove"
      @cancel="toDelete = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { currentUser, isStaff, isStudent, isAdmin } from '@/stores/authState'
import { getResources, createResource, updateResource, deleteResource } from '@/services/resource.service'
import { getSubjects } from '@/services/subject.service'
import { getUsers } from '@/services/user.service'
import { getDriveViewUrl, getDriveDirectDownloadUrl } from '@/services/googleDrive.service'
import { GRADES, formatDate, paginate } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import ResourceModal from '@/components/drive/ResourceModal.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'

const PAGE_SIZE = 10
const toast = useToast()

const tab = ref('lesson_plans')
const scopeFilter = ref('all') // 'all' | 'mine'
const loading = ref(true)
const error = ref('')
const submitting = ref(false)

const lists = ref({ lesson_plans: [], slides: [], sample_exams: [] })
const subjects = ref([])
const users = ref([])

const search = ref('')
const subjectFilter = ref('')
const gradeFilter = ref('')
const page = ref(1)

const showForm = ref(false)
const editing = ref(null)
const toDelete = ref(null)

const subjectName = id => subjects.value.find(s => s.id === id)?.name || '—'
const authorName = id => {
  if (!id) return 'Dùng chung'
  if (id === currentUser.value?.uid) return 'Bạn'
  const u = users.value.find(x => x.uid === id)
  return u ? u.displayName : id
}

const currentList = computed(() => lists.value[tab.value] || [])
const totalCount = computed(() => currentList.value.length)
const myCount = computed(() => currentList.value.filter(r => r.teacherId === currentUser.value?.uid).length)

const canManage = r => isAdmin.value || (isStaff.value && r.teacherId === currentUser.value.uid)

const filtered = computed(() => {
  const s = search.value.trim().toLowerCase()
  const uid = currentUser.value?.uid
  return currentList.value.filter(r => {
    if (scopeFilter.value === 'mine' && r.teacherId !== uid) return false
    if (s && !(r.title?.toLowerCase().includes(s) || r.topic?.toLowerCase().includes(s))) return false
    if (subjectFilter.value && subjectFilter.value !== 'all' && r.subjectId !== subjectFilter.value) return false
    if (gradeFilter.value && gradeFilter.value !== 'all' && String(r.grade) !== String(gradeFilter.value)) return false
    return true
  })
})
const paged = computed(() => paginate(filtered.value, page.value, PAGE_SIZE))
watch([search, subjectFilter, gradeFilter, tab, scopeFilter], () => { page.value = 1 })

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const user = currentUser.value
    const [plans, slides, samples, s, uList] = await Promise.all([
      getResources('lesson_plans', user),
      getResources('slides', user),
      getResources('sample_exams', user),
      getSubjects({ onlyActive: false }),
      getUsers()
    ])
    lists.value = { lesson_plans: plans, slides, sample_exams: samples }
    subjects.value = s
    users.value = uList
  } catch {
    error.value = 'Không thể tải danh sách tài liệu.'
  } finally {
    loading.value = false
  }
}

const openForm = r => {
  editing.value = r
  showForm.value = true
}

const save = async data => {
  submitting.value = true
  try {
    if (editing.value) await updateResource(tab.value, editing.value.id, data)
    else await createResource(tab.value, data, currentUser.value)
    toast.success('Đã lưu tài liệu.')
    showForm.value = false
    await load()
  } catch {
    toast.error('Không thể lưu tài liệu.')
  } finally {
    submitting.value = false
  }
}

const remove = async () => {
  submitting.value = true
  try {
    await deleteResource(tab.value, toDelete.value.id, toDelete.value.fileId, currentUser.value)
    toast.success('Đã xóa tài liệu và tệp trên Google Drive.')
    toDelete.value = null
    await load()
  } catch {
    toast.error('Không thể xóa tài liệu.')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>
