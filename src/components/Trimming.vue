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

const canvasHeight = computed(() => {
  // get canvas height
  const videoPlayerElement = sliderCanvas.value as HTMLCanvasElement
  return videoPlayerElement.clientHeight
})

/****************************************
 * handlers
 ****************************************/
let isDragging = ref<boolean>(false)
let isDraggingLeft = ref<boolean>(false)
let isDraggingRight = ref<boolean>(false)

const trimmingSliderWrapper = ref<HTMLDivElement | null>(null)
const trimmingSlider = ref<HTMLDivElement | null>(null)
const leftArrowWrapper = ref<HTMLDivElement | null>(null)
const rightArrowWrapper = ref<HTMLDivElement | null>(null)
const progressBar = ref<HTMLDivElement | null>(null)

const cursorType = ref<string>('pointer')
const trimmingSliderBackgroundColor = ref<string>('#cccccc')
const progressBarPosition = ref<number>(22)
const trimmingSliderWidth = ref<number>(0)

const handleMouseMove = (e: MouseEvent) => {
  if (isDraggingRight.value) {
    trimmingSliderWidthCalcForRightTrim(e)
  }
  if (isDraggingLeft.value) {
    trimmingSliderWidthCalcForLeftTrim(e)
  }
}

const handleMouseLeave = (e: MouseEvent) => {
  isDraggingRight.value = false
  isDraggingLeft.value = false
  trimmingSliderBackgroundColor.value = '#cccccc'
  cursorType.value = 'pointer'
}

const progressBarPositionCalc = (e: MouseEvent) => {
  progressBarPosition.value = e.clientX - progressBar.value!.offsetWidth / 2 - 112
}

// for trimming slider width
const trimmingSliderWidthCalcForRightTrim = (e: MouseEvent) => {
  if (
    e.clientX <= trimmingSliderWrapper.value!.offsetWidth + 105 &&
    trimmingSlider.value!.style.left === '0px'
  ) {
    trimmingSliderWidth.value = e.clientX - 105
  } else if (e.clientX <= trimmingSliderWrapper.value!.offsetWidth + 105) {
    trimmingSliderWidth.value = e.clientX - trimmingSlider.value!.offsetLeft - 105
  } else {
    trimmingSliderWidth.value = trimmingSliderWidth.value
  }
}

const trimmingSliderWidthCalcForLeftTrim = (e: MouseEvent) => {
  // when left trim slider, slider left position should be changed and width should be changed
  if (e.clientX > 120) {
    trimmingSliderWidth.value =
      trimmingSliderWidth.value + (trimmingSlider.value!.offsetLeft - e.clientX + 120)
    trimmingSlider.value!.style.left = `${e.clientX - 120}px`
  } else if (0 < e.clientX) {
    trimmingSliderWidth.value = trimmingSliderWidth.value
  }
}

// right trim slider
const handleMouseHoverForTrimmingSliderRight = (e: MouseEvent) => {
  if (!isDraggingRight.value) {
    cursorType.value = 'grab'
  }
}

const handleMouseDownForTrimmingSliderRight = (e: MouseEvent) => {
  isDraggingRight.value = true
  trimmingSliderBackgroundColor.value = '#ffc800'
  cursorType.value = 'grabbing'
}

const handleMouseUpForTrimmingSliderRight = (e: MouseEvent) => {
  isDraggingRight.value = false
  trimmingSliderBackgroundColor.value = '#cccccc'
  cursorType.value = 'grab'
  store.trimEnd =
    store.videoDuration * (trimmingSliderWidth.value / trimmingSliderWrapper.value!.offsetWidth)
}

const handleMouseLeaveForTrimmingSliderRight = (e: MouseEvent) => {
  // cursorType.value = 'grab'
}

// for left trim slider
const handleMouseHoverForTrimmingSliderLeft = (e: MouseEvent) => {
  if (!isDraggingLeft.value) {
    cursorType.value = 'grab'
  }
}

const handleMouseDownForTrimmingSliderLeft = (e: MouseEvent) => {
  isDraggingLeft.value = true
  trimmingSliderBackgroundColor.value = '#ffc800'
  cursorType.value = 'grabbing'
}

