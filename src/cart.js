// Lógica pura del pedido: sin DOM, para poder probarla con `npm test`.
export const formatCOP = (n) => `$${n.toLocaleString('es-CO')} COP`;

export const cartCount = (cart) => cart.reduce((sum, item) => sum + item.qty, 0);
export const cartTotal = (cart) => cart.reduce((sum, item) => sum + item.price * item.qty, 0);

// sessionStorage se puede editar desde el navegador: no se confía en lo que traiga.
export function cleanCart(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (i) => i && typeof i.name === 'string' && Number.isInteger(i.price) && i.price > 0 && Number.isInteger(i.qty) && i.qty > 0,
  );
}

export function addItem(cart, name, price) {
  const found = cart.find((i) => i.name === name);
  if (found) found.qty += 1;
  else cart.push({ name, price, qty: 1 });
}

export function changeQty(cart, index, delta) {
  if (!cart[index]) return;
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
}

export function orderText(cart) {
  const lines = cart.map((i) => `• ${i.qty}x ${i.name} (${formatCOP(i.price * i.qty)})`);
  return [
    '⚙️ *NUEVA ORDEN // LA HAMBURGUESA MECÁNICA* ⚙️',
    '',
    ...lines,
    '',
    `*TOTAL ESTIMADO:* ${formatCOP(cartTotal(cart))}`,
    '',
    '📍 *Sede:* Calle 72 #98b-15, Bogotá',
    'Por favor confirmarme tiempo de entrega y datos de despacho.',
  ].join('\n');
}

export const whatsappUrl = (phone, text) => `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`;
