<template>
  <div
    v-if="isOpen"
    class="modal fade show d-block"
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5);"
    @click.self="$emit('close')"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <form @submit.prevent="submit">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng' }}</h5>
            <button type="button" class="btn-close" aria-label="Đóng" @click="$emit('close')"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="uf-name" class="form-label small fw-semibold">Họ và tên</label>
              <input id="uf-name" v-model="form.displayName" class="form-control" required />
            </div>
            <div class="mb-3">
              <label for="uf-email" class="form-label small fw-semibold">Email</label>
              <input id="uf-email" v-model="form.email" type="email" class="form-control" :disabled="isEdit" required />
            </div>
            <div class="row g-3 mb-3">
              <div class="col-6">
                <label for="uf-role" class="form-label small fw-semibold">Vai trò</label>
                <select id="uf-role" v-model="form.role" class="form-select">
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div class="col-6">
                <label for="uf-status" class="form-label small fw-semibold">Trạng thái</label>
                <select id="uf-status" v-model="form.status" class="form-select">
                  <option value="active">Hoạt động</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="inactive">Bị khóa</option>
                </select>
              </div>
            </div>
            <div v-if="form.role === 'student'" class="mb-3">
              <label for="uf-class" class="form-label small fw-semibold">Lớp</label>
              <select id="uf-class" v-model="form.classId" class="form-select">
                <option value="">Chưa xếp lớp</option>
                <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }} ({{ c.schoolYear }})</option>
              </select>
            </div>
            <div class="mb-3">
              <label for="uf-phone" class="form-label small fw-semibold">Số điện thoại</label>
              <input id="uf-phone" v-model="form.phone" class="form-control" />
            </div>
            <div class="mb-0">
              <label for="uf-pass" class="form-label small fw-semibold">
                {{ isEdit ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu' }}
              </label>
              <input id="uf-pass" v-model="form.password" type="password" class="form-control" :required="!isEdit" minlength="6" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" @click="$emit('close')">Hủy</button>
            <button type="submit" class="btn btn-dark" :disabled="submitting">
              <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  user: { type: Object, default: null },
  classes: { type: Array, default: () => [] },
  submitting: Boolean
})
const emit = defineEmits(['close', 'save'])

const isEdit = computed(() => Boolean(props.user))
const blank = () => ({ displayName: '', email: '', role: 'student', status: 'active', classId: '', phone: '', password: '' })
const form = ref(blank())

watch(() => props.isOpen, open => {
  if (open) form.value = props.user ? { ...blank(), ...props.user, password: '' } : blank()
})

const submit = () => emit('save', { ...form.value })
</script>
