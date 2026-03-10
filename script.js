let shows = JSON.parse(localStorage.getItem("shows")) || []

async function fetchImage(title){

try{

let res = await fetch(`https://api.tvmaze.com/search/shows?q=${title}`)
let data = await res.json()

if(data[0] && data[0].show.image){
return data[0].show.image.medium
}

}catch(e){}

return "https://via.placeholder.com/70x100?text=No+Image"
}

const titleInput = document.getElementById("titleInput")
const suggestionsBox = document.getElementById("suggestions")

titleInput.addEventListener("input", async () => {

let query = titleInput.value.trim()

if(query.length < 2){
suggestionsBox.innerHTML = ""
return
}

let res = await fetch(`https://api.tvmaze.com/search/shows?q=${query}`)
let data = await res.json()

showSuggestions(data)

})

function showSuggestions(shows) {

suggestionsBox.innerHTML=""

shows.slice(0,8).forEach(result => {

let show = result.show

let div = document.createElement("div")
div.className="suggestion"

let img = show.image ? show.image.medium : ""

div.innerHTML = `
<img src="${img}">
${show.name}
`

div.onclick = () => {

selectedShow = show

modalTitle.textContent = show.name
modalImage.src = show.image ? show.image.original : ""
modalGenre.value = show.genres.join(", ")

currentRating = 0
buildStarSelector()
updateStarDisplay()
updateRatingArea()

modal.classList.remove("hidden")

suggestionsBox.innerHTML=""
titleInput.value=""

}

suggestionsBox.appendChild(div)

})

}

document.addEventListener("click", (e) => {

if(!e.target.closest(".input-group") && !e.target.closest(".suggestion")){
suggestionsBox.innerHTML=""
}

})

function showToast(message) {

  const container = document.getElementById("toastContainer");
  if(!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-hide");
  }, 2500);

  setTimeout(() => {
    toast.remove();
  }, 3000);

}

async function addShow() {

let title = document.getElementById("titleInput").value
let genre = document.getElementById("genreInput").value
let status = document.getElementById("statusInput").value

if(!title) return

let image = await fetchImage(title)

shows.push({
title,
genre,
status,
rating:0,
rank:0,
image
})

save()
renderShows()
}

function save() {
localStorage.setItem("shows",JSON.stringify(shows))
}

function updateStatusById(id, newStatus) {
  let show = shows.find(s => s.id === id);
  if(!show) return;
  
  const prevStatus = show.status;
  show.status = newStatus;
  save();
  renderShows();

   // Only trigger animation if status changed to Completed
  if(prevStatus !== "Completed" && newStatus === "Completed"){
    const card = document.querySelector(`.show-card[data-id='${id}']`);
    if(card){
      const overlay = document.createElement("div");
      overlay.className = "completed-overlay show";
      overlay.textContent = "Completed!";
      card.appendChild(overlay);

      setTimeout(()=>{
        overlay.classList.remove("show");
        setTimeout(()=>overlay.remove(), 400); // remove after fade out
      }, 1000); // show overlay for 1 second
    }
  }

}

function showDeleteConfirm(id, title){

  const card = document.querySelector(`.show-card[data-id='${id}']`);

  if(card.querySelector(".delete-overlay")) return;

  const overlay = document.createElement("div");
  overlay.className = "delete-overlay show";

  overlay.innerHTML = `
    <p>Delete show?</p>
    <div class="delete-actions">
      <button class="delete-confirm">✔</button>
      <button class="delete-cancel">✕</button>
    </div>
  `;

  card.appendChild(overlay);

  overlay.querySelector(".delete-confirm").onclick = () => {
    deleteShowById(id);
  };

  overlay.querySelector(".delete-cancel").onclick = () => {
    overlay.classList.remove("show");
    setTimeout(()=>overlay.remove(),200);
  };

}

function deleteShowById(id) {
  shows = shows.filter(s => s.id !== id);
  save();
  renderShows();
}

function updateRating(i,val) {
shows[i].rating = val
save()
}

function updateRank(i,val) {
shows[i].rank = val
save()
}

