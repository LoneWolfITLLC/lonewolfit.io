const initialCards = [
  {
    name: "Val Thorens",
    link: "images/1-photo-by-moritz-feldmann-from-pexels.jpg",
  },
  {
    name: "Restaurant Terrace",
    link: "images/2-photo-by-ceiline-from-pexels.jpg",
  },
  {
    name: "An outdoor cafe",
    link: "images/3-photo-by-tubanur-dogan-from-pexels.jpg",
  },
  {
    name: "A very long bridge, over the forest and through the trees",
    link: "images/4-photo-by-maurice-laschet-from-pexels.jpg",
  },
  {
    name: "Tunnel with morning light",
    link: "images/5-photo-by-van-anh-nguyen-from-pexels.jpg",
  },
  {
    name: "Mountain house",
    link: "images/6-photo-by-moritz-feldmann-from-pexels.jpg",
  },
];

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

const cardTemplate = document.querySelector("#card-template");
const cardsList = document.querySelector(".cards__list");

const previewModal = document.getElementById("preview-modal");
const previewModalCloseButton = previewModal.querySelector(".modal__close-btn");

function closeModal(modal) {
  if (!modal || modal.classList.contains("modal--closing")) return;
  if (modal.querySelector(".modal__image-container")) {
    modal.querySelectorAll(".modal__image-container").forEach((container) => {
      container.classList.add("modal__container--closing");
    });
  } else if (modal.querySelector(".modal__container")) {
    modal.querySelectorAll(".modal__container").forEach((container) => {
      container.classList.add("modal__container--closing");
    });
  }

  modal.classList.add("modal--closing");
  modal.addEventListener(
    "animationend",
    () => {
      modal.classList.remove("modal--closing");
      if (modal.querySelector(".modal__image-container")) {
        modal
          .querySelectorAll(".modal__image-container")
          .forEach((container) => {
            container.classList.remove("modal__container--closing");
          });
      } else if (modal.querySelector(".modal__container")) {
        modal.querySelectorAll(".modal__container").forEach((container) => {
          container.classList.remove("modal__container--closing");
        });
      }
      modal.classList.remove("modal_is-opened");
    },
    { once: true }
  );
}

function openModal(modal) {
  modal.classList.add("modal_is-opened");
  if (modal.querySelector(".modal__image-container")) {
    modal.querySelectorAll(".modal__image-container").forEach((container) => {
      container.classList.add("modal__container--opening");
    });
  } else if (modal.querySelector(".modal__container")) {
    modal.querySelectorAll(".modal__container").forEach((container) => {
      container.classList.add("modal__container--opening");
    });
  }
  modal.addEventListener(
    "animationend",
    () => {
      if (modal.querySelector(".modal__image-container")) {
        modal
          .querySelectorAll(".modal__image-container")
          .forEach((container) => {
            container.classList.remove("modal__container--opening");
          });
      } else if (modal.querySelector(".modal__container")) {
        modal.querySelectorAll(".modal__container").forEach((container) => {
          container.classList.remove("modal__container--opening");
        });
      }
    },
    { once: true }
  );
}

function getCardElement(data) {
  if (!data || !data.link || !data.name) return null;

  const cardElement = cardTemplate.content
    .querySelector(".card")
    .cloneNode(true);
  const cardImageEl = cardElement.querySelector(".card__image");
  //const cardContent = cardElement.querySelector(".card__content");
  const cardTitleEl = cardElement.querySelector(".card__title");

  cardImageEl.src = data.link;
  cardImageEl.alt = data.name;
  cardTitleEl.textContent = data.name;

  cardImageEl.addEventListener("click", (evt) => {
    evt.preventDefault();
    const previewModalImageEl = previewModal.querySelector(".modal__image");
    const previewModalTextEl = previewModal.querySelector(".modal__caption");

    previewModalImageEl.src = data.link;
    previewModalImageEl.alt = data.name;
    previewModalTextEl.textContent = data.name;
    openModal(previewModal);
  });

  const cardLikeBtnEl = cardElement.querySelector(".card__like-btn");
  cardLikeBtnEl.addEventListener("click", (evt) => {
    evt.preventDefault();
    cardLikeBtnEl.classList.toggle("card__like-btn_active");
  });

  const cardDeleteBtnEl = cardElement.querySelector(".card__delete-btn");
  cardDeleteBtnEl.addEventListener("click", (evt) => {
    evt.preventDefault();
    cardElement.remove();
  });

  return cardElement;
}

editProfileBtn.addEventListener("click", function (event) {
  event.preventDefault();
  editProfileNameInput.value = profileNameEl.textContent;
  editProfileDescriptionInput.value = profileDescriptionEl.textContent;
  openModal(editProfileModal);
});

editProfileCloseBtn.addEventListener("click", function (event) {
  event.preventDefault();
  closeModal(editProfileModal);
});

newPostBtn.addEventListener("click", function (event) {
  event.preventDefault();
  openModal(newPostModal);
});

newPostCloseBtn.addEventListener("click", function (event) {
  event.preventDefault();
  closeModal(newPostModal);
});

previewModalCloseButton.addEventListener("click", function (event) {
  event.preventDefault();
  closeModal(previewModal);
});

function handleEditProfileSubmit(event) {
  event.preventDefault();
  profileNameEl.textContent = editProfileNameInput.value;
  profileDescriptionEl.textContent = editProfileDescriptionInput.value;
  closeModal(editProfileModal);
}

editProfileForm.addEventListener("submit", handleEditProfileSubmit);

function handleNewPostSubmit(event) {
  event.preventDefault();
  //console.log("New Post Image Link: " + newPostImageLinkInput.value);
  //console.log("New Post Caption: " + newPostCaptionInput.value);
  const cardData = {
    name: newPostImageLinkInput.value,
    link: newPostCaptionInput.value,
  };
  const card = getCardElement(cardData);
  cardsList.prepend(card);
  closeModal(newPostModal);
}

newPostForm.addEventListener("submit", handleNewPostSubmit);

initialCards.forEach(function (item) {
  const card = getCardElement(item);
  cardsList.append(card);
});
