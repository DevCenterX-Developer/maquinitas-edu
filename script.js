/* =========================================
   SCRIPT.JS - Lógica JavaScript Principal
   Máquinas EDU GT
   ========================================= */

// =========================================
// VARIABLES GLOBALES
// =========================================
let servicesData = [];
let activeCategoryFilter = '';
let searchQuery = '';
let isLoading = false;
let lastScrollY = 0;
let isMobileMenuOpen = false;
let currentImageIndex = 0;
let currentImages = [];
const VENTAS_PHONE = '50246690856';
const CATALOGO_URL = 'https://wa.me/c/50246690856';

// =========================================
// INICIALIZACIÓN
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    initTheme();
    initScrollEffects();
    initSearch();
    initMobileMenu();
    initAnimations();
    initProductModal();
    initSmoothScroll();
    initLazyLoading();
    initTouchGestures();
    initKeyboardShortcuts();
    initCopyToClipboard();
    initParallaxEffect();
    initCounterAnimation();
    initFormValidation();
    initNotificationSystem();
}

// =========================================
// TEMA AUTOMÁTICO (DÍA/NoCHE)
// =========================================
function initTheme() {
    const shouldBeDark = isNightTime();
    if (shouldBeDark) {
        document.documentElement.classList.add('dark-mode');
    }
    updateThemeBtn(shouldBeDark);
    
    setInterval(() => {
        const shouldBeDarkNow = isNightTime();
        const isCurrentlyDark = document.documentElement.classList.contains('dark-mode');
        if (shouldBeDarkNow !== isCurrentlyDark) {
            document.documentElement.classList.toggle('dark-mode');
            updateThemeBtn(shouldBeDarkNow);
        }
    }, 60000);
}

function isNightTime() {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeBtn(isDark);
    showNotification(isDark ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado');
}

function updateThemeBtn(isDark) {
    const btn = document.getElementById('theme-btn');
    if (!btn) return;
    btn.innerHTML = isDark ?
        '<i class="fa-solid fa-sun fa-fw" aria-hidden="true"></i>' :
        '<i class="fa-solid fa-moon fa-fw" aria-hidden="true"></i>';
}

// =========================================
// EFECTOS DE SCROLL
// =========================================
function initScrollEffects() {
    const header = document.getElementById('main-header');
    if (!header) return;
    
    let lastPos = 0;
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const top = window.pageYOffset;
                
                if (top > lastPos && top > 100) {
                    header.classList.add('header-hidden');
                } else {
                    header.classList.remove('header-hidden');
                }
                
                if (top > 50) {
                    header.classList.add('header-scrolled');
                } else {
                    header.classList.remove('header-scrolled');
                }
                
                lastPos = top;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// =========================================
// BÚSQUEDA DE PRODUCTOS
// =========================================
function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderProducts();
        }, 300);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchQuery = e.target.value.toLowerCase().trim();
            renderProducts();
        }
    });
}

// =========================================
// MENÚ MÓVIL
// =========================================
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');
    
    if (menuBtn && navActions) {
        menuBtn.addEventListener('click', () => {
            navActions.classList.toggle('mobile-open');
            isMobileMenuOpen = !isMobileMenuOpen;
            menuBtn.setAttribute('aria-expanded', isMobileMenuOpen);
        });
    }
    
    document.addEventListener('click', (e) => {
        if (isMobileMenuOpen && !e.target.closest('.nav-actions') && !e.target.closest('#mobile-menu-btn')) {
            navActions?.classList.remove('mobile-open');
            isMobileMenuOpen = false;
        }
    });
}

// =========================================
// ANIMACIONES
// =========================================
function initAnimations() {
    const animatedElements = document.querySelectorAll('.hero-title, .hero-description, .hero-actions, .hero-visual');
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `all 0.6s ease ${index * 0.1}s`;
    });
    
    setTimeout(() => {
        animatedElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }, 100);
    
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .nav-cta');
    buttons.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
        });
    });
}

// =========================================
// MODAL DE PRODUCTO
// =========================================
function initProductModal() {
    const modal = document.getElementById('product-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProductDetail);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProductDetail();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeProductDetail();
        }
    });
}

