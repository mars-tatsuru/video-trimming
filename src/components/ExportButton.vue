<script setup lang="ts">
import { type Ref, ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { mainStore } from '@/stores/main'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

/****************************************
 * store
 ****************************************/
const store = mainStore()

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
 * exportFile logic
 ****************************************/
async function trimVideo(inputFile: string, startTime: string, duration: string) {
  const ffmpeg = new FFmpeg()
  const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm'

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
  })

  console.log('ffmpeg loaded')

  // Write the file to use in FFmpeg
  await ffmpeg.writeFile('input.mp4', await fetchFile(inputFile))

  console.log('input.mp4 written')

  // Run FFmpeg command to trim the video
  // too long to wait
  await ffmpeg.exec(['-i', 'input.mp4', '-ss', startTime, '-t', duration, 'output.mp4'])

  console.log('output.mp4 written')

  // Read the result
  const data = await ffmpeg.readFile('output.mp4')

  console.log('output.mp4 read')

  // Create a URL for the output file to be used in the browser
  const url = URL.createObjectURL(new Blob([(data as Uint8Array).buffer], { type: 'video/mp4' }))

  console.log('URL created')

  return url
}

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
const handleVideoExport = () => {
  store.waitingForFormatVideoFlag = true

  trimVideo(
    '/src/assets/sample.mp4',
    formatTime(Math.floor(store.currentTime)),
    `${store.videoDuration}`
  ).then((trimmedVideoUrl) => {
    const downloadLink = document.createElement('a')
    downloadLink.download = 'video.mp4'

    downloadLink.href = trimmedVideoUrl

    downloadLink.setAttribute('hidden', 'true')
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()

    store.waitingForFormatVideoFlag = false
  })
}
</script>

<template>
  <div class="exportButton">
    <button
      :class="{ waitingDownload: store.waitingForFormatVideoFlag }"
      @click="handleVideoExport"
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
        ダウンロードする
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
