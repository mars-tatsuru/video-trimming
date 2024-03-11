import { createRouter, createWebHistory } from 'vue-router'
import EditView from '../views/EditView.vue'
import UploadView from '../views/UploadView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/edit',
      name: 'edit',
      component: EditView
    },
    {
      path: '/',
      name: 'upload',
      component: UploadView
    }
  ]
})

export default router
