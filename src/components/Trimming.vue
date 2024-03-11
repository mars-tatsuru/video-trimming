<script setup lang="ts">
import { type Ref, ref, onMounted, computed, onBeforeUnmount, watch } from 'vue'
import 'video.js/dist/video-js.css'
import { mainStore } from '@/stores/main'

/****************************************
 * store
 ****************************************/
const store = mainStore()

/****************************************
 * dom
 ****************************************/
const sliderCanvas = ref<HTMLCanvasElement | CanvasRenderingContext2D | null>(null)

/****************************************
 * data
 ****************************************/
const progressBarPosition = ref<number>(0)

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
 * computed
 ****************************************/
const canvasWidth = computed(() => {
  // get canvas width
  const videoPlayerElement = sliderCanvas.value as HTMLCanvasElement
  return videoPlayerElement.clientWidth
})

/****************************************
 * emit
 ****************************************/
const emit = defineEmits(['trim-start', 'trim-end'])

/****************************************
 * handlers
 ****************************************/
let isDragging = ref<boolean>(false)
const trimmingSlider = ref<HTMLDivElement | null>(null)
const progressBar = ref<HTMLDivElement | null>(null)
const cursorType = ref<string>('pointer')

const handleMouseDown = (e: MouseEvent) => {
  progressBarPosition.value = e.clientX - progressBar.value!.offsetWidth / 2 - 110
  cursorType.value = 'grabbing'
  isDragging.value = true
}

const handleMouseUp = (e: MouseEvent) => {
  cursorType.value = 'pointer'
  isDragging.value = false

  store.currentTime =
    store.videoDuration * (progressBarPosition.value / trimmingSlider.value!.clientWidth)
}

const handleMouseDbClick = (e: MouseEvent) => {
  if (!store.playFlag) {
    progressBarPosition.value = e.clientX - progressBar.value!.offsetWidth / 2 - 110
    store.currentTime =
      store.videoDuration * (progressBarPosition.value / trimmingSlider.value!.clientWidth)
  }
}

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    if (e.clientX - progressBar.value!.offsetWidth / 2 - 110 < 0) {
      progressBarPosition.value = 0
      return
    }
    progressBarPosition.value = e.clientX - progressBar.value!.offsetWidth / 2 - 110
  }
}

const handleMouseLeave = () => {
  isDragging.value = false
}

const handleMouseClick = (e: MouseEvent) => {
  isDragging.value = !isDragging.value
}

const handleMouseOver = () => {
  // cursorType.value = 'grab'
}

/****************************************
 * DOM setting
 ****************************************/
// TODO: create thumbnails
const thumbnails = ref<string[]>([])

/****************************************
 * onMounted
 ****************************************/
onMounted(() => {})

/****************************************
 * watch
 ****************************************/
watch(
  () => store.currentTime,
  (newVal) => {
    progressBarPosition.value = canvasWidth.value * (newVal / store.videoDuration)

    if (newVal === store.videoDuration) {
      progressBarPosition.value = 0
    }
  }
)
</script>

<template>
  <div
    class="trimmingSlider"
    @dblclick="handleMouseDbClick"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    ref="trimmingSlider"
    :style="{ cursor: cursorType }"
  >
    <canvas ref="sliderCanvas" style="user-select: none" />
    <div
      class="progressBar"
      @mousedown="handleMouseDown"
      @mouseover="handleMouseOver"
      @mouseup="handleMouseUp"
      :style="{ left: `${progressBarPosition}px`, cursor: cursorType }"
      ref="progressBar"
    ></div>
  </div>
</template>

<style scoped lang="scss">
.trimmingSlider {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

canvas {
  width: 100%;
  height: 100%;
  border: 5px solid #ffc800;
  border-radius: 8px;
  padding: 10px;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  background: black;
  margin-bottom: 4px;
}

.second-indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  &--bold {
    background: #6e7787;
  }
  &--light {
    background: #afbbca;
  }
}

.progressBar {
  position: absolute;
  bottom: 0;
  background: #6e7787;
  width: 5px;
  height: 100%;

  &:hover {
    background: #ffc800;
  }

  &:active {
    background: #ffc800;
  }
}
</style>
