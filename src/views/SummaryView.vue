<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import Trimming from '@/components/Trimming.vue'
import exportButton from '@/components/ExportButton.vue'
import ExportMp3Button from '@/components/ExportMp3Button.vue'
import { mainStore } from '@/stores/main'
import { useRouter } from 'vue-router'
import { cloneDeep, isEqual } from 'lodash-es'
import { on } from 'events'

/****************************************
 * store and router
 ****************************************/
const store = mainStore()
const router = useRouter()

/****************************************
 * data
 ****************************************/
const beforeForm = ref<any>({})
const form = ref<any>({}) // SettingSchema is a type definition
const isEditing = computed(() => {
  return !isEqual(beforeForm.value, form.value)
})
const summaryText = ref<string>('')
/****************************************
 * beforeEach
 ****************************************/
// Display an alert if the edited data has not been saved before navigating to another page.
// router.beforeEach((to, from, next) => {
//   if (isEditing.value) {
//     const answer = window.confirm('編集中のデータが全て破棄されますが、よろしいですか？')
//     if (answer) {
//       resetForm()
//       next()
//     } else {
//       next(false)
//     }
//   } else {
//     next()
//   }
// })

function init() {
  // Save the current time data in the store.
  form.value = cloneDeep(0)
  // Save he current time before editing for the purpose of comparing it with the data after editing in the form.
  beforeForm.value = cloneDeep(store.videoSummaryText)
}

const resetForm = () => {
  form.value = beforeForm.value
}

// watch(
//   () => store.videoSummaryText,
//   () => {
//     summaryText.value = store.videoSummaryText
//   }
// )

onMounted(() => {
  init()
})
</script>

<template>
  <div class="main">
    <div class="summaryInput">
      <p>動画全体文字起こし</p>
      <textarea v-if="store.videoSummaryText" v-model="store.videoSummaryText" />
      <p v-else>fetch error</p>
    </div>
    <!-- <div v-if="!store.videoSummaryText" class="loading">
      <span class="loadingSvg">
        <svg
          class="waitingDownloadIcon"
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="3.5" r="1.5" fill="currentColor" opacity="0">
            <animateTransform
              attributeName="transform"
              calcMode="discrete"
              dur="2.4s"
              repeatCount="indefinite"
              type="rotate"
              values="0 12 12;90 12 12;180 12 12;270 12 12"
            />
            <animate
              attributeName="opacity"
              dur="0.6s"
              keyTimes="0;0.5;1"
              repeatCount="indefinite"
              values="1;1;0"
            />
          </circle>
          <circle cx="12" cy="3.5" r="1.5" fill="currentColor" opacity="0">
            <animateTransform
              attributeName="transform"
              begin="0.2s"
              calcMode="discrete"
              dur="2.4s"
              repeatCount="indefinite"
              type="rotate"
              values="30 12 12;120 12 12;210 12 12;300 12 12"
            />
            <animate
              attributeName="opacity"
              begin="0.2s"
              dur="0.6s"
              keyTimes="0;0.5;1"
              repeatCount="indefinite"
              values="1;1;0"
            />
          </circle>
          <circle cx="12" cy="3.5" r="1.5" fill="currentColor" opacity="0">
            <animateTransform
              attributeName="transform"
              begin="0.4s"
              calcMode="discrete"
              dur="2.4s"
              repeatCount="indefinite"
              type="rotate"
              values="60 12 12;150 12 12;240 12 12;330 12 12"
            />
            <animate
              attributeName="opacity"
              begin="0.4s"
              dur="0.6s"
              keyTimes="0;0.5;1"
              repeatCount="indefinite"
              values="1;1;0"
            />
          </circle>
        </svg>
        要約文生成中
      </span>
    </div> -->
  </div>
</template>

<style scoped lang="scss">
.main {
  width: 100%;
  height: 100%;

  .summaryInput {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    p {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    textarea {
      width: 80%;
      height: 60vh;
      padding: 20px;
      font-size: 16px;
      border: 1px solid #ccc;
      border-radius: 5px;
    }
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;

    .loadingSvg {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      color: #666;
      font-weight: bold;

      svg {
        width: 100px;
        height: 100px;
      }
    }
  }
}
</style>
