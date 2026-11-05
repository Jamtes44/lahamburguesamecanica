// Bandeja de pedido compartida por todas las páginas.
import { addItem, cartCount, cartTotal, changeQty, cleanCart, formatCOP, orderText, whatsappUrl } from './cart.js';

const STORAGE_KEY = 'lhm-bandeja';
const drawer = document.getElementById('order-drawer');
const backdrop = document.getElementById('drawer-backdrop');
const list = document.getElementById('drawer-items-list');
const closeButton = drawer.querySelector('button[data-cart-close]');
const mobileMenu = document.querySelector('header details');
const cartLink = document.querySelector('header [data-cart-open]');
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function readCart() {
  try {
    return cleanCart(JSON.parse(sessionStorage.getItem(STORAGE_KEY)));
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // Sin almacenamiento el pedido sigue funcionando, pero solo dentro de esta página.
  }
}

const cart = readCart();
let returnFocus = null;

function render() {
  document.querySelectorAll('[data-cart-count]').forEach((el) => (el.textContent = cartCount(cart)));
  document.querySelectorAll('[data-cart-total]').forEach((el) => (el.textContent = formatCOP(cartTotal(cart))));
  // aria-label oculta el contador visible, así que debe decirlo él.
  cartLink.setAttribute('aria-label', `Ver pedido, ${cartCount(cart)} ${cartCount(cart) === 1 ? 'producto' : 'productos'}`);
  list.innerHTML = cart.length
    ? cart
        .map(
          (item, index) => `
      <div class="flex items-center justify-between bg-surface-container-low p-space-sm shadow-sm">
        <div class="flex flex-col min-w-0 pr-2">
          <span class="font-headline-sm text-body-sm uppercase text-ink-white truncate">${esc(item.name)}</span>
          <span class="font-label-code text-label-code text-gear-amber">${formatCOP(item.price)} c/u</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button aria-label="Quitar uno de ${esc(item.name)}" class="w-8 h-8 bg-surface-container flex items-center justify-center text-ink-white hover:bg-surface-bright text-xs font-bold" data-index="${index}" data-qty="-1" type="button">-</button>
          <span class="font-label-code text-label-code text-ink-white px-1 font-bold">${item.qty}</span>
          <button aria-label="Agregar uno de ${esc(item.name)}" class="w-8 h-8 bg-surface-container flex items-center justify-center text-ink-white hover:bg-surface-bright text-xs font-bold" data-index="${index}" data-qty="1" type="button">+</button>
        </div>
      </div>`,
        )
        .join('')
    : '<p class="font-body-sm text-body-sm text-outline text-center py-space-xl">Tu bandeja está vacía.<br>Agrega algún producto de la carta.</p>';
}

function setOpen(open) {
  if (open === !drawer.inert) return;
  if (open) returnFocus = document.activeElement;
  drawer.inert = !open;
  drawer.classList.toggle('translate-x-full', !open);
  backdrop.classList.toggle('hidden', !open);
  // Con la bandeja abierta, el teclado y el lector de pantalla no deben alcanzar el fondo.
  document.querySelectorAll('body > header, body > main, body > footer').forEach((el) => (el.inert = open));
  (open ? closeButton : returnFocus)?.focus({ preventScroll: true });
}

// Si el navegador bloquea la pestaña nueva, se abre en la misma: el mensaje no se pierde.
export function sendToWhatsApp(text) {
  const url = whatsappUrl(document.body.dataset.whatsapp, text);
  if (!window.open(url, '_blank')) location.href = url;
}

document.addEventListener('click', (event) => {
  if (!event.target.closest('header details')) mobileMenu.open = false;
  const target =event.target.closest('.add-to-cart-btn, [data-cart-open], [data-cart-close], [data-cart-send], [data-qty]');
  if (!target) return;

  if (target.matches('.add-to-cart-btn')) {
    addItem(cart, target.dataset.name, Number(target.dataset.price));
  } else if (target.matches('[data-qty]')) {
    changeQty(cart, Number(target.dataset.index), Number(target.dataset.qty));
  } else if (target.matches('[data-cart-close]')) {
    setOpen(false);
    return;
  } else if (target.matches('[data-cart-send]') && cart.length) {
    sendToWhatsApp(orderText(cart));
    return;
  } else if (target.matches('[data-cart-open]')) {
    event.preventDefault();
  }

  saveCart();
  render();
  setOpen(true);
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  setOpen(false);
  if (mobileMenu.open) {
    mobileMenu.open = false;
    mobileMenu.querySelector('summary').focus();
  }
});

render();
