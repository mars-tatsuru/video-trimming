<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { mainStore } from '@/stores/main'
import { useRouter } from 'vue-router'

/****************************************
 * store and router
 ****************************************/
const store = mainStore()
const router = useRouter()

/****************************************
 * data
 ****************************************/

let newsData = ref() // will later be filled with the data
onMounted(() => {
  // json parse
  let req = new XMLHttpRequest()
  req.open('GET', 'http://localhost:5173/newsData.json', false)
  req.send(null)
  if (req.status == 200) newsData.value = JSON.parse(req.responseText)
})
</script>

<template>
  <div class="main">
    <div class="summaryWrapper">
      <h1>要約結果画面</h1>
      <div v-for="{ whole, title, summary, tags } in newsData" class="summaryItem">
        <div v-if="whole" class="summaryItemContents">
          <h2>ページ全体要約</h2>
          <textarea v-text="summary" />
          <div class="tags">
            <p v-for="(tag, index) in tags">
              {{ tag }}
            </p>
          </div>
        </div>
        <div v-else class="summaryItemContents">
          <h2>{{ title }}</h2>
          <textarea v-text="summary" />
          <div class="tags">
            <p v-for="(tag, index) in tags">
              {{ tag }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  width: 100%;
  height: 100%;

  h1 {
    font-size: 30px;
    font-weight: bold;
    margin-bottom: 20px;
    letter-spacing: 3px;
    text-align: center;
  }

  .summaryWrapper {
    padding: 20px;

    .summaryItem {
      margin-top: 20px;
      border: 1px solid #ccc;
      padding: 20px;
      border-radius: 10px;

      .summaryItemContents {
        h2 {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        textarea {
          width: 100%;
          border: 1px solid #ccc;
          max-height: 300px;
          field-sizing: content;
          margin-bottom: 15px;
          font-size: 14px;
          padding: 10px;
          line-height: 1.5;
          border-radius: 5px;
        }

        .tags {
          display: flex;

          p {
            border-radius: 2px;
            color: #fff;
            padding: 8px 15px;
            line-height: 1;
            background-color: #6b77ff;
            margin-right: 10px;
          }
        }
      }
    }
  }
}
</style>
