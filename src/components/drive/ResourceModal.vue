<template>
  <div
    v-if="isOpen"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5); z-index: 1070;"
    @click.self="$emit('close')"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable my-3" style="max-height: calc(100vh - 2rem);">
      <form class="modal-content shadow" style="max-height: 90vh; display: flex; flex-direction: column;" @submit.prevent="submit">
        <div class="modal-header flex-shrink-0">
          <h5 class="modal-title fw-bold">
            {{ isEdit ? 'Chỉnh sửa' : 'Thêm' }} {{ typeTitle }}
          </h5>
          <button type="button" class="btn-close" aria-label="Đóng" @click="$emit('close')"></button>
        </div>

        <div class="modal-body" style="overflow-y: auto; flex: 1 1 auto;">
          <!-- Khung chọn phương thức đính kèm -->
          <div class="card p-3 mb-3 bg-light border">
            <label class="form-label fw-semibold small mb-2">
              Tệp tài liệu <span class="text-danger">*</span>
            </label>

            <!-- Bộ nút chuyển đổi phương thức -->
            <div class="btn-group w-100 mb-3" role="group">
              <button
                type="button"
                class="btn btn-sm py-2"
                :class="sourceMode === 'upload' ? 'btn-dark text-white fw-medium' : 'btn-outline-dark bg-white'"
                :disabled="uploading"
                @click="sourceMode = 'upload'"
              >
                <i class="bi bi-cloud-arrow-up me-1"></i>Tải tệp từ máy tính
              </button>
              <button
                type="button"
                class="btn btn-sm py-2"
                :class="sourceMode === 'link' ? 'btn-dark text-white fw-medium' : 'btn-outline-dark bg-white'"
                :disabled="uploading"
                @click="sourceMode = 'link'"
              >
                <i class="bi bi-link-45deg me-1"></i>Dán liên kết Google Drive
              </button>
            </div>

            <!-- PHƯƠNG ÁN 1: Tải tệp từ máy tính -->
            <div v-if="sourceMode === 'upload'">
              <input ref="fileInput" type="file" class="d-none" @change="onFileChosen" />

              <!-- Đang upload -->
              <div v-if="uploading" class="p-3 bg-white border rounded">
                <div class="d-flex justify-content-between small fw-medium mb-1">
                  <span><i class="bi bi-cloud-upload me-1"></i>Đang tải lên Google Drive...</span>
                  <span>{{ progress }}%</span>
                </div>
                <div class="progress" style="height: 8px;">
                  <div class="progress-bar bg-dark" :style="{ width: progress + '%' }"></div>
                </div>
                <div class="small text-muted mt-2">Vui lòng chờ trong giây lát...</div>
              </div>

              <!-- Đã có tệp thành công -->
              <div v-else-if="form.fileId && !isManualLink" class="bg-white border rounded p-3 d-flex justify-content-between align-items-center gap-2">
                <div class="d-flex align-items-center gap-2 overflow-hidden">
                  <i class="bi bi-file-earmark-check fs-3 text-success flex-shrink-0"></i>
                  <div class="overflow-hidden">
                    <div class="fw-semibold small text-truncate">{{ form.fileName || form.title || form.fileId }}</div>
                    <div class="text-muted small" style="font-size: 0.75rem;">Đã tải lên Google Drive thành công</div>
                  </div>
                </div>
                <button type="button" class="btn btn-outline-dark btn-sm flex-shrink-0" @click="fileInput.click()">
                  <i class="bi bi-arrow-repeat me-1"></i>Chọn tệp khác
                </button>
              </div>

              <!-- Chưa chọn tệp: Hộp bấm chọn -->
              <div
                v-else
                class="border border-2 border-dashed rounded p-4 text-center bg-white"
                style="cursor: pointer;"
                @click="fileInput.click()"
              >
                <i class="bi bi-cloud-arrow-up fs-2 text-dark d-block mb-1"></i>
                <div class="fw-semibold small">Bấm vào đây để chọn tệp từ máy tính</div>
                <div class="text-muted small mt-1" style="font-size: 0.8rem;">
                  Hỗ trợ Word (.docx), PowerPoint (.pptx), PDF, Excel... (tối đa 100MB). Tệp sẽ tự động đồng bộ lên Google Drive.
                </div>
              </div>
            </div>

            <!-- PHƯƠNG ÁN 2: Dán liên kết Google Drive -->
            <div v-else>
              <div class="mb-2">
                <label for="modal-drive-link" class="form-label small text-muted">Đường link chia sẻ Google Drive</label>
                <div class="input-group">
                  <span class="input-group-text bg-white"><i class="bi bi-link-45deg"></i></span>
                  <input
                    id="modal-drive-link"
                    v-model="form.fileUrl"
                    class="form-control"
                    placeholder="https://drive.google.com/file/d/... hoặc https://docs.google.com/..."
                    @input="onLinkInput"
                  />
                  <button type="button" class="btn btn-outline-dark btn-sm" title="Mở hộp thoại chi tiết" @click="showPicker = true">
                    <i class="bi bi-pencil me-1"></i>Chi tiết
                  </button>
                </div>
                <div class="form-text small mt-1">
                  Dán liên kết chia sẻ từ Google Drive (ở chế độ: <em>"Bất kỳ ai có đường liên kết đều có thể xem"</em>).
                </div>
              </div>

              <!-- Thông báo nhận diện ID -->
              <div v-if="form.fileId" class="alert alert-success py-2 px-3 small mt-2 mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-check-circle-fill flex-shrink-0"></i>
                <div class="text-truncate">
                  Đã nhận diện tệp Drive: <strong>{{ form.fileName || form.fileId }}</strong>
                </div>
              </div>
              <div v-else-if="form.fileUrl" class="alert alert-warning py-2 px-3 small mt-2 mb-0">
                <i class="bi bi-exclamation-triangle me-1"></i>Không thể trích xuất File ID từ đường link này. Vui lòng kiểm tra lại.
              </div>
            </div>
          </div>

          <!-- Các thông tin chi tiết khác -->
          <div class="row g-3">
            <!-- Tên tài liệu -->
            <div class="col-12">
              <label for="rs-title" class="form-label small fw-semibold">Tên tài liệu <span class="text-danger">*</span></label>
              <input id="rs-title" v-model="form.title" class="form-control" placeholder="VD: Kế hoạch bài dạy Tuần 1" required />
            </div>

            <!-- Môn học (Select và tìm kiếm) -->
            <div class="col-12 col-md-6">
              <label class="form-label small fw-semibold">Môn học <span class="text-danger">*</span></label>
              <SearchableSelect
                v-model="form.subjectId"
                :options="subjects"
                value-key="id"
                label-key="name"
                placeholder="-- Chọn môn học --"
                search-placeholder="Tìm môn (Toán, Lý, Anh...)"
              />
            </div>

            <!-- Khối -->
            <div class="col-12 col-md-6">
              <label for="rs-grade" class="form-label small fw-semibold">Khối <span class="text-danger">*</span></label>
              <select id="rs-grade" v-model.number="form.grade" class="form-select" required>
                <option value="" disabled>-- Chọn khối --</option>
                <option v-for="g in GRADES" :key="g" :value="g">Khối {{ g }}</option>
              </select>
            </div>

            <!-- Chủ đề -->
            <div class="col-12">
              <label for="rs-topic" class="form-label small fw-semibold">Chủ đề / Chuyên đề</label>
              <input id="rs-topic" v-model="form.topic" class="form-control" placeholder="VD: Chương 1 - Mệnh đề & Tập hợp" />
            </div>

            <!-- Mô tả -->
            <div class="col-12">
              <label for="rs-desc" class="form-label small fw-semibold">Mô tả hoặc ghi chú</label>
              <textarea id="rs-desc" v-model="form.description" class="form-control" rows="2" placeholder="Ghi chú thêm về tài liệu..."></textarea>
            </div>
          </div>
        </div>

        <!-- Footer cố định ở đáy, không bao giờ bị che -->
        <div class="modal-footer flex-shrink-0 bg-white border-top d-flex justify-content-between align-items-center">
          <div>
            <span v-if="!form.fileId" class="small text-danger">
              <i class="bi bi-exclamation-circle me-1"></i>Chưa đính kèm tệp tài liệu
            </span>
            <span v-else class="small text-success">
              <i class="bi bi-check-circle me-1"></i>Đã sẵn sàng lưu
            </span>
          </div>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">Hủy</button>
            <button type="submit" class="btn btn-dark px-4" :disabled="submitting || uploading || !form.fileId">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>Lưu tài liệu
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <DrivePickerModal
    :is-open="showPicker"
    :initial-url="form.fileUrl"
    :initial-name="form.fileName"
    @close="showPicker = false"
    @select="onPicked"
  />
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { extractDriveFileId, uploadFileToDrive } from '@/services/googleDrive.service'
import { currentUser } from '@/stores/authState'
import { GRADES } from '@/utils/helpers'
import { useToast } from '@/composables/useToast'
import DrivePickerModal from '@/components/drive/DrivePickerModal.vue'
import SearchableSelect from '@/components/common/SearchableSelect.vue'

