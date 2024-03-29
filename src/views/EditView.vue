<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import Trimming from '@/components/Trimming.vue'
import exportButton from '@/components/ExportButton.vue'
import ExportMp3Button from '@/components/ExportMp3Button.vue'
import { mainStore } from '@/stores/main'
import { useRouter } from 'vue-router'
import { cloneDeep, isEqual } from 'lodash-es'

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

/********************************************
 * confirm Whether it has changed from before
 ********************************************/
function init() {
  // Save the current time data in the store.
  form.value = cloneDeep(0)
  // Save he current time before editing for the purpose of comparing it with the data after editing in the form.
  beforeForm.value = cloneDeep(store.currentTime)
}

function resetForm() {
  form.value = beforeForm.value
}

/****************************************
 * videoOptions
 ****************************************/
const videoOptions = {
  autoplay: false,
  controls: false,
  sources: [
    {
      src: store.videoData ? URL.createObjectURL(store.videoData) : null,
      type: 'video/mp4'
    }
  ],
  loop: false,
  enableSmoothSeeking: true,
  liveui: true
}

/****************************************
 * onMounted
 ****************************************/
onMounted(() => {
  init()

  if (videoOptions.sources[0].src === null) {
    router.push('/')
  }
})

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

watch(
  () => store.currentTime,
  () => {
    init()
  }
)
</script>

<template>
  <div class="main">
    <VideoPlayer :options="videoOptions" />
    <div class="trimmingWrapper">
      <ExportMp3Button />
      <!-- <exportButton /> -->
      <div class="trimming">
        <button class="playButton" type="button" @click="store.startAndStop(store.playFlag)">
          <svg
            v-if="!store.playFlag"
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M5.536 21.886a1.004 1.004 0 0 0 1.033-.064l13-9a1 1 0 0 0 0-1.644l-13-9A1 1 0 0 0 5 3v18a1 1 0 0 0 .536.886"
            />
          </svg>
          <svg
            v-if="store.playFlag"
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
          >
            <path fill="currentColor" d="M14 19V5h4v14zm-8 0V5h4v14z" />
          </svg>
        </button>
        <Trimming :options="videoOptions" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  display: grid;
  grid-template-rows: 1fr 350px;
  width: 100%;
  height: 100%;

  .video-js {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    margin: 0 auto;
  }

  .trimmingWrapper {
    height: 100%;
    padding: 10px;

    .trimming {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 280px;
      margin-top: 10px;

      .playButton {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 100px;
        background-color: #fff;
        border-radius: 50%;
        color: #000;
        border: 1px solid #e7e7e7;
        cursor: pointer;

        svg {
          width: 50px;
          height: 50px;
        }
      }
    }
  }
}
</style>
