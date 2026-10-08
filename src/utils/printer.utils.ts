export const ANCHO_TICKET = 82;
export const SPACER = "-".repeat(Math.max(1, ANCHO_TICKET));

export const priceParser = (value: number): string => {
  return value.toLocaleString("es-AR", {
    style: "currency",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currency: "ARS",
  });
};

export const formatLine = (
  leftLine: string,
  rightLine: string,
  charAmount?: number,
): string => {
  const charQty = charAmount || ANCHO_TICKET;
  const availableSpaces = charQty - leftLine.length - rightLine.length;
  const fillingSpaces = " ".repeat(Math.max(1, availableSpaces));
  return leftLine + fillingSpaces + rightLine;
};
