/**
 * ========================================
 * JAVASCRIPT - Panel de Administración
 * Máquinas EDU GT
 * ========================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// ========================================
// CONFIGURACIÓN DE FIREBASE
// ========================================
const firebaseConfig = {
    apiKey: "AIzaSyBGM_uhBQrcb0tJbFGgjYbAwMlxvLMAQEo",
    authDomain: "maquinitas-edu.firebaseapp.com",
    projectId: "maquinitas-edu",
    storageBucket: "maquinitas-edu.firebasestorage.app",
    messagingSenderId: "787575674360",
    appId: "1:787575674360:web:105a03c7f688e226a3720d"
};

// ========================================
// CONFIGURACIÓN DE CLOUDINARY
// ========================================
const cloudName = 'dxo5hsyne';
const apiKey = '259528425163714';
const apiSecret = 'hRsU-ZvQN9WnuHoGmXNaf_79w7c';

// ========================================
// INICIALIZACIÓN DE FIREBASE
// ========================================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsCollection = collection(db, 'productos');

// ========================================
// VARIABLES GLOBALES
// ========================================
let imageMethod = 'file';
let currentProductId = null;
let currentImageUrl = '';
let uploadedImages = [];

// ========================================
// ELEMENTOS DEL DOM
// ========================================
const msgBox = document.getElementById('msg-box');
const form = document.getElementById('admin-form');
const imagesPreview = document.getElementById('images-preview');
const uploadArea = document.getElementById('upload-area');

// ========================================
// OBTENER INPUTS DE IMÁGENES
// ========================================
const imageInputs = [];
for (let i = 1; i <= 5; i++) {
    imageInputs.push({
        file: document.getElementById(`image${i}-file`),
        url: document.getElementById(`image${i}-url`)
    });
}

// ========================================
// FUNCIONES DE MÉTODO (ARCHIVO/URL)
// ========================================
function setMethod(method) {
    imageMethod = method;
    
    // Actualizar botones
    const buttons = document.querySelectorAll('.method-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(method === 'file' ? 'archivo' : 'url')) {
            btn.classList.add('active');
        }
    });
    
    // Mostrar/ocultar contenedores
    const fileContainer = document.querySelector('.file-inputs-container');
    const urlContainer = document.querySelector('.url-inputs-container');
    
    if (fileContainer && urlContainer) {
        fileContainer.style.display = method === 'file' ? 'block' : 'none';
        urlContainer.style.display = method === 'url' ? 'block' : 'none';
    }
    
    // Mostrar/ocultar área de upload
    if (uploadArea) {
        uploadArea.style.display = method === 'file' ? 'block' : 'none';
    }
    
    // Actualizar visibilidad de inputs
    imageInputs.forEach(input => {
        if (input.file) input.file.style.display = method === 'file' ? 'block' : 'none';
        if (input.url) input.url.style.display = method === 'url' ? 'block' : 'none';
    });
    
    updatePreview();
}

// ========================================
// ACTUALIZAR PREVIEW DE IMÁGENES
// ========================================
function updatePreview() {
    if (!imagesPreview) return;
    
    imagesPreview.innerHTML = '';
    const images = [];
    
    imageInputs.forEach((input, idx) => {
        let value = null;
        
        if (imageMethod === 'file') {
            if (input.file && input.file.files[0]) {
                value = {
                    file: input.file.files[0],
                    preview: URL.createObjectURL(input.file.files[0])
                };
            }
        } else {
            if (input.url && input.url.value.trim()) {
                value = input.url.value.trim();
            }
        }
        
        if (value) {
            images.push({
                src: imageMethod === 'file' ? value.preview : value,
                index: idx + 1,
                isFile: imageMethod === 'file'
            });
        }
    });
    
    // Actualizar contador
    let counter = document.getElementById('image-counter');
    if (!counter) {
        counter = document.createElement('div');
        counter.id = 'image-counter';
        counter.className = 'image-counter';
        imagesPreview.appendChild(counter);
    }
    counter.textContent = `${images.length} imagen${images.length !== 1 ? 'es' : ''} seleccionada${images.length !== 1 ? 's' : ''}`;
    
    // Crear previews
    images.forEach((img) => {
        const container = document.createElement('div');
        container.className = 'image-preview-item';
        
        const thumbnail = document.createElement('img');
        thumbnail.src = img.src;
        thumbnail.alt = `Imagen ${img.index}`;
        
        const badge = document.createElement('span');
        badge.className = 'image-badge';
        badge.textContent = img.index;
        
        container.appendChild(thumbnail);
        container.appendChild(badge);
        
        imagesPreview.appendChild(container);
    });
    
    // Actualizar preview lateral
    if (images.length > 0) {
        const img = document.getElementById('ui-img');
        const placeholder = document.getElementById('ui-placeholder');
        if (img && placeholder) {
            img.src = images[0].src;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        }
    } else {
        const img = document.getElementById('ui-img');
        const placeholder = document.getElementById('ui-placeholder');
        if (img) img.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
    }
}

// ========================================
// DRAG AND DROP
// ========================================
if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            handleDroppedFiles(files);
        }
    });
}

// ========================================
// MANEJAR ARCHIVOS SOLTADOS
// ========================================
function handleDroppedFiles(files) {
    // Limitar a 5 archivos
    const maxFiles = 5;
    const filesToUse = files.slice(0, maxFiles);
    
    // Asignar archivos a los inputs
    filesToUse.forEach((file, idx) => {
        if (imageInputs[idx] && imageInputs[idx].file) {
            // Crear un DataTransfer para asignar el archivo
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInputs[idx].file.files = dataTransfer.files;
        }
    });
    
    // Si hay más archivos de los disponibles, mostrar advertencia
    if (files.length > maxFiles) {
        showMessage(`Solo se pueden seleccionar máximo ${maxFiles} imágenes.`, 'error');
    }
    
    updatePreview();
}

// ========================================
// EVENT LISTENERS PARA INPUTS
// ========================================
imageInputs.forEach(input => {
    if (input.file) {
        input.file.addEventListener('change', updatePreview);
    }
    if (input.url) {
        input.url.addEventListener('input', updatePreview);
    }
});

// ========================================
// RESETEAR FORMULARIO
// ========================================
function resetForm() {
    currentProductId = null;
    currentImageUrl = '';
    
    // Limpiar campos del formulario
    const nameEl = document.getElementById('name');
    const categoriaEl = document.getElementById('categoria');
    const descEl = document.getElementById('desc');
    const precioEl = document.getElementById('precio');
    const descuentoEl = document.getElementById('descuento');
    
    if (nameEl) nameEl.value = '';
    if (categoriaEl) categoriaEl.value = '';
    if (descEl) descEl.value = '';
    if (precioEl) precioEl.value = '';
    if (descuentoEl) descuentoEl.value = '0';
    
    // Limpiar todos los campos de imagen
    imageInputs.forEach(input => {
        if (input.file) input.file.value = '';
        if (input.url) input.url.value = '';
    });
    
    setMethod('file');
    updatePreview();
    
    // Actualizar UI
    const formTitle = document.getElementById('form-title');
    const formDesc = document.getElementById('form-desc');
    const btnSave = document.getElementById('btn-save');
    const btnCancel = document.getElementById('btn-cancel-edit');
    
    if (formTitle) formTitle.innerText = 'Nuevo Producto';
    if (formDesc) formDesc.innerText = 'Completa los datos para publicar un nuevo producto en la tienda.';
    if (btnSave) btnSave.innerText = 'Guardar producto';
    if (btnCancel) btnCancel.style.display = 'none';
    
    // Resetear preview
    const uiName = document.getElementById('ui-name');
    const uiPrice = document.getElementById('ui-price');
    if (uiName) uiName.innerText = 'Producto';
    if (uiPrice) uiPrice.innerText = '$0';
}

// ========================================
// FIRMA DE CLOUDINARY
// ========================================
async function cloudinarySignature(timestamp) {
    const toSign = `timestamp=${timestamp}${apiSecret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(toSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========================================
// SUBIR IMAGEN A CLOUDINARY
// ========================================
async function uploadImageToCloudinary(file) {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await cloudinarySignature(timestamp);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    
    const response = await fetch(url, {
        method: 'POST',
        body: formData,
    });
    
    if (!response.ok) {
        throw new Error('Error subiendo imagen a Cloudinary');
    }
    
    return response.json();
}

// ========================================
// MANEJAR ENVÍO DEL FORMULARIO
// ========================================
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!msgBox) return;
    msgBox.style.display = 'none';
    
    const btn = document.getElementById('btn-save');
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> ' + (currentProductId ? 'Actualizando...' : 'Guardando...');
    
    try {
        const images = [];
        
        if (imageMethod === 'file') {
            // Subir archivos a Cloudinary
            for (const input of imageInputs) {
                if (input.file && input.file.files[0]) {
                    const upload = await uploadImageToCloudinary(input.file.files[0]);
                    images.push(upload.secure_url);
                }
            }
        } else {
            // Usar URLs directamente
            for (const input of imageInputs) {
                const url = input.url ? input.url.value.trim() : '';
                if (url) {
                    images.push(url);
                }
            }
        }
        
        // Validar que haya al menos una imagen (para productos nuevos)
        if (!currentProductId && images.length === 0) {
            throw new Error('Debe seleccionar al menos una imagen.');
        }
        
        // Obtener valores del formulario
        const nameEl = document.getElementById('name');
        const categoriaEl = document.getElementById('categoria');
        const descEl = document.getElementById('desc');
        const precioEl = document.getElementById('precio');
        const descuentoEl = document.getElementById('descuento');
        
        const product = {
            name: nameEl ? nameEl.value.trim() : '',
            categoria: categoriaEl ? categoriaEl.value.trim() : '',
            desc: descEl ? descEl.value.trim() : '',
            precio: Number(precioEl ? precioEl.value : 0) || 0,
            descuento: Number(descuentoEl ? descuentoEl.value : 0) || 0,
            image: images[0] || '',
            image1: images[1] || '',
            image2: images[2] || '',
            image3: images[3] || '',
            image4: images[4] || '',
            image5: images[5] || ''
        };
        
        // Guardar o actualizar producto
        if (currentProductId) {
            await updateDoc(doc(db, 'productos', currentProductId), product);
            showMessage('Producto actualizado correctamente.', 'success');
        } else {
            await addDoc(productsCollection, product);
            showMessage('Producto creado correctamente.', 'success');
        }
        
        resetForm();
        refreshProducts();
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        
        if (error.message.includes('unavailable') || error.message.includes('network')) {
            showMessage('Error de conexión. Verifica tu conexión a internet.', 'error');
        } else {
            showMessage(error.message, 'error');
        }
    } finally {
        btn.disabled = false;
        btn.innerText = currentProductId ? 'Actualizar producto' : 'Guardar producto';
    }
}

// ========================================
// MOSTRAR MENSAJE
// ========================================
function showMessage(message, type) {
    if (!msgBox) return;
    
    msgBox.innerText = message;
    msgBox.className = `msg ${type}`;
    msgBox.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        msgBox.style.display = 'none';
    }, 5000);
}

// ========================================
// REFRESCAR LISTA DE PRODUCTOS
// ========================================
async function refreshProducts() {
    const list = document.getElementById('product-list');
    if (!list) {
        console.error('Elemento product-list no encontrado');
        return;
    }
    
    list.innerHTML = '<p style="color: var(--text-gray); font-style: italic;">Cargando productos...</p>';
    
    try {
        const snapshot = await getDocs(query(productsCollection, orderBy('name', 'asc')));
        
        if (snapshot.empty) {
            list.innerHTML = '<p style="color: var(--text-gray); font-style: italic;">No hay productos registrados.</p>';
            return;
        }
        
        list.innerHTML = '';
        
        snapshot.forEach(doc => {
            const item = doc.data();
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <img src="${item.image || 'https://via.placeholder.com/100'}" 
                     onerror="this.src='https://via.placeholder.com/100?text=Error'" 
                     alt="${item.name || 'Producto'}">
                <div class="item-info">
                    <h4>${item.name || 'Sin nombre'}</h4>
                    <p>${item.categoria || ''}</p>
                </div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" type="button" onclick="editProduct('${doc.id}')">
                        <i class="fa-solid fa-pen"></i> EDITAR
                    </button>
                    <button class="action-btn delete-btn" type="button" onclick="deleteProduct('${doc.id}')">
                        <i class="fa-solid fa-trash"></i> BORRAR
                    </button>
                </div>
            `;
            list.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        list.innerHTML = '<p style="color: var(--error); font-style: italic;">Error de conexión. Verifica tu conexión a internet.</p>';
    }
}

// ========================================
// EDITAR PRODUCTO
// ========================================
async function editProduct(id) {
    try {
        const productDocRef = doc(db, 'productos', id);
        const docSnapshot = await getDoc(productDocRef);
        
        if (!docSnapshot.exists()) return;
        
        const item = docSnapshot.data();
        currentProductId = id;
        currentImageUrl = item.image || '';
        
        // Llenar formulario
        const nameEl = document.getElementById('name');
        const categoriaEl = document.getElementById('categoria');
        const descEl = document.getElementById('desc');
        const precioEl = document.getElementById('precio');
        const descuentoEl = document.getElementById('descuento');
        
        if (nameEl) nameEl.value = item.name || '';
        if (categoriaEl) categoriaEl.value = item.categoria || '';
        if (descEl) descEl.value = item.desc || '';
        if (precioEl) precioEl.value = item.precio || 0;
        if (descuentoEl) descuentoEl.value = item.descuento || 0;
        
        // Cargar URLs de múltiples imágenes
        const imageUrls = [
            item.image,
            item.image1,
            item.image2,
            item.image3,
            item.image4,
            item.image5
        ].filter(Boolean);
        
        imageUrls.forEach((url, idx) => {
            if (imageInputs[idx] && imageInputs[idx].url) {
                imageInputs[idx].url.value = url;
            }
        });
        
        // Cambiar a modo URL
        setMethod('url');
        
        // Actualizar UI
        const formTitle = document.getElementById('form-title');
        const formDesc = document.getElementById('form-desc');
        const btnSave = document.getElementById('btn-save');
        const btnCancel = document.getElementById('btn-cancel-edit');
        
        if (formTitle) formTitle.innerText = 'Editando producto';
        if (formDesc) formDesc.innerText = 'Modifica los datos y guarda los cambios.';
        if (btnSave) btnSave.innerText = 'Actualizar producto';
        if (btnCancel) btnCancel.style.display = 'block';
        
        // Actualizar preview
        const uiImg = document.getElementById('ui-img');
        const uiPlaceholder = document.getElementById('ui-placeholder');
        const uiName = document.getElementById('ui-name');
        const uiPrice = document.getElementById('ui-price');
        
        if (uiImg) {
            uiImg.src = item.image || '';
            uiImg.style.display = item.image ? 'block' : 'none';
        }
        if (uiPlaceholder) {
            uiPlaceholder.style.display = item.image ? 'none' : 'block';
        }
        if (uiName) uiName.innerText = item.name || 'Producto';
        if (uiPrice) uiPrice.innerText = '$' + (item.precio || 0).toLocaleString();
        
        // Actualizar preview de múltiples imágenes
        updatePreview();
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error cargando producto para editar:', error);
        showMessage('Error de conexión al cargar producto.', 'error');
    }
}

// ========================================
// ELIMINAR PRODUCTO
// ========================================
async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    
    try {
        await deleteDoc(doc(db, 'productos', id));
        refreshProducts();
        showMessage('Producto eliminado correctamente.', 'success');
    } catch (error) {
        console.error('Error eliminando producto:', error);
        showMessage('Error de conexión al eliminar producto.', 'error');
    }
}

// ========================================
// EXPORTAR FUNCIONES AL OBJETO WINDOW
// ========================================
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.setMethod = setMethod;

// ========================================
// INICIALIZACIÓN DE LA APP
// ========================================
function initAdminApp() {
    // Verificar que todos los elementos necesarios existan
    const requiredElements = [
        'product-list', 'msg-box', 'admin-form',
        'image1-file', 'image1-url', 'image2-file', 'image2-url',
        'image3-file', 'image3-url', 'image4-file', 'image4-url',
        'image5-file', 'image5-url', 'ui-img', 'ui-placeholder'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    
    if (missingElements.length > 0) {
        console.error('Elementos faltantes:', missingElements);
        return;
    }
    
    // Configurar event listeners
    const btnCancel = document.getElementById('btn-cancel-edit');
    if (btnCancel) {
        btnCancel.onclick = resetForm;
    }
    
    if (form) {
        form.onsubmit = handleSubmit;
    }
    
    // Cargar productos
    refreshProducts();
    
    // Establecer método inicial
    setMethod('file');
    
    // Actualizar estado de conexión
    updateConnectionStatus();
}

// ========================================
// ESTADO DE CONEXIÓN
// ========================================
function updateConnectionStatus() {
    const status = document.getElementById('connection-status');
    if (!status) return;
    
    if (navigator.onLine) {
        status.textContent = 'EN LÍNEA';
        status.style.color = 'var(--success)';
        status.classList.remove('offline');
    } else {
        status.textContent = 'SIN CONEXIÓN';
        status.style.color = 'var(--error)';
        status.classList.add('offline');
    }
}

// ========================================
// EVENT LISTENERS DE CONEXIÓN
// ========================================
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// ========================================
// INICIAR CUANDO EL DOM ESTÉ LISTO
// ========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminApp);
} else {
    initAdminApp();
}

// ========================================
// ACTUALIZAR PREVIEW EN TIEMPO REAL
// ========================================
const nameInput = document.getElementById('name');
const precioInput = document.getElementById('precio');

if (nameInput) {
    nameInput.addEventListener('input', (e) => {
        const uiName = document.getElementById('ui-name');
        if (uiName) uiName.innerText = e.target.value || 'Producto';
    });
}

if (precioInput) {
    precioInput.addEventListener('input', (e) => {
        const uiPrice = document.getElementById('ui-price');
        if (uiPrice) {
            const value = Number(e.target.value) || 0;
            uiPrice.innerText = '$' + value.toLocaleString();
        }
    });
}