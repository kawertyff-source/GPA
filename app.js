import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ใส่ Firebase Config ของคุณตรงนี้
const firebaseConfig = {
  apiKey: "AIzaSyD2CP-sc33iPWhsOwu4XPR26DBWpOe5Luw",
  authDomain: "nosbsj-45f44.firebaseapp.com",
  databaseURL: "https://nosbsj-45f44-default-rtdb.firebaseio.com",
  projectId: "nosbsj-45f44",
  storageBucket: "nosbsj-45f44.firebasestorage.app",
  messagingSenderId: "700115555837",
  appId: "1:700115555837:web:a7caf2504840b825283594"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ข้อมูลนักเรียน (ย่อเพื่อความสั้น) - ตัวจริงใส่ครบ 40 คนเหมือนเดิม
const STUDENTS = { "19598": "กรวิชญ์ มาตขาว", "19599": "กรวิทย์ เจียรนัย" /* ... จนถึง 19637 */ };
const ADMIN_ID = "19598"; 

let userSession = null;

// --- ระบบ Auth ---
document.getElementById('loginBtn').onclick = () => {
    const e = document.getElementById('email').value;
    const p = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, e, p).catch(err => alert("ลองใหม่อีกครั้ง: " + err.code));
};

onAuthStateChanged(auth, (user) => {
    if(user) {
        const sid = user.email.split('@')[0];
        userSession = { uid: user.uid, sid: sid, name: STUDENTS[sid] || "นักเรียนใหม่" };
        
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        document.getElementById('display-name').innerText = userSession.name;
        document.getElementById('display-id').innerText = `ID: ${sid}`;
        document.getElementById('user-avatar').innerText = userSession.name[0];

        if(sid === ADMIN_ID) document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');

        syncData();
    } else {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }
});

// --- จัดการข้อมูล ---
function syncData() {
    // 1. โหลดเกรด & คำนวณ GPA
    onValue(ref(db, `grades/${userSession.sid}`), (snap) => {
        const tbody = document.getElementById('grade-body');
        tbody.innerHTML = "";
        let totalPoint = 0, count = 0;

        snap.forEach(child => {
            const d = child.val();
            totalPoint += d.val; count++;
            tbody.innerHTML += `<tr><td>${d.sub}</td><td>${d.score}</td><td>${d.val}</td><td><button onclick="deleteGrade('${child.key}')">ลบ</button></td></tr>`;
        });

        const gpa = count > 0 ? (totalPoint / count).toFixed(2) : "0.00";
        document.getElementById('user-gpa').innerText = gpa;
        // ส่ง GPA สรุปให้ Admin ดู
        set(ref(db, `summary/${userSession.sid}`), { name: userSession.name, gpa: gpa });
    });

    // 2. โหลดประกาศ
    onValue(ref(db, 'system/announcement'), snap => {
        document.getElementById('ann-text').innerText = snap.val() || "ยังไม่มีประกาศใหม่";
    });

    // 3. โหลดแชท
    onValue(ref(db, 'chats'), snap => {
        const box = document.getElementById('chat-messages');
        box.innerHTML = "";
        snap.forEach(c => {
            const m = c.val();
            const type = m.sid === userSession.sid ? 'mine' : 'others';
            box.innerHTML += `<div class="msg ${type}"><b>${m.name}:</b><br>${m.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

// --- ฟังก์ชันเสริม ---
window.saveNewGrade = () => {
    const sub = document.getElementById('sub-select').value;
    const score = parseInt(document.getElementById('score-input').value);
    let val = 0;
    if(score >= 80) val = 4; else if(score >= 70) val = 3; else if(score >= 60) val = 2; else if(score >= 50) val = 1;
    
    push(ref(db, `grades/${userSession.sid}`), { sub, score, val });
    toggleModal('gradeModal', false);
};

window.deleteGrade = (id) => remove(ref(db, `grades/${userSession.sid}/${id}`));

document.getElementById('send-chat').onclick = () => {
    const text = document.getElementById('chat-input').value;
    if(text) push(ref(db, 'chats'), { sid: userSession.sid, name: userSession.name, text: text });
    document.getElementById('chat-input').value = "";
};

// Admin Tool: อัปเดตประกาศ
document.getElementById('update-ann-btn').onclick = () => {
    const txt = document.getElementById('admin-ann').value;
    set(ref(db, 'system/announcement'), txt);
    alert("อัปเดตประกาศแล้ว");
};

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
        const page = btn.getAttribute('data-page');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    };
});

window.toggleModal = (id, show) => document.getElementById(id).style.display = show ? 'flex' : 'none';
document.getElementById('logoutBtn').onclick = () => signOut(auth);
