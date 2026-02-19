import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. นำ Config ของคุณมาใส่
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

// 2. ข้อมูลรายชื่อนักเรียน 40 คน (ดึงจากรหัสนักเรียนเป็นหลัก)
const studentData = {
    "19598": "กรวิชญ์ มาตขาว", "19599": "กรวิทย์ เจียรนัย", "19600": "กิตติพัฒน์ สติภา", "19601": "จิรายุ สายพันธ์", 
    "19602": "เฉลิมชัย ศรีดาเลิศ", "19603": "ฐิระวัฒน์ จอระนิตย์", "19604": "ณฐนนท์ ธนูทอง", "19605": "ณัฐชูศักดิ์ ศรีทา",
    "19606": "ณัฐพล นาจาน", "19607": "ณัฏฐมินทร์ อ่อนสำอาง", "19608": "ทะนิสสอน สิมมา", "19609": "ธนโชติ พวงเงิน",
    "19610": "ธนภูมิ บุญเหลา", "19611": "ปกรณ์ ดวงศรี", "19612": "พนธกร สถิตเวโรจน์", "19613": "ภัทรพล ศรีคำขลิบ",
    "19614": "มหาราช ก้อนคำ", "19615": "ศรายุทธ โคตมงคล", "19616": "กรกนก เคนพรม", "19617": "กันยกร ส้มโย",
    "19618": "กิตติพร ทองพูล", "19619": "ขวัญข้าว พานจรุง", "19620": "จันทิรวิภา นาคะบุตร", "19621": "ชัญญาภรณ์ สุดสวย",
    "19622": "ชิตะยา อนุสนธิ์", "19623": "ณิชนิกาญจน์ สุดรักษา", "19624": "ณัฐณิชา วาจมะกุ", "19625": "ณัฐธิดา พิมพ์พันธ์",
    "19626": "ธนพร พลมิตร", "19627": "นงนุช มิตตะมา", "19628": "นภัสร จรลี", "19629": "นริศรา พรมจำปา",
    "19630": "น้ำฝน โชมจิตร", "19631": "บุชรินทร์ ทองศรี", "19632": "ปาณิสรา เดชะคำภู", "19633": "พิชญา สีมาขันธ์",
    "19634": "วรัญญา สุทธิ", "19635": "ศุภิสรา ศรีบุตรดา", "19636": "สุดาวรรณ กุลลิ", "19637": "อมิดา ยมพิมาย"
};

let currentUserData = {};

// 3. ระบบล็อคอิน
document.getElementById('loginBtn').addEventListener('click', async () => {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const msg = document.getElementById('loginMessage');
    
    try {
        // พยายามล็อคอิน
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        // หากยังไม่มีบัญชี (ล็อคอินครั้งแรก) ให้สร้างบัญชีอัตโนมัติ
        if(error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                alert("สร้างบัญชีครั้งแรกสำเร็จ!");
            } catch (regError) {
                msg.innerText = "รหัสผ่านไม่ถูกต้อง หรือเกิดข้อผิดพลาด";
            }
        } else {
            msg.innerText = "เกิดข้อผิดพลาด: " + error.message;
        }
    }
});

// ออกจากระบบ
document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

// ตรวจสอบสถานะการเข้าสู่ระบบ
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'flex';
        
        const studentId = user.email.split('@')[0];
        currentUserData = {
            uid: user.uid,
            id: studentId,
            name: studentData[studentId] || "ไม่ทราบชื่อ"
        };
        
        // เซ็ตโปรไฟล์
        document.getElementById('profileName').innerText = currentUserData.name;
        document.getElementById('profileId').innerText = `รหัส: ${studentId}`;
        document.getElementById('profileInitial').innerText = currentUserData.name.charAt(0);

        loadGrades();
        loadChat();
    } else {
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('app-section').style.display = 'none';
    }
});

