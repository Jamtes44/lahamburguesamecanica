import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { addItem, cartCount, cartTotal, changeQty, cleanCart, orderText, whatsappUrl } from '../src/cart.js';

test('un producto con & llega completo a WhatsApp', () => {
  const cart = [];
  addItem(cart, 'Bombín Mac & Cheese Balls', 16000);
  const url = new URL(whatsappUrl('573001112233', orderText(cart)));
  const text = url.searchParams.get('text');
  assert.equal(url.searchParams.get('phone'), '573001112233');
  assert.ok(text.includes('1x Bombín Mac & Cheese Balls'));
  assert.ok(text.includes('*TOTAL ESTIMADO:* $16.000 COP'));
  assert.ok(text.includes('Calle 72 #98b-15'));
});

test('suma cantidades y total, y quita el producto al llegar a cero', () => {
  const cart = [];
  addItem(cart, 'A', 1000);
  addItem(cart, 'A', 1000);
  addItem(cart, 'B', 500);
  assert.equal(cartCount(cart), 3);
  assert.equal(cartTotal(cart), 2500);
  changeQty(cart, 1, -1);
  assert.deepEqual(cart, [{ name: 'A', price: 1000, qty: 2 }]);
  changeQty(cart, 9, 1);
  assert.equal(cartCount(cart), 2);
});

test('la carta no tiene precios inválidos ni productos repetidos', () => {
  const items = JSON.parse(readFileSync('src/carta.json', 'utf8')).flatMap((s) => s.items);
  assert.equal(new Set(items.map((i) => i.name)).size, items.length);
  for (const item of items) {
    assert.ok(item.consult || item.prices.length > 0, item.name);
    for (const { price } of item.prices ?? []) assert.ok(Number.isInteger(price) && price >= 1000, item.name);
  }
});

test('descarta datos alterados del almacenamiento', () => {
  assert.deepEqual(cleanCart(null), []);
  assert.deepEqual(cleanCart('hola'), []);
  const ok = { name: 'A', price: 1000, qty: 1 };
  assert.deepEqual(cleanCart([ok, { name: 'B', price: -1, qty: 1 }, { name: 'C', price: 1, qty: 0 }, { price: 1, qty: 1 }, null]), [ok]);
});
