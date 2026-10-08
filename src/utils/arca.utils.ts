import { ARCAData } from "../types/arca.types";

const DATA_MAP: { [key: number]: ARCAData } = {
  27394116705: {
    razonSocial: "CROCE GIANNINA PAOLA",
    domicilio: "12 DE OCTUBRE 10957 - PILAR, BUENOS AIRES",
    inicAct: "01/11/2023",
    iibb: "27394116705",
    ptoVenta: 5,
  },
  27418912141: {
    razonSocial: "LOPEZ MICAELA LOANA",
    domicilio: "12 DE OCTUBRE 10957 - PILAR, BUENOS AIRES",
    inicAct: "01/05/2024",
    iibb: "27418912141",
    ptoVenta: 4,
  },
};

export const getCuitData = (cuit: number) => DATA_MAP[cuit];
