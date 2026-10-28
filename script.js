// --- LOGIQUE DE NAVIGATION DE L'APPLICATION ---
function switchMainTab(tabName) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
    document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));

    if (tabName === 'buyer') {
        document.getElementById('view-buyer').classList.remove('hidden');
        document.getElementById('nav-buyer').classList.add('active');
        displayPublicProducts();
    } else if (tabName === 'seller') {
        document.getElementById('view-seller').classList.remove('hidden');
        document.getElementById('nav-seller').classList.add('active');
    } else if (tabName === 'admin') {
        document.getElementById('view-admin').classList.remove('hidden');
        document.getElementById('nav-admin').classList.add('active');
    }
}

function switchSellerSubTab(tabId) {
    document.querySelectorAll('.seller-pane').forEach(p => p.classList.add('hidden'));
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`seller-pane-${tabId}`).classList.remove('hidden');
    document.getElementById(`subtab-${tabId}`).classList.add('active');
}

window.onload = function() {
    displayPublicProducts();
};

// --- AUTHENTIFICATION VENDEUR & ABONNEMENT STRICT ---
let activeSellerPhone = "";

function authenticateSeller() {
    const phoneInput = document.getElementById('seller-phone-input').value.trim();
    const alertBox = document.getElementById('seller-auth-alert');

    if (!phoneInput) {
        alertBox.innerHTML = '<div class="pro-alert alert-error">Veuillez renseigner votre numéro WhatsApp professionnel.</div>';
        return;
    }

    activeSellerPhone = phoneInput;
    let sellers = JSON.parse(localStorage.getItem('daga_sellers')) || {};
    let seller = sellers[activeSellerPhone];

    document.getElementById('seller-auth-card').classList.add('hidden');
    document.getElementById('seller-dashboard-panel').classList.remove('hidden');

    const now = new Date().getTime();
    const subAlert = document.getElementById('seller-subscription-alert');

    // Lien de demande d'activation WhatsApp
    let adminWa = "+22651892952";
    let msg = encodeURIComponent(`Bonjour Administrateur, je souhaite activer/prolonger l'abonnement de ma boutique sur Daga. Mon numéro est le ${activeSellerPhone}. Merci !`);
    document.getElementById('whatsapp-activation-link').href = `https://wa.me/${adminWa.replace(/[^0-9]/g,'')}?text=${msg}`;

    if (seller && seller.expireAt > now) {
        let daysLeft = Math.ceil((seller.expireAt - now) / (1000 * 60 * 60 * 24));
        subAlert.className = "pro-alert alert-success";
        subAlert.innerHTML = `✨ <strong>Boutique Validée (${seller.plan || 'Pro Merchant'})</strong> — ${daysLeft} jour(s) de visibilité restant(s).`;

        document.getElementById('shop-name-input').value = seller.shopName || "Ma Boutique Daga";
        document.getElementById('shop-cat-input').value = seller.shopCategory || "Mode";
        document.getElementById('shop-desc-input').value = seller.shopDesc || "";
        document.getElementById('shop-fb-input').value = seller.shopFb || "";

        updateSellerStats(daysLeft);
        loadSellerProductsList();
    } else {
        subAlert.className = "pro-alert alert-info";
        subAlert.innerHTML = `🔒 <strong>Abonnement Expiré ou Inactif</strong><br>Pour débloquer la publication de vos articles, effectuez votre transfert Orange Money ou Moov Money au <strong>+226 51 89 29 52</strong>.`;

        document.getElementById('stat-my-products').innerText = "0";
        document.getElementById('stat-days-left').innerText = "0";
        document.getElementById('seller-my-products-container').innerHTML = '<p style="color:var(--danger); font-weight:700;">⚠️ Publication d\'articles verrouillée (Abonnement Inactif).</p>';
    }
}

function updateSellerStats(daysLeft) {
    let products = JSON.parse(localStorage.getItem('daga_products')) || [];
    let myProds = products.filter(p => p.whatsapp === activeSellerPhone);

    document.getElementById('stat-my-products').innerText = myProds.length;
    document.getElementById('stat-days-left').innerText = daysLeft;
}

function saveShopProfile() {
    let sellers = JSON.parse(localStorage.getItem('daga_sellers')) || {};
    if (!sellers[activeSellerPhone]) sellers[activeSellerPhone] = {};

    sellers[activeSellerPhone].shopName = document.getElementById('shop-name-input').value.trim() || "Boutique Daga";
    sellers[activeSellerPhone].shopCategory = document.getElementById('shop-cat-input').value;
    sellers[activeSellerPhone].shopDesc = document.getElementById('shop-desc-input').value.trim();
    sellers[activeSellerPhone].shopFb = document.getElementById('shop-fb-input').value.trim();

    localStorage.setItem('daga_sellers', JSON.stringify(sellers));
    alert("Profil de la boutique sauvegardé avec succès !");
    displayPublicProducts();
}

