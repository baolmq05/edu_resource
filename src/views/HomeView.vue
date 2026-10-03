<template>
  <div>
    <section class="bg-white border-bottom py-5">
      <div class="container-xl py-4 text-center">
        <h1 class="display-6 fw-bold mb-3">Học tập và kiểm tra online<br />đơn giản cho mỗi lớp học</h1>
        <p class="text-muted mx-auto mb-4" style="max-width: 560px;">
          Giáo viên tạo đề và giao cho lớp. Học sinh làm bài trực tuyến và xem kết quả ngay sau khi nộp.
        </p>
        <div class="d-flex justify-content-center gap-2">
          <router-link v-if="isAuthenticated" to="/dashboard" class="btn btn-dark px-4">Vào bảng điều khiển</router-link>
          <template v-else>
            <router-link to="/login" class="btn btn-dark px-4">Đăng nhập</router-link>
            <router-link to="/register" class="btn btn-outline-dark px-4">Đăng ký</router-link>
          </template>
        </div>
      </div>
    </section>

    <section class="container-xl py-5">
      <div class="row g-3">
        <div v-for="f in features" :key="f.title" class="col-12 col-md-6 col-lg-3">
          <div class="card h-100 p-4">
            <i :class="[f.icon, 'fs-3 mb-3']"></i>
            <h2 class="h6 fw-bold">{{ f.title }}</h2>
            <p class="small text-muted mb-0">{{ f.text }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { isAuthenticated } from '@/stores/authState'

const features = [
  { icon: 'bi bi-people', title: 'Quản lý lớp học', text: 'Phân công giáo viên và học sinh theo từng lớp, từng năm học.' },
  { icon: 'bi bi-card-checklist', title: 'Ngân hàng đề', text: 'Tạo đề, thêm câu hỏi, giao cho lớp và xuất bản.' },
  { icon: 'bi bi-pencil-square', title: 'Làm bài online', text: 'Đồng hồ đếm ngược, tự động nộp bài và chấm điểm.' },
  { icon: 'bi bi-folder2-open', title: 'Tài liệu bài dạy', text: 'Lưu kế hoạch bài dạy và slide trên Google Drive.' }
]
</script>
