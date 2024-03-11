<script setup lang="ts">
import { type Ref, ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { mainStore } from '@/stores/main'

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
const exportVideo = () => {
  const downloadLink = document.createElement('a')
  downloadLink.download = 'video.mp4'

  // cut currentTime and EndTime
  const videoDuration = store.videoDuration
  const videoDataSize = Math.floor(store.videoData?.size as number)
  const currentTime = store.currentTime

  const TrimSize = Math.floor((videoDataSize! * (videoDuration - currentTime)) / videoDuration)
  const videoBlob = store.videoData as Blob

  // videoBlobをTrimSizeに切り取る
  const trimmedBlob = new Blob([videoBlob.slice(TrimSize, videoDataSize)], {
    type: 'video/mp4'
  })

  const originalVideoBlob = new Blob([videoBlob], {
    type: 'video/mp4'
  })

  downloadLink.href = URL.createObjectURL(originalVideoBlob)

  downloadLink.setAttribute('hidden', 'true')
  document.body.appendChild(downloadLink)
  downloadLink.click()
  downloadLink.remove()
}
</script>

<template>
  <div class="exportButton">
    <button @click="exportVideo">ダウンロードする</button>
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
