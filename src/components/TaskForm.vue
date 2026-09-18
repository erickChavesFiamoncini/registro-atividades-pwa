<template>
  <form class="task-form" @submit.prevent="handleSubmit">

    <!-- Tarefa -->
    <div class="task-row">
      <input
        v-model="newTask"
        type="text"
        placeholder="Nova tarefa..."
        class="task-input"
      />

      <button
        type="submit"
        class="task-button"
        :disabled="uploading"
      >
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


    <!-- Imagem -->
    <div class="image-section">

      <img
        v-if="previewUrl || editingTask?.img_url"
        :src="previewUrl || editingTask?.img_url"
        class="image-preview"
        alt="Imagem da tarefa"
      />

      <label
        v-if="!showCameraCapture"
        class="image-label"
        :class="{ disabled: uploading }"
      >
        <span v-if="uploading">
          Enviando...
        </span>

        <span v-else>
          {{
            previewUrl || editingTask?.img_url
              ? "📁 Trocar imagem"
              : "📁 Adicionar imagem"
          }}
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

      <button
        v-if="!showCameraCapture"
        type="button"
        class="task-button-camera"
        :disabled="uploading"
        @click="showCameraCapture = true"
      >
        Abrir câmera
      </button>

      <CameraCapture
        v-if="showCameraCapture"
        @captured="handleCameraCapture"
        @close="showCameraCapture = false"
      />

      <p class="image-help">
        Em celular, você pode usar a câmera pelo botão
        "Adicionar imagem" ou pelo preview ao vivo.
      </p>

    </div>


    <!-- Localização -->
    <div class="location-section">

      <div class="location-header">

        <strong>Localização</strong>

        <div class="location-controls">

          <!-- Campo de endereço -->
          <input
            v-model="addressInput"
            type="text"
            class="address-input"
            placeholder="Digite um endereço..."
            :disabled="loadingAddress || loadingLocation"
            @keyup.enter.prevent="handleAddressSearch"
          />

          <!-- Buscar endereço -->
          <button
            type="button"
            class="address-search-button"
            :disabled="
              loadingAddress ||
              loadingLocation ||
              !addressInput.trim()
            "
            @click="handleAddressSearch"
          >
            {{ loadingAddress ? "Buscando..." : "Buscar endereço" }}
          </button>

          <!-- Localização atual -->
          <button
            type="button"
            class="location-button"
            :disabled="loadingLocation || loadingAddress"
            @click="handleGetLocation"
          >
            {{
              loadingLocation
                ? "Obtendo localização..."
                : "Usar minha localização"
            }}
          </button>

        </div>
      </div>


      <p class="location-help">
        Você pode usar sua localização atual ou informar um endereço.
        Depois, também pode ajustar o marcador diretamente no mapa.
      </p>


      <!-- Endereço encontrado -->
      <p
        v-if="location?.label"
        class="location-label"
      >
        {{ location.label }}
      </p>


      <!-- Erro -->
      <p
        v-if="locationError"
        class="location-error"
      >
        {{ locationError }}
      </p>


      <!-- Mapa -->
      <TaskLocationMap
        v-if="location"
        :location="location"
        @location-change="handleMapLocationChanged"
      />


      <!-- Remover localização -->
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
import { ref, watch } from "vue";

import tasksApi from "../api/tasksApi.js";
import CameraCapture from "./CameraCapture.vue";
import TaskLocationMap from "./TaskLocationMap.vue";
import { useGeolocation } from "../composables/useGeolocation.js";
import geocodingApi from "../api/geocodingApi.js";
import { buildLocationPayload } from "../utils/location.js";


const props = defineProps({
  editingTask: {
    type: Object,
    default: null,
  },
});


const emit = defineEmits([
  "add",
  "update",
  "cancel",
]);


/* =========================
   GEOLOCALIZAÇÃO
   ========================= */

const {
  location,
  loadingLocation,
  locationError,
  requestCurrentLocation,
  setLocationFromTask,
  setLocationLabel,
  clearLocation,
} = useGeolocation();


/* =========================
   TAREFA
   ========================= */

const newTask = ref("");



/* =========================
   IMAGEM
   ========================= */

