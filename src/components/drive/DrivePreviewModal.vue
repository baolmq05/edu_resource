<template>
  <div
    v-if="isOpen"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.6); z-index: 1080;"
    @click.self="close"
  >
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" style="height: 90vh;">
      <div class="modal-content h-100">
        <!-- Header -->
        <div class="modal-header py-2 px-3 bg-light border-bottom d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2 text-truncate me-3">
            <span class="badge bg-dark">
              <i :class="fileTypeIcon" class="me-1"></i>
              {{ fileTypeLabel }}
            </span>
            <span class="fw-semibold text-truncate text-dark" style="max-width: 500px;">
              {{ title || 'Xem trước tệp Google Drive' }}
            </span>
          </div>

          <div class="d-flex align-items-center gap-2">
            <!-- Nút mở trên Google Drive -->
            <a
              v-if="viewUrl"
              :href="viewUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-sm btn-outline-dark d-flex align-items-center gap-1"
              title="Mở trong tab mới"
            >
              <i class="bi bi-box-arrow-up-right"></i>
              <span class="d-none d-sm-inline">Mở Google Drive</span>
            </a>

            <!-- Nút tải về -->
            <a
              v-if="downloadUrl"
              :href="downloadUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-sm btn-dark d-flex align-items-center gap-1"
              title="Tải về máy"
            >
              <i class="bi bi-download"></i>
              <span class="d-none d-sm-inline">Tải về</span>
            </a>

            <button
              type="button"
              class="btn-close ms-2"
              aria-label="Đóng"
              @click="close"
            ></button>
          </div>
        </div>

        <!-- Body / Iframe Viewer -->
        <div class="modal-body p-0 position-relative h-100 bg-secondary-subtle">
          <div v-if="iframeLoading" class="position-absolute top-50 start-50 translate-middle text-center">
            <div class="spinner-border text-dark" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
            <div class="text-muted small mt-2">Đang kết nối đến máy chủ Google Drive...</div>
          </div>

          <iframe
            v-if="previewUrl"
            :src="previewUrl"
            class="w-100 h-100 border-0"
            allow="autoplay"
            @load="iframeLoading = false"
          ></iframe>

          <div v-else class="d-flex flex-column align-items-center justify-content-center h-100 p-4 text-center">
            <i class="bi bi-file-earmark-x text-muted display-4 mb-3"></i>
            <h6 class="fw-bold">Không tìm thấy mã tệp Google Drive hợp lệ</h6>
            <p class="text-muted small">Vui lòng kiểm tra lại liên kết hoặc quyền chia sẻ của tệp trên Google Drive.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getDrivePreviewUrl, getDriveViewUrl, getDriveDirectDownloadUrl } from '@/services/googleDrive.service'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  fileId: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    default: 'general' // 'slide', 'document', 'general'
  }
})

const emit = defineEmits(['close'])

const iframeLoading = ref(true)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    iframeLoading.value = true
  }
})

const previewUrl = computed(() => {
  if (!props.fileId) return ''
  return getDrivePreviewUrl(props.fileId, props.fileType)
})

const viewUrl = computed(() => {
  if (!props.fileId) return ''
  return getDriveViewUrl(props.fileId)
})

const downloadUrl = computed(() => {
  if (!props.fileId) return ''
  return getDriveDirectDownloadUrl(props.fileId)
})

const fileTypeLabel = computed(() => {
  if (props.fileType === 'slide' || props.fileType === 'presentation') return 'Slide Bài giảng'
  if (props.fileType === 'document' || props.fileType === 'doc') return 'Kế hoạch bài dạy'
  return 'Tài liệu Drive'
})

const fileTypeIcon = computed(() => {
  if (props.fileType === 'slide' || props.fileType === 'presentation') return 'bi bi-file-earmark-slides'
  if (props.fileType === 'document' || props.fileType === 'doc') return 'bi bi-file-earmark-text'
  return 'bi bi-google-drive'
})

const close = () => {
  emit('close')
}
</script>
