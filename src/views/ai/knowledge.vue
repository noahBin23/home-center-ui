<script setup>

import { reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { http } from "@/utils/http";

const knowledgeId = ref(null)
const knowLedgeList = reactive([])

/**
 * 加载知识库列表
 * TODO
 * @returns {Promise<void>}
 */
const loadKnowledgeList = async function() {
  const response = await http.get("/api/ai/knowledge")
  knowLedgeList.splice(0, knowLedgeList.length, ...response.data)
}

const onKnowledgeChanged = function(value) {
  console.log(knowledgeId.value)
}

const onCreateNewKnowledge = function() {
  console.log("onCreateNewKnowledge")
  ElMessageBox.prompt('请输入名称', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  }).then(async ({ value }) => {

    ElMessage({
      type: 'success',
      message: `创建成功`,
    })
  }).catch(() => {
    ElMessage({
      type: 'info',
      message: '取消创建',
    })
  })
}

</script>
<template>
  <div>
    <h1>知识库</h1>
    <el-row>
      <el-col :span="6">
        <el-card class="m-4 box-card main-card" shadow="never" :body-style="{ height: '75vh', overflow: 'auto' }">
          <el-row>
            <el-col>
              <el-button @change="onCreateNewKnowledge">新建知识库</el-button>
            </el-col>
          </el-row>
          <el-divider>
            <h4>知识库列表</h4>
          </el-divider>
          <el-row>
            <el-col>
              <el-radio-group v-model="knowledgeId" @change="onKnowledgeChanged">
                <el-radio label="1">item</el-radio>
              </el-radio-group>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="18">
        <el-card class="m-4 box-card main-card" shadow="never" :body-style="{ height: '75vh', overflow: 'auto' }">
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<style scoped></style>
