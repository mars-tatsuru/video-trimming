import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const mainStore = defineStore('counter', () => {
  const currentTime = ref<number>(0)
  const videoDuration = ref<number>(0)
  const playFlag = ref<boolean>(false)

  const startAndStop = (flag: boolean) => {
    if (!flag) {
      playFlag.value = true
    } else {
      playFlag.value = false
    }
  }
  return { currentTime, videoDuration, playFlag, startAndStop }
})
