/**
 * AURELLE - Luxury Handcrafted Accessories
 * Core Interactive Application Logic
 */

// Default curated products matching FORMAT.jpeg
const DEFAULT_PRODUCTS = [
  {
    id: 'prod-eden-bag',
    title: 'The Eden Bag',
    category: 'bags',
    price: 120.00,
    image: 'assets/eden_bag.jpg',
    contact: '+94 77 234 5678',
    whatsapp: '94772345678',
    tag: 'Best Seller',
    isUserItem: false,
    description: 'Signature architectural handbag hand-woven with luminous faux pearls and gold brass hardware clasp.'
  },
  {
    id: 'prod-midnight-purse',
    title: 'Midnight Purse',
    category: 'purses',
    price: 95.00,
    image: 'assets/midnight_purse.jpg',
    contact: '+94 77 234 5678',
    whatsapp: '94772345678',
    tag: 'Popular',
    isUserItem: false,
    description: 'Glamorous evening bag hand-beaded with obsidian black pearls, accompanied by a 14k gold-plated chain.'
  },
  {
    id: 'prod-daisy-pouch',
    title: 'Daisy Pouch',
    category: 'pouches',
    price: 45.00,
    image: 'assets/daisy_pouch.jpg',
    contact: '+94 77 234 5678',
    whatsapp: '94772345678',
    tag: 'Trending',
    isUserItem: false,
    description: 'Artisanal champagne silk clutch embroidered with delicate pearl daisy motifs and handcrafted tassel pull.'
  },
  {
    id: 'prod-lumiere-bracelet',
    title: 'Lumiere Bracelet',
    category: 'jewellery',
    price: 35.00,
    image: 'assets/lumiere_bracelet.jpg',
    contact: '+94 77 234 5678',
    whatsapp: '94772345678',
    tag: 'Handcrafted',
    isUserItem: false,
    description: 'Triple-tier natural freshwater pearl bracelet accented with gold faceted rondelle spacers and signature charm.'
  },
  {
    id: 'prod-gift-set',
    title: 'Aurelle Keepsake Box',
    category: 'giftsets',
    price: 165.00,
    image: 'assets/gift_sets.jpg',
    contact: '+94 77 234 5678',
    whatsapp: '94772345678',
    tag: 'Gift Set',
    isUserItem: false,
    description: 'Curated luxury presentation box containing a matching pearl pouch and Lumiere bracelet tied with silk ribbon.'
  }
];

// App State Management
class AurelleStore {
  constructor() {
    this.products = [];
    this.wishlist = new Set();
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.selectedProductForOrder = null;
    this.currentUploadedImageDataUrl = null;

    this.init();
  }

  init() {
    this.loadStorage();
    this.setupEventListeners();
    this.renderCatalog();
    this.updateCounters();
  }

  // Load user data from localStorage
  loadStorage() {
    try {
      const savedUserItems = localStorage.getItem('aurelle_user_items');
      const userItems = savedUserItems ? JSON.parse(savedUserItems) : [];
      this.products = [...userItems, ...DEFAULT_PRODUCTS];

      const savedWishlist = localStorage.getItem('aurelle_wishlist');
      if (savedWishlist) {
        this.wishlist = new Set(JSON.parse(savedWishlist));
      }
    } catch (e) {
      console.error('Failed to load local storage:', e);
      this.products = [...DEFAULT_PRODUCTS];
    }
  }

  saveUserItems() {
    const userItems = this.products.filter(p => p.isUserItem);
    try {
      localStorage.setItem('aurelle_user_items', JSON.stringify(userItems));
    } catch (e) {
      this.showToast('Storage limit reached. Please use a smaller image file.', 'error');
    }
  }

  saveWishlist() {
    try {
      localStorage.setItem('aurelle_wishlist', JSON.stringify(Array.from(this.wishlist)));
    } catch (e) {
      console.error(e);
    }
    this.updateCounters();
  }

  updateCounters() {
    const wishlistCountEl = document.getElementById('wishlist-count');
    if (wishlistCountEl) {
      wishlistCountEl.textContent = this.wishlist.size;
    }
  }

