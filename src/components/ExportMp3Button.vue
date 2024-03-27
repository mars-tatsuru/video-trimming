<script setup lang="ts">
import { type Ref, ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { mainStore } from '@/stores/main'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { useRouter } from 'vue-router'
import { cloneDeep, isEqual } from 'lodash-es'

/****************************************
 * store
 ****************************************/
const store = mainStore()
const router = useRouter()

/****************************************
 * data
 ****************************************/
const player = ref<any>('')
const videoPlayer: Ref<string | Element> = ref('')

/****************************************
 * props
 ****************************************/
const props = defineProps({
  options: {
    type: Object,
    default: () => ({})
  }
})

/****************************************
 * formatTime
 ****************************************/
function formatTime(seconds: number) {
  // calculate hours, minutes, seconds
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  // format hours, minutes, seconds
  const formattedHours = hours < 10 ? '0' + hours : hours
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes
  const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds

  // return like '00:00:00'
  return formattedHours + ':' + formattedMinutes + ':' + formattedSeconds
}

/****************************************
 * handle exportFile
 ****************************************/
const transformVideoFromApi = async () => {
  store.waitingForFormatVideoFlag = true
  let transformVideoUrl = ''
  let errorFlag = false

  await fetch(`http://localhost:8080/transform?videoName=${store.videoData?.name}`)
    .then((response) => response.json())
    .then((data) => {
      const { result, error } = data
      transformVideoUrl = result.transformVideoPath
      store.videoSummaryText = result.text.text
      console.log(result.text.text)

      if (error) {
        console.error(error)
        errorFlag = true
      }
    })

  if (errorFlag) {
    store.waitingForFormatVideoFlag = false
    console.error('Failed to transform video')
  }

  const downloadLink = document.createElement('a')
  downloadLink.download = 'video.mp3'

  downloadLink.href = `http://localhost:5173/src/backend/${transformVideoUrl}`
  console.log(downloadLink.href)

  downloadLink.setAttribute('hidden', 'true')
  document.body.appendChild(downloadLink)
  downloadLink.click()
  downloadLink.remove()

  store.waitingForFormatVideoFlag = false
  console.log('transformVideoFromApi')

  router.push('/summary')
}
</script>

<template>
  <div class="exportButton">
    <button
      :class="{ waitingDownload: store.waitingForFormatVideoFlag }"
      @click="transformVideoFromApi"
    >
      <span class="download" v-if="!store.waitingForFormatVideoFlag">
        <svg
          class="downloadIcon"
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="m12 16l-5-5l1.4-1.45l2.6 2.6V4h2v8.15l2.6-2.6L17 11zm-6 4q-.825 0-1.412-.587T4 18v-3h2v3h12v-3h2v3q0 .825-.587 1.413T18 20z"
          />
        </svg>
        音声
      </span>
      <span class="waitingDownload" v-if="store.waitingForFormatVideoFlag">
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
        ダウンロード中...
      </span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.exportButton {
  display: flex;
  justify-content: flex-end;

  button {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    background-color: #4ee467;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &.waitingDownload {
      background-color: #f5f5f5;
      color: #000;
      cursor: not-allowed;
      border: 1px solid #000;
    }

    span {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: bold;
      line-height: 1;

      svg {
        width: 20px;
        height: 20px;
        margin-right: 5px;
      }
    }
  }
}
</style>
