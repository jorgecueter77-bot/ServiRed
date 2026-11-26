import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 8000 });
const ServiciosContext = createContext(null);
const initial = { datos: null, error: "", cargando: true };

function reducer(state, action) {
  switch (action.type) {
    case "cargando":
      return { ...state, cargando: true, error: "" };
    case "listo":
      return { datos: action.datos, error: "", cargando: false };
    case "error":
      return { ...state, error: action.error, cargando: false };
    default:
      return state;
  }
}

export function mensajeError(error) {
  return (
    error.response?.data?.mensaje ||
    "No hay comunicación con el servidor. Intenta de nuevo."
  );
}

export function ServiciosProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [revision, setRevision] = useState(0);
  const [perfil, setPerfil] = useState("administracion");
  const recargar = () => setRevision((number) => number + 1);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: "cargando" });
    const recursos = ["clientes", "solicitudes", "ordenes", "tecnicos"];
    Promise.all(
      recursos.map((recurso) =>
        api.get(recurso, { signal: controller.signal }),
      ),
    )
      .then((responses) => {
        if (controller.signal.aborted) return;
        const datos = Object.fromEntries(
          recursos.map((recurso, index) => [recurso, responses[index].data]),
        );
        dispatch({ type: "listo", datos });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          dispatch({ type: "error", error: mensajeError(error) });
      });
    return () => controller.abort();
  }, [revision]);

  async function guardar(ruta, datos, metodo = "post") {
    const response = await api[metodo](ruta, datos);
    recargar();
    return response.data;
  }

  return (
    <ServiciosContext.Provider
      value={{ ...state, perfil, setPerfil, recargar, guardar }}
    >
      {children}
    </ServiciosContext.Provider>
  );
}

export function useServicios() {
  return useContext(ServiciosContext);
}
