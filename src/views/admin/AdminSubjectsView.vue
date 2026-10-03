<template>
  <div>
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <h1 class="h4 fw-bold mb-0">Quản lý môn học</h1>
      <button id="add-subject-btn" type="button" class="btn btn-dark btn-sm" @click="openForm(null)">
        <i class="bi bi-plus-lg me-1"></i>Thêm môn học
      </button>
    </div>

    <div class="card p-3 mb-3">
      <input v-model="search" type="search" class="form-control form-control-sm" placeholder="Tìm theo mã hoặc tên môn..." />
    </div>

    <LoadingSpinner v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="load" />
    <EmptyState v-else-if="!filtered.length" icon="bi bi-book" title="Chưa có môn học" description="Hãy thêm môn học đầu tiên." />

    <div v-else class="card overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Mã</th><th>Tên môn</th><th>Mô tả</th><th>Trạng thái</th><th class="text-end">Thao tác</th></tr>
          </thead>
          <tbody>
            <tr v-for="s in paged" :key="s.id">
              <td class="fw-medium">{{ s.code }}</td>
              <td>{{ s.name }}</td>
              <td class="text-muted small">{{ s.description }}</td>
              <td>
                <span class="badge" :class="s.status === 'inactive' ? 'bg-secondary' : 'bg-light text-dark border'">
                  {{ s.status === 'inactive' ? 'Ngưng dùng' : 'Đang dùng' }}
                </span>
              </td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button type="button" class="btn btn-outline-dark" title="Chỉnh sửa" @click="openForm(s)"><i class="bi bi-pencil"></i></button>
                  <button type="button" class="btn btn-outline-danger" title="Xóa" @click="toDelete = s"><i class="bi bi-trash"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <Pagination v-model:current-page="page" :total-items="filtered.length" :page-size="PAGE_SIZE" />

    <div v-if="showForm" class="modal fade show d-block" tabindex="-1" style="background-color: rgba(0,0,0,.5);" @click.self="showForm = false">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <form @submit.prevent="save">
            <div class="modal-header">
              <h5 class="modal-title">{{ editing ? 'Chỉnh sửa môn học' : 'Thêm môn học' }}</h5>
              <button type="button" class="btn-close" aria-label="Đóng" @click="showForm = false"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-4">
                  <label for="sf-code" class="form-label small fw-semibold">Mã môn</label>
                  <input id="sf-code" v-model="form.code" class="form-control text-uppercase" required />
                </div>
                <div class="col-8">
                  <label for="sf-name" class="form-label small fw-semibold">Tên môn</label>
                  <input id="sf-name" v-model="form.name" class="form-control" required />
                </div>
                <div class="col-12">
                  <label for="sf-desc" class="form-label small fw-semibold">Mô tả</label>
                  <textarea id="sf-desc" v-model="form.description" class="form-control" rows="2"></textarea>
                </div>
                <div class="col-12">
                  <label for="sf-status" class="form-label small fw-semibold">Trạng thái</label>
                  <select id="sf-status" v-model="form.status" class="form-select">
                    <option value="active">Đang dùng</option>
                    <option value="inactive">Ngưng dùng</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" @click="showForm = false">Hủy</button>
              <button type="submit" class="btn btn-dark" :disabled="submitting">
                <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>Lưu
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <ConfirmModal
      :is-open="Boolean(toDelete)"
      title="Xóa môn học"
      :message="`Bạn có chắc muốn xóa môn &quot;${toDelete?.name}&quot;?`"
      confirm-text="Xóa"
      :loading="submitting"
      @confirm="remove"
      @cancel="toDelete = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@/services/subject.service'
import { paginate } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Pagination from '@/components/common/Pagination.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const PAGE_SIZE = 10
const toast = useToast()

const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const subjects = ref([])
const search = ref('')
const page = ref(1)

const showForm = ref(false)
const editing = ref(null)
const form = ref({ code: '', name: '', description: '', status: 'active' })
const toDelete = ref(null)

const filtered = computed(() => {
  const s = search.value.trim().toLowerCase()
  return subjects.value.filter(x => !s || x.name?.toLowerCase().includes(s) || x.code?.toLowerCase().includes(s))
})
const paged = computed(() => paginate(filtered.value, page.value, PAGE_SIZE))
watch(search, () => { page.value = 1 })

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    subjects.value = await getSubjects()
  } catch {
    error.value = 'Không thể tải danh sách môn học.'
  } finally {
    loading.value = false
  }
}

const openForm = s => {
  editing.value = s
  form.value = s
    ? { code: s.code, name: s.name, description: s.description || '', status: s.status || 'active' }
    : { code: '', name: '', description: '', status: 'active' }
  showForm.value = true
}

const save = async () => {
  submitting.value = true
  try {
    if (editing.value) await updateSubject(editing.value.id, form.value)
    else await createSubject(form.value)
    toast.success('Đã lưu môn học.')
    showForm.value = false
    await load()
  } catch (err) {
    toast.error(err.message || 'Không thể lưu môn học.')
  } finally {
    submitting.value = false
  }
}

const remove = async () => {
  submitting.value = true
  try {
    await deleteSubject(toDelete.value.id)
    toast.success('Đã xóa môn học.')
    toDelete.value = null
    await load()
  } catch (err) {
    toast.error(err.message || 'Không thể xóa môn học.')
    toDelete.value = null
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>
