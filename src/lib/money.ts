// Prices are stored in centavos to avoid floating point errors.
const formatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

export function formatPrice(centavos: number) {
  return formatter.format(centavos / 100);
}