// 4. ระบบจัดการเกรด และ GPA
function calculateGrade(score) {
    if (score >= 80) return 4.0;
    if (score >= 75) return 3.5;
    if (score >= 70) return 3.0;
    if (score >= 65) return 2.5;
    if (score >= 60) return 2.0;
    if (score >= 55) return 1.5;
    if (score >= 50) return 1.0;
    return 0.0;
}

document.getElementById('saveGradeBtn').addEventListener('click', () => {
    const subject = document.getElementById('subjectSelect').value;
    const score = parseInt(document.getElementById('scoreInput').value);
    
    if (isNaN(score) || score < 0 || score > 100) return alert("กรอกคะแนน 0-100");
    
    const grade = calculateGrade(score);
    const gradeRef = ref(db, `users/${currentUserData.uid}/grades`);
    
    push(gradeRef, { subject, score, grade }).then(() => {
        closeModal('gradeModal');
        document.getElementById('scoreInput').value = '';
    });
});

function loadGrades() {
    const gradeRef = ref(db, `users/${currentUserData.uid}/grades`);
    onValue(gradeRef, (snapshot) => {
        const tbody = document.getElementById('gradeTbody');
        tbody.innerHTML = '';
        let totalGrade = 0;
        let count = 0;

        snapshot.forEach((child) => {
            const data = child.val();
            const key = child.key;
            totalGrade += data.grade;
            count++;

            tbody.innerHTML += `
                <tr>
                    <td>${data.subject}</td>
                    <td>${data.score}</td>
                    <td><span class="grade-badge">${data.grade.toFixed(1)}</span></td>
                    <td><button onclick="deleteGrade('${key}')" class="btn btn-danger" style="padding:0.3rem 0.5rem; font-size:0.8rem;">ลบ</button></td>
                </tr>
            `;
        });

        const gpa = count > 0 ? (totalGrade / count).toFixed(2) : "0.00";
        document.getElementById('totalGpa').innerText = gpa;
    });
}

window.deleteGrade = (key) => {
    remove(ref(db, `users/${currentUserData.uid}/grades/${key}`));
}

// 5. ระบบแชท ม.1/6 แบบ Realtime
document.getElementById('sendChatBtn').addEventListener('click', () => {
    const text = document.getElementById('chatMessage').value;
    if (!text.trim()) return;

    push(ref(db, 'chats'), {
        senderId: currentUserData.id,
        senderName: currentUserData.name,
        text: text,
        timestamp: Date.now()
    }).then(() => {
        document.getElementById('chatMessage').value = '';
    });
});

function loadChat() {
    onValue(ref(db, 'chats'), (snapshot) => {
        const chatBox = document.getElementById('chatBox');
        chatBox.innerHTML = '';
        
        snapshot.forEach((child) => {
            const msg = child.val();
            const isMine = msg.senderId === currentUserData.id;
            const div = document.createElement('div');
            div.className = `chat-msg ${isMine ? 'msg-mine' : 'msg-other'}`;
            div.innerHTML = `<div class="msg-sender">${msg.senderName}</div>${msg.text}`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight; // เลื่อนลงล่างสุดเสมอ
    });
}

// 6. เปลี่ยนรหัสผ่าน
document.getElementById('changePwdBtn').addEventListener('click', async () => {
    const newPwd = document.getElementById('newPassword').value;
    if(newPwd.length < 6) return alert("รหัสผ่านต้องมี 6 ตัวอักษรขึ้นไป");

    try {
        await updatePassword(auth.currentUser, newPwd);
        alert("เปลี่ยนรหัสผ่านสำเร็จ!");
        closeModal('passwordModal');
    } catch (error) {
        alert("เกิดข้อผิดพลาด กรุณาล็อคเอาท์แล้วล็อคอินใหม่ก่อนเปลี่ยนรหัสผ่าน");
    }
});

// Modal Logic
window.openModal = (id) => document.getElementById(id).classList.add('active');
window.closeModal = (id) => document.getElementById(id).classList.remove('active');
