window.onload = function() {
  // Access data
  document.getElementById('user-name').textContent = window.electronStore.get('userName');
  document.getElementById('user-photo').src = window.electronStore.get('userPhoto');
};

document.querySelector('.sidebar').addEventListener('mouseenter', () => {
  // document.getElementById("close-sidebar-svg").style.display = "block";
  document.documentElement.style.setProperty('--close-side-bar-icon-visibility', 'block');
});

document.querySelector('.sidebar').addEventListener('mouseleave', () => {
  // document.getElementById("close-sidebar-svg").style.display = "none";
  document.documentElement.style.setProperty('--close-side-bar-icon-visibility', 'none');
});

function openNav() {
  document.getElementById("menu").style.width = "200px";
  document.getElementById("main").style.marginLeft = "200px";
  document.getElementById("open-sidebar-svg").style.display = "none";
}

function closeNav() {
  document.getElementById("menu").style.width = "0";
  document.getElementById("main").style.marginLeft= "0";
  document.documentElement.style.setProperty('--close-side-bar-icon-visibility', 'none');
  document.getElementById("open-sidebar-svg").style.display = "block";
}

document.getElementById("signOutBtn").addEventListener('click', () => {
  // clean up electron store
  window.electronStore.delete('userName');
  window.electronStore.delete('userPhoto');
});