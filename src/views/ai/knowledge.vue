<script setup>

import { onMounted, reactive, ref } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import { http } from "@/utils/http";

const knowledgeId = ref(null)
const knowLedgeList = reactive([])
const knowLedgeDetail = ref(null)

const loadKnowledgeListLoading = ref(false)
/**
 * 加载知识库列表
 * @returns {Promise<void>}
 */
const loadKnowledgeList = async function() {
  loadKnowledgeListLoading.value = true
  const response = await http.get("/api/ai-knowledge/list")
  knowLedgeList.splice(0, knowLedgeList.length, ...response.data)
  loadKnowledgeListLoading.value = false
}
onMounted(async () => {
  await loadKnowledgeList()
  if (knowLedgeList.length > 0) {
    knowledgeId.value = knowLedgeList[0].id
    await loadKnowledgeItemTableData()
  }
})

const onKnowledgeChanged = async function(value) {
  await loadKnowledgeItemTableData()
}
const knowledgeItemLoading = ref(false)

// 创建知识库相关
const dialogCreateNewKnowledgeVisible = ref(false)
const createNewKnowledgeFormData = reactive({
  name: "",
  db_type: "elasticsearch",
})
const knowledgeFormRef = ref()
const knowledgeFormRules = reactive({
  name: [
    { required: true, message: 'Please input name', trigger: 'blur' },
  ],
  db_type: [
    { required: true, message: 'Please select db type', trigger: 'blur' },
  ]
})

const onCreateNewKnowledge = function() {
  dialogCreateNewKnowledgeVisible.value = true
}

const onBtnCreateNewKnowledgeSubmit = async function(formEl) {
  await formEl.validate((valid, fields) => {
    if (valid) {
      http.post("/api/ai-knowledge/create", {
        data: {
          name: createNewKnowledgeFormData.name,
          db_type: createNewKnowledgeFormData.db_type,
        },
      }).then(response => {
        console.log(response)
        ElMessage({
          type: 'success',
          message: `创建成功`,
        })
        dialogCreateNewKnowledgeVisible.value = false
        loadKnowledgeList()
      }).catch(error => {
        console.log(error)
        ElMessage({
          type: 'error',
          message: `创建失败${error}`,
        })
      })
    } else {
      ElMessage({
        type: 'error',
        message: `参数校验错误`,
      })
    }
  })
}

const knowledgeItemTableData = reactive([])
const knowledgeSourceTypeList = reactive([
  "text",
  "pdf"
])
const knowledgeItemFormRef = ref()
const knowledgeItemFormData = reactive({
  name: "",
  intro: "",
  source_type: "",
  content: "",
})
const knowledgeItemFormRules = reactive({
  name: [
    { required: true, message: 'Please input Activity name', trigger: 'blur' },
  ],
  intro: [
    { required: true, message: 'Please input intro', trigger: 'blur' },
  ],
  source_type: [
    { required: true, message: 'Please input Source Type', trigger: 'blur' },
  ],
  content: [
    { required: true, message: 'Please input content', trigger: 'blur' },
  ],
})

const loadKnowledgeItemTableData = async function() {
  if (knowledgeId.value === null || knowledgeId.value === undefined) {
    ElMessage({
      type: 'warning',
      message: '请选择知识库',
    })
    return
  }
  knowledgeItemLoading.value = true
  const response = await http.get(`/api/ai-knowledge/detail/${knowledgeId.value}`)
  console.log("loadKnowledgeItemTableData response", response)
  knowledgeItemTableData.splice(0, knowledgeItemTableData.length, ...response.data.knowledge_items)
  knowLedgeDetail.value = response.data
  knowledgeItemLoading.value = false
}

// 添加item对话框
const addItemDialogVisible = ref(false)

const onBtnAddItemClicked = function() {
  addItemDialogVisible.value = true
  if (addItemUploadRef.value != null) {
    addItemUploadRef.value.clearFiles()
  }
  if (knowledgeItemFormRef.value != null) {
    knowledgeItemFormRef.value.resetFields()
  }
}
const onBtnConfirmAddItemClicked = async function(formEl) {
  console.log("onBtnConfirmAddItemClicked")
  if (knowledgeId.value === null || knowledgeId.value === undefined) {
    ElMessage({
      type: 'warning',
      message: '请选择知识库',
    })
    return
  }
  await formEl.validate((valid, fields) => {
    if (valid) {
      http.post(`/api/ai-knowledge/item/${knowledgeId.value}`, {
        data: {
          knowledge_id: knowledgeId.value,
          name: knowledgeItemFormData.name,
          intro: knowledgeItemFormData.intro,
          source_type: knowledgeItemFormData.source_type,
          content: knowledgeItemFormData.content,
        }
      }).then(async response => {
        console.log(response)
        ElMessage({
          type: 'success',
          message: `创建成功`,
        })
        await loadKnowledgeItemTableData()
        addItemDialogVisible.value = false
      }).catch(error => {
        console.log(error)
        ElMessage({
          type: 'error',
          message: `创建失败${error}`,
        })
      })
    } else {
      console.log('error submit!', fields)
    }
  })
}


const addItemUploadRef = ref(null)
const uploading = ref(false)
const onBeforeUploadFile = function () {
  uploading.value = true
  return true
}
const onUploadFileSuccess = function(response, file, fileList) {
  console.log("onUploadFileSuccess", response, file, fileList)
  knowledgeItemFormData.content = response.data.object_name
  uploading.value = false
  ElMessage.success("文件上传成功")
}

const onBtnStartProcess = async function () {
  if (knowledgeId.value === null || knowledgeId.value === undefined) {
    ElMessage({
      type: 'warning',
      message: '请选择知识库',
    })
    return
  }
  const response = await http.post(`/api/ai-knowledge/process-knowledge/${knowledgeId.value}`, {})
  console.log(response)
  ElMessage({
    type: 'success',
    message: `开始处理 \n ${JSON.stringify(response.data)}`,
  })
}

