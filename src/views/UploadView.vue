<script setup lang="ts">
import { ref } from 'vue'
import { mainStore } from '@/stores/main'
import { useRouter } from 'vue-router'

/****************************************
 * store and router
 ****************************************/
const store = mainStore()
const router = useRouter()

/****************************************
 * reactive variables
 ****************************************/
const fileSizeTooLarge = ref(false)
const wrongFileType = ref(false)

/****************************************
 * helpers
 ****************************************/
const isLargeFile = (fileSize: number) => {
  if (fileSize > 10737418240) {
    console.log('file size is too large')
    return true
  }
  console.log('file size is OK')
  return false
}

const isWrongFileType = (fileType: string) => {
  const acceptAry = '.mp4'
    .replace(/\./g, '')
    .split(',')
    .map((item) => {
      return `video/${item}`
    })

  return acceptAry.indexOf(fileType) === -1
}

/****************************************
 * onHandler
 ****************************************/
const onSelected = (e: Event) => {
  const fileObj = (e.target as HTMLInputElement)?.files?.[0]

  if (fileObj) {
    // Check file size
    if (isLargeFile(fileObj.size)) {
      fileSizeTooLarge.value = true
      return
    } else {
      fileSizeTooLarge.value = false
      console.log('file size is OK')
    }

    // Check file format by MIME type
    if (isWrongFileType(fileObj.type)) {
      wrongFileType.value = true
      return
    } else {
      wrongFileType.value = false
      console.log('file type is OK')
    }
  }

  store.videoData = fileObj

  router.push('/edit')
}
</script>

<template>
  <div class="main">
    <div class="uploadArea">
      <div class="uploadMessage">
        <p>
          こちらにファイルをドロップ、またはクリックでアップロードしてください。<br />
          ファイルサイズ :50MB以下 対応ファイル : .mp4
        </p>
      </div>
      <label class="uploadButton">
        ファイル選択
        <input @change.prevent="onSelected" type="file" class="" accept=".mp4" />
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .uploadArea {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    width: 50rem;
    min-height: 20rem;
    height: max-content;
    padding: 1rem;
    background:
      linear-gradient(90deg, #fff 19px, transparent 1%) center,
      linear-gradient(#fff 20px, transparent 1%) center,
      #f5f5f5;
    background-size: 23px 24px;
    border: 2px dashed #c8c8c8;
    border-radius: 1rem;

    .uploadMessage {
      p {
        font-size: 1.2rem;
        margin: 0;
        color: #888888;
      }
    }

    .uploadButton {
      display: flex;
      justify-content: center;
      align-items: center;
      width: max-content;
      height: max-content;
      padding: 0.5rem 2rem;
      border: 1px solid #e7e7e7;
      border-radius: 0.3rem;
      color: #444;
      background: #fff;
      font-weight: bold;
      word-break: keep-all;
      cursor: pointer;
      transition: all 100ms ease-in-out;
      margin-top: 2rem;

      input {
        display: none;
      }
    }
  }
}
</style>
