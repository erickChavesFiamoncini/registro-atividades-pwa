<template>
  <div
    ref="mapElement"
    class="task-location-map"
    aria-label="Mapa da localização"
  ></div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const props = defineProps({
  location: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["location-change"]);

const mapElement = ref(null);

let map = null;
let marker = null;
let accuracyCircle = null;

/**
 * Verifica se a localização recebida possui
 * coordenadas válidas.
 */
function getLocationPoint() {
  if (!props.location) {
    return null;
  }

  const latitude = Number(props.location.latitude);
  const longitude = Number(props.location.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return [latitude, longitude];
}

/**
 * Remove marcador e círculo de precisão.
 */
function removeMarkerAndCircle() {
  if (marker) {
    marker.off("dragend", handleMarkerDragEnd);
    marker.remove();
    marker = null;
  }

  if (accuracyCircle) {
    accuracyCircle.remove();
    accuracyCircle = null;
  }
}

/**
 * Atualiza o círculo de precisão da localização.
 */
function updateAccuracyCircle(point) {
  if (!map) {
    return;
  }

  if (accuracyCircle) {
    accuracyCircle.remove();
    accuracyCircle = null;
  }

  const accuracy = Number(props.location?.accuracy);

  if (Number.isFinite(accuracy) && accuracy > 0) {
    accuracyCircle = L.circle(point, {
      radius: accuracy,
      color: "#4a90d9",
      fillColor: "#4a90d9",
      fillOpacity: 0.15,
      weight: 1,
    }).addTo(map);
  }
}

/**
 * Atualiza o popup do marcador.
 */
function updatePopup() {
  if (!marker) {
    return;
  }

  marker.unbindPopup();

  if (props.location?.label) {
    marker.bindPopup(props.location.label);
  }
}

/**
 * Cria o marcador arrastável.
 */
function createMarker(point) {
  if (!map) {
    return;
  }

  marker = L.marker(point, {
    draggable: true,
    autoPan: true,
  }).addTo(map);

  updatePopup();

  marker.on("dragend", handleMarkerDragEnd);
}

/**
 * Renderiza/atualiza a localização no mapa.
 */
function renderLocation({ centerMap = false } = {}) {
  if (!map) {
    return;
  }

  const point = getLocationPoint();

  if (!point) {
    removeMarkerAndCircle();
    return;
  }

  /**
   * Se ainda não existe marcador, cria.
   */
  if (!marker) {
    createMarker(point);
  } else {
    /**
     * Atualiza apenas a posição.
     * Não recriamos o marcador, pois isso poderia
     * atrapalhar o arraste.
     */
    marker.setLatLng(point);
    updatePopup();
  }

  updateAccuracyCircle(point);

  if (centerMap) {
    map.setView(point, 17);
  }

  nextTick(() => {
    if (map) {
      map.invalidateSize();
    }
  });
}

/**
 * Envia nova posição para o componente pai.
 */
function emitNewPosition(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return;
  }

  emit("location-change", {
    latitude: lat,
    longitude: lng,
  });
}

/**
 * Executado quando o usuário termina de arrastar
 * o marcador.
 */
function handleMarkerDragEnd(event) {
  const position = event.target.getLatLng();

  emitNewPosition(position.lat, position.lng);
}

/**
 * Permite clicar diretamente no mapa para
 * reposicionar o marcador.
 */
function handleMapClick(event) {
  const { lat, lng } = event.latlng;

  emitNewPosition(lat, lng);
}

/**
 * Inicializa o mapa.
 */
onMounted(async () => {
  await nextTick();

  if (!mapElement.value) {
    return;
  }

  map = L.map(mapElement.value, {
    zoomControl: true,
    dragging: true,
    scrollWheelZoom: true,
    doubleClickZoom: true,
    touchZoom: true,
  }).setView([0, 0], 2);

  L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }
  ).addTo(map);

  /**
   * Clique no mapa reposiciona o marcador.
   */
  map.on("click", handleMapClick);

  /**
   * Renderiza a localização inicial.
   */
  renderLocation({
    centerMap: true,
  });

  /**
   * Garante que o Leaflet reconheça o tamanho
   * correto do elemento depois que o Vue terminar
   * de renderizar.
   */
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
    }
  }, 100);
});

/**
 * Observa alterações na localização vindas do
 * componente pai.
 */
watch(
  () => [
    props.location?.latitude,
    props.location?.longitude,
    props.location?.accuracy,
    props.location?.label,
  ],
  () => {
    renderLocation({
      centerMap: false,
    });
  }
);

onBeforeUnmount(() => {
  if (map) {
    map.off("click", handleMapClick);
    map.remove();
    map = null;
  }

  marker = null;
  accuracyCircle = null;
});
</script>

<style scoped>
.task-location-map {
  width: 100%;
  height: 220px;
  min-height: 220px;

  border-radius: 10px;
  overflow: hidden;

  border: 1px solid #e2e8f0;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.05);

  position: relative;

  /*
   * O mapa precisa ficar acima de outros elementos
   * da página, mas abaixo de modais.
   */
  z-index: 1;

  /*
   * Evita que algum estilo do formulário
   * comprima o mapa.
   */
  flex-shrink: 0;
}

.task-location-map :deep(.leaflet-container) {
  width: 100%;
  height: 100%;

  cursor: crosshair;

  /*
   * Permite interação normal com o mapa.
   */
  pointer-events: auto;

  font-family: inherit;
}

.task-location-map :deep(.leaflet-marker-icon) {
  cursor: grab;
}

.task-location-map :deep(.leaflet-marker-icon:active) {
  cursor: grabbing;
}

.task-location-map :deep(.leaflet-marker-shadow) {
  pointer-events: none;
}

.task-location-map :deep(.leaflet-control) {
  z-index: 500;
}
</style>
