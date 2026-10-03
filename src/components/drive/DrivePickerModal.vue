<template>
  <div
    v-if="isOpen"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5); z-index: 1080;"
    @click.self="close"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title d-flex align-items-center gap-2">
            <i class="bi bi-google text-dark"></i>
            <span>Liên kết tệp từ Google Drive</span>
          </h5>
          <button type="button" class="btn-close" aria-label="Đóng" @click="close"></button>
        </div>

        <div class="modal-body">
          <!-- Hướng dẫn nhanh -->
          <div class="alert alert-light border small text-muted mb-3">
            <i class="bi bi-info-circle me-1"></i>
            Bạn chỉ cần dán đường dẫn chia sẻ (Share link) từ Google Drive hoặc Google Docs / Slides. Hệ thống sẽ tự động trích xuất mã tệp.
          </div>

          <!-- Input liên kết Google Drive -->
          <div class="mb-3">
            <label class="form-label fw-semibold small">Đường link hoặc File ID Google Drive <span class="text-danger">*</span></label>
            <div class="input-group">
              <span class="input-group-text bg-light text-muted">
                <i class="bi bi-link-45deg"></i>
              </span>
              <input
                v-model="inputUrl"
                type="text"
                class="form-control"
                placeholder="https://drive.google.com/file/d/1BxiMVs.../view?usp=sharing"
                @input="handleInput"
              />
            </div>
            <div class="form-text small">
              Ví dụ: https://docs.google.com/presentation/d/1aBc.../edit hoặc mã ID: 1BxiMVs0...
            </div>
          </div>

          <!-- Kết quả phân tích -->
          <div v-if="parsedId" class="card bg-light border p-3 mb-3">
            <div class="d-flex align-items-start gap-2">
              <i class="bi bi-check-circle-fill text-success mt-1"></i>
              <div class="flex-grow-1 small">
                <div class="fw-semibold text-dark">Đã nhận diện File ID hợp lệ:</div>
                <div class="font-monospace text-break text-secondary">{{ parsedId }}</div>
                <div class="mt-2 text-muted">
                  Trạng thái: Sẵn sàng nhúng xem trước & hỗ trợ tải trực tiếp.
                </div>
              </div>
            </div>
          </div>

          <!-- Tên tệp hiển thị -->
          <div class="mb-3">
            <label class="form-label fw-semibold small">Tên tệp hiển thị (tùy chọn)</label>
            <input
              v-model="fileName"
              type="text"
              class="form-control"
              placeholder="VD: KHBD_MonToan_Lop12.docx hoặc Slide_VatLy_Bai01.pptx"
            />
          </div>

          <!-- Nút mở Google Picker API nếu có -->
          <div class="text-center pt-2 border-top">
            <button
              type="button"
              class="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-2"
              @click="triggerPicker"
            >
              <i class="bi bi-cloud-arrow-up"></i>
              <span>Chọn trực tiếp từ tài khoản Google Drive</span>
            </button>
          </div>
        </div>

        <div class="modal-footer bg-light">
          <button type="button" class="btn btn-outline-secondary" @click="close">Hủy</button>
          <button
            type="button"
            class="btn btn-dark"
            :disabled="!parsedId"
            @click="confirmSelection"
          >
            <i class="bi bi-check2 me-1"></i>
            Xác nhận tệp
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { extractDriveFileId, openGoogleDrivePicker } from '@/services/googleDrive.service'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialUrl: {
    type: String,
    default: ''
  },
  initialName: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'select'])

const toast = useToast()
const inputUrl = ref('')
const fileName = ref('')
const parsedId = ref('')

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    inputUrl.value = props.initialUrl || ''
    fileName.value = props.initialName || ''
    parsedId.value = extractDriveFileId(props.initialUrl)
  }
})

const handleInput = () => {
  parsedId.value = extractDriveFileId(inputUrl.value)
}

const triggerPicker = () => {
  openGoogleDrivePicker({
    onSelect: (doc) => {
      parsedId.value = doc.fileId
      inputUrl.value = doc.fileUrl || `https://drive.google.com/file/d/${doc.fileId}/view`
      fileName.value = doc.fileName
      toast.success(`Đã chọn tệp: ${doc.fileName}`)
    },
    onError: (msg) => {
      toast.warning(msg)
    }
  })
}

const confirmSelection = () => {
  if (!parsedId.value) return
  emit('select', {
    fileId: parsedId.value,
    fileUrl: inputUrl.value || `https://drive.google.com/file/d/${parsedId.value}/view`,
    fileName: fileName.value || `Drive_File_${parsedId.value.substring(0, 8)}`
  })
  close()
}

const close = () => {
  emit('close')
}
</script>