function showProductDetail(id) {
    const item = servicesData.find(s => s.id === id);
    if (!item) return;

    const hasDiscount = Number(item.descuento) > 0;
    const price = Number(item.precio) || 0;
    const finalPrice = hasDiscount ? price * (1 - Number(item.descuento) / 100) : price;
    const mainImg = document.getElementById('modal-img');
    currentImages = [item.image, item.image1, item.image2, item.image3, item.image4, item.image5].filter(Boolean);
    currentImageIndex = 0;
    const imageUrl = currentImages[0] || 'https://via.placeholder.com/600';
    mainImg.src = imageUrl;

    const thumbContainer = document.getElementById('modal-thumbnails');
    thumbContainer.innerHTML = '';
    if (currentImages.length > 1) {
        currentImages.forEach((url, i) => {
            const t = document.createElement('img');
            t.src = url;
            t.className = `thumbnail-img ${i === 0 ? 'active' : ''}`;
            t.onclick = () => {
                currentImageIndex = i;
                updateMainImage();
            };
            thumbContainer.appendChild(t);
        });
    }

    document.getElementById('modal-title').innerText = item.name || 'Producto';
    document.getElementById('modal-current-price').innerText = formatCurrency(finalPrice);
    document.getElementById('modal-category').innerText = (item.categoria && item.categoria.trim() !== '') ? item.categoria : 'Producto Educativo';
    const defaultDesc = 'Equipo educativo con información actual y contenido claro para usuarios.';
    document.getElementById('modal-description').innerText = (item.desc && item.desc.trim() !== '') ? item.desc : defaultDesc;

    const stockBox = document.getElementById('modal-stock');
    const stockValue = item.stock === null || item.stock === undefined || item.stock === '' ? 0 : item.stock;
    stockBox.innerHTML = `Stock disponible: <span class="modal-stock-number">${stockValue}</span>`;
    stockBox.style.display = 'block';

    const oldPrice = document.getElementById('modal-old-price');
    const discount = document.getElementById('modal-discount');
    if (hasDiscount) {
        oldPrice.innerText = formatCurrency(price);
        oldPrice.style.display = 'block';
        discount.innerText = `${item.descuento}% OFF`;
        discount.style.display = 'inline-block';
    } else {
        oldPrice.style.display = 'none';
        discount.style.display = 'none';
    }

    const msg = encodeURIComponent(`Hola, quería consultar por ${item.name || 'producto'}, stock: ${stockValue}`);
    document.getElementById('btn-comprar').href = `https://wa.me/${VENTAS_PHONE}?text=${msg}`;
    document.getElementById('btn-contactar').href = `https://wa.me/message/SMZS6OPOZLO3E1`;

    document.getElementById('product-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    document.getElementById('product-modal').scrollTop = 0;
}

function closeProductDetail() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function updateMainImage() {
    const mainImg = document.getElementById('modal-img');
    mainImg.style.opacity = '0.5';
    setTimeout(() => {
        mainImg.src = currentImages[currentImageIndex];
        mainImg.style.opacity = '1';
    }, 150);
    document.querySelectorAll('.thumbnail-img').forEach((el, i) => {
        el.classList.toggle('active', i === currentImageIndex);
    });
}

function changeImage(direction) {
    if (currentImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + direction + currentImages.length) % currentImages.length;
    updateMainImage();
}

// =========================================
// SCROLL SUAVE
// =========================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// =========================================
// LAZY LOADING DE IMÁGENES
// =========================================
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// =========================================
// GESTOS TÁCTILES
// =========================================
function initTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
            if (diffX > 0) {
                changeImage(1);
            } else {
                changeImage(-1);
            }
        }
    }
}

// =========================================
// ATAJOS DE TECLADO
// =========================================
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
            case 't':
            case 'T':
                toggleTheme();
                break;
            case 'Escape':
                closeProductDetail();
                break;
            case 'ArrowLeft':
                if (document.getElementById('product-modal')?.style.display === 'block') {
                    changeImage(-1);
                }
                break;
            case 'ArrowRight':
                if (document.getElementById('product-modal')?.style.display === 'block') {
                    changeImage(1);
                }
                break;
        }
    });
}

// =========================================
// COPIAR AL PORTAPAPELES
// =========================================
function initCopyToClipboard() {
    document.querySelectorAll('[data-copy]').forEach(element => {
        element.addEventListener('click', async () => {
            const text = element.dataset.copy;
            try {
                await navigator.clipboard.writeText(text);
                showNotification('📋 Copiado al portapapeles');
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        });
    });
}

// =========================================
// EFECTO PARALLAX
// =========================================
function initParallaxEffect() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        hero.style.backgroundPositionY = `${rate}px`;
    }, { passive: true });
}

// =========================================
// ANIMACIÓN DE CONTADORES
// =========================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-counter]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.dataset.counter);
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;
                
                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

