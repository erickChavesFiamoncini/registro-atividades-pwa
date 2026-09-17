import { ref } from "vue";

export function useGeolocation() {
  const isSupported =
    typeof navigator !== "undefined" &&
    typeof navigator.geolocation !== "undefined";

  const permissionState = ref("unknown");
  const loadingLocation = ref(false);
  const locationError = ref("");
  const location = ref(null);

  async function readPermissionState() {
    if (!navigator.permissions?.query) return;

    try {
      const status = await navigator.permissions.query({
        name: "geolocation",
      });

      permissionState.value = status.state;

      status.onchange = () => {
        permissionState.value = status.state;
      };
    } catch {
      permissionState.value = "unknown";
    }
  }

  function setLocationFromTask(task) {
    if (!task || task.latitude == null || task.longitude == null) {
      location.value = null;
      return;
    }

    location.value = {
      latitude: task.latitude,
      longitude: task.longitude,
      accuracy: task.geolocation_accuracy ?? null,
      timestamp: task.geolocation_timestamp
        ? Date.parse(task.geolocation_timestamp)
        : Date.now(),
      label: task.location_label ?? null,
    };
  }

  /**
   * Atualiza a localização para uma posição escolhida manualmente
   * pelo usuário no mapa.
   *
   * A precisão do GPS deixa de ser aplicada porque essa nova posição
   * foi escolhida pelo usuário, e não obtida diretamente pelo GPS.
   */
  function setLocationPosition(latitude, longitude) {
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return;
    }

    if (!location.value) {
      location.value = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracy: null,
        timestamp: Date.now(),
        label: null,
      };

      return;
    }

    location.value = {
      ...location.value,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: null,
      timestamp: Date.now(),
      label: null,
    };
  }

  function clearLocation() {
    location.value = null;
    locationError.value = "";
  }

  function setLocationLabel(label) {
    if (location.value) {
      location.value = {
        ...location.value,
        label: label || null,
      };
    }
  }

  function requestCurrentLocation() {
    if (!isSupported) {
      locationError.value =
        "Geolocalização não suportada neste dispositivo.";

      return Promise.resolve(null);
    }

    loadingLocation.value = true;
    locationError.value = "";

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          permissionState.value = "granted";

          location.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            label: null,
          };

          loadingLocation.value = false;

          resolve(location.value);
        },

        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            permissionState.value = "denied";
            locationError.value = "Permissão de localização negada.";
          } else if (error.code === error.TIMEOUT) {
            locationError.value =
              "Tempo esgotado para obter localização.";
          } else {
            locationError.value =
              "Não foi possível obter a localização agora.";
          }

          loadingLocation.value = false;

          resolve(null);
        },

        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  }

  return {
    isSupported,
    permissionState,
    loadingLocation,
    locationError,
    location,
    readPermissionState,
    setLocationFromTask,
    setLocationPosition,
    clearLocation,
    setLocationLabel,
    requestCurrentLocation,
  };
}
