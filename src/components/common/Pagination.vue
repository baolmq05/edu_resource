<template>
  <div v-if="totalPages > 1" class="d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 mt-4">
    <div class="small text-muted">
      Hiển thị <strong>{{ startIndex + 1 }}</strong> - <strong>{{ endIndex }}</strong> trong số <strong>{{ totalItems }}</strong> mục
    </div>
    
    <nav aria-label="Phân trang dữ liệu">
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <button
            class="page-link"
            aria-label="Trang trước"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
        </li>

        <li
          v-for="page in visiblePages"
          :key="page"
          class="page-item"
          :class="{ active: currentPage === page, disabled: page === '...' }"
        >
          <button
            v-if="page !== '...'"
            class="page-link"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <span v-else class="page-link">...</span>
        </li>

        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <button
            class="page-link"
            aria-label="Trang sau"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:currentPage', 'page-change'])

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize) || 1)
const startIndex = computed(() => (props.currentPage - 1) * props.pageSize)
const endIndex = computed(() => Math.min(startIndex.value + props.pageSize, props.totalItems))

const visiblePages = computed(() => {
  const current = props.currentPage
  const total = totalPages.value
  const delta = 2
  const pages = []

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return pages
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== props.currentPage) {
    emit('update:currentPage', page)
    emit('page-change', page)
  }
}
</script>
