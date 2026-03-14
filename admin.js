// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyA6gthbmmbK_dZWt-bdpXEw986Lj94msz4",
  authDomain: "charvis-maggam-hub.firebaseapp.com",
  projectId: "charvis-maggam-hub",
  appId: "1:137089691820:web:fe35a99dd7dd231ca02f09"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();


// ================= ADMIN EMAIL =================
const ADMIN_EMAIL = "admin@charvi.com";


// ================= CLOUDINARY CONFIG =================
const CLOUD_NAME = "dzlncwjiy";
const UPLOAD_PRESET = "charvi_upload";


// ================= LOGIN =================
document.getElementById("loginBtn")?.addEventListener("click", function () {

  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  const msg = document.getElementById("loginMsg");

  if(!email || !password){
      if(msg) msg.innerText = "Enter email and password";
      return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
        if(msg) msg.innerText = "";
        window.location.href = "admin-dashboard.html";
    })
    .catch((error) => {
        if(msg) msg.innerText = error.message;
        console.error(error);
    });

});
// ================= AUTH STATE =================
auth.onAuthStateChanged(function (user) {

  const loginSection = document.getElementById("loginSection");
  const dashboardSection = document.getElementById("dashboardSection");

  if (!loginSection || !dashboardSection) return;

  if (user) {

    if (user.email !== ADMIN_EMAIL) {
      alert("Access Denied ❌");
      auth.signOut();
      return;
    }

    loginSection.style.display = "none";
    dashboardSection.style.display = "block";

    loadBookings();
    loadGallery();

  } else {
    loginSection.style.display = "block";
    dashboardSection.style.display = "none";
  }

});


// ================= LOAD BOOKINGS =================
async function loadBookings(){

  const { data, error } = await db
    .from("bookings")
    .select("*")
    .order("created_at",{ascending:false});

  if(error){
    console.error("Booking Load Error:", error);
    return;
  }

  const tableBody = document.querySelector("#bookingTable tbody");

  if(!tableBody) return;

  tableBody.innerHTML="";

  let todayCount=0;
  const today=new Date().toDateString();

  data.forEach(booking=>{

    const bookingDate=new Date(booking.created_at).toDateString();

    if(bookingDate===today){
      todayCount++;
    }

    const row=document.createElement("tr");

    row.innerHTML=`
      <td>${new Date(booking.created_at).toLocaleString()}</td>
      <td>${booking.booking_id}</td>
      <td>${booking.name}</td>
      <td>${booking.phone}</td>
      <td>${booking.service}</td>
      <td>${booking.email}</td>
      <td>
        <button onclick="deleteBooking(${booking.id})">🗑</button>
      </td>
    `;

    tableBody.appendChild(row);

  });

  const total = document.getElementById("totalBookings");
  const todayEl = document.getElementById("todayBookings");

  if(total) total.innerText=data.length;
  if(todayEl) todayEl.innerText=todayCount;

}


// ================= DELETE BOOKINGS =================
async function deleteBooking(id){

  if(!confirm("Delete this booking?")) return;

  const { error } = await db
    .from("bookings")
    .delete()
    .eq("id", id);

  if(error){
    console.error("Delete Error:", error);
    return;
  }

  loadBookings();

}


// ================= CLOUDINARY IMAGE UPLOAD =================
const dropArea = document.getElementById("dropArea");
const imageInput = document.getElementById("imageInput");

if (dropArea && imageInput) {

  dropArea.addEventListener("click", () => imageInput.click());

  dropArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropArea.classList.add("dragover");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragover");
  });

  dropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    dropArea.classList.remove("dragover");
    uploadToCloudinary(e.dataTransfer.files[0]);
  });

  imageInput.addEventListener("change", () => {
    uploadToCloudinary(imageInput.files[0]);
  });

}


// ================= UPLOAD TO CLOUDINARY =================
function uploadToCloudinary(file){

  if(!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(async data => {

    console.log("Cloudinary Response:", data);

    const imageUrl = data.secure_url;

    if(!imageUrl){
      console.error("Image URL missing");
      return;
    }

    const { error } = await db
      .from("gallery")
      .insert([{ image_url: imageUrl }]);

    if(error){
      console.error("Supabase Insert Error:", error);
      return;
    }

    loadGallery();

  })
  .catch(err => console.error("Upload Error:", err));
}


// ================= LOAD GALLERY =================
async function loadGallery(){

  const { data, error } = await db
    .from("gallery")
    .select("*")
    .order("created_at",{ascending:false});

  if(error){
    console.error("Gallery Load Error:", error);
    return;
  }

  const gallery = document.getElementById("galleryContainer");

  if(!gallery) return;

  gallery.innerHTML = "";

  data.forEach(img => {

    const div = document.createElement("div");
    div.className = "gallery-item";

    const image = document.createElement("img");
    image.src = img.image_url;

    const btn = document.createElement("button");
    btn.className = "delete-btn";
    btn.innerText = "🗑";

    btn.addEventListener("click", async function(){

      if(confirm("Delete image?")){

        await db
          .from("gallery")
          .delete()
          .eq("id", img.id);

        loadGallery();

      }

    });

    div.appendChild(image);
    div.appendChild(btn);
    gallery.appendChild(div);

  });

  const imgCount = document.getElementById("totalImages");
  if(imgCount) imgCount.innerText=data.length;

}


// ================= SECTION SWITCH =================
window.showSection = function(sectionId, element){

  document.querySelectorAll(".admin-section").forEach(sec=>{
    sec.style.display="none";
  });

  document.querySelectorAll(".menu-item").forEach(item=>{
    item.classList.remove("active");
  });

  const section=document.getElementById(sectionId);

  if(section) section.style.display="block";

  if(element){
    element.classList.add("active");
  }

}


// ================= SEARCH =================
function searchBooking(){

  const input = document.getElementById("searchInput").value.toLowerCase();
  const rows = document.querySelectorAll("#bookingTable tbody tr");

  rows.forEach(row => {
    const name = row.children[2].innerText.toLowerCase();
    row.style.display = name.includes(input) ? "" : "none";
  });

}


// ================= EXPORT BOOKINGS =================
async function exportBookings(){

  const { data } = await db
    .from("bookings")
    .select("*");

  let csv="Booking ID,Name,Phone,Service,Email\n";

  data.forEach(b=>{
    csv+=`${b.booking_id},${b.name},${b.phone},${b.service},${b.email}\n`;
  });

  const blob=new Blob([csv],{type:"text/csv"});
  const url=window.URL.createObjectURL(blob);

  const a=document.createElement("a");
  a.href=url;
  a.download="bookings.csv";
  a.click();

}


// ================= LOGOUT =================
document.getElementById("logoutBtn")?.addEventListener("click", function(){
  auth.signOut();
});
