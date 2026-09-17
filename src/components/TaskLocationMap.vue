<template>
  <div
    ref="mapElement"
    class="task-location-map"
    aria-label="Mapa da localização"
  />
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

function removeMarkerAndCircle() {
  if (marker) {
    marker.remove();
    marker = null;
  }

  if (accuracyCircle) {
    accuracyCircle.remove();
    accuracyCircle = null;
  }
}

function updateAccuracyCircle(point) {
  if (!map) return;

  if (accuracyCircle) {
    accuracyCircle.remove();
    accuracyCircle = null;
  }

  if (props.location.accuracy > 0) {
    accuracyCircle = L.circle(point, {
      radius: props.location.accuracy,
      color: "#4a90d9",
      fillColor: "#4a90d9",
      fillOpacity: 0.15,
    }).addTo(map);
  }
}

function updatePopup() {
  if (!marker) return;

  marker.unbindPopup();

  if (props.location.label) {
    marker.bindPopup(props.location.label);
  }
}

function createMarker(point) {
  if (!map) return;

  marker = L.marker(point, {
    draggable: true,
  }).addTo(map);

  updatePopup();

  marker.on("dragend", handleMarkerDragEnd);
}

function renderLocation({ centerMap = false } = {}) {
  if (!map || !props.location) return;

  const latitude = Number(props.location.latitude);
  const longitude = Number(props.location.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return;
  }

  const point = [latitude, longitude];

  if (!marker) {
    createMarker(point);
  } else {
    marker.setLatLng(point);
    updatePopup();
  }

  updateAccuracyCircle(point);

  if (centerMap) {
    map.setView(point, 17);
  }

  nextTick(() => {
    map.invalidateSize();
  });
}

function emitNewPosition(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return;
  }

  emit("location-change", {
    latitude,
    longitude,
  });
}

function handleMarkerDragEnd(event) {
  const position = event.target.getLatLng();

  emitNewPosition(position.lat, position.lng);
}

function handleMapClick(event) {
  const { lat, lng } = event.latlng;

  emitNewPosition(lat, lng);
}

onMounted(() => {
  map = L.map(mapElement.value).setView([0, 0], 2);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  map.on("click", handleMapClick);

  renderLocation({
    centerMap: true,
  });
});

watch(
  () => props.location,
  () => {
    /*
     * Não usamos setView aqui.
     *
     * Isso é importante porque, quando o usuário arrasta o marcador,
     * o componente pai atualiza as coordenadas. Se chamássemos
     * setView novamente toda vez, o mapa ficaria "pulando" para o
     * centro a cada alteração.
     */
    renderLocation({
      centerMap: false,
    });
  },
  {
    deep: true,
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
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.05);
  z-index: 1;
}

/*
 * O cursor ajuda a indicar que o mapa pode ser manipulado.
 */
.task-location-map :deep(.leaflet-container) {
  cursor: crosshair;
}

.task-location-map :deep(.leaflet-marker-icon) {
  cursor: grab;
}

.task-location-map :deep(.leaflet-marker-icon:active) {
  cursor: grabbing;
}
</style>
