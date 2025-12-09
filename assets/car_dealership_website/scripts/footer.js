function initFooter() {
  const footer = document.querySelector(".footer");
  if (!footer) return;
  const facebookBtn = footer.querySelector("#facebookBtn");
  const instagramBtn = footer.querySelector("#instagramBtn");
  const tiktokBtn = footer.querySelector("#tiktokBtn");
  const youtubeBtn = footer.querySelector("#youtubeBtn");

  if(facebookBtn) facebookBtn.addEventListener("click", () => {
    window.open("https://www.facebook.com/BuySmart365", "_blank");
  });

  if(instagramBtn) instagramBtn.addEventListener("click", () => {
    window.open("https://www.instagram.com/buysmart365/", "_blank");
  });

  if(tiktokBtn) tiktokBtn.addEventListener("click", () => {
    window.open("https://www.tiktok.com/@buysmart365", "_blank");
  });

  if(youtubeBtn) youtubeBtn.addEventListener("click", () => {
    window.open("https://www.youtube.com/@buysmart365", "_blank");
  });
}

document.addEventListener("DOMContentLoaded", initFooter);
