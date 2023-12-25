<script setup>
import { onMounted, ref } from "vue";
import { http } from "@/utils/http";

const yijuData = ref(null)
const getYoudaoYiju = async function () {
  const response = await http.get("/api/open-service/youdao_yiju");
  console.log(response)
  yijuData.value = response.data
}

onMounted(getYoudaoYiju)

</script>
<template>
  <div>
    <div>{{ yijuData ? yijuData.summary : "" }}</div>
    <div>{{ yijuData ? yijuData.title: "" }}</div>
  </div>
</template>
<style scoped></style>
