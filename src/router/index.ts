import { createRouter, createWebHistory } from 'vue-router'
import EditView from '../views/EditView.vue'
import UploadView from '../views/UploadView.vue'
import SummaryView from '../views/SummaryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'upload',
      component: UploadView
    },
    {
      path: '/edit',
      name: 'edit',
      component: EditView
    },
    {
      path: '/summary',
      name: 'summary',
      component: SummaryView
    }
  ]
})

export default router
