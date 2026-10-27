/** GTIN-8, UPC-A (12), EAN-13 o GTIN-14: solo dígitos y dígito verificador GS1 correcto. */
export function isValidGtin(value: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13,14})$/.test(value)) return false;
  const digits = [...value].map(Number);
  const check = digits.pop() as number;
  // Desde el dígito más cercano al verificador, pesos alternos 3 y 1.
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}
