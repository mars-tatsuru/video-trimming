<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import VideoPlayer from '@/components/VideoPlayer.vue'
import Trimming from '@/components/Trimming.vue'
import { mainStore } from '@/stores/main'
import { useRouter } from 'vue-router'

/****************************************
 * store and router
 ****************************************/
const store = mainStore()
const router = useRouter()

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
  if (videoOptions.sources[0].src === null) {
    router.push('/')
  }
})
</script>

<template>
  <div class="main">
    <VideoPlayer :options="videoOptions" />
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
</template>

<style scoped lang="scss">
.main {
  display: grid;
  grid-template-rows: 1fr 300px;
  width: 100%;
  height: 100%;

  .video-js {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    margin: 0 auto;
  }

  .trimming {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;

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
</style>
