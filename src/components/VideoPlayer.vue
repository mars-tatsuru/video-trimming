<script setup lang="ts">
import { type Ref, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
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
 * onMounted
 ****************************************/
onMounted(() => {
  player.value = videojs(videoPlayer.value, props.options)

  player.value.on('timeupdate', () => {
    store.currentTime = player.value.currentTime()

    if (player.value.ended()) {
      store.playFlag = false
    }
  })

  // get video duration
  player.value.on('loadedmetadata', () => {
    store.videoDuration = player.value.duration()
  })
})

onBeforeUnmount(() => {
  if (player.value) {
    player.value.dispose()
  }
})

watch(
  () => store.playFlag,
  (newVal) => {
    if (player.value) {
      if (newVal) {
        player.value.currentTime(store.currentTime)
        player.value.play()
      } else {
        player.value.pause()
      }
    }
  }
)
</script>

<template>
  <video id="video-player" ref="videoPlayer" class="video-js"></video>
</template>

<style scoped lang="scss">
.video-js {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  margin: 0 auto;
}
</style>