// =========================================
// VALIDACIÓN DE FORMULARIOS
// =========================================
function initFormValidation() {
    const forms = document.querySelectorAll('[data-validate]');
    
    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const required = form.querySelectorAll('[required]');
            let isValid = true;
            
            required.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                } else {
                    field.classList.remove('error');
                }
            });
            
            if (isValid) {
                showNotification('✅ Formulario enviado correctamente');
            } else {
                showNotification('⚠️ Por favor complete todos los campos');
            }
        });
    });
}

// =========================================
// SISTEMA DE NOTIFICACIONES
// =========================================
function initNotificationSystem() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(container);
}

function showNotification(message, duration = 3000) {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: linear-gradient(135deg, #22d3ee, #818cf8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
    `;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// =========================================
// FORMATO DE MONEDA
// =========================================
function formatCurrency(val) {
    return new Intl.NumberFormat('es-CO', { 
        style: 'currency', 
        currency: 'COP', 
        maximumFractionDigits: 0 
    }).format(Number(val) || 0);
}

// =========================================
// RENDERIZADO DE PRODUCTOS
// =========================================
function renderProducts() {
    const grid = document.getElementById('products-grid');
    const selectedCategory = document.getElementById('category-select').value.toLowerCase().trim();
    grid.innerHTML = '';

    const filtered = servicesData.filter(item => {
        const categoryMatch = selectedCategory ? ((item.categoria || '').toLowerCase() === selectedCategory) : true;
        return categoryMatch;
    });

    if (filtered.length === 0) {
        const message = selectedCategory ? `No se encontraron productos en la categoría "${selectedCategory}".` : 'No se encontraron productos.';
        grid.innerHTML = `<div class="loading-text" style="grid-column: 1/-1;">${message}</div>`;
        return;
    }

    filtered.forEach(item => {
        const hasDiscount = Number(item.descuento) > 0;
        const price = Number(item.precio) || 0;
        const finalPrice = hasDiscount ? price * (1 - Number(item.descuento) / 100) : price;
        const imageUrl = item.image || item.imagen || 'https://via.placeholder.com/400';

        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.onclick = () => showProductDetail(item.id);
        card.innerHTML = `
            ${hasDiscount ? `<div class="discount-badge">-${item.descuento}%</div>` : ''}
            <img src="${imageUrl}" class="product-image" onerror="this.src='https://via.placeholder.com/400'">
            <div class="product-info">
                <h3 class="product-title">${item.name || 'Producto sin nombre'}</h3>
                <span class="product-category-tag">${item.categoria || 'Sin categoría'}</span>
                <div class="product-price">${formatCurrency(finalPrice)}</div>
            </div>`;
        grid.appendChild(card);
    });
}

// =========================================
// CATEGORÍAS
// =========================================
function renderCategoryChips() {
    const container = document.querySelector('.category-filter');
    if (!container) return;
    
    const categories = [
        'Todas',
        'Maquinas arcade',
        'Maquinas xbox 360',
        'Maquinas vending',
        'Accesorios',
        'Repuestos',
        'Maquinas pelucheras',
        'Producto variado',
        'Consolas',
        'Controles',
        'Reparaciones',
        'Sistemas'
    ];
    
    container.innerHTML = categories.map((cat, index) => `
        <button type="button" class="category-chip ${index === 0 ? 'active' : ''}" 
                data-category="${index === 0 ? '' : cat.toLowerCase()}">
            ${cat}
        </button>
    `).join('');
    
    container.addEventListener('click', (e) => {
        const button = e.target.closest('.category-chip');
        if (!button) return;
        
        document.querySelectorAll('.category-chip').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        activeCategoryFilter = button.dataset.category || '';
        renderProducts();
    });
}

function populateCategorySelect() {
    const select = document.getElementById('category-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">Todas las categorías</option>';
    
    const uniqueCategories = [...new Set(servicesData.map(item => item.categoria).filter(cat => cat))];
    
    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.toLowerCase();
        option.textContent = category;
        select.appendChild(option);
    });
}

// =========================================
// CATÁLOGO
// =========================================
function openCatalog() {
    window.open(CATALOGO_URL, '_blank');
}

// =========================================
// WHATSAPP
// =========================================
function initWhatsApp() {
    const btn = document.getElementById('btn-contactar');
    if (btn) {
        btn.href = `https://wa.me/message/SMZS6OPOZLO3E1`;
    }
}

// =========================================
// UTILIDADES
// =========================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// =========================================
// EXPORTAR FUNCIONES GLOBALES
// =========================================
window.toggleTheme = toggleTheme;
window.openCatalog = openCatalog;
window.showProductDetail = showProductDetail;
window.closeProductDetail = closeProductDetail;
window.renderProducts = renderProducts;
window.changeImage = changeImage;
window.formatCurrency = formatCurrency;