const statusButtons = document.querySelectorAll(".status-btn");
let selectedStatus = "To Watch"; // default

statusButtons.forEach(icon => {
  icon.addEventListener("click", () => {
    statusButtons.forEach(i => i.classList.remove("selected"));
    icon.classList.add("selected");
    selectedStatus = icon.dataset.status;
    updateRatingArea();
  });
});

function renderShows() {

let list = document.getElementById("shows")
let search = document.getElementById("titleInput").value.toLowerCase()
let sort = document.getElementById("sort").value

let filtered = shows.filter(s => 
  s.title.toLowerCase().includes(search)
);

if(sort){

  if(sort === "status"){

    const order = {
      "To Watch": 0,
      "Watching": 1,
      "Completed": 2
    };

    filtered.sort((a,b)=> order[a.status] - order[b.status]);

  } else {

    filtered.sort((a,b)=>{
      return a[sort].localeCompare
        ? a[sort].localeCompare(b[sort])
        : a[sort] - b[sort];
    });

  }

}

const dropdowns = document.querySelectorAll(".dropdown");

dropdowns.forEach(dropdown => {

    const select = dropdown.querySelector('.select');
    const caret = dropdown.querySelector('.caret');
    const menu = dropdown.querySelector('.menu');
    const options = dropdown.querySelectorAll('.menu li');
    const selected = dropdown.querySelector('.selected');

    select.addEventListener('click', () => {
        select.classList.toggle('select-clicked');
        caret.classList.toggle('caret-rotate');
        menu.classList.toggle('menu-open');
    });

    options.forEach(option => {
        option.addEventListener('click', () => {

            selected.innerText = option.innerText;

            select.classList.remove('select-clicked');
            caret.classList.remove('caret-rotate');
            menu.classList.remove('menu-open');

            options.forEach(option => {
                option.classList.remove('active');
            });

            option.classList.add('active');

        });
    });

});

list.innerHTML="";

const overlay = document.getElementById("emptyOverlay");

if(filtered.length === 0){
    overlay.classList.remove("hidden");
} else {
    overlay.classList.add("hidden");
}

filtered.forEach((show,i)=>{

let card = document.createElement("div")
card.className="show-card"
card.dataset.id = show.id;

card.innerHTML=`

<img src="${show.image}">

<div class="show-title">${show.title}</div>

<div class="show-meta genre">${show.genre}</div>

<div class="card-divider"></div>

${show.status === "Completed" ? `

<div class="rating-control">

    <button class="rating-arrow" data-id="${show.id}" data-direction="down" ${show.status !== "Completed" ? "disabled" : ""}>
        <svg fill="#ffffff" height="15px" width="15px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M168.837,256L388.418,36.418c8.331-8.331,8.331-21.839,0-30.17c-8.331-8.331-21.839-8.331-30.17,0L123.582,240.915 c-8.331,8.331-8.331,21.839,0,30.17l234.667,234.667c8.331,8.331,21.839,8.331,30.17,0c8.331-8.331,8.331-21.839,0-30.17 L168.837,256z"></path> </g> </g> </g>
        </svg>
    </button>

    <div class="stars">${show.status === "Completed" ? renderStars(show.rating) : ""}</div>
    
    <button class="rating-arrow" data-id="${show.id}" data-direction="up" ${show.status !== "Completed" ? "disabled" : ""}>
        <svg fill="#ffffff" height="15px" width="15px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512.005 512.005" xml:space="preserve" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M388.418,240.923L153.751,6.256c-8.341-8.341-21.824-8.341-30.165,0s-8.341,21.824,0,30.165L343.17,256.005 L123.586,475.589c-8.341,8.341-8.341,21.824,0,30.165c4.16,4.16,9.621,6.251,15.083,6.251c5.461,0,10.923-2.091,15.083-6.251 l234.667-234.667C396.759,262.747,396.759,249.264,388.418,240.923z"></path> </g> </g> </g>
        </svg>
    </button>

</div>

` : ""}

<div class="show-meta">

<select class="status-dropdown ${show.status.replace(" ","").toLowerCase()}" 
onchange="updateStatusById(${show.id}, this.value)">

    <option value="To Watch" ${show.status === 'To Watch' ? 'selected disabled' : ''}>To Watch</option>
    <option value="Watching" ${show.status === 'Watching' ? 'selected disabled' : ''}>Watching</option>
    <option value="Completed" ${show.status === 'Completed' ? 'selected disabled' : ''}>Completed</option>

</select>

</div>

<button class="delete" onclick="showDeleteConfirm(${show.id})">✕</button>

`

list.appendChild(card)

})

}

