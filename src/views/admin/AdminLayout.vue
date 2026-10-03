<template>
  <div class="container-xl py-4">
    <div class="row g-4">
      <aside class="col-12 col-lg-3 col-xl-2">
        <div class="card p-2">
          <nav class="nav flex-lg-column">
            <router-link v-for="item in items" :key="item.to" :to="item.to" class="nav-link rounded d-flex align-items-center gap-2 sidebar-link" exact-active-class="active">
              <i :class="item.icon"></i>{{ item.label }}
            </router-link>
          </nav>
        </div>
      </aside>
      <section class="col-12 col-lg-9 col-xl-10">
        <router-view />
      </section>
    </div>
  </div>
</template>

<script setup>
const items = [
  { to: '/admin', label: 'Tổng quan', icon: 'bi bi-speedometer2' },
  { to: '/admin/users', label: 'Người dùng', icon: 'bi bi-people' },
  { to: '/admin/classes', label: 'Lớp học', icon: 'bi bi-diagram-3' },
  { to: '/admin/subjects', label: 'Môn học', icon: 'bi bi-book' },
  { to: '/exams', label: 'Đề thi', icon: 'bi bi-card-checklist' },
  { to: '/resources', label: 'Tài liệu', icon: 'bi bi-folder2-open' }
]
</script>

<style scoped>
.sidebar-link.active {
  background-color: #111827;
  color: #ffffff !important;
}
</style>
