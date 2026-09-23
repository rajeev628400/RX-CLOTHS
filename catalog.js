(function () {
  'use strict';

  const cartStorageKey = 'rx-cloths-cart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(cartStorageKey)) || [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  }

  function getCartCount(cart) {
    return cart.reduce(function (total, product) {
      return total + product.quantity;
    }, 0);
  }

  function getNumericPrice(price) {
    const numericPrice = Number(String(price).replace(/[^0-9.]/g, ''));
    return Number.isFinite(numericPrice) ? numericPrice : 0;
  }

  function formatPrice(price) {
    return `₹${price.toLocaleString('en-IN')}`;
  }

  function updateCartUI() {
    const cart = getCart();
    const count = getCartCount(cart);

    document.querySelectorAll('.cart-link b, .bag-circle').forEach(function (element) {
      element.textContent = count;
    });

    const emptyCart = document.querySelector('.empty-cart');

    if (!emptyCart) {
      return;
    }

    emptyCart.innerHTML = '';

    const bagCircle = document.createElement('div');
    bagCircle.className = 'bag-circle';
    bagCircle.textContent = count;
    emptyCart.appendChild(bagCircle);

    if (!cart.length) {
      const emptyTitle = document.createElement('h3');
      emptyTitle.textContent = 'Your cart is empty.';
      emptyCart.appendChild(emptyTitle);
      return;
    }

    const cartList = document.createElement('div');
    cartList.className = 'cart-items';

    cart.forEach(function (product) {
      const item = document.createElement('div');
      item.className = 'cart-item';
      const image = document.createElement('img');
      image.src = product.image;
      image.alt = product.name;

      const productInfo = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = product.name;
      const size = document.createElement('span');
      size.textContent = `Size: ${product.size || 'Not selected'}`;
      const price = document.createElement('span');
      price.textContent = `${product.price} x ${product.quantity}`;

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'remove-cart-item';
      removeButton.textContent = 'Remove';
      removeButton.addEventListener('click', function () {
        const updatedCart = getCart().filter(function (item) {
          return !(item.id === product.id && (item.size || '') === (product.size || ''));
        });
        saveCart(updatedCart);
        updateCartUI();
      });

      productInfo.append(name, size, price, removeButton);
      item.append(image, productInfo);
      cartList.appendChild(item);
    });

    emptyCart.appendChild(cartList);

    const subtotal = document.createElement('strong');
    subtotal.className = 'cart-subtotal';
    subtotal.textContent = `Subtotal: ${formatPrice(cart.reduce(function (total, product) {
      return total + getNumericPrice(product.price) * product.quantity;
    }, 0))}`;
    emptyCart.appendChild(subtotal);
  }

  function addToCart(product) {
    const cart = getCart();
    const existingProduct = cart.find(function (item) {
      return item.id === product.id && item.size === product.size;
    });

    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);
    updateCartUI();
  }

  function productFromCard(card) {
    const image = card.querySelector('img');
    const nameElement = card.querySelector('.product-info h3, .collection-info strong');
    const priceElement = card.querySelector('.product-info strong, .collection-info span');

    if (!image || !nameElement || !priceElement) {
      return null;
    }

    const name = nameElement.textContent.trim();
    const imagePath = image.getAttribute('src');
    const productId = imagePath.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const category = document.body.dataset.collection || 'rx cloths';

    return {
      id: productId,
      name: name,
      price: priceElement.textContent.trim(),
      image: imagePath,
      details: `${name} from the RX CLOTHS ${category} collection, designed for comfortable everyday styling.`
    };
  }

  function createProductModal() {
    const modal = document.createElement('section');
    modal.className = 'product-modal dynamic-product-modal';
    modal.setAttribute('aria-label', 'Product details');

    const card = document.createElement('div');
    card.className = 'modal-card';

    const image = document.createElement('img');
    image.className = 'dynamic-product-image';

    const content = document.createElement('div');
    content.className = 'modal-content';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow dark';

    const title = document.createElement('h2');
    const price = document.createElement('strong');
    price.className = 'modal-price';

    const details = document.createElement('p');
    const sizeLabel = document.createElement('p');
    sizeLabel.className = 'product-size-label';
    sizeLabel.textContent = 'Select size';

    const sizeOptions = document.createElement('div');
    sizeOptions.className = 'product-size-options';
    const sizes = ['S', 'M', 'L', 'XL'];
    const modalState = { selectedSize: '' };

    sizes.forEach(function (size) {
      const sizeButton = document.createElement('button');
      sizeButton.type = 'button';
      sizeButton.className = 'product-size-option';
      sizeButton.textContent = size;
      sizeButton.addEventListener('click', function () {
        modalState.selectedSize = size;
        sizeOptions.querySelectorAll('.product-size-option').forEach(function (option) {
          option.classList.toggle('selected', option === sizeButton);
        });
      });
      sizeOptions.appendChild(sizeButton);
    });

    const addButton = document.createElement('button');
    addButton.className = 'btn btn-blue modal-add-to-cart';
    addButton.type = 'button';
    addButton.textContent = 'Add to Bag';

    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close dynamic-modal-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close product details');
    closeButton.textContent = '×';

    content.append(eyebrow, title, price, details, sizeLabel, sizeOptions, addButton);
    card.append(image, content, closeButton);
    modal.appendChild(card);
    document.body.appendChild(modal);

    closeButton.addEventListener('click', function () {
      modal.classList.remove('is-open');
    });

    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        modal.classList.remove('is-open');
      }
    });

    return {
      modal: modal,
      image: image,
      eyebrow: eyebrow,
      title: title,
      price: price,
      details: details,
      addButton: addButton,
      state: modalState
    };
  }

  function setupProductDetails() {
    const productCards = document.querySelectorAll('.product, .shop-product-card, .collection-slot');
    const productModal = createProductModal();

    productCards.forEach(function (card) {
      const product = productFromCard(card);

      if (!product) {
        return;
      }

      card.dataset.productId = product.id;
      card.addEventListener('click', function (event) {
        if (event.target.closest('.add-to-cart')) {
          return;
        }

        event.preventDefault();
        productModal.image.src = product.image;
        productModal.image.alt = product.name;
        productModal.eyebrow.textContent = `RX CLOTHS / ${document.body.dataset.collection || 'COLLECTION'}`;
        productModal.title.textContent = product.name;
        productModal.price.textContent = product.price;
        productModal.details.textContent = product.details;
        productModal.state.selectedSize = '';
        productModal.modal.querySelectorAll('.product-size-option').forEach(function (option) {
          option.classList.remove('selected');
        });
        productModal.addButton.textContent = 'Add to Bag';
        productModal.addButton.onclick = function () {
          if (!productModal.state.selectedSize) {
            window.alert('Please select a size.');
            return;
          }

          addToCart({ ...product, size: productModal.state.selectedSize });
          productModal.addButton.textContent = 'Added to Bag';
        };
        productModal.modal.classList.add('is-open');
      });
    });

    document.querySelectorAll('.product a[href^="#"], .quick-view').forEach(function (link) {
      link.addEventListener('click', function (event) {
        event.preventDefault();
        link.closest('.product').click();
      });
    });
  }

  function setupCollectionCart() {
    document.querySelectorAll('.collection-slot').forEach(function (card) {
      const image = card.querySelector('img');
      const nameElement = card.querySelector('.collection-info strong');
      const priceElement = card.querySelector('.collection-info span');

      if (!image || !nameElement || !priceElement || card.querySelector('.add-to-cart')) {
        return;
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'add-to-cart';
      button.textContent = 'Add to Cart';
      button.addEventListener('click', function () {
        card.click();
      });

      card.appendChild(button);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('catalog-ready');
    setupCollectionCart();
    setupProductDetails();
    updateCartUI();
  });
}());
