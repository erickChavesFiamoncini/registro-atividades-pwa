<template>
  <form class="task-form" @submit.prevent="handleSubmit">
    <div class="task-row">
      <input
        v-model="newTask"
        type="text"
        placeholder="Nova tarefa..."
        class="task-input"
      />

      <button type="submit" class="task-button" :disabled="uploading">
        {{ editingTask ? "Alterar" : "Adicionar" }}
      </button>

      <button
        v-if="editingTask"
        type="button"
        class="task-button-cancel"
        @click="handleCancel"
      >
        Cancelar
      </button>
    </div>

    <div class="image-section">
      <!-- Preview da imagem -->
      <img
        v-if="previewUrl || editingTask?.img_url"
        :src="previewUrl || editingTask?.img_url"
        class="image-preview"
        alt="Imagem da tarefa"
      />

      <!-- Selecionar imagem / câmera do celular -->
      <label class="image-label" :class="{ disabled: uploading }">
        <span v-if="uploading" class="upload-status"> Enviando... </span>

        <span v-else>
          {{ previewUrl || editingTask?.img_url ? "Trocar imagem" : "Adicionar imagem" }}
        </span>

        <input
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          class="image-input"
          :disabled="uploading"
          @change="handleImageChange"
        />
      </label>

      <!-- Câmera com getUserMedia -->
      <button
        type="button"
        class="task-button-camera"
        :disabled="uploading"
        @click="showCameraCapture = !showCameraCapture"
      >
        {{ showCameraCapture ? "Fechar câmera" : "Abrir câmera" }}
      </button>

      <!-- Componente da câmera -->
      <CameraCapture v-if="showCameraCapture" @captured="handleCameraCapture" />

      <p class="image-help">
        Em celular, você pode usar a câmera pelo botão "Adicionar imagem" ou pelo preview
        ao vivo.
      </p>
    </div>
    <div class="location-section">
      <div class="location-header">
        <strong>Localização</strong>

        <button
          type="button"
          class="location-button"
          :disabled="loadingLocation"
          @click="handleGetLocation"
        >
          {{ loadingLocation ? "Obtendo localização..." : "Usar minha localização" }}
        </button>
      </div>

      <p v-if="location?.label" class="location-label">
        {{ location.label }}
      </p>

      <p v-if="locationError" class="location-error">
        {{ locationError }}
      </p>

      <TaskLocationMap v-if="location" :location="location" />

      <button
        v-if="location"
        type="button"
        class="location-remove-button"
        @click="clearLocation"
      >
        Remover localização
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import tasksApi from '../api/tasksApi.js'
import CameraCapture from './CameraCapture.vue'
import TaskLocationMap from './TaskLocationMap.vue'
import { useGeolocation } from '../composables/useGeolocation.js'
import geocodingApi from "../api/geocodingApi.js";
import { buildLocationPayload } from '../utils/location.js'

const props = defineProps({
  editingTask: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["add", "update", "cancel"]);

const {
  location,
  loadingLocation,
  locationError,
  requestCurrentLocation,
  setLocationFromTask,
  setLocationLabel,
  clearLocation,
} = useGeolocation();

const newTask = ref("");
const previewUrl = ref(null);
const imgAttachmentKey = ref(null);
const uploading = ref(false);
const showCameraCapture = ref(false);

watch(
  () => props.editingTask,
  (task) => {
    newTask.value = task ? task.title : "";

    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
    }

    previewUrl.value = null;
    imgAttachmentKey.value = null;
    showCameraCapture.value = false;

    if (task) {
      setLocationFromTask(task);
    } else {
      clearLocation();
    }
  }
);

async function handleImageChange(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  previewUrl.value = URL.createObjectURL(file);
  uploading.value = true;

  try {
    const response = await tasksApi.uploadImage(file);

    imgAttachmentKey.value = response.data.attachment_key;
  } catch (err) {
    console.error("Erro ao fazer upload da imagem", err);

    previewUrl.value = null;
    imgAttachmentKey.value = null;
  } finally {
    uploading.value = false;
  }
}

async function handleCameraCapture(file) {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  previewUrl.value = URL.createObjectURL(file);
  uploading.value = true;

  try {
    const response = await tasksApi.uploadImage(file);

    imgAttachmentKey.value = response.data.attachment_key;

    showCameraCapture.value = false;
  } catch (err) {
    console.error("Erro ao fazer upload da foto da câmera", err);

    previewUrl.value = null;
    imgAttachmentKey.value = null;
  } finally {
    uploading.value = false;
  }
}

function handleSubmit() {
  if (!newTask.value.trim()) return;

  const payload = {
    title: newTask.value.trim(),
    img_attachment_key: imgAttachmentKey.value,
    ...buildLocationPayload(location.value),
  };

  if (props.editingTask) {
    emit(
      "update",
      props.editingTask.id,
      payload,
    );
  } else {
    emit("add", payload);
  }

  newTask.value = "";
  previewUrl.value = null;
  imgAttachmentKey.value = null;
  showCameraCapture.value = false;
  clearLocation();
}

function handleCancel() {
  newTask.value = "";

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }

  previewUrl.value = null;
  imgAttachmentKey.value = null;
  showCameraCapture.value = false;
  clearLocation();

  emit("cancel");
}

async function handleGetLocation() {
  const captured = await requestCurrentLocation();
  if (!captured) return;

  try {
    const address = await geocodingApi.reverse(captured.latitude, captured.longitude);

    setLocationLabel(address?.label ?? null);
  } catch {
    locationError.value = "Localização obtida, mas não foi possível identificar a rua.";
  }
}
</script>

<style scoped>
.task-form {
  margin-bottom: 24px;
}

.task-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.task-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.task-input:focus {
  border-color: #642db8;
}

.task-button {
  padding: 12px 20px;
  background-color: #642db8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.task-button:hover:not(:disabled) {
  background-color: #9a6be0;
}

.task-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-button-cancel {
  padding: 12px 16px;
  background-color: transparent;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: border-color 0.2s;
}

.task-button-cancel:hover {
  border-color: #aaa;
}

.image-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ccc;
  flex-wrap: wrap;
}

.image-preview {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.image-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border: 1.5px solid #642db8;
  color: #642db8;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.image-label:hover:not(.disabled) {
  background: #eaf2fb;
}

.image-label.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.image-input {
  display: none;
}

.task-button-camera {
  padding: 8px 14px;
  background-color: #642db8;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
}

.task-button-camera:hover:not(:disabled) {
  background-color: #9a6be0;
}

.task-button-camera:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.image-help {
  width: 100%;
  font-size: 0.75rem;
  color: #999;
  margin: 0;
}

.upload-status {
  color: #888;
}
</style>
