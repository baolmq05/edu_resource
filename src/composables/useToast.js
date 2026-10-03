import { reactive } from 'vue'

const toasts = reactive([])
let nextId = 1

export function useToast() {
  const showToast = (message, { type = 'info', title = '', duration = 4000 } = {}) => {
    const id = nextId++
    
    // Đặt title mặc định tương ứng với loại thông báo nếu chưa có
    let defaultTitle = 'Thông báo'
    if (type === 'success') defaultTitle = 'Thành công'
    else if (type === 'danger' || type === 'error') {
      type = 'danger'
      defaultTitle = 'Có lỗi xảy ra'
    } else if (type === 'warning') defaultTitle = 'Cảnh báo'
    else if (type === 'info') defaultTitle = 'Thông tin'

    const toast = {
      id,
      type,
      title: title || defaultTitle,
      message,
      duration
    }

    toasts.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }

  const removeToast = (id) => {
    const index = toasts.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.splice(index, 1)
    }
  }

  return {
    toasts,
    showToast,
    removeToast,
    success: (msg, title = 'Thành công') => showToast(msg, { type: 'success', title }),
    error: (msg, title = 'Có lỗi xảy ra') => showToast(msg, { type: 'danger', title }),
    warning: (msg, title = 'Cảnh báo') => showToast(msg, { type: 'warning', title }),
    info: (msg, title = 'Thông tin') => showToast(msg, { type: 'info', title })
  }
}
