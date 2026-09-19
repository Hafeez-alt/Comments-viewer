
const EMAILJS_PUBLIC_KEY = "fqqFd1BeW15etqETY";
const EMAILJS_SERVICE_ID = "service_gtpnaih";
const EMAILJS_TEMPLATE_ID = "template_rsrbals";

/* =====================================================
   COMMENTS VIEWER
   LOGIN + COMMENTS + POST COMMENT + FAVORITES
===================================================== */

const API_URL = "https://jsonplaceholder.typicode.com/comments";

const categories = [
    "Technology",
    "Sports",
    "Education",
    "Movies",
    "Travel",
    "Health",
    "Business",
    "General"
];

const STORAGE_KEYS = {
    accounts: "cv_accounts",
    session: "cv_session",
    postedComments: "cv_posted_comments",
    favorites: "cv_favorites"
};

let apiComments = [];
let selectedCategory = "All";

/* ================= EMAILJS INITIALIZATION ================= */

emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
});


/* ================= DOM ELEMENTS ================= */

const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");

const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

const commentsContainer = document.getElementById("commentsContainer");
const favoritesContainer = document.getElementById("favoritesContainer");

const commentsLoading = document.getElementById("commentsLoading");
const commentsError = document.getElementById("commentsError");

const categoryFilter = document.getElementById("categoryFilter");
const categorySummary = document.getElementById("categorySummary");

const postCommentForm = document.getElementById("postCommentForm");
const postMessage = document.getElementById("postMessage");

const contactForm = document.getElementById("contactForm");
const contactResponse = document.getElementById("contactResponse");

const favoritesEmpty = document.getElementById("favoritesEmpty");


/* ================= LOCAL STORAGE ================= */

function getAccounts() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.accounts) || "[]"
    );
}

function getSession() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.session) || "null"
    );
}

function getPostedComments() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.postedComments) || "[]"
    );
}

function getFavorites() {
    return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.favorites) || "[]"
    );
}

function saveFavorites(favorites) {
    localStorage.setItem(
        STORAGE_KEYS.favorites,
        JSON.stringify(favorites)
    );
}


/* ================= AUTH VIEW ================= */

function showLogin() {
    loginBox.classList.remove("hidden");
    registerBox.classList.add("hidden");

    loginMessage.textContent = "";
    registerMessage.textContent = "";
}

function showRegister() {
    loginBox.classList.add("hidden");
    registerBox.classList.remove("hidden");

    loginMessage.textContent = "";
    registerMessage.textContent = "";
}

function showApp() {
    authContainer.classList.add("hidden");
    appContainer.classList.remove("hidden");

    const session = getSession();

    if (session) {
        document.getElementById("navUsername").textContent =
            session.username;

        document.getElementById("postUsername").value =
            session.username;
    }

    navigateTo("home");
    fetchComments();
}

function showAuth() {
    authContainer.classList.remove("hidden");
    appContainer.classList.add("hidden");
    showLogin();
}


/* ================= REGISTER ================= */

registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username =
        document.getElementById("registerUsername").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        showMessage(
            registerMessage,
            "Passwords do not match.",
            "error"
        );
        return;
    }

    const accounts = getAccounts();

    const existingUser = accounts.find(
        account => account.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
        showMessage(
            registerMessage,
            "Username already exists.",
            "error"
        );
        return;
    }

    accounts.push({
        username: username,
        password: password
    });

    localStorage.setItem(
        STORAGE_KEYS.accounts,
        JSON.stringify(accounts)
    );

    showMessage(
        registerMessage,
        "Account created successfully. Please login.",
        "success"
    );

    registerForm.reset();

    setTimeout(() => {
        showLogin();
    }, 1200);
});


/* ================= LOGIN ================= */

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username =
        document.getElementById("loginUsername").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    const accounts = getAccounts();

    const validAccount = accounts.find(
        account =>
            account.username === username &&
            account.password === password
    );

    if (!validAccount) {
        showMessage(
            loginMessage,
            "Invalid username or password.",
            "error"
        );
        return;
    }

    localStorage.setItem(
        STORAGE_KEYS.session,
        JSON.stringify({
            username: username
        })
    );

    loginForm.reset();

    showApp();
});


/* ================= LOGOUT ================= */

document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.removeItem(STORAGE_KEYS.session);
    showAuth();
});


/* ================= NAVIGATION ================= */

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", function (event) {
        event.preventDefault();

        const page = this.dataset.page;

        navigateTo(page);
    });
});

function navigateTo(page) {

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.remove("active-page");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.remove("active");
    });

    const selectedPage = document.getElementById(page + "Page");

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }

    const selectedLink = document.querySelector(
        `.nav-link[data-page="${page}"]`
    );

    if (selectedLink) {
        selectedLink.classList.add("active");
    }

    if (page === "favorites") {
        renderFavorites();
    }

    if (page === "comments") {
        renderComments();
    }
}