const previewUrl = ref(null);
const imgAttachmentKey = ref(null);
const uploading = ref(false);
const showCameraCapture = ref(false);



/* =========================
   ENDEREÇO
   ========================= */

const addressInput = ref("");
const loadingAddress = ref(false);



/* =========================
   EDIÇÃO DA TAREFA
   ========================= */

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

    addressInput.value = "";
    loadingAddress.value = false;


    if (task) {

      setLocationFromTask(task);


      if (task.location_label) {
        addressInput.value = task.location_label;
      }

    } else {

      clearLocation();

    }
  }
);



/* =========================
   UPLOAD DE IMAGEM
   ========================= */

async function handleImageChange(event) {

  const file = event.target.files[0];

  if (!file) {
    return;
  }


  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }


  previewUrl.value = URL.createObjectURL(file);

  uploading.value = true;


  try {

    const response = await tasksApi.uploadImage(file);

    imgAttachmentKey.value =
      response.data.attachment_key;

  } catch (err) {

    console.error(
      "Erro ao fazer upload da imagem",
      err
    );

    previewUrl.value = null;
    imgAttachmentKey.value = null;

  } finally {

    uploading.value = false;

  }
}



/* =========================
   CÂMERA
   ========================= */

async function handleCameraCapture(file) {

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }


  previewUrl.value = URL.createObjectURL(file);

  uploading.value = true;


  try {

    const response =
      await tasksApi.uploadImage(file);

    imgAttachmentKey.value =
      response.data.attachment_key;

  } catch (err) {

    console.error(
      "Erro ao fazer upload da foto da câmera",
      err
    );

    previewUrl.value = null;
    imgAttachmentKey.value = null;

  } finally {

    uploading.value = false;
    showCameraCapture.value = false;

  }
}



/* =========================
   BUSCAR ENDEREÇO
   ========================= */

async function handleAddressSearch() {

  const query = addressInput.value.trim();

  if (!query) {
    return;
  }


  loadingAddress.value = true;
  locationError.value = "";


  try {

    const result =
      await geocodingApi.search(query);


    if (!result) {

      locationError.value =
        "Não foi possível encontrar esse endereço. " +
        "Tente informar um endereço mais completo.";

      return;
    }


    /*
     * Cria a localização usando as coordenadas
     * encontradas pelo endereço.
     */

    location.value = {

      latitude: Number(result.latitude),

      longitude: Number(result.longitude),

      accuracy: null,

      timestamp: Date.now(),

      label: result.label,

    };


    /*
     * Substitui o texto digitado pelo endereço
     * encontrado pelo serviço.
     */

    addressInput.value = result.label;


  } catch (err) {

    console.error(
      "Erro ao buscar endereço:",
      err
    );

    locationError.value =
      "Não foi possível buscar esse endereço agora. " +
      "Tente novamente.";

  } finally {

    loadingAddress.value = false;

  }
}



/* =========================
   MUDANÇA PELO MAPA
   ========================= */

async function handleMapLocationChanged(newLocation) {

  if (!newLocation) {
    return;
  }


  const latitude =
    Number(newLocation.latitude);

  const longitude =
    Number(newLocation.longitude);


  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return;
  }


  /*
   * Atualiza imediatamente a posição.
   */

  location.value = {

    ...(location.value || {}),

    latitude,

    longitude,

    accuracy: null,

    timestamp: Date.now(),

    label: null,

  };


  /*
   * Descobre o endereço correspondente à
   * nova posição do marcador.
   */

  try {

    const address =
      await geocodingApi.reverse(
        latitude,
        longitude
      );


    if (address?.label) {

      setLocationLabel(address.label);

      addressInput.value =
        address.label;

    } else {

      setLocationLabel(
        "Endereço não encontrado"
      );

      addressInput.value = "";

    }

  } catch (err) {

    console.error(
      "Erro ao identificar novo endereço:",
      err
    );

    setLocationLabel(
      "Endereço não encontrado"
    );

    addressInput.value = "";

  }
}



/* =========================
   SALVAR TAREFA
   ========================= */

