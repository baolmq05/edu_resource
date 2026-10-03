import './assets/main.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { refreshCurrentUser } from './services/auth.service'

const app = createApp(App)

app.use(router)

// Đồng bộ role / lớp / trạng thái khóa tài khoản từ Firebase trước khi hiển thị
refreshCurrentUser().finally(() => {
  app.mount('#app')
})