document.addEventListener("click", (e) => {

const arrow = e.target.closest(".rating-arrow")
if (!arrow) return; // user clicks somewhere else

const id = arrow.dataset.id
const direction = arrow.dataset.direction
const show = shows.find(s=>s.id==id)

if(direction === "up" && show.rating < 5) {
    show.rating += 0.5;
}

if(direction === "down" && show.rating > 0) {
    show.rating -= 0.5;
}

renderShows();

})

function updateStarDisplay() {

    let stars = ratingContainer.children

    for(let i = 0; i < stars.length; i++) {

        let value = i + 1;

        stars[i].className="star"

        if(currentRating >= value) {
            stars[i].classList.add("full")
        }
        else if(currentRating >= value-0.5) {
            stars[i].classList.add("half")
        }
    }
}

let selectedShow = null

const modal = document.getElementById("showModal")
const modalTitle = document.getElementById("modalTitle")
const modalImage = document.getElementById("modalImage")
const modalGenre = document.getElementById("modalGenre")
const ratingContainer = document.getElementById("ratingStars")
const ratingUp = document.getElementById("ratingUp")
const ratingDown = document.getElementById("ratingDown")
let currentRating = 0

document.getElementById("closeModal").onclick = () => {
modal.classList.add("hidden")
}

ratingUp.onclick = () => {

if(selectedStatus !== "Completed") return

if(currentRating < 5){
currentRating += 0.5
updateStarDisplay()
}

}

ratingDown.onclick = () => {

if(selectedStatus !== "Completed") return

if(currentRating > 0){
currentRating -= 0.5
updateStarDisplay()
}

}

document.getElementById("confirmAdd").onclick = () => {

if(!selectedShow) return

shows.push({
    id: Date.now(),
    title: selectedShow.name,
    genre: modalGenre.value,
    status: selectedStatus,
    rating: currentRating,
    image: selectedShow.image ? selectedShow.image.original: "",
    rank: 0
})

save()
renderShows()

showToast(`✓ <strong>${selectedShow.name}</strong> has been added.`);

buildStarSelector()
currentRating = 0
updateStarDisplay()

modal.classList.add("hidden")
selectedShow = null

}

function updateRatingArea() {

const ratingStars = document.getElementById("ratingStars")
const ratingControl = document.getElementById("ratingControl")
const ratingMessage = document.getElementById("ratingMessage")

if(selectedStatus === "Completed") {
ratingStars.style.display = "flex"
ratingControl.style.display = "flex"
ratingMessage.classList.add("hidden")
} else {
ratingStars.style.display = "none"
ratingControl.style.display = "none"
ratingMessage.classList.remove("hidden")
}

}

function buildStarSelector() {

ratingContainer.innerHTML=""

for(let i=1;i<=5;i++) {

let star=document.createElement("span")
star.className="star"
star.textContent="★"

/* star.onclick=(e)=>{

let rect = star.getBoundingClientRect()
let clickX = e.clientX - rect.left

if(clickX < rect.width/2){
currentRating = i - 0.5
}else{
currentRating = i
}
*/

updateStarDisplay()

ratingContainer.appendChild(star)

}
}

function renderStars(rating) {

let starsHTML = ""

for(let i=1;i<=5;i++){

if(rating >= i){

starsHTML += `<span class="star full">★</span>`

}else if(rating >= i-0.5){

starsHTML += `<span class="star half">★</span>`

}else{

starsHTML += `<span class="star">★</span>`

}

}

return starsHTML

}

renderShows()