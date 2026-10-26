/* Applique le thème choisi avant l'affichage, pour éviter un flash de couleur. */
(function () {
  try {
    var t = localStorage.getItem('portail-tiin-theme');
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  } catch (e) { /* stockage indisponible : on suit le réglage de la tablette */ }
})();