const toast = useToast()
const fileInput = ref(null)
const uploading = ref(false)
const progress = ref(0)
const sourceMode = ref('upload') // 'upload' | 'link'
const isManualLink = ref(false)

const props = defineProps({
  isOpen: Boolean,
  type: { type: String, default: 'lesson_plans' },
  data: { type: Object, default: null },
  subjects: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  submitting: Boolean
})
const emit = defineEmits(['close', 'save'])

const isEdit = computed(() => Boolean(props.data))
const showPicker = ref(false)

const typeTitle = computed(() => {
  if (props.type === 'lesson_plans') return 'kế hoạch bài dạy'
  if (props.type === 'slides') return 'slide bài dạy'
  return 'đề mẫu tự luyện'
})

const blank = () => ({
  title: '',
  subjectId: '',
  grade: 10,
  classId: '',
  topic: '',
  description: '',
  fileId: '',
  fileName: '',
  fileUrl: '',
  mimeType: ''
})
const form = ref(blank())

watch(
  () => props.isOpen,
  open => {
    if (open) {
      if (props.data) {
        form.value = { ...blank(), ...props.data }
        isManualLink.value = Boolean(props.data.fileUrl && !props.data.fileUrl.includes('drive.google.com/file/d/' + props.data.fileId))
        sourceMode.value = isManualLink.value ? 'link' : 'upload'
      } else {
        form.value = blank()
        sourceMode.value = 'upload'
        isManualLink.value = false
      }
    }
  }
)

