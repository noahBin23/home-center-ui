<script setup>
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, onMounted } from "vue"
import { http } from "@/utils/http"
import { ElMessage, ElMessageBox } from "element-plus"

defineOptions({
  name: "AI"
})

const userInput = ref("")
const messages = reactive([])

const sendMessage = async function() {
  if (userInput.value) {
    messages.push({
      role: "user",
      content: userInput.value
    })
    messages.push({
      role: "ai",
      content: "生成中..."
    })
    const response = await fetch(`/api/ai/completions?conversation_id=${conversionId.value}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: userInput.value,
        streaming: true
      }),
    })

    // Read the response as a stream of data
    const reader = response.body.getReader()
    const decoder = new TextDecoder("utf-8")
    messages[messages.length - 1].content = ""
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      // Massage and parse the chunk of data
      const chunk = decoder.decode(value);
      const lines = chunk.split("\r\n\r\n");
      console.log(lines)
      const parsedLines = lines
        .filter((line) => line.startsWith("event: data"))
        .map((line) => line.replace(/^event: data\r\ndata: /, "").trim()) // Remove the "data: " prefix
        .map((line) => line.replace(/\r\n\r\n/, "").trim())
        .filter((line) => line !== "" && line !== "[DONE]") // Remove empty lines and "[DONE]"
        .map((line) => JSON.parse(line)); // Parse the JSON string
      console.log(parsedLines)

      for (const parsedLine of parsedLines) {
        const content = parsedLine.content
        // Update the UI with the new content
        messages[messages.length - 1].content += content
      }
    }

    userInput.value = ""
  } else {
    ElMessage({
      message: '请输入内容',
      type: 'warning',
    })
  }
}

const conversionId = ref("")
const conversionList = reactive([])

const createConversion = async function () {
  ElMessageBox.prompt('请输入名称', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  }).then(async ({ value }) => {
    const response = await http.post("/api/ai-conversion/create", {
      data: {
        name: value
      },
    })
    console.log(response)
    ElMessage({
      type: 'success',
      message: `创建成功`,
    })
    await loadConversionList()
  }).catch(() => {
      ElMessage({
        type: 'info',
        message: '取消创建',
      })
    })
}

/**
 * 加载历史聊天记录
 * @returns {Promise<void>}
 */
const loadConversionHistory = async function() {
  messages.splice(0, messages.length)
  const response = await http.get(`/api/ai/history/${conversionId.value}`, {
  })
  console.log(response)
  response.data.forEach(item => {
    if (item.type === 'human') {
      messages.push({
        role: "human",
        content: item.content
      })
    } else if (item.type === 'AIMessageChunk') {
      messages.push({
        role: 'ai',
        content: item.content
      })
    }
  })
}

const onConversionChanged = async function (value) {
  console.log("onConversionChanged", value)
  await loadConversionHistory()
}

const loadConversionList = async function () {
  const response = await http.get("/api/ai-conversion/list")
  console.log(response)
  conversionList.splice(0, conversionList.length, ...response.data)
}
onMounted(async () => {
  await loadConversionList()
  conversionId.value = conversionList[0].session_id
  await loadConversionHistory()
})

</script>

<template>
  <div>
    <el-row style="height: 90%">
      <el-col :span="6">
        <el-card class="m-4 box-card main-card" shadow="never" :body-style="{ height: '70vh', overflow: 'auto' }">
          <el-button @click="createConversion">新建会话</el-button>
          <el-divider>
            <h4>会话列表</h4>
          </el-divider>
          <el-radio-group v-model="conversionId" @change="onConversionChanged">
            <el-radio :label="item.session_id" v-for="item in conversionList" :key="item.id">{{ item.name }}</el-radio>
          </el-radio-group>
          <el-divider>
            <h4>知识库列表</h4>
          </el-divider>
        </el-card>
      </el-col>
      <el-col :span="18">
        <el-card class="m-4 box-card main-card" shadow="never" :body-style="{ height: '70vh', overflow: 'auto' }">
          <template #header>
            <div class="card-header">
              <span class="font-medium">AI 聊天</span>
            </div>
          </template>
          <div>
            <el-card :class="item.role === 'ai' ? 'ai-content-card content-card' : 'human-content-card content-card'" v-for="item in messages" :key="item">
              <div>{{ item.content }}</div>
            </el-card>
          </div>
          <template #footer>
            <el-input v-model="userInput" placeholder="Please input" class="input-with-select" size="large">
              <template #append>
                <el-button :icon="Search" @click="sendMessage"></el-button>
              </template>
            </el-input>
          </template>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.main-content {
  margin: 0 !important;
  height: 100%;
}

.main-card {
  height: 100%;
}

.content-card {
  margin-top: 5px;
  margin-bottom: 5px;
  border-radius: 15px;
}

.ai-content-card {
  width: 580px;
  background: aliceblue;
}
.human-content-card {
  width: 580px;
  background: antiquewhite;
  float: right;
}
</style>
