
export const priceParser = (value: number) => {
  return value.toLocaleString("es-AR", {
    style: "currency",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currency: "ARS",
  });
};