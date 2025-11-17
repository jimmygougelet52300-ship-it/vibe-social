// Remplace ces valeurs par TES clés Firebase (disponibles dans la console Firebase)
const firebaseConfig = {
    apiKey: "TU_API_KEY_ICI",
    authDomain: "TON_PROJET.firebaseapp.com",
    projectId: "TON_PROJET",
    storageBucket: "TON_PROJET.appspot.com",
    messagingSenderId: "TON_SENDER_ID",
    appId: "TON_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Connexion anonyme
document.getElementById('loginBtn').addEventListener('click', () => {
    auth.signInAnonymously()
        .then(() => {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('vibeForm').style.display = 'block';
            loadVibes();
        })
        .catch((error) => alert("Erreur : " + error.message));
});

// Poster une Vibe
document.getElementById('postBtn').addEventListener('click', () => {
    const vibeText = document.getElementById('vibeInput').value.trim();
    if (vibeText === "" || vibeText.length > 200) {
        alert("Ta Vibe doit faire entre 1 et 200 caractères !");
        return;
    }
    db.collection("vibes").add({
        text: vibeText,
        reactions: { "😂": 0, "🥺": 0, "🔥": 0 },
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000)) // Expire après 24h
    });
    document.getElementById('vibeInput').value = '';
});

// Charger les Vibes en temps réel
function loadVibes() {
    const now = new Date();
    db.collection("vibes")
        .where("expiresAt", ">", now)
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
            const vibesList = document.getElementById('vibesList');
            vibesList.innerHTML = '';
            snapshot.forEach(doc => {
                const vibe = doc.data();
                const div = document.createElement('div');
                div.className = 'vibe';
                div.innerHTML = `
                    <p>${vibe.text}</p>
                    <div class="reactions">
                        <button class="reaction-btn" data-id="${doc.id}" data-reaction="😂">
                            😂 <span class="reaction-count">${vibe.reactions["😂"]}</span>
                        </button>
                        <button class="reaction-btn" data-id="${doc.id}" data-reaction="🥺">
                            🥺 <span class="reaction-count">${vibe.reactions["🥺"]}</span>
                        </button>
                        <button class="reaction-btn" data-id="${doc.id}" data-reaction="🔥">
                            🔥 <span class="reaction-count">${vibe.reactions["🔥"]}</span>
                        </button>
                    </div>
                `;
                vibesList.appendChild(div);
            });
        });
}

// Gérer les réactions
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('reaction-btn')) {
        const vibeId = e.target.dataset.id;
        const reaction = e.target.dataset.reaction;
        db.collection("vibes").doc(vibeId).update({
            [`reactions.${reaction}`]: firebase.firestore.FieldValue.increment(1)
        });
    }
});

// Nettoyer les Vibes expirées (toutes les 5 min)
setInterval(() => {
    const now = new Date();
    db.collection("vibes")
        .where("expiresAt", "<=", now)
        .get()
        .then(snapshot => snapshot.forEach(doc => doc.ref.delete()));
}, 300000);