// --- STUDIO PRODUIT & MAQUILLAGE (STYLE SHOPIFY) ---
function publishProductPro() {
    const name = document.getElementById('prod-name').value.trim();
    const price = document.getElementById('prod-price').value.trim();
    const oldPrice = document.getElementById('prod-oldprice').value.trim();
    const badge = document.getElementById('prod-badge').value;
    const desc = document.getElementById('prod-desc').value.trim();

    if (!name || !price) {
        alert("Veuillez remplir au moins le titre et le prix de l'article.");
        return;
    }

    let sellers = JSON.parse(localStorage.getItem('daga_sellers')) || {};
    let seller = sellers[activeSellerPhone];
    const now = new Date().getTime();

    // VÉRIFICATION D'ABONNEMENT FERME
    if (!seller || seller.expireAt <= now) {
        alert("Action impossible : Votre abonnement est expiré. Veuillez le renouveler au +226 51 89 29 52.");
        return;
    }

    // LIMITATION PAR FORFAIT
    let products = JSON.parse(localStorage.getItem('daga_products')) || [];
    let myProds = products.filter(p => p.whatsapp === activeSellerPhone);
    let limit = seller.plan === 'Starter' ? 5 : (seller.plan === 'VIP' ? 9999 : 25);

    if (myProds.length >= limit) {
        alert(`Limite atteinte pour votre forfait (${seller.plan} : max ${limit} articles). Contactez l'admin pour passer au forfait supérieur.`);
        return;
    }

    products.unshift({
        id: Date.now(),
        name,
        price,
        oldPrice,
        badge,
        desc,
        category: seller.shopCategory || "Mode",
        whatsapp: activeSellerPhone
    });

    localStorage.setItem('daga_products', JSON.stringify(products));
    alert("Article maquillé et publié avec succès sur le marché !");

    document.getElementById('prod-name').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-oldprice').value = '';
    document.getElementById('prod-desc').value = '';

    let daysLeft = Math.ceil((seller.expireAt - now) / (1000 * 60 * 60 * 24));
    updateSellerStats(daysLeft);
    loadSellerProductsList();
    displayPublicProducts();
}

