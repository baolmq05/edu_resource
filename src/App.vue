<template>
  <div class="d-flex flex-column min-vh-100 bg-light">
    <!-- Main Top Navbar -->
    <AppNavbar />

    <!-- Main Content Routed Views -->
    <main class="flex-grow-1">
      <router-view />
    </main>

    <!-- Footer -->
    <AppFooter />

    <!-- System-wide Toast Container -->
    <AppToast />
  </div>
</template>

<script setup>
import AppNavbar from '@/components/common/AppNavbar.vue'
import AppFooter from '@/components/common/AppFooter.vue'
import AppToast from '@/components/common/AppToast.vue'
</script>