  // Event Listeners Setup
  setupEventListeners() {
    // Header scroll background effect
    window.addEventListener('scroll', () => {
      const header = document.querySelector('.header');
      if (header) {
        if (window.scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    });

    // Category filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeCategory = e.currentTarget.dataset.category;
        this.renderCatalog();
      });
    });

    // Category showcase cards click filter
    const catCards = document.querySelectorAll('.category-card');
    catCards.forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.dataset.category;
        this.activeCategory = cat;
        // update top pills
        filterBtns.forEach(b => {
          if (b.dataset.category === cat) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
        this.renderCatalog();
        const catalogSection = document.getElementById('catalog');
        if (catalogSection) {
          catalogSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Upload Item Modal toggles
    const openUploadBtns = document.querySelectorAll('.js-open-upload');
    const uploadModal = document.getElementById('upload-modal');
    const closeUploadBtn = document.getElementById('close-upload-modal');
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');

    openUploadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.openModal(uploadModal);
      });
    });

    if (closeUploadBtn) closeUploadBtn.addEventListener('click', () => this.closeModal(uploadModal));
    if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', () => this.closeModal(uploadModal));

    // Order Modal toggles
    const orderModal = document.getElementById('order-modal');
    const closeOrderBtn = document.getElementById('close-order-modal');
    if (closeOrderBtn) closeOrderBtn.addEventListener('click', () => this.closeModal(orderModal));

    // Close on backdrop click
    [uploadModal, orderModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) this.closeModal(modal);
        });
      }
    });

    // Upload Form File Drag & Drop + Input
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('item-image-file');
    const previewBox = document.getElementById('image-preview-box');
    const previewImg = document.getElementById('preview-image');
    const removePreviewBtn = document.getElementById('btn-remove-preview');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelected(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileSelected(e.target.files[0]);
        }
      });
    }

    if (removePreviewBtn) {
      removePreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.clearUploadedImage();
      });
    }

    // Upload Form Submission
    const uploadForm = document.getElementById('upload-item-form');
    if (uploadForm) {
      uploadForm.addEventListener('submit', (e) => this.handleUploadSubmit(e));
    }

    // Direct WhatsApp / Order submission inside Order Modal
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
      orderForm.addEventListener('submit', (e) => this.handleOrderSubmit(e));
    }

    // Search bar toggle & input
    const searchBtn = document.getElementById('search-toggle-btn');
    const searchBarContainer = document.getElementById('search-bar-container');
    const searchInput = document.getElementById('search-input');

    if (searchBtn && searchBarContainer) {
      searchBtn.addEventListener('click', () => {
        searchBarContainer.classList.toggle('active');
        if (searchBarContainer.classList.contains('active') && searchInput) {
          searchInput.focus();
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCatalog();
      });
    }

    // Newsletter submit demo
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.showToast('Thank you for subscribing to Aurelle Radiance!', 'success');
        newsletterForm.reset();
      });
    }
  }

  // Handle image file selection & resizing for crisp performance
  handleFileSelected(file) {
    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // Compress slightly to prevent localStorage quota issues
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        this.currentUploadedImageDataUrl = dataUrl;

        // Update UI
        const previewBox = document.getElementById('image-preview-box');
        const previewImg = document.getElementById('preview-image');
        const dropzone = document.getElementById('dropzone');

        if (previewImg) previewImg.src = dataUrl;
        if (previewBox) previewBox.style.display = 'block';
        if (dropzone) dropzone.style.display = 'none';
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  clearUploadedImage() {
    this.currentUploadedImageDataUrl = null;
    const previewBox = document.getElementById('image-preview-box');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('item-image-file');

    if (previewBox) previewBox.style.display = 'none';
    if (dropzone) dropzone.style.display = 'block';
    if (fileInput) fileInput.value = '';
  }

  // Handle adding a new item
  handleUploadSubmit(e) {
    e.preventDefault();

    if (!this.currentUploadedImageDataUrl) {
      this.showToast('Please upload an image of the item.', 'error');
      return;
    }

    const title = document.getElementById('item-title').value.trim();
    const category = document.getElementById('item-category').value;
    const price = parseFloat(document.getElementById('item-price').value);
    const contact = document.getElementById('item-contact').value.trim();
    const description = document.getElementById('item-description').value.trim();

    if (!title || isNaN(price) || !contact) {
      this.showToast('Please fill in the item name, price, and contact number.', 'error');
      return;
    }

    // Clean phone number for WhatsApp
    const rawDigits = contact.replace(/[^0-9]/g, '');

    const newItem = {
      id: 'user-item-' + Date.now(),
      title: title,
      category: category,
      price: price,
      image: this.currentUploadedImageDataUrl,
      contact: contact,
      whatsapp: rawDigits,
      tag: 'New Piece',
      isUserItem: true,
      description: description || 'Artisanal handcrafted piece created with bespoke detailing.'
    };

    // Prepend new item
    this.products.unshift(newItem);
    this.saveUserItems();

    // Reset form & close modal
    e.target.reset();
    this.clearUploadedImage();
    const uploadModal = document.getElementById('upload-modal');
    this.closeModal(uploadModal);

    // Switch view to Show All or specific category
    this.activeCategory = 'all';
    document.querySelectorAll('.filter-btn').forEach(b => {
      if (b.dataset.category === 'all') b.classList.add('active');
      else b.classList.remove('active');
    });

    this.renderCatalog();
    this.showToast(`"${title}" has been successfully added to Aurelle!`, 'success');

    // Scroll to catalog
    const catalog = document.getElementById('catalog');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Delete an item added by user
  deleteProduct(id) {
    if (confirm('Are you sure you want to remove this item from the collection?')) {
      this.products = this.products.filter(p => p.id !== id);
      this.saveUserItems();
      this.renderCatalog();
      this.showToast('Item removed from collection.', 'info');
    }
  }

  // Open Order Modal for an item
  openOrderModal(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    this.selectedProductForOrder = product;

    // Populate order modal details
    const orderModal = document.getElementById('order-modal');
    const thumb = document.getElementById('order-modal-thumb');
    const title = document.getElementById('order-modal-title');
    const price = document.getElementById('order-modal-price');
    const contactText = document.getElementById('order-modal-contact-number');
    const whatsappBtn = document.getElementById('btn-order-whatsapp-direct');
    const callBtn = document.getElementById('btn-order-call-direct');

    if (thumb) thumb.src = product.image;
    if (title) title.textContent = product.title;
    if (price) price.textContent = `$${product.price.toFixed(2)}`;
    if (contactText) contactText.textContent = product.contact;

    const message = encodeURIComponent(`Hello Aurelle! I would like to order "${product.title}" ($${product.price.toFixed(2)}). Please provide availability and payment/delivery details.`);
    
    if (whatsappBtn) {
      whatsappBtn.href = `https://wa.me/${product.whatsapp}?text=${message}`;
      whatsappBtn.target = '_blank';
    }

    if (callBtn) {
      callBtn.href = `tel:${product.contact.replace(/\s+/g, '')}`;
    }

    this.openModal(orderModal);
  }

  // Quick WhatsApp order from the card
  quickWhatsAppOrder(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const message = encodeURIComponent(`Hello Aurelle! I am interested in ordering "${product.title}" priced at $${product.price.toFixed(2)}. Could you share ordering details?`);
    window.open(`https://wa.me/${product.whatsapp}?text=${message}`, '_blank');
  }

  // Handle in-modal custom checkout submission
  handleOrderSubmit(e) {
    e.preventDefault();
    if (!this.selectedProductForOrder) return;

    const customerName = document.getElementById('customer-name').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    const customerAddress = document.getElementById('customer-address').value.trim();
    const customerNotes = document.getElementById('customer-notes').value.trim();

    const product = this.selectedProductForOrder;

    let text = `*New Order Request - Aurelle*\n`;
    text += `Item: ${product.title} ($${product.price.toFixed(2)})\n`;
    text += `Customer Name: ${customerName}\n`;
    text += `Contact Number: ${customerPhone}\n`;
    if (customerAddress) text += `Delivery Address: ${customerAddress}\n`;
    if (customerNotes) text += `Special Requests: ${customerNotes}\n`;

    const encoded = encodeURIComponent(text);
    const orderModal = document.getElementById('order-modal');
    this.closeModal(orderModal);
    e.target.reset();

    this.showToast('Redirecting to WhatsApp to finalize your handcrafted order...', 'success');
    setTimeout(() => {
      window.open(`https://wa.me/${product.whatsapp}?text=${encoded}`, '_blank');
    }, 600);
  }

  // Wishlist toggle
  toggleWishlist(productId, btnElement) {
    if (this.wishlist.has(productId)) {
      this.wishlist.delete(productId);
      if (btnElement) btnElement.classList.remove('active');
      this.showToast('Removed from your wishlist.', 'info');
    } else {
      this.wishlist.add(productId);
      if (btnElement) btnElement.classList.add('active');
      this.showToast('Saved to your wishlist ✦', 'success');
    }
    this.saveWishlist();
  }

  // Render Product Catalog Cards
  renderCatalog() {
    const container = document.getElementById('products-grid');
    if (!container) return;

    let filtered = this.products;

    // Filter by Category
    if (this.activeCategory !== 'all') {
      if (this.activeCategory === 'user-items') {
        filtered = filtered.filter(p => p.isUserItem);
      } else {
        filtered = filtered.filter(p => p.category === this.activeCategory);
      }
    }

    // Filter by Search Query
    if (this.searchQuery) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(this.searchQuery) ||
        p.category.toLowerCase().includes(this.searchQuery) ||
        p.description.toLowerCase().includes(this.searchQuery) ||
        p.contact.toLowerCase().includes(this.searchQuery)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✦</div>
          <h3 class="empty-state-title">No Pieces Found</h3>
          <p style="color: var(--text-muted); margin-bottom: 20px;">
            We couldn't find any creations matching your selection.
          </p>
          <button class="btn-primary js-open-upload">
            + Upload The First Item
          </button>
        </div>
      `;
      // re-attach upload trigger
      container.querySelector('.js-open-upload')?.addEventListener('click', () => {
        this.openModal(document.getElementById('upload-modal'));
      });
      return;
    }

    container.innerHTML = filtered.map(product => {
      const isWishlisted = this.wishlist.has(product.id);
      const categoryLabel = this.getCategoryLabel(product.category);

      return `
        <article class="product-card ${product.isUserItem ? 'is-user-item' : ''}" data-id="${product.id}">
          <div class="product-image-container">
            <img src="${product.image}" alt="${product.title}" class="product-image" loading="lazy">
            <span class="product-tag ${product.isUserItem ? 'tag-user' : ''}">${product.tag || 'Handmade'}</span>
            <button class="btn-wishlist ${isWishlisted ? 'active' : ''}" 
                    aria-label="Save to Wishlist" 
                    onclick="window.aurelle.toggleWishlist('${product.id}', this)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            ${product.isUserItem ? `
              <button class="btn-delete-card" title="Delete Uploaded Item" onclick="window.aurelle.deleteProduct('${product.id}')">
                ✕
              </button>
            ` : ''}
          </div>

          <div class="product-info">
            <div class="product-category-meta">${categoryLabel}</div>
            <h3 class="product-title">${product.title}</h3>
            
            <div class="product-price-row">
              <span class="product-price">$${product.price.toFixed(2)}</span>
            </div>

            <div class="product-contact-badge" title="Order Contact Number">
              <svg viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span>${product.contact}</span>
            </div>

            <div class="product-card-actions">
              <button class="btn-order-card" onclick="window.aurelle.openOrderModal('${product.id}')">
                Order Piece →
              </button>
              <button class="btn-whatsapp-quick" title="Order via WhatsApp" onclick="window.aurelle.quickWhatsAppOrder('${product.id}')">
                <svg viewBox="0 0 24 24">
                  <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.19.53-1.06 1.04-1.47 1.08-.38.03-.89.06-2.88-.72-1.7-.67-2.8-2.4-2.88-2.52-.08-.11-.69-.92-.69-1.75 0-.83.43-1.24.58-1.41.16-.17.35-.22.46-.22.12 0 .24 0 .34.01.11.01.26-.04.41.31.15.36.52 1.27.57 1.36.05.1.08.21.01.33-.06.12-.1.2-.2.31-.1.11-.21.25-.3.33-.1.1-.21.21-.09.41.12.21.54.89 1.16 1.44.8.71 1.47.93 1.68 1.04.21.1.33.09.45-.05.12-.14.52-.61.66-.82.14-.21.28-.18.47-.11.19.07 1.21.57 1.42.67.21.1.35.15.4.24.05.09.05.52-.14 1.05z"/>
                </svg>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  getCategoryLabel(cat) {
    const map = {
      'bags': 'Handcrafted Bags',
      'purses': 'Evening Purses',
      'pouches': 'Embroidered Pouches',
      'jewellery': 'Artisan Jewellery',
      'giftsets': 'Curated Gift Sets'
    };
    return map[cat] || 'Accessories';
  }

  // Modal helpers
  openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Toast notification
  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>✦</span>
      <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(60px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.aurelle = new AurelleStore();
});
