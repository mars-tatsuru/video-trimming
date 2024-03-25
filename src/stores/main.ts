import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const mainStore = defineStore('counter', () => {
  const videoData = ref<File | undefined>()
  const trimStart = ref<number>(0)
  const trimEnd = ref<number>(0)
  const currentTime = ref<number>(0)
  const videoDuration = ref<number>(0)
  const playFlag = ref<boolean>(false)
  const waitingForFormatVideoFlag = ref<boolean>(false)

  const startAndStop = (flag: boolean) => {
    if (!flag) {
      playFlag.value = true
    } else {
      playFlag.value = false
    }
  }

  return {
    videoData,
    trimStart,
    trimEnd,
    currentTime,
    videoDuration,
    playFlag,
    waitingForFormatVideoFlag,
    startAndStop
  }
})