const handleMouseUpForTrimmingSliderLeft = (e: MouseEvent) => {
  isDraggingLeft.value = false
  trimmingSliderBackgroundColor.value = '#cccccc'
  cursorType.value = 'grab'
  store.trimStart =
    store.videoDuration * (trimmingSlider.value!.offsetLeft / trimmingSliderWidth.value)
}

const handleMouseLeaveForTrimmingSliderLeft = (e: MouseEvent) => {
  // cursorType.value = 'grab'
}

/****************************************
 * DOM setting
 ****************************************/
// TODO: create thumbnails

/****************************************
 * onMounted
 ****************************************/
onMounted(() => {
  trimmingSliderWidth.value = trimmingSliderWrapper.value!.offsetWidth
})

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
    class="trimmingSliderWrapper"
    ref="trimmingSliderWrapper"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <!-- ↓trim slider↓ -->
    <div
      class="trimmingSlider"
      ref="trimmingSlider"
      :style="{
        width: `${trimmingSliderWidth}px`,
        cursor: cursorType
      }"
      :class="{ trimActive: isDraggingLeft || isDraggingRight }"
    >
      <div
        class="leftArrowWrapper"
        ref="leftArrowWrapper"
        :style="{ backgroundColor: trimmingSliderBackgroundColor }"
        @mouseover="handleMouseHoverForTrimmingSliderLeft"
        @mousedown="handleMouseDownForTrimmingSliderLeft"
        @mouseup="handleMouseUpForTrimmingSliderLeft"
        @mouseleave="handleMouseLeaveForTrimmingSliderLeft"
      >
        <div class="leftArrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path fill="currentColor" d="m14 17l-5-5l5-5z" />
          </svg>
        </div>
      </div>
      <div
        class="rightArrowWrapper"
        ref="rightArrowWrapper"
        :style="{
          backgroundColor: trimmingSliderBackgroundColor
        }"
        @mouseover="handleMouseHoverForTrimmingSliderRight"
        @mousedown="handleMouseDownForTrimmingSliderRight"
        @mouseup="handleMouseUpForTrimmingSliderRight"
        @mouseleave="handleMouseLeaveForTrimmingSliderRight"
      >
        <div class="rightArrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
            <path fill="currentColor" d="M10 17V7l5 5z" />
          </svg>
        </div>
      </div>
    </div>
    <canvas ref="sliderCanvas" style="user-select: none" />
    <!-- ↑trim slider↑ -->

    <!-- <div
      class="progressBar"
      :style="{ left: `${progressBarPosition}px`, cursor: cursorType }"
      ref="progressBar"
    ></div> -->
  </div>
</template>

<style scoped lang="scss">
.trimmingSliderWrapper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: #cccccc;
  padding: 10px 0;

  canvas {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: calc(100% - 44px);
    height: calc(100% - 20px);
    filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
    background: black;
  }
}

.trimmingSlider {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  padding: 0px 22px;
  border-radius: 10px;
  background-color: transparent;
  border-top: 10px solid #cccccc;
  border-bottom: 10px solid #cccccc;

  &.trimActive {
    border-top: 10px solid #ffc800;
    border-bottom: 10px solid #ffc800;
  }

  .rightArrowWrapper {
    position: absolute;
    top: 0;
    right: 0;
    width: 22px;
    height: 100%;
    background-color: #cccccc;
    // border-radius: 0 10px 10px 0;
    .rightArrow {
      position: absolute;
      top: 50%;
      right: -3px;
      transform: translateY(-50%);
      width: 30px;
      height: 30px;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        width: 100%;
        height: 100%;
      }
    }
  }

  .leftArrowWrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 22px;
    height: 100%;
    background-color: #c3c3c3;
    // border-radius: 10px 0 0 10px;
    .leftArrow {
      position: absolute;
      top: 50%;
      left: -3px;
      transform: translateY(-50%);
      width: 30px;
      height: 30px;
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        width: 100%;
        height: 100%;
      }
    }
  }
}

.progressBar {
  position: absolute;
  bottom: 0;
  background: #fff;
  width: 5px;
  height: 100%;
}
</style>