const onLinkInput = () => {
  const extracted = extractDriveFileId(form.value.fileUrl)
  form.value.fileId = extracted
  isManualLink.value = true
}

const onPicked = d => {
  form.value.fileId = d.fileId
  form.value.fileUrl = d.fileUrl
  form.value.fileName = d.fileName
  isManualLink.value = true
  sourceMode.value = 'link'
  if (!form.value.title) form.value.title = d.fileName.replace(/\.[^/.]+$/, '')
}

const submit = () => {
  if (!form.value.subjectId) {
    toast.warning('Vui lòng chọn môn học.')
    return
  }
  if (!form.value.grade) {
    toast.warning('Vui lòng chọn khối.')
    return
  }
  emit('save', { ...form.value })
}

const MAX_SIZE = 100 * 1024 * 1024

const onFileChosen = async e => {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (file.size > MAX_SIZE) {
    toast.warning('Tệp quá lớn (tối đa 100 MB).')
    return
  }
  uploading.value = true
  progress.value = 0
  try {
    const d = await uploadFileToDrive(
      file,
      {
        type: props.type,
        subjectName: props.subjects.find(s => s.id === form.value.subjectId)?.name || '',
        userId: currentUser.value.uid
      },
      p => (progress.value = p)
    )
    form.value.fileId = d.fileId
    form.value.fileUrl = d.fileUrl
    form.value.fileName = d.fileName
    form.value.mimeType = d.mimeType
    isManualLink.value = false
    if (!form.value.title) form.value.title = file.name.replace(/\.[^/.]+$/, '')
    toast.success('Đã tải tệp lên Google Drive thành công.')
  } catch (err) {
    toast.error(err.message || 'Lỗi khi tải tệp lên.')
  } finally {
    uploading.value = false
  }
}
</script>
