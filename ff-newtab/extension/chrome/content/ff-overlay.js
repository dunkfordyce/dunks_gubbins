ffnewtab.onFirefoxLoad = function(event) {
  document.getElementById("contentAreaContextMenu")
          .addEventListener("popupshowing", function (e){ ffnewtab.showFirefoxContextMenu(e); }, false);
};

ffnewtab.showFirefoxContextMenu = function(event) {
  // show or hide the menuitem based on what the context menu is on
  document.getElementById("context-ffnewtab").hidden = gContextMenu.onImage;
};

window.addEventListener("load", ffnewtab.onFirefoxLoad, false);
