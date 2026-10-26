/* Vérificateur du catalogue : signale les erreurs d'écriture et les oublis. */
(function () {
  'use strict';
  var list = document.getElementById('checks');
  var out = { ok: 0, warn: 0, err: 0 };
  var VUES = ['applications', 'galerie', 'bibliotheque', 'emplacement', 'cartes'];
  var STATUTS = ['publie', 'brouillon', 'en-preparation', 'archive'];

  function add(kind, title, detail) {
    out[kind]++;
    var li = document.createElement('li');
    li.className = 'k-' + kind;
    var span = document.createElement('span');
    var b = document.createElement('b'); b.textContent = title; span.appendChild(b);
    if (detail) { span.appendChild(document.createElement('br')); span.appendChild(document.createTextNode(detail)); }
    li.appendChild(span);
    list.appendChild(li);
  }
  function isLocal(u) { return u && !/^[a-z][a-z0-9+.-]*:/i.test(u) && u.indexOf('//') !== 0; }
  function badScheme(u) { return u && /^[a-z][a-z0-9+.-]*:/i.test(u) && !/^https?:/i.test(u); }
  function exists(u) {
    return fetch(u, { method: 'HEAD', cache: 'no-store' }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }
  function finish() {
    document.getElementById('summary').innerHTML =
      '<span class="status status-ok">' + out.ok + ' correct' + (out.ok > 1 ? 's' : '') + '</span>' +
      '<span class="status status-wait">' + out.warn + ' à surveiller</span>' +
      (out.err ? '<span class="status" style="background:#FBE3E0;color:#A1281B">' + out.err + ' erreur' + (out.err > 1 ? 's' : '') + '</span>' : '');
  }

  fetch('data/catalogue.json', { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (txt) {
    var cat;
    try { cat = JSON.parse(txt); }
    catch (e) { add('err', 'Le fichier n’est pas un JSON valide', e.message + ' — vérifier virgules, guillemets et accolades.'); finish(); return; }
    add('ok', 'Le fichier se lit correctement');

    var rub = {};
    (cat.rubriques || []).forEach(function (r) {
      if (!r.id) return add('err', 'Une rubrique n’a pas d’identifiant');
      if (rub[r.id]) add('err', 'Rubrique en double : ' + r.id);
      rub[r.id] = r;
      if (VUES.indexOf(r.vue) < 0) add('warn', 'Rubrique « ' + r.id + ' » : vue inconnue (' + r.vue + ')', 'Elle sera affichée en liste simple. Vues possibles : ' + VUES.join(', '));
    });
    add('ok', Object.keys(rub).length + ' rubriques déclarées');

    var ids = {}, checks = [];
    (cat.ressources || []).forEach(function (it, i) {
      var nom = it.id || ('ressource n°' + (i + 1));
      if (!it.id) add('err', nom + ' : identifiant manquant');
      else if (ids[it.id]) add('err', 'Identifiant en double : ' + it.id);
      ids[it.id] = 1;
      if (it.id && !/^[a-z0-9-]+$/.test(it.id)) add('warn', nom + ' : identifiant à simplifier', 'Utiliser seulement des minuscules sans accent, des chiffres et des tirets.');
      if (!it.titre) add('err', nom + ' : titre manquant');
      if (!rub[it.rubrique]) add('err', nom + ' : rubrique « ' + it.rubrique + ' » inconnue');
      if (it.statut && STATUTS.indexOf(it.statut) < 0) add('warn', nom + ' : statut « ' + it.statut + ' » inconnu', 'Statuts possibles : ' + STATUTS.join(', '));
      [['url', it.url], ['image', it.image], ['icone', it.icone]].concat((it.documents || []).map(function (d) { return ['document', d.url]; }))
        .forEach(function (pair) {
          var u = pair[1];
          if (!u) return;
          if (badScheme(u)) add('err', nom + ' : lien refusé (' + pair[0] + ')', u);
          else if (isLocal(u)) checks.push(exists(u.split('#')[0]).then(function (ok) { if (!ok) add('err', nom + ' : fichier introuvable (' + pair[0] + ')', u); }));
        });
      var r = rub[it.rubrique];
      if (r && r.vue === 'galerie' && it.statut !== 'brouillon') {
        if (it.exemple) add('warn', nom + ' : exemple fictif', cat.portail && cat.portail.afficherExemples ? 'Visible. Le retirer à l’arrivée des premiers vrais projets (ou passer « afficherExemples » à false).' : 'Masqué (afficherExemples = false).');
        else if (!(it.autorisation && it.autorisation.diffusionVerifiee === true)) add('warn', nom + ' : non affiché', 'L’autorisation de diffusion n’est pas marquée comme vérifiée.');
        else add('ok', nom + ' : projet publié avec autorisation vérifiée');
      }
    });
    add('ok', (cat.ressources || []).length + ' ressources déclarées');

    Promise.all(checks).then(function () {
      if (checks.length) add('ok', checks.length + ' fichiers locaux contrôlés');
      finish();
    });
  }).catch(function (e) { add('err', 'Catalogue introuvable', e.message); finish(); });
})();