function loadSellerProductsList() {
    let products = JSON.parse(localStorage.getItem('daga_products')) || [];
    let myProds = products.filter(p => p.whatsapp === activeSellerPhone);
    const container = document.getElementById('seller-my-products-container');

    if (myProds.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">Aucun article dans votre catalogue.</p>';
        return;
    }

    let html = '<table><tr><th>Article</th><th>Prix</th><th>Action</th></tr>';
    myProds.forEach(p => {
        html += `<tr>
            <td><strong>${p.name}</strong></td>
            <td><strong style="color:var(--primary);">${p.price}</strong></td>
            <td><button onclick="deleteProduct(${p.id})" style="background:#fee2e2; color:var(--danger); border:none; padding:6px 10px; border-radius:6px; font-weight:700; cursor:pointer;">Supprimer</button></td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
}

function deleteProduct(id) {
    if (confirm("Supprimer définitivement cet article ?")) {
        let products = JSON.parse(localStorage.getItem('daga_products')) || [];
        products = products.filter(p => p.id !== id);
        localStorage.setItem('daga_products', JSON.stringify(products));

        let sellers = JSON.parse(localStorage.getItem('daga_sellers')) || {};
        let seller = sellers[activeSellerPhone];
        const now = new Date().getTime();
        let daysLeft = seller ? Math.ceil((seller.expireAt - now) / (1000 * 60 * 60 * 24)) : 0;

        updateSellerStats(daysLeft);
        loadSellerProductsList();
        displayPublicProducts();
    }
}

// --- MARCHÉ PUBLIC DAGA ---
function displayPublicProducts() {
    const container = document.getElementById('products-list');
    if (!container) return;

    let products = JSON.parse(localStorage.getItem('daga_products')) || [];
    let sellers = JSON.parse(localStorage.getItem('daga_sellers')) || {};
    const now = new Date().getTime();

    // FILTRAGE STRICT : SEULS LES ARTICLES DES BOUTIQUES AVEC ABONNEMENT ACTIF SONT VISIBLES
    let activeProducts = products.filter(p => {
        let s = sellers[p.whatsapp];
        return s && s.expireAt > now;
    });

    if (activeProducts.length === 0) {
        container.innerHTML = `
            <div class="pro-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <p style="color: var(--text-muted); font-size: 1.1em; margin: 0;">🛒 Le marché Daga est en cours de réapprovisionnement.</p>
                <p style="color: var(--text-muted); font-size: 0.9em; margin-top: 5px;">Revenez très vite pour découvrir les nouveautés !</p>
            </div>`;
        return;
    }

    let html = '';
    activeProducts.forEach(p => {
        let s = sellers[p.whatsapp] || {};
        let shopName = s.shopName || "Boutique Partenaire";
        let cleanWa = p.whatsapp.replace(/[^0-9]/g, '');
        let waMsg = encodeURIComponent(`Bonjour, je suis intéressé par votre article "${p.name}" (${p.price}) aperçu sur votre boutique "${shopName}" sur Daga.`);
        let waLink = `https://wa.me/${cleanWa}?text=${waMsg}`;

        html += `
            <div class="product-card" data-category="${p.category}">
                <div>
                    <div class="product-shop-badge">🏪 ${shopName}</div>
                    ${p.badge ? `<span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:6px; font-size:0.72em; font-weight:800;">${p.badge}</span>` : ''}
                    <h3 class="product-title" style="margin-top:6px;">${p.name}</h3>
                    <div class="product-price-stack">
                        <span class="product-price">${p.price}</span>
                        ${p.oldPrice ? `<span class="product-oldprice">${p.oldPrice}</span>` : ''}
                    </div>
                    <p class="product-desc">${p.desc}</p>
                </div>
                <a href="${waLink}" target="_blank" class="whatsapp-btn-pro">Commander via WhatsApp</a>
            </div>
        `;
    });
    container.innerHTML = html;
}

function filterProducts() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const cat = document.getElementById('category-filter').value;

    document.querySelectorAll('.product-card').forEach(card => {
        let text = card.innerText.toLowerCase();
        let cardCat = card.getAttribute('data-category');
        if (text.includes(query) && (!cat || cardCat === cat)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

// --- ADMINISTRATION CENTRALE (`admin2026`) ---
function verifyAdminLogin() {
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === "admin2026") {
        document.getElementById('admin-auth-box').classList.add('hidden');
        document.getElementById('admin-dashboard-box').classList.remove('hidden');
        loadAdminData();
    } else {
        document.getElementById('admin-auth-alert').innerHTML = '<div class="pro-alert alert-error">Mot de passe secret incorrect.</div>';
    }
}

function loadAdminData() {
    let products = JSON.parse(localStorage.getItem('daga_products')) || [];
    let sellers = JSON.parse(localStorage.getItem('daga_sellers')) || {};

    document.getElementById('admin-stat-sellers').innerText = Object.keys(sellers).length;
    document.getElementById('admin-stat-products').innerText = products.length;

    const now = new Date().getTime();
    let tableHtml = '<table><tr><th>WhatsApp</th><th>Boutique</th><th>Forfait</th><th>Statut</th><th>Action</th></tr>';

    if (Object.keys(sellers).length === 0) {
        tableHtml = '<p style="color:var(--text-muted);">Aucune boutique enregistrée.</p>';
    } else {
        for (let phone in sellers) {
            let s = sellers[phone];
            let active = s.expireAt > now;
            let statusBadge = active ? '<span style="color:var(--success); font-weight:800;">Actif</span>' : '<span style="color:var(--danger); font-weight:800;">Expiré</span>';

            tableHtml += `<tr>
                <td>${phone}</td>
                <td>${s.shopName || 'Boutique'}</td>
                <td><strong>${s.plan || 'Pro'}</strong></td>
                <td>${statusBadge}</td>
                <td><button onclick="adminRenewSpecificPhone('${phone}')" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:700; cursor:pointer;">+30 Jours</button></td>
            </tr>`;
        }
        tableHtml += '</table>';
    }
    document.getElementById('admin-sellers-table-container').innerHTML = tableHtml;
}

function adminGrantSubscription() {
    let phone = document.getElementById('admin-target-phone').value.trim();
    let plan = document.getElementById('admin-target-plan').value;
    const alertBox = document.getElementById('admin-grant-alert');

    if (!phone) {
        alertBox.innerHTML = '<div class="pro-alert alert-error">Entrez un numéro WhatsApp valide.</div>';
        return;
    }

    let sellers = JSON.parse(localStorage.getItem('daga_sellers')) || {};
    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    let baseTime = (sellers[phone] && sellers[phone].expireAt > now) ? sellers[phone].expireAt : now;

    if (!sellers[phone]) {
        sellers[phone] = { shopName: "Boutique Daga", shopCategory: "Mode", shopDesc: "", plan: plan, expireAt: baseTime + thirtyDays };
    } else {
        sellers[phone].plan = plan;
        sellers[phone].expireAt = baseTime + thirtyDays;
    }

    localStorage.setItem('daga_sellers', JSON.stringify(sellers));
    alertBox.innerHTML = `<div class="pro-alert alert-success">30 jours d'accès (${plan}) attribués à ${phone} !</div>`;
    document.getElementById('admin-target-phone').value = '';
    loadAdminData();
}

function adminRenewSpecificPhone(phone) {
    let sellers = JSON.parse(localStorage.getItem('daga_sellers')) || {};
    const now = new Date().getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    let baseTime = (sellers[phone] && sellers[phone].expireAt > now) ? sellers[phone].expireAt : now;
    if (!sellers[phone]) sellers[phone] = { plan: 'Pro' };
    sellers[phone].expireAt = baseTime + thirtyDays;

    localStorage.setItem('daga_sellers', JSON.stringify(sellers));
    loadAdminData();
    alert(`Abonnement prolongé de 30 jours pour ${phone}`);
}