const onBtnClearDb = async function () {
  if (knowledgeId.value === null || knowledgeId.value === undefined) {
    ElMessage({
      type: 'warning',
      message: '请选择知识库',
    })
    return
  }
  const response = await http.post(`/api/ai-knowledge/clear-db/${knowledgeId.value}`, {})
  console.log(response)
  ElMessage({
    type: 'success',
    message: `清空数据库 \n ${JSON.stringify(response.msg)}`,
  })
  await loadKnowledgeItemTableData()
}

</script>
<template>
  <div>
    <el-row>
      <el-col :span="6">
        <el-card class="m-4 box-card main-card" shadow="never" :body-style="{ height: '80vh', overflow: 'auto' }">
          <el-row>
            <el-col>
              <el-button @click="onCreateNewKnowledge">新建知识库</el-button>
            </el-col>
          </el-row>
          <el-divider>
            <h4>知识库列表</h4>
          </el-divider>
          <el-row v-loading="loadKnowledgeListLoading">
            <el-col>
              <el-radio-group v-model="knowledgeId" @change="onKnowledgeChanged">
                <el-radio :label="item.id" v-for="item in knowLedgeList" :key="item.id">{{ item.name }}</el-radio>
              </el-radio-group>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="18">
        <el-card class="m-4 box-card main-card" shadow="never" :body-style="{ height: '80vh', overflow: 'auto' }">
          <el-button @click="loadKnowledgeItemTableData">刷新数据</el-button>
          <el-button @click="onBtnAddItemClicked">添加内容</el-button>
          <el-button type="primary" @click="onBtnStartProcess">训练</el-button>
          <el-popconfirm title="确认删除?" @confirm="onBtnClearDb">
            <template #reference>
              <el-button type="danger">清空数据库</el-button>
            </template>
          </el-popconfirm>
          <el-divider>基础信息</el-divider>
          <el-descriptions title="" v-loading="knowledgeItemLoading">
            <el-descriptions-item label="向量库类型">{{ knowLedgeDetail == null ? "null" : knowLedgeDetail.knowledge.db_type }}</el-descriptions-item>
            <el-descriptions-item label="向量库数据量">{{ knowLedgeDetail == null ? "null" : knowLedgeDetail.status.document_count }}</el-descriptions-item>
          </el-descriptions>
          <el-divider></el-divider>
          <el-table :data="knowledgeItemTableData" style="width: 100%" v-loading="knowledgeItemLoading">
            <el-table-column prop="id" label="ID" width="100" />
            <el-table-column prop="name" label="Name" width="180" />
            <el-table-column prop="source_type" label="类型" width="150" />
            <el-table-column prop="intro" label="Intro" />
            <el-table-column prop="content" label="Content" >
              <template #default="scope">
                {{ scope.row.content.substring(0, 50) + '...' }}
              </template>
            </el-table-column>
            <el-table-column fixed="right" label="Operations" width="120">
              <template #default>
                <el-button link type="danger" size="small">Delete</el-button>
                <el-button link type="primary" size="small">Edit</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
    <el-dialog v-model="addItemDialogVisible" title="添加" width="40%">
      <el-form :model="knowledgeItemFormData" :rules="knowledgeItemFormRules" label-width="120px" ref="knowledgeItemFormRef">
        <el-form-item label="Name" prop="name">
          <el-input v-model="knowledgeItemFormData.name" />
        </el-form-item>
        <el-form-item label="Intro" prop="intro">
          <el-input v-model="knowledgeItemFormData.intro" />
        </el-form-item>
        <el-form-item label="Content Type" prop="source_type">
          <el-select v-model="knowledgeItemFormData.source_type" placeholder="please select your content type">
            <el-option v-for="item in knowledgeSourceTypeList" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="Content" prop="content">
          <el-col :span="18">
            <el-input v-model="knowledgeItemFormData.content" />
          </el-col>
          <el-col :span="6">
            <el-upload ref="addItemUploadRef" class="file-upload" action="/api/files/upload" :limit="1"
                       :show-file-list="false"
                       :with-credentials="true"
                       :before-upload="onBeforeUploadFile"
                       :auto-upload="true" :on-success="onUploadFileSuccess">
              <template #trigger>
                <el-button type="primary" v-loading="uploading" :disabled="uploading">select file</el-button>
              </template>
            </el-upload>
          </el-col>
        </el-form-item>
      </el-form>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="addItemDialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="onBtnConfirmAddItemClicked(knowledgeItemFormRef)">Confirm</el-button>
      </span>
      </template>
    </el-dialog>
    <el-dialog v-model="dialogCreateNewKnowledgeVisible" title="添加知识库" width="40%">
      <el-form :model="createNewKnowledgeFormData" :rules="knowledgeFormRules" label-width="120px" ref="knowledgeFormRef">
        <el-form-item label="Name" prop="name">
          <el-input v-model="createNewKnowledgeFormData.name" />
        </el-form-item>
        <el-form-item label="DB Type" prop="db_type">
          <el-select v-model="createNewKnowledgeFormData.db_type" placeholder="please select your db type">
            <el-option label="Elasticsearch" value="elasticsearch" />
            <el-option label="Chroma" value="chroma" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogCreateNewKnowledgeVisible = false">取消</el-button>
        <el-button type="primary" @click="onBtnCreateNewKnowledgeSubmit(knowledgeFormRef)">提交</el-button>
      </span>
      </template>
    </el-dialog>
  </div>
</template>
<style scoped>
.file-upload {
    display: flex;
    margin-left: 20px;
}
</style>