function handleSubmit() {

  if (!newTask.value.trim()) {
    return;
  }


  const payload = {

    title: newTask.value.trim(),

    img_attachment_key:
      imgAttachmentKey.value,

    ...buildLocationPayload(
      location.value
    ),

  };


  if (props.editingTask) {

    emit(
      "update",
      props.editingTask.id,
      payload
    );

  } else {

    emit(
      "add",
      payload
    );

  }


  /*
   * Limpa o formulário.
   */

  newTask.value = "";


  if (previewUrl.value) {
    URL.revokeObjectURL(
      previewUrl.value
    );
  }


  previewUrl.value = null;

  imgAttachmentKey.value = null;

  showCameraCapture.value = false;

  addressInput.value = "";

  clearLocation();

}



/* =========================
   CANCELAR
   ========================= */

function handleCancel() {

  newTask.value = "";


  if (previewUrl.value) {

    URL.revokeObjectURL(
      previewUrl.value
    );

  }


  previewUrl.value = null;

  imgAttachmentKey.value = null;

  showCameraCapture.value = false;

  addressInput.value = "";


  clearLocation();


  emit("cancel");

}



/* =========================
   LOCALIZAÇÃO ATUAL
   ========================= */

async function handleGetLocation() {

  const captured =
    await requestCurrentLocation();


  if (!captured) {
    return;
  }


  try {

    const address =
      await geocodingApi.reverse(
        captured.latitude,
        captured.longitude
      );


    if (address?.label) {

      setLocationLabel(
        address.label
      );

      addressInput.value =
        address.label;

    } else {

      setLocationLabel(
        "Endereço não encontrado"
      );

      addressInput.value = "";

    }

  } catch (err) {

    console.error(
      "Erro na busca do endereço:",
      err
    );


    locationError.value =
      "Localização obtida, mas não foi possível " +
      "identificar o endereço.";

    addressInput.value = "";

  }
}
</script>


<style scoped>
/* =========================================
   FORMULÁRIO
   ========================================= */

.task-form {
  width: 100%;
  margin-bottom: 24px;
  box-sizing: border-box;
}


/* =========================================
   LINHA DA TAREFA
   ========================================= */

.task-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
}


.task-input {
  flex: 1;
  min-width: 0;

  padding: 12px;

  border: 2px solid #ddd;
  border-radius: 8px;

  font-size: 1rem;

  outline: none;

  transition: border-color 0.2s;

  box-sizing: border-box;
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

  white-space: nowrap;
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

  white-space: nowrap;
}


.task-button-cancel:hover {
  border-color: #aaa;
}



/* =========================================
   IMAGEM
   ========================================= */

.image-section {
  display: flex;
  align-items: center;

  gap: 12px;

  padding: 10px 12px;

  background: #f8f9fa;

  border-radius: 8px;

  border: 1px dashed #ccc;

  flex-wrap: wrap;

  width: 100%;

  box-sizing: border-box;
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

  box-sizing: border-box;
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

  white-space: nowrap;
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



/* =========================================
   LOCALIZAÇÃO
   ========================================= */

.location-section {
  margin-top: 16px;

  padding: 16px;

  background-color: #ffffff;

  border: 1px solid #e2e8f0;

  border-radius: 12px;

  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.04);

  display: flex;

  flex-direction: column;

  gap: 12px;

  width: 100%;

  box-sizing: border-box;
}



/* =========================================
   CABEÇALHO
   ========================================= */

.location-header {
  display: flex;

  align-items: center;

  gap: 12px;

  width: 100%;

  min-width: 0;
}


.location-header strong {
  font-size: 0.95rem;

  color: #2d3748;

  font-weight: 600;

  display: flex;

  align-items: center;

  gap: 6px;

  flex-shrink: 0;
}


.location-header strong::before {
  content: "📍";

  font-size: 1rem;
}



/* =========================================
   CONTROLES
   ========================================= */

.location-controls {
  display: flex;

  align-items: center;

  justify-content: flex-end;

  gap: 8px;

  flex: 1;

  min-width: 0;

  flex-wrap: wrap;
}



/* =========================================
   CAMPO DE ENDEREÇO
   ========================================= */

