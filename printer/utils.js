"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceParser = void 0;
const priceParser = (value) => {
    return value.toLocaleString("es-AR", {
        style: "currency",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        currency: "ARS",
    });
};
exports.priceParser = priceParser;
