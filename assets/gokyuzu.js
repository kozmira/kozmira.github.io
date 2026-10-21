// "Şu an gökyüzünde" kutusu: Ay'ın evresi ve burcu, Güneş'in burcu, retro gezegenler, sıradaki dolunay ve yeni ay.
// Hesap uygulamadakiyle aynı (src/lib/astro.ts, astronomy-engine); metinler sayfadaki #sky-data içinde (scripts/site/build.ts).
(function () {
  var section = document.getElementById('gokyuzu');
  var dataEl = document.getElementById('sky-data');
  var A = window.Astronomy;
  if (!section || !dataEl || !A) return;
  var D = JSON.parse(dataEl.textContent);
  var now = new Date();
  var norm = function (x) { return ((x % 360) + 360) % 360; };

  /** tropikal ekliptik boylam (gerçek ekinoks), uygulamadaki eclipticLongitude ile aynı */
  function lon(body, date) {
    var t = A.MakeTime(date);
    if (body === 'Moon') return norm(A.EclipticGeoMoon(t).lon);
    var v = A.GeoVector(body, t, true);
    return norm(A.SphereFromVector(A.RotateVector(A.Rotation_EQJ_ECT(t), v)).lon);
  }
  var signOf = function (l) { return Math.floor(l / 30); };
  var fill = function (s, k, v) { return s.replace('{' + k + '}', v); };

  /** Ay'ın görünüşü: aydınlık kısım evre açısına göre (0 yeni ay, 180 dolunay; büyürken sağ taraf aydınlık) */
  function moonSvg(angle, lit) {
    var rx = Math.abs(Math.cos(angle * Math.PI / 180)) * 46;
    var d = angle < 180
      ? 'M50 4A46 46 0 0 1 50 96A' + rx + ' 46 0 0 ' + (angle < 90 ? 0 : 1) + ' 50 4Z'
      : 'M50 4A46 46 0 0 0 50 96A' + rx + ' 46 0 0 ' + (angle > 270 ? 1 : 0) + ' 50 4Z';
    return '<svg class="moon" viewBox="-20 -20 140 140" aria-hidden="true"><defs>'
      + '<radialGradient id="mlit" cx="45%" cy="40%"><stop offset="0" stop-color="#FFF8E4"/><stop offset=".75" stop-color="#F0D68E"/><stop offset="1" stop-color="#D2AA55"/></radialGradient>'
      + '<radialGradient id="mglow"><stop offset="0" stop-color="#E8C872" stop-opacity=".55"/><stop offset="1" stop-color="#E8C872" stop-opacity="0"/></radialGradient></defs>'
      + '<circle cx="50" cy="50" r="70" fill="url(#mglow)" opacity="' + (0.15 + 0.6 * lit).toFixed(2) + '"/>'
      + '<circle cx="50" cy="50" r="46" fill="#151038" stroke="#E8C872" stroke-width="1.5" stroke-opacity=".35"/>'
      + '<path d="' + d + '" fill="url(#mlit)"/></svg>';
  }

  try {
    var angle = A.MoonPhase(now);
    var lit = (1 - Math.cos(angle * Math.PI / 180)) / 2;
    var phase = D.phases[Math.floor(norm(angle + 22.5) / 45)];
    var moonSign = signOf(lon('Moon', now));
    var sunSign = signOf(lon('Sun', now));
    var retro = D.planets.filter(function (p) {
      var d = lon(p.body, new Date(now.getTime() + 432e5)) - lon(p.body, new Date(now.getTime() - 432e5));
      if (d > 180) d -= 360;
      if (d < -180) d += 360;
      return d < 0;
    }).map(function (p) { return p.name; });

    var when = new Intl.DateTimeFormat(D.locale, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    var events = [[180, D.t.full], [0, D.t.newMoon]].map(function (e) {
      var t = A.SearchMoonPhase(e[0], A.MakeTime(now), 40);
      return t && { date: t.date, text: e[1] + ' ' + D.signs[signOf(lon('Moon', t.date))] + ' · ' + when.format(t.date) };
    }).filter(Boolean).sort(function (a, b) { return a.date - b.date; });

    var chips = [D.sun + ' ' + D.signs[sunSign], retro.length ? fill(D.t.retro, 'list', retro.join(', ')) : D.t.none]
      .concat(events.map(function (e) { return e.text; }));

    document.getElementById('sky-moon').innerHTML = moonSvg(angle, lit);
    document.getElementById('sky-title').textContent = D.moon + ' ' + D.signs[moonSign];
    document.getElementById('sky-phase').textContent = phase + ' · ' + fill(D.t.lit, 'n', Math.round(lit * 100));
    document.getElementById('sky-mood').textContent = D.moonIn[moonSign];
    var list = document.getElementById('sky-chips');
    chips.forEach(function (c) { var li = document.createElement('li'); li.textContent = c; list.appendChild(li); });
    var time = document.getElementById('sky-time');
    time.dateTime = now.toISOString();
    time.textContent = when.format(now);
    section.hidden = false;
  } catch (e) {
    // hesap yapılamazsa kutu gizli kalır
  }
})();