.address-input {
  flex: 1;

  min-width: 180px;

  width: 240px;

  padding: 8px 10px;

  background-color: #ffffff;

  color: #2d3748;

  border: 1px solid #d8b4fe;

  border-radius: 8px;

  font-size: 0.85rem;

  outline: none;

  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  box-sizing: border-box;
}


.address-input::placeholder {
  color: #a0aec0;
}


.address-input:focus {
  border-color: #642db8;

  box-shadow:
    0 0 0 2px
    rgba(100, 45, 184, 0.1);
}


.address-input:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}



/* =========================================
   BOTÃO BUSCAR
   ========================================= */

.address-search-button {
  padding: 8px 12px;

  background-color: #642db8;

  color: #ffffff;

  border: 1px solid #642db8;

  border-radius: 8px;

  font-size: 0.85rem;

  font-weight: 600;

  cursor: pointer;

  transition:
    background-color 0.2s,
    border-color 0.2s;

  white-space: nowrap;

  flex-shrink: 0;
}


.address-search-button:hover:not(:disabled) {
  background-color: #9a6be0;

  border-color: #9a6be0;
}


.address-search-button:disabled {
  opacity: 0.5;

  cursor: not-allowed;
}



/* =========================================
   BOTÃO LOCALIZAÇÃO
   ========================================= */

.location-button {
  padding: 8px 14px;

  background-color: #f3e8ff;

  color: #642db8;

  border: 1px solid #d8b4fe;

  border-radius: 8px;

  font-size: 0.85rem;

  font-weight: 600;

  cursor: pointer;

  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;

  white-space: nowrap;

  flex-shrink: 0;
}


.location-button:hover:not(:disabled) {
  background-color: #642db8;

  color: #ffffff;

  border-color: #642db8;

  box-shadow:
    0 2px 6px
    rgba(100, 45, 184, 0.25);
}


.location-button:disabled {
  opacity: 0.6;

  cursor: not-allowed;
}



/* =========================================
   AJUDA
   ========================================= */

.location-help {
  margin: 0;

  font-size: 0.8rem;

  color: #718096;

  line-height: 1.4;
}



/* =========================================
   ENDEREÇO SELECIONADO
   ========================================= */

.location-label {
  margin: 0;

  padding: 8px 12px;

  background-color: #f8fafc;

  border-left: 3px solid #642db8;

  border-radius: 0 6px 6px 0;

  font-size: 0.875rem;

  color: #4a5568;

  line-height: 1.4;

  overflow-wrap: anywhere;
}



/* =========================================
   ERRO
   ========================================= */

.location-error {
  margin: 0;

  padding: 8px 12px;

  background-color: #fff5f5;

  border-left: 3px solid #e53e3e;

  border-radius: 0 6px 6px 0;

  font-size: 0.85rem;

  color: #c53030;

  line-height: 1.4;
}



/* =========================================
   REMOVER LOCALIZAÇÃO
   ========================================= */

.location-remove-button {
  align-self: flex-start;

  padding: 6px 12px;

  background-color: transparent;

  color: #e53e3e;

  border: 1px solid #fed7d7;

  border-radius: 6px;

  font-size: 0.8rem;

  font-weight: 500;

  cursor: pointer;

  transition:
    background-color 0.2s,
    border-color 0.2s;
}


.location-remove-button:hover {
  background-color: #fff5f5;

  border-color: #e53e3e;
}



/* =========================================
   RESPONSIVIDADE
   ========================================= */

@media (max-width: 900px) {

  .location-header {
    align-items: flex-start;

    flex-direction: column;
  }


  .location-header strong {
    width: 100%;
  }


  .location-controls {
    width: 100%;

    justify-content: flex-start;

    flex-wrap: wrap;
  }


  .address-input {
    flex: 1;

    min-width: 200px;
  }

}



@media (max-width: 600px) {

  .task-row {
    flex-wrap: wrap;
  }


  .task-input {
    width: 100%;

    flex-basis: 100%;
  }


  .task-button,
  .task-button-cancel {
    flex: 1;
  }


  .location-controls {
    flex-direction: column;

    align-items: stretch;

    width: 100%;
  }


  .address-input {
    width: 100%;

    min-width: 0;

    flex: none;
  }


  .address-search-button,
  .location-button {
    width: 100%;
  }

}
</style>
