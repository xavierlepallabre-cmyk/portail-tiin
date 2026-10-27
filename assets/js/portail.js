/* ==========================================================================
   Portail TIIN — moteur d'affichage
   Le contenu vient entièrement de data/catalogue.json.
   Pour ajouter une ressource, on modifie le catalogue, jamais ce fichier.
   ========================================================================== */
(function () {
  'use strict';

  var CATALOGUE_URL = 'data/catalogue.json';
  var vue = document.getElementById('vue');
  var nav = document.getElementById('mainnav');

  var cat = null;          // catalogue chargé
  var rubById = {};        // rubriques indexées
  var lastRoute = null;    // route affichée
  var lastRouteBefore = null; // route précédente (pour le retour intelligent)
  var firstRender = true;

  /* ---------- Outils ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // N'accepte que des liens web (http/https) ou des chemins relatifs du portail.
  function safeUrl(u) {
    if (!u || typeof u !== 'string') return null;
    var t = u.trim();
    if (/^https?:\/\//i.test(t)) return t;
    if (/^[a-z][a-z0-9+.-]*:/i.test(t) || t.indexOf('//') === 0) return null;
    return t;
  }
  function isAbsolute(u) { return /^https?:\/\//i.test(u || ''); }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function icon(name, cls) {
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  }
  function plural(n, one, many) { return n + ' ' + (n > 1 ? many : one); }
  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (v) { if (v && !seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }
  function frDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  var STATUTS = {
    'publie': { cls: 'status-ok', txt: 'Disponible' },
    'disponible': { cls: 'status-ok', txt: 'Disponible' },
    'en-preparation': { cls: 'status-wait', txt: 'En préparation' },
    'envisage': { cls: 'status-idea', txt: 'Envisagé' }
  };
  function statusBadge(s) {
    var st = STATUTS[s] || STATUTS['en-preparation'];
    return '<span class="status ' + st.cls + '">' + st.txt + '</span>';
  }

  // Icône selon le format d'un document ou d'une ressource
  function formatIcon(f) {
    var k = norm(f);
    if (/simul|parcours|interactif/.test(k)) return 'play';
    if (/outil|calcul|appli/.test(k)) return 'apps';
    if (/diapo|ppt|odp|presentation|slide/.test(k)) return 'slides';
    if (/image|photo|poster|affiche|jpe?g|png|webp/.test(k)) return 'image';
    if (/video|mp4|webm/.test(k)) return 'video';
    if (/pdf|fiche|cours|doc|rapport|odt/.test(k)) return 'file';
    return 'link';
  }
  function formatLabel(f) {
    var k = norm(f);
    var map = { pdf: 'PDF', pptx: 'Diaporama', ppt: 'Diaporama', odp: 'Diaporama', jpg: 'Image', jpeg: 'Image', png: 'Image', mp4: 'Vidéo', webm: 'Vidéo', lien: 'Lien', docx: 'Document Word', odt: 'Document' };
    return map[k] || f || 'Document';
  }

  /* ---------- Visibilité : la règle de publication ---------- */
  function isVisible(it) {
    if (!it || !it.id || !it.titre) return false;
    if (it.statut === 'brouillon' || it.statut === 'archive') return false;
    var rub = rubById[it.rubrique];
    if (!rub) return false;
    if (rub.vue === 'galerie') {
      // Un projet d'élève n'apparaît qu'après vérification de l'autorisation de diffusion.
      if (it.exemple) return !!(cat.portail && cat.portail.afficherExemples);
      return !!(it.autorisation && it.autorisation.diffusionVerifiee === true);
    }
    return true;
  }
  function itemsOf(rubId) {
    return (cat.ressources || []).filter(function (it) { return it.rubrique === rubId && isVisible(it); });
  }

  /* ---------- Routage (compatible bouton Retour d'Android) ---------- */
  function parseHash() {
    var h = location.hash.replace(/^#/, '');
    if (!h || h === '/') return { parts: [], query: {} };
    var q = {}, path = h, i = h.indexOf('?');
    if (i >= 0) {
      path = h.slice(0, i);
      new URLSearchParams(h.slice(i + 1)).forEach(function (v, k) { q[k] = v; });
    }
    return { parts: path.replace(/^\//, '').split('/').filter(Boolean).map(decodeURIComponent), query: q };
  }
  function setQuery(q) {
    var r = parseHash();
    var base = '#/' + r.parts.map(encodeURIComponent).join('/');
    var s = new URLSearchParams();
    Object.keys(q).forEach(function (k) { if (q[k]) s.set(k, q[k]); });
    var str = s.toString();
    // replaceState : changer un filtre ne crée pas d'étape dans l'historique
    history.replaceState(history.state, '', base + (str ? '?' + str : ''));
  }

  var scrollMemo = {};
  try { scrollMemo = JSON.parse(sessionStorage.getItem('portail-scroll') || '{}'); } catch (e) {}
  function saveScroll() {
    scrollMemo[routeKey()] = window.scrollY;
    try { sessionStorage.setItem('portail-scroll', JSON.stringify(scrollMemo)); } catch (e) {}
  }
  function routeKey() { return parseHash().parts.join('/') || '/'; }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function render() {
    var r = parseHash();
    var key = r.parts.join('/') || '/';
    var html;
    try {
      if (r.parts.length === 0) html = viewHome();
      else if (r.parts[0] === 'dispositif') html = viewDispositif();
      else {
        var rub = rubById[r.parts[0]];
        if (!rub) html = viewNotFound();
        else if (r.parts[1]) html = rub.vue === 'galerie' ? viewProjet(rub, r.parts[1]) : viewNotFound();
        else html = viewRubrique(rub, r.query);
      }
    } catch (err) {
      console.error(err);
      html = viewFault('Une erreur est survenue à l’affichage de cette page.', String(err && err.message || err));
    }

    vue.innerHTML = html;
    vue.classList.remove('is-entering'); void vue.offsetWidth; vue.classList.add('is-entering');
    updateNav(r.parts[0] || '');
    bindView(r);

    var y = scrollMemo[key] || 0;
    window.scrollTo(0, y);
    if (!firstRender) vue.focus({ preventScroll: true });
    firstRender = false;
    lastRoute = key;
    document.title = pageTitle(r);
  }

  function pageTitle(r) {
    var base = (cat && cat.portail && cat.portail.nom) || 'Portail TIIN';
    if (!r.parts.length) return base;
    if (r.parts[0] === 'dispositif') return 'Le dispositif — ' + base;
    var rub = rubById[r.parts[0]];
    return (rub ? rub.titreLong || rub.titre : 'Page introuvable') + ' — ' + base;
  }

  /* ---------- Navigation principale ---------- */
  function buildNav() {
    var links = [{ id: '', titre: 'Accueil', icone: 'home', couleur: 'apps' }].concat(
      (cat.rubriques || []).filter(function (r) { return r.menu; })
    );
    nav.innerHTML = links.map(function (l) {
      return '<a class="navlink" href="#/' + esc(l.id) + '" data-route="' + esc(l.id) + '" style="--c:var(--c-' + esc(l.couleur || 'neutre') + ')">' +
        '<span class="navicon">' + icon(l.icone || 'apps') + '</span><span>' + esc(l.titre) + '</span></a>';
    }).join('');
  }
  function updateNav(first) {
    nav.querySelectorAll('.navlink').forEach(function (a) {
      if (a.getAttribute('data-route') === first) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    var info = document.querySelector('.topbar a[href="#/dispositif"]');
    if (info) { if (first === 'dispositif') info.setAttribute('aria-current', 'page'); else info.removeAttribute('aria-current'); }
  }

  /* ==========================================================================
     Vues
     ========================================================================== */

  function assemblySvg() {
    // Le motif des barres du logo Tocqueville, rejoué une fois à l'ouverture.
    var bars = [
      [0, 70, 120, 'o'], [24, 30, 150, 'o'], [24, 186, 34, 'o'], [48, 96, 124, 'g'],
      [72, 10, 170, 'o'], [96, 60, 90, 'b'], [96, 156, 64, 'o'], [120, 22, 128, 'o'],
      [120, 156, 64, 'b'], [144, 84, 136, 'o'], [168, 40, 100, 'o'], [168, 146, 74, 'o'],
      [192, 110, 80, 'g'], [216, 52, 120, 'b']
    ];
    return '<svg class="assembly' + (sessionStorage.getItem('portail-anim') ? '' : ' play') + '" viewBox="0 0 230 220" role="img" aria-label="Motif des barres du lycée Tocqueville">' +
      bars.map(function (b, i) {
        return '<rect class="' + b[3] + '" x="' + b[0] + '" y="' + b[1] + '" width="14" height="' + b[2] + '" rx="4" style="animation-delay:' + (i * 45) + 'ms"/>';
      }).join('') + '</svg>';
  }

  function viewHome() {
    var p = cat.portail || {};
    var apps = itemsOf('applications');
    var others = (cat.rubriques || []).filter(function (r) { return r.menu && r.id !== 'applications'; });

    var html = '<section class="hero">' +
      '<div>' +
        '<h1>Manipuler, observer, comprendre.</h1>' +
        '<p class="lead">Les applications, les ressources et les travaux de ta formation, réunis sur ta tablette.</p>' +
        '<p class="where">' + esc(p.formation || 'Bac Pro TIIN') + ', ' + esc(p.etablissement || '') + '</p>' +
      '</div>' +
      '<div class="art">' + assemblySvg() + '</div>' +
    '</section>';

    var rubApps = rubById['applications'];
    html += '<section class="section" aria-labelledby="h-apps">' +
      '<div class="section-head"><h2 id="h-apps">' + esc(rubApps ? rubApps.titreLong : 'Applications') + '</h2></div>' +
      '<div class="apps">' + apps.map(appCard).join('') + '</div>' +
    '</section>';

    if (others.length) {
      html += '<section class="section" aria-labelledby="h-more">' +
        '<div class="section-head"><h2 id="h-more">Explorer aussi</h2></div>' +
        '<div class="tiles">' + others.map(rubTile).join('') + '</div>' +
      '</section>';
    }

    html += '<footer class="homefoot">' +
      '<span>Aucun compte, aucune donnée personnelle collectée.</span>' +
      '<a href="#/dispositif">' + icon('info', 'ic-sm') + 'Le dispositif TIIN sur tablette</a>' +
      '<p class="credit">Conception originale : Xavier Le Pallabre<br>Ressource pédagogique développée à titre personnel, avec l’assistance d’outils d’intelligence artificielle.<br>© 2026 Xavier Le Pallabre — Attribution de l’auteur original à conserver lors des réutilisations et adaptations, conformément à la licence applicable.</p>' +
    '</footer>';
    return html;
  }

  function appCard(it) {
    var url = safeUrl(it.url);
    var look = ['nuclea', 'surete'].indexOf(it.apparence) >= 0 ? it.apparence : 'defaut';
    var figs = (it.chiffres || []).map(function (c) {
      return '<li><b>' + esc(c.valeur) + '</b><span>' + esc(c.libelle) + '</span></li>';
    }).join('');
    var shortcuts = (it.raccourcis || []).map(function (s) {
      var u = safeUrl(s.url);
      if (!u) return '';
      return '<li><a href="' + esc(u) + '" data-ext="' + esc(it.titre) + '" style="--dot:' + esc(s.couleur || 'currentColor') + '">' + esc(s.titre) + '</a></li>';
    }).join('');
    return '<article class="appcard is-' + look + '">' +
      '<a class="appcard-main" href="' + esc(url || '#') + '" data-ext="' + esc(it.titre) + '" aria-label="Ouvrir ' + esc(it.titre) + '">' +
        (it.icone ? '<img class="appcard-icon" src="' + esc(safeUrl(it.icone)) + '" alt="" width="72" height="72">' : '') +
        '<h3>' + esc(it.titre) + '</h3>' +
        '<span class="sub">' + esc(it.sousTitre || '') + '</span>' +
        '<p class="desc">' + esc(it.description || '') + '</p>' +
        (figs ? '<ul class="figures">' + figs + '</ul>' : '') +
        (it.contenus && it.contenus.length ? '<ul class="contents" aria-label="Contenu">' + it.contenus.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>' : '') +
      '</a>' +
      (shortcuts ? '<ul class="shortcuts" aria-label="Accès directs dans ' + esc(it.titre) + '">' + shortcuts + '</ul>' : '') +
      '<div class="appcard-foot"><span class="open">Ouvrir ' + icon('open', 'ic-sm') + '</span></div>' +
    '</article>';
  }

  function rubTile(rub) {
    var items = itemsOf(rub.id);
    var meta = '';
    if (rub.vue === 'galerie') {
      var real = items.filter(function (i) { return !i.exemple; }).length;
      meta = real ? plural(real, 'projet publié', 'projets publiés') :
        (items.length ? 'Galerie prête, illustrée par des exemples' : 'Galerie prête pour les premiers projets');
    } else if (rub.vue === 'bibliotheque' || rub.vue === 'cartes') {
      meta = items.length ? plural(items.length, 'ressource', 'ressources') : 'Prête à accueillir des documents';
    } else {
      meta = rub.description || '';
    }
    var badge = rub.statut ? statusBadge(rub.statut) : '';
    return '<a class="tile" href="#/' + esc(rub.id) + '" style="--c:var(--c-' + esc(rub.couleur || 'neutre') + ')">' +
      '<span class="tile-ic">' + icon(rub.icone || 'apps') + '</span>' +
      '<h3>' + esc(rub.titreLong || rub.titre) + '</h3>' +
      '<p>' + esc(meta) + '</p>' +
      (badge ? badge : '') +
      '<span class="tile-end">' + icon('chevron') + '</span>' +
    '</a>';
  }

  function pageHead(rub, extra) {
    return '<header class="pagehead" style="--c:var(--c-' + esc(rub.couleur || 'neutre') + ')">' +
      '<span class="rod" aria-hidden="true"></span>' +
      '<h1>' + esc(rub.titreLong || rub.titre) + (extra || '') + '</h1>' +
      '<p>' + esc(rub.description || '') + '</p>' +
    '</header>';
  }

  function viewRubrique(rub, query) {
    switch (rub.vue) {
      case 'applications': return viewApplications(rub);
      case 'galerie': return viewGalerie(rub, query);
      case 'bibliotheque': return viewBibliotheque(rub, query);
      case 'emplacement': return viewEmplacement(rub);
      default: return viewCartes(rub);
    }
  }

  function viewApplications(rub) {
    var apps = itemsOf(rub.id);
    return pageHead(rub) +
      (apps.length ? '<div class="apps">' + apps.map(appCard).join('') + '</div>' :
        '<div class="empty"><strong>Aucune application publiée.</strong><span>Les applications déclarées dans le catalogue apparaîtront ici.</span></div>');
  }

  /* --- Filtres partagés (galerie et bibliothèque) --- */
  var FILTER_LABELS = { anneeScolaire: 'Année', typeProjet: 'Type', thematique: 'Thème', discipline: 'Discipline', niveau: 'Niveau', format: 'Format' };

  function filterBar(rub, items, query, placeholder) {
    var rows = (rub.filtres || []).map(function (f) {
      var values = uniq(items.map(function (i) { return i[f]; })).sort(function (a, b) {
        return f === 'anneeScolaire' ? String(b).localeCompare(String(a)) : String(a).localeCompare(String(b), 'fr');
      });
      if (values.length < 2) return '';
      var cur = query[f] || '';
      return '<div class="chiprow" role="group" aria-label="Filtrer par ' + esc((FILTER_LABELS[f] || f).toLowerCase()) + '">' +
        '<span class="chiprow-label">' + esc(FILTER_LABELS[f] || f) + '</span>' +
        '<button type="button" class="chip" data-filter="' + esc(f) + '" data-value="" aria-pressed="' + (!cur) + '">Tous</button>' +
        values.map(function (v) {
          return '<button type="button" class="chip" data-filter="' + esc(f) + '" data-value="' + esc(v) + '" aria-pressed="' + (cur === v) + '">' + esc(v) + '</button>';
        }).join('') +
      '</div>';
    }).join('');
    return '<div class="toolbar">' +
      '<div class="searchbox">' + icon('search') +
        '<input type="search" id="q" enterkeyhint="search" autocomplete="off" placeholder="' + esc(placeholder) + '" aria-label="' + esc(placeholder) + '" value="' + esc(query.q || '') + '">' +
        '<button type="button" class="clear" id="qclear" aria-label="Effacer la recherche"' + (query.q ? '' : ' hidden') + '>' + icon('close', 'ic-sm') + '</button>' +
      '</div>' + rows +
    '</div>';
  }
  function applyFilters(rub, items, query) {
    var q = norm(query.q);
    return items.filter(function (it) {
      for (var i = 0; i < (rub.filtres || []).length; i++) {
        var f = rub.filtres[i];
        if (query[f] && it[f] !== query[f]) return false;
      }
      if (!q) return true;
      var hay = norm([it.titre, it.description, it.thematique, it.typeProjet, it.discipline, it.format, (it.motsCles || []).join(' ')].join(' '));
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
    });
  }

  function viewGalerie(rub, query) {
    var all = itemsOf(rub.id);
    var hasExamples = all.some(function (i) { return i.exemple; });
    var list = applyFilters(rub, all, query);

    var html = pageHead(rub);
    if (hasExamples) {
      html += '<div class="notice">' + icon('info') + '<p>Les fiches marquées « Exemple fictif » montrent la présentation des futurs projets. Elles ne correspondent à aucun travail réel et seront retirées à l’arrivée des premiers projets.</p></div>';
    }
    if (!all.length) {
      return html + '<div class="empty"><strong>La galerie attend ses premiers projets.</strong>' +
        '<span>Chaque projet est publié après accord de diffusion et vérification des informations personnelles.</span></div>';
    }
    html += filterBar(rub, all, query, 'Rechercher un projet, un thème…');
    return html + '<div id="results">' + galerieResults(rub, list) + '</div>';
  }

  function galerieResults(rub, list) {
    var html = '<p class="resultcount" aria-live="polite">' + plural(list.length, 'fiche', 'fiches') + '</p>';
    if (!list.length) {
      return html + '<div class="empty"><strong>Aucun projet ne correspond.</strong><button type="button" class="btn btn-quiet" data-reset>Effacer les filtres</button></div>';
    }
    html += '<div class="gallery">' + list.map(function (it) {
      var img = safeUrl(it.image);
      return '<a class="pcard" href="#/' + esc(rub.id) + '/' + encodeURIComponent(it.id) + '">' +
        '<div class="pcard-media">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" width="400" height="300">' : '') +
          (it.exemple ? '<span class="tag-example">Exemple fictif</span>' : '') + '</div>' +
        '<div class="pcard-body">' +
          '<div class="pcard-meta"><span class="type">' + esc(it.typeProjet || '') + '</span><span>' + esc(it.anneeScolaire || '') + '</span><span>' + esc(it.thematique || '') + '</span></div>' +
          '<h3>' + esc(it.titre) + '</h3>' +
        '</div></a>';
    }).join('') + '</div>';
    return html;
  }

  function viewProjet(rub, id) {
    var it = itemsOf(rub.id).filter(function (i) { return i.id === id; })[0];
    if (!it) return viewNotFound('Ce projet n’existe pas ou n’est pas publié.');
    var img = safeUrl(it.image);
    var docs = (it.documents || []).map(function (d) {
      var u = safeUrl(d.url); if (!u) return '';
      return '<li><a class="doc" href="' + esc(u) + '" target="_blank" rel="noopener">' +
        '<span class="doc-ic">' + icon(formatIcon(d.format || d.url)) + '</span>' +
        '<span>' + esc(d.titre || 'Document') + '<small>' + esc(formatLabel(d.format)) + (d.taille ? ', ' + esc(d.taille) : '') + '</small></span>' +
        '<span class="ic-end">' + icon('open', 'ic-sm') + '</span></a></li>';
    }).join('');
    var links = (it.liens || []).map(function (l) {
      var u = safeUrl(l.url); if (!u) return '';
      return '<li><a class="doc" href="' + esc(u) + '" target="_blank" rel="noopener">' +
        '<span class="doc-ic">' + icon('link') + '</span><span>' + esc(l.titre || u) + '<small>Lien de consultation</small></span>' +
        '<span class="ic-end">' + icon('open', 'ic-sm') + '</span></a></li>';
    }).join('');
    var facts = [['Année scolaire', it.anneeScolaire], ['Type', it.typeProjet], ['Thème', it.thematique], ['Réalisé par', it.auteurs]]
      .filter(function (f) { return f[1]; })
      .map(function (f) { return '<dt>' + f[0] + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('');
    var rights = it.exemple ?
      'Exemple fictif : aucun élève n’est concerné par cette fiche.' :
      'Diffusion autorisée' + (it.autorisation && it.autorisation.verifieeLe ? ', vérifiée le ' + frDate(it.autorisation.verifieeLe) : '') + '. Pour demander un retrait, s’adresser à l’enseignant.';

    return '<a class="backlink" href="#/' + esc(rub.id) + '" data-back="' + esc(rub.id) + '">' + icon('back') + 'Tous les projets</a>' +
      '<article class="detail">' +
        '<div class="detail-media">' + (img ? '<img src="' + esc(img) + '" alt="Illustration du projet ' + esc(it.titre) + '" width="800" height="600">' : '') +
          (it.exemple ? '<span class="tag-example">Exemple fictif</span>' : '') + '</div>' +
        '<div>' +
          '<h1>' + esc(it.titre) + '</h1>' +
          '<p class="desc">' + esc(it.description || '') + '</p>' +
          (facts ? '<dl class="facts">' + facts + '</dl>' : '') +
          '<section class="section" style="margin-top:28px" aria-labelledby="h-docs"><div class="section-head" style="margin-bottom:0"><h2 id="h-docs">Documents associés</h2></div>' +
            ((docs || links) ? '<ul class="docs">' + docs + links + '</ul>' :
              '<div class="empty" style="margin-top:12px"><span>Aucun document joint pour l’instant. Rapports, diaporamas, photos ou vidéos apparaîtront ici.</span></div>') +
          '</section>' +
          '<p class="rights">' + icon('shield') + '<span>' + rights + '</span></p>' +
        '</div>' +
      '</article>';
  }

  function viewBibliotheque(rub, query) {
    var all = itemsOf(rub.id);
    var list = applyFilters(rub, all, query);
    var html = pageHead(rub);
    if (!all.length) {
      return html + '<div class="empty"><strong>La bibliothèque est prête.</strong><span>Les supports de cours, fiches de synthèse et documents apparaîtront ici dès leur ajout au catalogue.</span></div>';
    }
    html += filterBar(rub, all, query, 'Rechercher une ressource…');
    html += '<div id="results">' + biblioResults(rub, list) + '</div>';
    var hasDocs = all.some(function (i) { return /pdf|fiche|cours/i.test(i.format || ''); });
    if (!hasDocs) {
      html += '<div class="empty" style="margin-top:28px"><strong>Supports de cours et fiches de synthèse</strong>' +
        '<span>Cette partie accueillera les documents PDF au fil des séances. Ils pourront être classés par discipline, thème et niveau.</span></div>';
    }
    return html;
  }

  function biblioResults(rub, list) {
    var html = '<p class="resultcount" aria-live="polite">' + plural(list.length, 'ressource', 'ressources') + '</p>';
    if (!list.length) {
      html += '<div class="empty"><strong>Aucune ressource ne correspond.</strong><button type="button" class="btn btn-quiet" data-reset>Effacer les filtres</button></div>';
    } else {
      var groups = {};
      list.forEach(function (it) { var g = it.thematique || 'Autres ressources'; (groups[g] = groups[g] || []).push(it); });
      html += '<div class="library">' + Object.keys(groups).sort(function (a, b) { return a.localeCompare(b, 'fr'); }).map(function (g) {
        return '<section class="group"><h2>' + esc(g) + '</h2><ul class="rows">' + groups[g].map(resourceRow).join('') + '</ul></section>';
      }).join('') + '</div>';
    }
    return html;
  }

  function resourceRow(it) {
    var u = safeUrl(it.url);
    var ext = u && isAbsolute(u);
    var attrs = ext ? ' data-ext="' + esc(it.titre) + '"' : ' target="_blank" rel="noopener"';
    var tags = [it.discipline, it.niveau].filter(Boolean).join(', ');
    return '<li><a class="row" href="' + esc(u || '#') + '"' + attrs + '>' +
      '<span class="row-ic">' + icon(formatIcon(it.format)) + '</span>' +
      '<h3>' + esc(it.titre) + '</h3>' +
      '<p>' + esc(it.description || '') + (tags ? ' <span style="color:var(--faint)">(' + esc(tags) + ')</span>' : '') + '</p>' +
      '<span class="row-end">' + (it.format ? '<span class="fmt">' + esc(it.format) + '</span>' : '') + icon('chevron') + '</span>' +
    '</a></li>';
  }

  function viewEmplacement(rub) {
    var items = itemsOf(rub.id);
    var intro = items[0] && items[0].description;
    var qcmUrl = cat.portail && cat.portail.qcm && safeUrl(cat.portail.qcm.url);
    var action = qcmUrl ?
      '<a class="btn btn-primary" href="' + esc(qcmUrl) + '" data-ext="QCM">' + esc(cat.portail.qcm.libelleBouton || 'Ouvrir les QCM') + icon('open', 'ic-sm') + '</a>' :
      '<p class="lockline">' + icon('info') + '<span>Non disponible dans cette version du portail.</span></p>';

    return pageHead(rub) +
      '<div style="margin:-8px 0 24px">' + statusBadge(qcmUrl ? 'publie' : (rub.statut || 'en-preparation')) + '</div>' +
      '<div class="placeholder">' +
        '<section class="panel" aria-labelledby="h-how">' +
          '<h2 id="h-how">Comment cela fonctionnera</h2>' +
          (intro ? '<p>' + esc(intro) + '</p>' : '') +
          '<ol class="steps">' +
            '<li><span><b>L’enseignant ouvre une séance</b><span>Le questionnaire est associé à la séance de formation du jour.</span></span></li>' +
            '<li><span><b>Chaque apprenti répond sur sa tablette</b><span>Individuellement, à son rythme, sans papier.</span></span></li>' +
            '<li><span><b>Les réponses sont enregistrées à part</b><span>Sur un service d’évaluation distinct, jamais dans ce portail public.</span></span></li>' +
            '<li><span><b>L’enseignant analyse les résultats</b><span>Sur un tableau de bord séparé, accessible après authentification.</span></span></li>' +
          '</ol>' +
          '<div style="margin-top:20px">' + action + '</div>' +
        '</section>' +
        '<section class="panel" aria-labelledby="h-arch">' +
          '<h2 id="h-arch">Architecture prévue</h2>' +
          '<p>Trois éléments séparés, pour protéger les données des apprentis.</p>' +
          '<div class="flow" style="margin-top:18px">' +
            '<div class="node">' + icon('tablet') + '<span><b>Tablette de l’apprenti</b>Portail public, sans compte</span></div>' +
            '<span class="link" aria-hidden="true"></span>' +
            '<div class="node">' + icon('server') + '<span><b>Application QCM</b>Indépendante du portail</span></div>' +
            '<span class="link" aria-hidden="true"></span>' +
            '<div class="node is-protected">' + icon('chart') + '<span><b>Tableau de bord enseignant</b>Accès protégé par authentification</span></div>' +
          '</div>' +
          '<p class="lockline">' + icon('lock') + '<span>Le portail public ne stocke aucun résultat ni aucun nom.</span></p>' +
        '</section>' +
      '</div>';
  }

  function viewCartes(rub) {
    // Vue générique : toute nouvelle rubrique s'affiche sans modifier le code.
    var items = itemsOf(rub.id);
    return pageHead(rub) + (items.length ?
      '<ul class="rows">' + items.map(resourceRow).join('') + '</ul>' :
      '<div class="empty"><strong>Cette rubrique est prête.</strong><span>Ses contenus apparaîtront ici dès leur ajout au catalogue.</span></div>');
  }

  function viewDispositif() {
    var road = cat.feuilleDeRoute || [];
    function col(statut, titre, cls) {
      var li = road.filter(function (r) { return r.statut === statut; });
      if (!li.length) return '';
      return '<section class="' + cls + '"><h2>' + statusBadge(statut) + '<span class="visually-hidden">' + titre + '</span></h2>' +
        '<ul>' + li.map(function (r) { return '<li>' + esc(r.titre) + '</li>'; }).join('') + '</ul></section>';
    }
    var nbApps = itemsOf('applications').length;
    var nbRes = itemsOf('ressources').length;
    return '<header class="pagehead" style="--c:var(--orange)"><span class="rod" aria-hidden="true"></span>' +
        '<h1>La formation TIIN sur tablette</h1>' +
        '<p>Un portail unique pour accéder aux applications de la formation, aux ressources et aux travaux des promotions. Aujourd’hui : ' +
        plural(nbApps, 'application', 'applications') + ' et ' + plural(nbRes, 'ressource classée', 'ressources classées') + '.</p></header>' +
      '<div class="section" style="margin-top:8px"><div class="section-head"><h2>Où en est le projet</h2></div>' +
        '<div class="roadmap">' + col('disponible', 'Disponible', 'col-ok') + col('en-preparation', 'En préparation', 'col-wait') + col('envisage', 'Envisagé', 'col-idea') + '</div></div>' +
      '<div class="section"><div class="section-head"><h2>Principes</h2></div>' +
        '<ul class="principles">' +
          '<li>' + icon('shield') + '<b>Sans compte ni collecte</b><span>Aucune donnée personnelle n’est enregistrée par le portail.</span></li>' +
          '<li>' + icon('tablet') + '<b>Pensé pour la tablette</b><span>Installable sur l’écran d’accueil, utilisable au doigt, en paysage comme en portrait.</span></li>' +
          '<li>' + icon('apps') + '<b>Applications indépendantes</b><span>Chaque outil vit séparément : le portail les relie sans les modifier.</span></li>' +
          '<li>' + icon('ressources') + '<b>Évolutif</b><span>Une ressource s’ajoute par une simple déclaration dans le catalogue.</span></li>' +
          '<li>' + icon('server') + '<b>Sans frais d’hébergement</b><span>Publication sur GitHub Pages, sans serveur à administrer.</span></li>' +
        '</ul></div>' +
      '<p class="homefoot">' + esc((cat.portail && cat.portail.etablissement) || '') + '<span>Catalogue v' + esc(cat.version || '') + '</span></p>';
  }

  function viewNotFound(msg) {
    return '<div class="empty" style="margin-top:32px"><strong>' + esc(msg || 'Cette page n’existe pas.') + '</strong>' +
      '<a class="btn btn-quiet" href="#/">' + icon('home', 'ic-sm') + 'Revenir à l’accueil</a></div>';
  }
  function viewFault(msg, detail) {
    return '<div class="empty fault"><strong>' + esc(msg) + '</strong>' +
      (detail ? '<pre>' + esc(detail) + '</pre>' : '') +
      '<button type="button" class="btn btn-quiet" data-reload>Recharger</button></div>';
  }

  /* ---------- Interactions de chaque vue ---------- */
  function refreshResults(r) {
    var rub = rubById[r.parts[0]];
    var box = document.getElementById('results');
    if (!rub || !box) return;
    var query = parseHash().query;
    var list = applyFilters(rub, itemsOf(rub.id), query);
    box.innerHTML = rub.vue === 'galerie' ? galerieResults(rub, list) : biblioResults(rub, list);
    vue.querySelectorAll('.chip[data-filter]').forEach(function (b) {
      b.setAttribute('aria-pressed', String((query[b.getAttribute('data-filter')] || '') === b.getAttribute('data-value')));
    });
    var clr = document.getElementById('qclear'); if (clr) clr.hidden = !query.q;
    bindReset(r);
  }
  function bindReset(r) {
    vue.querySelectorAll('[data-reset]').forEach(function (b) {
      b.addEventListener('click', function () {
        setQuery({}); var q = document.getElementById('q'); if (q) q.value = ''; refreshResults(r);
      });
    });
  }

  function bindView(r) {
    var q = document.getElementById('q');
    if (q) {
      var t;
      q.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () {
          var cur = parseHash().query; cur.q = q.value.trim(); setQuery(cur); refreshResults(r);
        }, 180);
      });
      q.addEventListener('keydown', function (e) { if (e.key === 'Enter') q.blur(); });
      var clr = document.getElementById('qclear');
      if (clr) clr.addEventListener('click', function () {
        var cur = parseHash().query; delete cur.q; setQuery(cur); q.value = ''; refreshResults(r); q.focus();
      });
    }
    vue.querySelectorAll('.chip[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        var cur = parseHash().query; cur[b.getAttribute('data-filter')] = b.getAttribute('data-value'); setQuery(cur); refreshResults(r);
      });
    });
    bindReset(r);
    var back = vue.querySelector('[data-back]');
    if (back) back.addEventListener('click', function (e) {
      // Si l'on vient de la galerie, on y revient avec ses filtres et sa position.
      if (lastRouteBefore === back.getAttribute('data-back')) { e.preventDefault(); history.back(); }
    });
    if (!r.parts.length) { try { sessionStorage.setItem('portail-anim', '1'); } catch (e) {} }
  }

  /* ---------- Ouverture des applications : prudence hors connexion ---------- */
  var dlg = document.getElementById('offlineDialog');
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-ext]');
    if (!a) return;
    saveScroll();
    if (navigator.onLine) return; // ouverture normale, dans la même fenêtre : le bouton Retour ramène au portail
    e.preventDefault();
    document.getElementById('offlineText').textContent =
      a.getAttribute('data-ext') + ' est une application indépendante du portail. Sans connexion, elle ne s’ouvrira que si elle a déjà été chargée sur cette tablette.';
    document.getElementById('offlineGo').href = a.href;
    if (dlg.showModal) dlg.showModal(); else location.href = a.href;
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-reload]')) location.reload();
  });
  document.getElementById('offlineCancel').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });

  /* ---------- État réseau ---------- */
  var net = document.getElementById('netstate');
  function updateNet() { net.hidden = navigator.onLine; }
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);
  updateNet();

  /* ---------- Thème clair / sombre ---------- */
  var themeBtn = document.getElementById('themeBtn');
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function effectiveDark() {
    var t = document.documentElement.getAttribute('data-theme');
    return t ? t === 'dark' : mq.matches;
  }
  function syncThemeUi() {
    var dark = effectiveDark();
    themeBtn.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
    themeBtn.setAttribute('aria-label', dark ? 'Passer en thème clair' : 'Passer en thème sombre');
    var t = document.documentElement.getAttribute('data-theme');
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      if (t) { m.setAttribute('content', dark ? '#0A1226' : '#EEF2F7'); m.removeAttribute('media'); }
    });
  }
  themeBtn.addEventListener('click', function () {
    var next = effectiveDark() ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('portail-tiin-theme', next); } catch (e) {}
    syncThemeUi();
  });
  if (mq.addEventListener) mq.addEventListener('change', syncThemeUi);
  syncThemeUi();

  /* ---------- Barre du haut ---------- */
  var topbar = document.querySelector('.topbar');
  window.addEventListener('scroll', function () { topbar.classList.toggle('is-scrolled', window.scrollY > 4); }, { passive: true });
  window.addEventListener('pagehide', saveScroll);

  /* ---------- Démarrage ---------- */
  var goingForward = false;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (a && !a.hasAttribute('data-back')) goingForward = true;
  }, true);
  window.addEventListener('hashchange', function (e) {
    var oldKey = (e.oldURL.split('#')[1] || '/').replace(/\?.*$/, '').replace(/^\//, '') || '/';
    scrollMemo[oldKey] = window.scrollY;
    try { sessionStorage.setItem('portail-scroll', JSON.stringify(scrollMemo)); } catch (err) {}
    lastRouteBefore = oldKey;
    // Une page ouverte depuis un lien démarre en haut ; un retour retrouve sa position.
    if (goingForward) delete scrollMemo[routeKey()];
    goingForward = false;
    render();
  });

  fetch(CATALOGUE_URL, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('Le fichier ' + CATALOGUE_URL + ' est introuvable (erreur ' + r.status + ').');
      return r.text();
    })
    .then(function (txt) {
      try { cat = JSON.parse(txt); }
      catch (err) { throw new Error('Le catalogue contient une erreur d’écriture : ' + err.message + '\nVérifier les virgules, guillemets et accolades autour de cet endroit.'); }
      (cat.rubriques || []).forEach(function (r) { rubById[r.id] = r; });
      buildNav();
      render();
    })
    .catch(function (err) {
      console.error(err);
      vue.innerHTML = viewFault('Le catalogue des ressources n’a pas pu être chargé.', err.message);
    });

  /* ---------- Application installable (PWA) ---------- */
  var canSW = 'serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if (canSW) {
    {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').then(function (reg) {
          function offer(w) {
            if (!w || !navigator.serviceWorker.controller) return;
            var bar = document.createElement('div');
            bar.className = 'updatebar';
            bar.setAttribute('role', 'status');
            bar.innerHTML = '<p>Une nouvelle version du portail est disponible.</p><div class="sheet-actions"><button type="button" class="btn btn-primary">Mettre à jour</button></div>';
            bar.querySelector('button').onclick = function () { w.postMessage('skipWaiting'); };
            document.body.appendChild(bar);
          }
          if (reg.waiting) offer(reg.waiting);
          reg.addEventListener('updatefound', function () {
            var w = reg.installing;
            w && w.addEventListener('statechange', function () { if (w.state === 'installed') offer(w); });
          });
        }).catch(function (e) { console.warn('Service worker non enregistré :', e); });
        var reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', function () { if (!reloaded) { reloaded = true; location.reload(); } });
      });
    }
  }
})();
