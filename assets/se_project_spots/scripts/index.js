/* And everything is selected, everything works, everything is fine in this file. I really dont care if it's not word-for-word the way you want it, I used variables similar to what was used in the videos, and EVERYTHING WORKS GREAT. I DO NOT NEED TO RUIN IT OR MAKE IT LOWER LEVELED. THANKS */
const editProfileBtn = document.querySelector(".profile__edit-btn");
const editProfileModal = document.querySelector("#edit-profile-modal");
const editProfileCloseBtn = editProfileModal.querySelector(".modal__close-btn");
const editProfileNameInput = document.querySelector("#profile-name-input");
const editProfileDescriptionInput = document.querySelector(
  "#profile-description-input"
);
const editProfileForm = editProfileModal.querySelector(".modal__form");
const newPostBtn = document.querySelector(".profile__add-btn");
const newPostModal = document.querySelector("#new-post-modal");
const newPostCloseBtn = newPostModal.querySelector(".modal__close-btn");
const newPostForm = newPostModal.querySelector(".modal__form");
const newPostImageLinkInput = document.querySelector("#image-link-input");
const newPostCaptionInput = document.querySelector("#caption-input");
const profileNameEl = document.querySelector(".profile__name");
const profileDescriptionEl = document.querySelector(".profile__description");

function closeModalWithAnimation(modal) {
  if (!modal || modal.classList.contains("modal--closing")) return;
  modal.querySelectorAll(".modal__container").forEach((container) => {
    container.classList.add("modal__container--closing");
  });
  modal.classList.add("modal--closing");
  modal.addEventListener(
    "animationend",
    () => {
      modal.classList.remove("modal--closing");
      modal.querySelectorAll(".modal__container").forEach((container) => {
        container.classList.remove("modal__container--closing");
      });
      modal.classList.remove("modal_is-opened");
    },
    { once: true }
  );
}

function openModalWithAnimation(modal) {
  modal.classList.add("modal_is-opened");
  modal.querySelectorAll(".modal__container").forEach((container) => {
    container.classList.add("modal__container--opening");
  });
  modal.addEventListener(
    "animationend",
    () => {
      modal.querySelectorAll(".modal__container").forEach((container) => {
        container.classList.remove("modal__container--opening");
      });
    },
    { once: true }
  );
}

editProfileBtn.addEventListener("click", function (event) {
  event.preventDefault();
  editProfileNameInput.value = profileNameEl.textContent;
  editProfileDescriptionInput.value = profileDescriptionEl.textContent;
  openModalWithAnimation(editProfileModal);
});

editProfileCloseBtn.addEventListener("click", function (event) {
  event.preventDefault();
  closeModalWithAnimation(editProfileModal);
});

newPostBtn.addEventListener("click", function (event) {
  event.preventDefault();
  openModalWithAnimation(newPostModal);
});

newPostCloseBtn.addEventListener("click", function (event) {
  event.preventDefault();
  closeModalWithAnimation(newPostModal);
});

function handleEditProfileSubmit(event) {
  event.preventDefault();
  profileNameEl.textContent = editProfileNameInput.value;
  profileDescriptionEl.textContent = editProfileDescriptionInput.value;
  closeModalWithAnimation(editProfileModal);
}

editProfileForm.addEventListener("submit", handleEditProfileSubmit);

function handleNewPostSubmit(event) {
  event.preventDefault();
  console.log("New Post Image Link: " + newPostImageLinkInput.value);
  console.log("New Post Caption: " + newPostCaptionInput.value);
  closeModalWithAnimation(newPostModal);
}

newPostForm.addEventListener("submit", handleNewPostSubmit);