/* ================= FETCH COMMENTS ================= */

async function fetchComments() {

    commentsLoading.classList.remove("hidden");
    commentsError.classList.add("hidden");
    commentsContainer.innerHTML = "";

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to fetch comments");
        }

        const data = await response.json();

        apiComments = data.map(comment => {

            const category =
                categories[(comment.id - 1) % categories.length];

            return {
                id: "api-" + comment.id,
                name: comment.name,
                email: comment.email,
                body: comment.body,
                category: category,
                source: "API",
                originalId: comment.id
            };
        });

        populateCategoryDropdowns();
        renderAllData();

    } catch (error) {

        commentsError.classList.remove("hidden");

    } finally {

        commentsLoading.classList.add("hidden");

    }
}


/* ================= ALL COMMENTS ================= */

function getAllComments() {
    const postedComments = getPostedComments();

    return [
        ...apiComments,
        ...postedComments
    ];
}

function renderAllData() {
    updateStatistics();
    renderCategorySummary();
    renderComments();
    renderFavorites();
}


/* ================= CATEGORY DROPDOWNS ================= */

function populateCategoryDropdowns() {

    categoryFilter.innerHTML =
        `<option value="All">All Categories</option>`;

    const postCategory = document.getElementById("postCategory");

    postCategory.innerHTML =
        `<option value="">Select category</option>`;

    categories.forEach(category => {

        categoryFilter.innerHTML +=
            `<option value="${category}">${category}</option>`;

        postCategory.innerHTML +=
            `<option value="${category}">${category}</option>`;
    });
}

categoryFilter.addEventListener("change", function () {
    selectedCategory = this.value;
    renderComments();
});


/* ================= STATISTICS ================= */

function updateStatistics() {

    const allComments = getAllComments();
    const favorites = getFavorites();

    const uniqueEmails = new Set(
        allComments.map(comment => comment.email)
    );

    document.getElementById("totalComments").textContent =
        allComments.length;

    document.getElementById("uniqueUsers").textContent =
        uniqueEmails.size;

    document.getElementById("totalFavorites").textContent =
        favorites.length;

    document.getElementById("totalCategories").textContent =
        categories.length;

    document.getElementById("navFavoriteCount").textContent =
        favorites.length;
}


/* ================= CATEGORY SUMMARY ================= */

function renderCategorySummary() {

    const allComments = getAllComments();

    categorySummary.innerHTML = "";

    categories.forEach(category => {

        const count = allComments.filter(
            comment => comment.category === category
        ).length;

        categorySummary.innerHTML += `
            <div class="category-chip">
                ${category}: <strong>${count}</strong>
            </div>
        `;
    });
}


/* ================= RENDER COMMENTS ================= */

function renderComments() {

    const allComments = getAllComments();

    let filteredComments = allComments;

    if (selectedCategory !== "All") {
        filteredComments = allComments.filter(
            comment => comment.category === selectedCategory
        );
    }

    commentsContainer.innerHTML = "";

    if (filteredComments.length === 0) {
        commentsContainer.innerHTML = `
            <div class="empty-box">
                <div class="empty-icon">💬</div>
                <h2>No Comments Found</h2>
                <p>No comments are available in this category.</p>
            </div>
        `;

        return;
    }

    filteredComments.forEach(comment => {
        commentsContainer.innerHTML += createCommentCard(comment);
    });

    attachFavoriteEvents();
}


/* ================= COMMENT CARD ================= */

function createCommentCard(comment) {

    const favorites = getFavorites();

    const isFavorite = favorites.some(
        favorite => favorite.id === comment.id
    );

    const firstLetter =
        comment.name.charAt(0).toUpperCase();

    return `
        <div class="comment-card">

            <div class="comment-top">

                <div class="comment-user">

                    <div class="user-avatar">
                        ${firstLetter}
                    </div>

                    <div>
                        <h3>${escapeHTML(comment.name)}</h3>
                        <p>${escapeHTML(comment.email)}</p>
                    </div>

                </div>

                <button
                    class="favorite-btn ${isFavorite ? "favorited" : ""}"
                    data-id="${comment.id}"
                    title="${isFavorite ? "Remove from favorites" : "Add to favorites"}"
                >
                    ${isFavorite ? "♥" : "♡"}
                </button>

            </div>

            <p class="comment-body">
                ${escapeHTML(comment.body)}
            </p>

            <div class="comment-bottom">

                <span class="comment-category">
                    ${escapeHTML(comment.category)}
                </span>

                <span class="comment-source">
                    ${escapeHTML(comment.source)}
                </span>

                <span class="comment-id">
                    #${escapeHTML(String(comment.originalId || comment.id))}
                </span>

            </div>

        </div>
    `;
}


