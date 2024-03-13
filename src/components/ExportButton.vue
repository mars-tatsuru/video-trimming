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
 * exportFile
 ****************************************/
async function trimVideo(inputFile: any, startTime: string, duration: string) {
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

const handleVideoExport = () => {
  trimVideo('/src/assets/sample.mp4', '00:00:10', '10').then((trimmedVideoUrl) => {
    const downloadLink = document.createElement('a')
    downloadLink.download = 'video.mp4'

    downloadLink.href = trimmedVideoUrl

    downloadLink.setAttribute('hidden', 'true')
    document.body.appendChild(downloadLink)
    downloadLink.click()
    downloadLink.remove()
  })
}
</script>

<template>
  <div class="exportButton">
    <button @click="handleVideoExport">ダウンロードする</button>
  </div>
</template>

<style scoped lang="scss">
.exportButton {
  display: flex;
  justify-content: flex-end;

  button {
    padding: 10px 20px;
    background-color: #f00;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
}
</style>