/* ================= FAVORITE EVENTS ================= */

function attachFavoriteEvents() {

    document.querySelectorAll(".favorite-btn").forEach(button => {

        button.addEventListener("click", function () {

            const commentId = this.dataset.id;

            toggleFavorite(commentId);

        });
    });
}


/* ================= TOGGLE FAVORITE ================= */

function toggleFavorite(commentId) {

    const allComments = getAllComments();

    const selectedComment = allComments.find(
        comment => comment.id === commentId
    );

    if (!selectedComment) {
        return;
    }

    let favorites = getFavorites();

    const alreadyFavorite = favorites.some(
        favorite => favorite.id === commentId
    );

    if (alreadyFavorite) {

        favorites = favorites.filter(
            favorite => favorite.id !== commentId
        );

    } else {

        favorites.push(selectedComment);

    }

    saveFavorites(favorites);

    updateStatistics();
    renderComments();
    renderFavorites();
}


/* ================= RENDER FAVORITES ================= */

function renderFavorites() {

    const favorites = getFavorites();

    favoritesContainer.innerHTML = "";

    if (favorites.length === 0) {

        favoritesEmpty.classList.remove("hidden");

        return;
    }

    favoritesEmpty.classList.add("hidden");

    favorites.forEach(comment => {
        favoritesContainer.innerHTML += createCommentCard(comment);
    });

    attachFavoriteEvents();
}


/* ================= POST COMMENT ================= */

postCommentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const username =
        document.getElementById("postUsername").value.trim();

    const email =
        document.getElementById("postEmail").value.trim();

    const category =
        document.getElementById("postCategory").value;

    const body =
        document.getElementById("postBody").value.trim();

    if (!username || !email || !category || !body) {
        showMessage(
            postMessage,
            "Please fill in all fields.",
            "error"
        );
        return;
    }

    const newComment = {
        id: "user-" + Date.now(),
        name: username,
        email: email,
        category: category,
        body: body,
        source: "User Posted",
        originalId: "NEW"
    };

    const postedComments = getPostedComments();

    postedComments.unshift(newComment);

    localStorage.setItem(
        STORAGE_KEYS.postedComments,
        JSON.stringify(postedComments)
    );

    showMessage(
        postMessage,
        "Your comment was published successfully!",
        "success"
    );

    document.getElementById("postBody").value = "";
    document.getElementById("postEmail").value = "";
    document.getElementById("postCategory").value = "";

    renderAllData();

    setTimeout(() => {
        navigateTo("comments");
        postMessage.textContent = "";
    }, 1000);
});


/* ================= CONTACT FORM ================= */

contactForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name =
        document.getElementById("contactName").value.trim();

    const email =
        document.getElementById("contactEmail").value.trim();

    const message =
        document.getElementById("contactMessage").value.trim();

    const sendMessageBtn =
        document.getElementById("sendMessageBtn");

    if (!name || !email || !message) {
        showMessage(
            contactResponse,
            "Please fill in all fields.",
            "error"
        );

        return;
    }

    sendMessageBtn.disabled = true;
    sendMessageBtn.textContent = "⏳ Sending...";

    const templateParams = {
        from_name: name,
        from_email: email,
        message: message,
        reply_to: email
    };

    try {

        await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams
        );

        showMessage(
            contactResponse,
            "Your message was sent successfully to our email.",
            "success"
        );

        contactForm.reset();

    } catch (error) {

        console.error("Email sending error:", error);

        showMessage(
            contactResponse,
            "Message could not be sent. Please try again.",
            "error"
        );

    } finally {

        sendMessageBtn.disabled = false;
        sendMessageBtn.textContent = "📩 Send Message";

    }

});


/* ================= BUTTON ACTIONS ================= */

document.getElementById("showRegisterBtn")
    .addEventListener("click", showRegister);

document.getElementById("showLoginBtn")
    .addEventListener("click", showLogin);

document.getElementById("exploreCommentsBtn")
    .addEventListener("click", function () {
        navigateTo("comments");
    });

document.getElementById("goToCommentsBtn")
    .addEventListener("click", function () {
        navigateTo("comments");
    });


/* ================= HELPER FUNCTIONS ================= */

function showMessage(element, message, type) {

    element.textContent = message;

    element.className = "message";

    if (type === "success") {
        element.classList.add("success-message");
    } else {
        element.classList.add("error-message");
    }
}

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ================= INITIAL LOAD ================= */

document.addEventListener("DOMContentLoaded", function () {

    const session = getSession();

    if (session) {
        showApp();
    } else {
        showAuth();
    }

});