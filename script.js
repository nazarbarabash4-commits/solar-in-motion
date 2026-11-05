(function () {
  'use strict';

  // ======================================================================
  // 0. NASA Open APIs (api.nasa.gov) — real live data overlaid on simulation.
  //    Key obtained from https://api.nasa.gov (free, instant, no
  //    verification). If you want your own key — replace the line below.
  //    Mars Photos API is currently NOT connected: on NASA's side this endpoint
  //    currently returns 404 ("No such app") for all rovers — not a problem
  //    in the code, verified directly via curl.
  // ======================================================================
  const NASA_API_KEY = 'tYsAO3lfZHOUvxKa2uupckn9GW661t06A7YY5PuP';


  // ======================================================================
  // 1. Astronomical data (same parameters and formulas as in Python version)
  // ======================================================================
  const AU = 1.496e11;          // astronomical unit, m
  const SCENE_SCALE = 46;       // scene units per 1 AU

  // Orbital elements below are the JPL/Standish mean elements valid 3000 BC -
  // 3000 AD ("Keplerian Elements for Approximate Positions of the Major
  // Planets", Standish 1992 / ssd.jpl.nasa.gov/planets/approx_pos.html).
  // a/e/i/Om/w/L0 are the values AT the J2000.0 epoch (used as before for the
  // static dashed orbit lines, asteroid-belt radius and similar one-off
  // geometry); peri0 is the longitude of perihelion (ϖ = Ω+ω) at that same
  // epoch. *Dot fields are secular rates per Julian century, applied in
  // keplerPosition() so a body's actual simulated position stays accurate
  // centuries away from year 2000 too — the single fixed-element model used
  // before this drifted by tens of degrees after only ~50-100 years (worse
  // for the fast inner planets), which is what made Sky mode's fast-forward
  // star-field look subtly "wrong" over long date ranges. Jupiter/Saturn/
  // Uranus/Neptune/Pluto also get a small periodic correction (b/c/s/f) to
  // their mean anomaly, per the same source, which keeps those big planets'
  // long-term error within a few arcminutes instead of several degrees.
  const planetData = {
    Mercury: { a: 5.790993e10,  e: 0.20563661, i: 7.00559432,  Om: 48.33961819,  w: 29.11810076,  T: 88,    L0: 252.25166724,
      peri0: 77.45771895, aDot: 0, eDot: 0.00002123, iDot: -0.00590158, OmDot: -0.12214182, periDot: 0.15940013, LDot: 149472.67486623,
      color: 0xb5a396, size: 1.5, axialTilt: 0.03, radiusKm: 2439.7,
      facts: { mass: '3.30 × 10²³ kg', distance: '0.39 AU', day: '1408 h (58.6 Earth days)', year: '88 Earth days', moons: '0', temp: '167 °C avg', blurb: 'Smallest planet, closest to the Sun, with the most extreme temperature swings of any planet.' } },
    Venus:   { a: 1.082088e11, e: 0.00676399, i: 3.39777545,  Om: 76.67261496,  w: 55.09494217,  T: 225,   L0: 181.97970850,
      peri0: 131.76755713, aDot: -3.8896e4, eDot: -0.00005107, iDot: 0.00043494, OmDot: -0.27274174, periDot: 0.05679648, LDot: 58517.81560260,
      color: 0xe8cda2, size: 2.2, axialTilt: 177.4, radiusKm: 6051.8,
      facts: { mass: '4.87 × 10²⁴ kg', distance: '0.72 AU', day: '5832 h — rotates backwards', year: '225 Earth days', moons: '0', temp: '464 °C avg', blurb: 'Hottest planet thanks to a runaway greenhouse atmosphere; spins backwards relative to its orbit.' } },
    Earth:   { a: 1.496000e11, e: 0.01673163, i: -0.00054346, Om: -5.11260389,  w: 108.04266274, T: 365,   L0: 100.46691572,
      peri0: 102.93005885, aDot: -4.488e3, eDot: -0.00003661, iDot: -0.01337178, OmDot: -0.24123856, periDot: 0.31795260, LDot: 35999.37306329,
      color: 0x4d94eb, size: 2.3, axialTilt: 23.44, radiusKm: 6371,
      facts: { mass: '5.97 × 10²⁴ kg', distance: '1.00 AU', day: '23.9 h', year: '365.25 days', moons: '1', temp: '15 °C avg', blurb: 'The only known world with liquid surface water and life. Axial tilt of 23.4° drives the seasons.' } },
    Mars:    { a: 2.279474e11, e: 0.09336511, i: 1.85181869,  Om: 49.71320984,  w: -73.63065768, T: 687,   L0: -4.56813164,
      peri0: -23.91744784, aDot: 1.45112e5, eDot: 0.00009149, iDot: -0.00724757, OmDot: -0.26852431, periDot: 0.45223625, LDot: 19140.29934243,
      color: 0xc1440e, size: 1.8, axialTilt: 25.19, radiusKm: 3389.5,
      facts: { mass: '6.42 × 10²³ kg', distance: '1.52 AU', day: '24.6 h', year: '687 Earth days', moons: '2', temp: '−63 °C avg', blurb: 'The Red Planet — rusted iron dust covers the surface. Home to the largest volcano in the solar system, Olympus Mons.' } },
    Jupiter: { a: 7.782910e11, e: 0.04853590, i: 1.29861416,  Om: 100.29282654, w: -86.01787410, T: 4333,  L0: 34.33479152,
      peri0: 14.27495244, aDot: -4.284544e6, eDot: 0.00018026, iDot: -0.00322699, OmDot: 0.13024619, periDot: 0.18199196, LDot: 3034.90371757,
      b: -0.00012452, c: 0.06064060, s: -0.35635438, f: 38.35125000,
      color: 0xd9b38c, size: 5.1, axialTilt: 3.13, radiusKm: 69911,
      facts: { mass: '1.90 × 10²⁷ kg', distance: '5.20 AU', day: '9.9 h', year: '11.9 Earth years', moons: '101 (still rising)', temp: '−110 °C avg', blurb: 'Largest planet — a gas giant with a Great Red Spot storm wider than Earth, raging for centuries.' } },
    Saturn:  { a: 1.427408e12, e: 0.05550825, i: 2.49424102,  Om: 113.63998702, w: -20.77862639, T: 10759, L0: 50.07571329,
      peri0: 92.86136063, aDot: -4.58524e6, eDot: -0.00032044, iDot: 0.00451969, OmDot: -0.25015002, periDot: 0.54179478, LDot: 1222.11494724,
      b: 0.00025899, c: -0.13434469, s: 0.87320147, f: 38.35125000,
      color: 0xe3c98f, size: 4.5, ring: true, axialTilt: 26.73, radiusKm: 58232,
      facts: { mass: '5.68 × 10²⁶ kg', distance: '9.54 AU', day: '10.7 h', year: '29.4 Earth years', moons: '292 (most of any planet)', temp: '−140 °C avg', blurb: 'Famous for its bright ring system made of ice and rock. Less dense than water — it would float in a big enough tub.' } },
    Uranus:  { a: 2.870522e12, e: 0.04685740, i: 0.77298127,  Om: 73.96250215,  w: 98.47154226,  T: 30687, L0: 314.20276625,
      peri0: 172.43404441, aDot: -3.060068e7, eDot: -0.00001550, iDot: -0.00180155, OmDot: 0.05739699, periDot: 0.09266985, LDot: 428.49512595,
      b: 0.00058331, c: -0.97731848, s: 0.17689245, f: 7.67025000,
      color: 0x9fd9e6, size: 3.35, axialTilt: 97.77, radiusKm: 25362,
      facts: { mass: '8.68 × 10²⁵ kg', distance: '19.19 AU', day: '17.2 h — rotates on its side', year: '84 Earth years', moons: '29', temp: '−195 °C avg', blurb: 'Tipped on its side (98° tilt), likely from an ancient collision — its poles take turns facing the Sun.' } },
    Neptune: { a: 4.498401e12, e: 0.00895439, i: 1.77005520,  Om: 131.78635853, w: -85.10477129, T: 60190, L0: 304.22289287,
      peri0: 46.68158724, aDot: 9.644712e6, eDot: 0.00000818, iDot: 0.00022400, OmDot: -0.00606302, periDot: 0.01009938, LDot: 218.46515314,
      b: -0.00041348, c: 0.68346318, s: -0.10162547, f: 7.67025000,
      color: 0x5b7fe0, size: 3.35, axialTilt: 28.32, radiusKm: 24622,
      facts: { mass: '1.02 × 10²⁶ kg', distance: '30.07 AU', day: '16.1 h', year: '164.8 Earth years', moons: '16', temp: '−200 °C avg', blurb: 'Windiest planet — supersonic storms reach 2,100 km/h. Discovered by mathematical prediction before it was ever seen.' } },
    Pluto:   { a: 5.907234e12, e: 0.24885238, i: 17.14104260, Om: 110.30167986, w: 113.79534612, T: 90560, L0: 238.96535011,
      peri0: 224.09702598, aDot: 6.728275e8, eDot: 0.00006016, iDot: 0.00000501, OmDot: -0.00809981, periDot: -0.00968827, LDot: 145.18042903,
      b: -0.01262724,
      color: 0xc9b8a8, size: 1.1, axialTilt: 122.53, radiusKm: 1188.3,
      facts: { mass: '1.30 × 10²² kg', distance: '39.48 AU', day: '153.3 h — rotates backwards', year: '247.9 Earth years', moons: '5', temp: '−225 °C avg', blurb: 'Reclassified as a dwarf planet in 2006. Its large moon Charon is over half its size — they orbit a point between them.' } },
  };

  // Dwarf planets and known minor bodies (decorative layer, toggled separately)
  const minorBodyData = {
    Ceres:    { a: 4.14e11, e: 0.076, i: 10.6, Om: 80.3,  w: 73.6,  T: 1682,  L0: 95.99,  color: 0xa89a8a, size: 0.55, radiusKm: 469.7,
      facts: { mass: '9.38 × 10²⁰ kg', distance: '2.77 AU', day: '9.1 h', year: '4.6 Earth years', moons: '0', temp: '−105 °C avg', blurb: 'Largest object in the asteroid belt, reclassified as a dwarf planet in 2006. Has water ice beneath its crust.' } },
    Eris:     { a: 1.018e13, e: 0.436, i: 44.0, Om: 36.0,  w: 151.6, T: 203830, L0: 205.99, color: 0xd8d2c8, size: 0.6, radiusKm: 1163,
      facts: { mass: '1.66 × 10²² kg', distance: '68 AU avg', day: '25.9 h', year: '558 Earth years', moons: '1', temp: '−231 °C avg', blurb: 'More massive than Pluto — its discovery in 2005 triggered the debate that redefined what counts as a planet.' } },
    Makemake: { a: 6.85e12, e: 0.159, i: 29.0, Om: 79.4,  w: 296.6, T: 111845, L0: 165.5,  color: 0xc9a985, size: 0.5, radiusKm: 715,
      facts: { mass: '3.1 × 10²¹ kg', distance: '45.8 AU avg', day: '22.5 h', year: '306 Earth years', moons: '1', temp: '−239 °C avg', blurb: 'Named after a Rapa Nui creation deity. One of the largest known Kuiper Belt objects after Pluto and Eris.' } },
  };

  // Halley's Comet — highly elongated retrograde orbit (real elements)
  const cometData = {
    a: 2.667e12, e: 0.9671, i: 162.26, Om: 58.42, w: 111.33, T: 27509, L0: 190,
    color: 0xdff2ff, size: 0.5, radiusKm: 5.5,
    facts: { mass: '2.2 × 10¹⁴ kg', distance: '0.59 – 35.1 AU (highly eccentric)', day: '~2.2 days (nucleus)', year: '~76 Earth years', moons: '—', temp: 'varies drastically with distance', blurb: 'The most famous periodic comet — visible from Earth roughly every 76 years. Last seen in 1986, next expected around 2061.' },
  };


  const moonData = {
    Moon:     { parent: 'Earth',   orbitMult: 2.6, T: 27.3, color: 0xd9d9d9, size: 0.42, radiusKm: 1737.4,
      facts: { mass: '7.35 × 10²² kg', distance: '384,400 km from Earth', day: '27.3 days (tidally locked)', year: '27.3 days (orbit)', moons: '—', temp: '−53 °C avg', blurb: "Earth's only natural satellite. Always shows the same face to us — the far side wasn't seen until 1959." } },
    Io:       { parent: 'Jupiter', orbitMult: 1.7, T: 1.77, color: 0xe8d27a, size: 0.34, radiusKm: 1821.6,
      facts: { mass: '8.93 × 10²² kg', distance: '421,700 km from Jupiter', day: '1.77 days (tidally locked)', year: '1.77 days (orbit)', moons: '—', temp: '−130 °C avg', blurb: 'The most volcanically active body in the Solar System, driven by tidal heating from Jupiter\'s immense gravity.' } },
    Europa:   { parent: 'Jupiter', orbitMult: 2.1, T: 3.55, color: 0xcbb994, size: 0.32, radiusKm: 1560.8,
      facts: { mass: '4.80 × 10²² kg', distance: '671,000 km from Jupiter', day: '3.55 days (tidally locked)', year: '3.55 days (orbit)', moons: '—', temp: '−160 °C avg', blurb: 'An icy shell likely hides a liquid water ocean beneath — one of the best candidates for life beyond Earth.' } },
    Ganymede: { parent: 'Jupiter', orbitMult: 2.6, T: 7.15, color: 0x9c8b73, size: 0.38, radiusKm: 2634.1,
      facts: { mass: '1.48 × 10²³ kg', distance: '1,070,000 km from Jupiter', day: '7.15 days (tidally locked)', year: '7.15 days (orbit)', moons: '—', temp: '−163 °C avg', blurb: 'The largest moon in the Solar System — bigger than Mercury, and the only moon known to have its own magnetic field.' } },
    Callisto: { parent: 'Jupiter', orbitMult: 3.2, T: 16.7, color: 0x7d7264, size: 0.36, radiusKm: 2410.3,
      facts: { mass: '1.08 × 10²³ kg', distance: '1,883,000 km from Jupiter', day: '16.7 days (tidally locked)', year: '16.7 days (orbit)', moons: '—', temp: '−139 °C avg', blurb: 'The most heavily cratered object in the Solar System — its ancient surface has barely changed in billions of years.' } },
    Titan:    { parent: 'Saturn',  orbitMult: 3.1, T: 15.9, color: 0xe0b96b, size: 0.37, radiusKm: 2574.7,
      facts: { mass: '1.35 × 10²³ kg', distance: '1,222,000 km from Saturn', day: '15.9 days (tidally locked)', year: '15.9 days (orbit)', moons: '—', temp: '−179 °C avg', blurb: "Saturn's largest moon — the only moon with a dense atmosphere, and the only other world with rivers, lakes and rain (of liquid methane)." } },
  };

  function rotatePoint(x, y, z, Om, i, w) {
    const cosW = Math.cos(w), sinW = Math.sin(w);
    const x1 = cosW * x - sinW * y, y1 = sinW * x + cosW * y, z1 = z;
    const cosI = Math.cos(i), sinI = Math.sin(i);
    const x2 = x1, y2 = cosI * y1 - sinI * z1, z2 = sinI * y1 + cosI * z1;
    const cosOm = Math.cos(Om), sinOm = Math.sin(Om);
    const x3 = cosOm * x2 - sinOm * y2, y3 = sinOm * x2 + cosOm * y2, z3 = z2;
    return [x3, y3, z3];
  }

  // Orbital shape/orientation (a, e, i, Om, w — the ellipse itself, not
  // where the planet currently sits on it) for the 9 planetData bodies,
  // advanced to the given date via their secular (*Dot, per Julian century)
  // rates. Shared by keplerPosition (the planet's instantaneous position)
  // and by the static dashed orbit lines below — both need to agree on
  // which ellipse they're drawing. Bodies with no rate fields (comet, minor
  // bodies) fall back to their fixed elements exactly as before, since the
  // `|| 0` defaults make every *Dot term a no-op for them.
  function orbitShapeAtDay(data, daysSinceBase) {
    // J2000.0 = JD 2451545.0 TT = 2000-01-01 *12:00* (noon), but
    // daysSinceBase = 0 in this app means midnight 2000-01-01 UTC — shift by
    // half a day so "t = 0" lines up with the epoch the elements are given at.
    const t = (daysSinceBase - 0.5) / 36525; // Julian centuries since J2000.0
    const a = (data.a + (data.aDot || 0) * t);
    const e = data.e + (data.eDot || 0) * t;
    const iDeg = data.i + (data.iDot || 0) * t;
    const OmDeg = data.Om + (data.OmDot || 0) * t;
    const periDeg = (data.peri0 !== undefined ? data.peri0 : data.Om + data.w) + (data.periDot || 0) * t;
    return {
      t: t, a: a, e: e,
      i: iDeg * Math.PI / 180,
      Om: OmDeg * Math.PI / 180,
      w: (periDeg - OmDeg) * Math.PI / 180,
      periDeg: periDeg,
    };
  }

  // Planet position (meters) for number of days since base date 2000-01-01.
  // For the 9 planetData bodies (which carry *Dot secular-rate fields, see
  // the big comment above planetData), a/e/i/Om/peri/L are all advanced to
  // "now" before solving Kepler's equation, instead of treating them as
  // fixed-forever constants — that's what keeps the simulation accurate
  // across the multi-century date ranges this app allows, not just near
  // the year 2000. Bodies with no rate fields (comet, minor bodies, which
  // only have a/e/i/Om/w/L0/T) fall back to the simpler fixed-element model
  // exactly as before — the `|| 0` defaults make every *Dot/b/c/s/f term a
  // no-op for them.
  function keplerPosition(data, daysSinceBase) {
    const shape = orbitShapeAtDay(data, daysSinceBase);
    const t = shape.t, a = shape.a, e = shape.e;
    const LDeg = data.L0 + (data.LDot || 0) * t;

    let MDeg;
    if (data.T && data.peri0 === undefined) {
      // Fixed-element bodies (comet / minor bodies): same approach as
      // before — mean anomaly advances at a constant rate set by the
      // orbital period T, independent of the (unused) L/peri rates above.
      const dayMod = ((daysSinceBase % data.T) + data.T) % data.T;
      MDeg = (data.L0 - (data.Om + data.w)) + 360 * dayMod / data.T;
    } else {
      MDeg = LDeg - shape.periDeg;
      if (data.b !== undefined) {
        MDeg += data.b * t * t;
        if (data.c !== undefined) {
          const fRad = (data.f || 0) * t * Math.PI / 180;
          MDeg += data.c * Math.cos(fRad) + data.s * Math.sin(fRad);
        }
      }
    }
    MDeg = ((MDeg % 360) + 360) % 360;
    if (MDeg > 180) MDeg -= 360; // keep near [-180°,180°] for solver stability

    const i = shape.i, Om = shape.Om, w = shape.w;
    const M = MDeg * Math.PI / 180;
    let E = M;
    for (let k = 0; k < 12; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    // Position relative to focus (Sun) — the error was here: E is measured
    // from the CENTER of the ellipse, so simple r·cosE/r·sinE gave a point not on the orbit.
    const xOrb = a * (Math.cos(E) - e);
    const yOrb = a * Math.sqrt(1 - e * e) * Math.sin(E);
    return rotatePoint(xOrb, yOrb, 0, Om, i, w);
  }

  // Transform orbital coordinates (m) to scene coordinates (Y — "up")
  function toScene(pos) {
    return [
      (pos[0] / AU) * SCENE_SCALE,
      (pos[2] / AU) * SCENE_SCALE,
      (pos[1] / AU) * SCENE_SCALE,
    ];
  }

  // ======================================================================
  // 1a. Sky mode helpers — convert a heliocentric ecliptic vector (m) into
  //     a geocentric Right Ascension / Declination, then into a direction
  //     on the celestial sphere "dome" used for the planetarium view.
  // ======================================================================
  const OBLIQUITY = 23.4392811 * Math.PI / 180;
  function eclipticToRaDec(gx, gy, gz) {
    // Rotate ecliptic → equatorial by Earth's axial tilt (about the x-axis),
    // then convert equatorial Cartesian → RA/Dec.
    const y2 = gy * Math.cos(OBLIQUITY) - gz * Math.sin(OBLIQUITY);
    const z2 = gy * Math.sin(OBLIQUITY) + gz * Math.cos(OBLIQUITY);
    const r = Math.sqrt(gx * gx + y2 * y2 + z2 * z2) || 1;
    return { ra: Math.atan2(y2, gx), dec: Math.asin(Math.max(-1, Math.min(1, z2 / r))) };
  }
  // RA/Dec (radians) → point on a unit-radius dome. Scene convention:
  // y = up (toward the north celestial pole when dec = +90°).
  function raDecToDome(ra, dec, radius) {
    return new THREE.Vector3(
      radius * Math.cos(dec) * Math.cos(ra),
      radius * Math.sin(dec),
      -radius * Math.cos(dec) * Math.sin(ra)
    );
  }
  // ======================================================================
  // 1a-2. Sky mode helpers — observer location on Earth. Julian Date of the
  //     simulated "now", Greenwich sidereal time and the equatorial→horizontal
  //     (Alt/Az) transform, so the sky dome can be oriented to the real
  //     horizon at a given latitude/longitude and local time of day, and a
  //     low-precision lunar ephemeris (truncated ELP2000-82B periodic terms,
  //     Meeus ch. 47) so the Moon can be placed at its real position in the
  //     sky — its artistic orbit around Earth used elsewhere in the app is
  //     not accurate enough for this.
  // ======================================================================

  // Julian centuries since J2000.0 (good enough here — TT vs UT differs by
  // under a minute, invisible at the angular precision of this view).
  function julianCenturies(jd) { return (jd - 2451545) / 36525; }

  // Greenwich mean sidereal time, in degrees [0, 360). Meeus (12.4).
  function greenwichSiderealTimeDeg(jd) {
    const t = julianCenturies(jd);
    let gst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * t * t - (t * t * t) / 38710000;
    gst %= 360;
    return gst < 0 ? gst + 360 : gst;
  }

  // Equatorial RA/Dec (degrees) + observer lat/lon (degrees) + Julian Date
  // → horizontal altitude/azimuth (degrees, azimuth measured from North
  // through East, matching the dome's cardinal-direction markers).
  function raDecToAltAz(raDeg, decDeg, latDeg, lonDeg, jd) {
    const hourAngle = (((greenwichSiderealTimeDeg(jd) + lonDeg) % 360 - raDeg + 540) % 360 - 180) * Math.PI / 180;
    const dec = decDeg * Math.PI / 180, lat = latDeg * Math.PI / 180;
    const sinAlt = Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle);
    const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    let az = Math.atan2(
      -Math.sin(hourAngle) * Math.cos(dec),
      Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(hourAngle)
    ) * 180 / Math.PI;
    az = (az + 360) % 360;
    return { alt: alt * 180 / Math.PI, az: az };
  }

  // Truncated ELP2000-82B periodic terms for the Moon's geocentric ecliptic
  // longitude/distance (MOON_LON_DIST) and latitude (MOON_LAT): [D, M, M', F, lonSin, distCos] / [D, M, M', F, latSin]
  // — see Meeus, "Astronomical Algorithms", ch. 47.
  const MOON_LON_DIST = [
    [0, 0, 1, 0, 6288774, -20905355], [2, 0, -1, 0, 1274027, -3699111], [2, 0, 0, 0, 658314, -2955968],
    [0, 0, 2, 0, 213618, -569925], [0, 1, 0, 0, -185116, 48888], [0, 0, 0, 2, -114332, -3149],
    [2, 0, -2, 0, 58793, 246158], [2, -1, -1, 0, 57066, -152138], [2, 0, 1, 0, 53322, -170733],
    [2, -1, 0, 0, 45758, -204586], [0, 1, -1, 0, -40923, -129620], [1, 0, 0, 0, -34720, 108743],
    [0, 1, 1, 0, -30383, 104755], [2, 0, 0, -2, 15327, 10321], [0, 0, 1, 2, -12528, 0],
    [0, 0, 1, -2, 10980, 79661], [4, 0, -1, 0, 10675, -34782], [0, 0, 3, 0, 10034, -23210],
    [4, 0, -2, 0, 8548, -21636], [2, 1, -1, 0, -7888, 24208], [2, 1, 0, 0, -6766, 30824],
    [1, 0, -1, 0, -5163, -8379], [1, 1, 0, 0, 4987, -16675], [2, -1, 1, 0, 4036, -12831],
    [2, 0, 2, 0, 3994, -10445], [4, 0, 0, 0, 3861, -11650], [2, 0, -3, 0, 3665, 14403],
    [0, 1, -2, 0, -2689, -7003], [2, 0, -1, 2, -2602, 0], [2, -1, -2, 0, 2390, 10056],
    [1, 0, 1, 0, -2348, 6322], [2, -2, 0, 0, 2236, -9884], [0, 1, 2, 0, -2120, 5751],
    [0, 2, 0, 0, -2069, 0], [2, -2, -1, 0, 2048, -4950], [2, 0, 1, -2, -1773, 4130],
    [2, 0, 0, 2, -1595, 0], [4, -1, -1, 0, 1215, -3958], [0, 0, 2, 2, -1110, 0], [3, 0, -1, 0, -892, 3258],
  ];
  const MOON_LAT = [
    [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693], [2, 0, 0, -1, 173237],
    [2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271], [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198],
    [2, 0, 1, -1, 9266], [0, 0, 2, -1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
    [2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359], [2, -1, -1, 1, 2463], [2, -1, 0, 1, 2211],
    [2, -1, -1, -1, 2065], [0, 1, -1, -1, -1870], [4, 0, -1, -1, 1828], [0, 1, 0, 1, -1794], [0, 0, 0, 3, -1749],
  ];
  // Geocentric ecliptic position of the Moon (AU, mean equinox of date) for
  // a given Julian Date. Direction-only accuracy matters here (this feeds
  // eclipticToRaDec, which is scale-invariant), so the ~km-level truncation
  // error of dropping ELP2000's smaller terms is not visible on screen.
  function moonEclipticPositionAU(jd) {
    const t = julianCenturies(jd);
    const Lp = 218.3164477 + 481267.88123421 * t - 0.0015786 * t * t + t ** 3 / 538841 - t ** 4 / 65194000;
    const D = 297.8501921 + 445267.1114034 * t - 0.0018819 * t * t + t ** 3 / 545868 - t ** 4 / 113065000;
    const M = 357.5291092 + 35999.0502909 * t - 0.0001536 * t * t + t ** 3 / 24490000;
    const Mp = 134.9633964 + 477198.8675055 * t + 0.0087414 * t * t + t ** 3 / 69699 - t ** 4 / 14712000;
    const F = 93.272095 + 483202.0175233 * t - 0.0036539 * t * t - t ** 3 / 3526000 + t ** 4 / 863310000;
    const E = 1 - 0.002516 * t - 0.0000074 * t * t;
    const DEG = Math.PI / 180;
    let sumLon = 0, sumDist = 0, sumLat = 0;
    for (const [d, m, mp, f, lonCoef, distCoef] of MOON_LON_DIST) {
      const arg = (d * D + m * M + mp * Mp + f * F) * DEG;
      const eFactor = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
      sumLon += lonCoef * eFactor * Math.sin(arg);
      sumDist += distCoef * eFactor * Math.cos(arg);
    }
    for (const [d, m, mp, f, latCoef] of MOON_LAT) {
      const arg = (d * D + m * M + mp * Mp + f * F) * DEG;
      const eFactor = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
      sumLat += latCoef * eFactor * Math.sin(arg);
    }
    // Venus/Jupiter/flattening correction terms (Meeus 47.6) are small
    // (arcseconds) and skipped — negligible for a visual sky view.
    const lonDeg = Lp + sumLon / 1e6;
    const latDeg = sumLat / 1e6;
    const distKm = 385000.56 + sumDist / 1e3;
    const AU_KM = 149597870.7;
    const lonR = lonDeg * DEG, latR = latDeg * DEG, distAU = distKm / AU_KM;
    return [
      distAU * Math.cos(latR) * Math.cos(lonR),
      distAU * Math.cos(latR) * Math.sin(lonR),
      distAU * Math.sin(latR),
    ];
  }

  // Approximate B-V colour index → star tint (cool trick: just a few warm/cool stops).
  function bvToColor(bv) {
    if (bv === undefined || bv === null || isNaN(bv)) bv = 0.6;
    let r, g, b;
    if (bv < 0) { r = 0.65 + 0.35 * (1 + bv / 0.4); g = 0.75 + 0.2 * (1 + bv / 0.4); b = 1.0; }
    else if (bv < 0.4) { r = 0.9 + bv * 0.25; g = 0.92 + bv * 0.1; b = 1.0 - bv * 0.25; }
    else if (bv < 1.0) { r = 1.0; g = 0.95 - (bv - 0.4) * 0.25; b = 0.85 - (bv - 0.4) * 0.65; }
    else { r = 1.0; g = 0.78 - Math.min(0.3, (bv - 1.0) * 0.2); b = 0.55 - Math.min(0.35, (bv - 1.0) * 0.3); }
    return [Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b))];
  }

  // Soft round sprite for star points — plain THREE.PointsMaterial with no
  // map renders each point as a hard-edged square, which reads as pixelated
  // "glitchy" dots rather than stars. A small radial-gradient texture turns
  // every point into an anti-aliased circular glow instead.
  let _starSpriteTex = null;
  function starSpriteTexture() {
    if (_starSpriteTex) return _starSpriteTex;
    const cnv = document.createElement('canvas');
    cnv.width = cnv.height = 32;
    const ctx = cnv.getContext('2d');
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    _starSpriteTex = new THREE.CanvasTexture(cnv);
    return _starSpriteTex;
  }

  // ======================================================================
  // 1b. Procedural planet textures (no external images — everything is generated
  //     on <canvas> at startup: craters, continents/clouds, gas giant stripes,
  //     ice caps, solar granulation).
  // ======================================================================
  function hash2(x, y, seed) {
    const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  }
  function valueNoise(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
    const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }
  function fbm(x, y, seed, octaves) {
    let total = 0, amp = 0.5, freq = 1, maxAmp = 0;
    for (let i = 0; i < octaves; i++) {
      total += amp * valueNoise(x * freq, y * freq, seed + i * 17.13);
      maxAmp += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return total / maxAmp;
  }
  function lerpRgb(c1, c2, t) {
    t = Math.max(0, Math.min(1, t));
    return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t];
  }
  function hexToRgb(hex) {
    return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  }

  const TEX_W = 224, TEX_H = 112;

  function newTextureCanvas() {
    const c = document.createElement('canvas');
    c.width = TEX_W; c.height = TEX_H;
    return c;
  }
  function toTexture(canvas) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  // Cratered rocky surface (Mercury, Pluto)
  function paintRocky(ctx, baseHex, darkHex, lightHex, craterCount, seed) {
    const base = hexToRgb(baseHex), dark = hexToRgb(darkHex), light = hexToRgb(lightHex);
    const img = ctx.createImageData(TEX_W, TEX_H);
    for (let y = 0; y < TEX_H; y++) {
      for (let x = 0; x < TEX_W; x++) {
        const n = fbm(x / TEX_W * 6, y / TEX_H * 6, seed, 4);
        const rgb = n < 0.45 ? lerpRgb(dark, base, n / 0.45) : lerpRgb(base, light, (n - 0.45) / 0.55);
        const idx = (y * TEX_W + x) * 4;
        img.data[idx] = rgb[0]; img.data[idx + 1] = rgb[1]; img.data[idx + 2] = rgb[2]; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    for (let i = 0; i < craterCount; i++) {
      const cx = Math.random() * TEX_W, cy = Math.random() * TEX_H;
      const r = 2 + Math.random() * Math.random() * 16;
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      grad.addColorStop(0, 'rgba(255,255,255,0.10)');
      grad.addColorStop(0.55, 'rgba(0,0,0,0.22)');
      grad.addColorStop(0.85, 'rgba(255,255,255,0.10)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.88, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Multi-colored mottling without craters (sulfurous volcanic spots on Io,
  // pale ice of dwarf planets) — color stops by noise value 0..1
  function paintMottled(ctx, stops, seed, scale, octaves) {
    const rgbStops = stops.map(function (s) { return { t: s.t, rgb: hexToRgb(s.color) }; });
    const img = ctx.createImageData(TEX_W, TEX_H);
    for (let y = 0; y < TEX_H; y++) {
      for (let x = 0; x < TEX_W; x++) {
        const n = fbm(x / TEX_W * scale, y / TEX_H * scale, seed, octaves || 4);
        let rgb = rgbStops[rgbStops.length - 1].rgb;
        for (let i = 0; i < rgbStops.length - 1; i++) {
          if (n >= rgbStops[i].t && n <= rgbStops[i + 1].t) {
            const lt = (n - rgbStops[i].t) / (rgbStops[i + 1].t - rgbStops[i].t);
            rgb = lerpRgb(rgbStops[i].rgb, rgbStops[i + 1].rgb, lt);
            break;
          }
        }
        const idx = (y * TEX_W + x) * 4;
        img.data[idx] = rgb[0]; img.data[idx + 1] = rgb[1]; img.data[idx + 2] = rgb[2]; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // Fine cracks on icy surface (Europa)
  function paintCracks(ctx, count, seed) {
    let rngState = seed * 9301 + 49297;
    function rnd() { rngState = (rngState * 9301 + 49297) % 233280; return rngState / 233280; }
    ctx.strokeStyle = 'rgba(150,90,70,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < count; i++) {
      let x = rnd() * TEX_W, y = rnd() * TEX_H;
      const segs = 5 + Math.floor(rnd() * 6);
      let angle = rnd() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < segs; s++) {
        angle += (rnd() - 0.5) * 1.1;
        x += Math.cos(angle) * (8 + rnd() * 10);
        y += Math.sin(angle) * (8 + rnd() * 10);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // Horizontally-banded gas giants (Jupiter, Saturn, Uranus, Neptune)
  function paintBands(ctx, bandColorsHex, seed, waviness, spot) {
    const bands = bandColorsHex.map(hexToRgb);
    const img = ctx.createImageData(TEX_W, TEX_H);
    for (let y = 0; y < TEX_H; y++) {
      for (let x = 0; x < TEX_W; x++) {
        const warp = (fbm(x / TEX_W * 3, y / TEX_H * 7, seed, 3) - 0.5) * waviness * TEX_H;
        const fine = (valueNoise(x / TEX_W * 40, y / TEX_H * 40, seed + 5) - 0.5) * 10;
        let yy = y + warp + fine;
        let bandF = (yy / TEX_H) * bands.length;
        bandF = Math.max(0, Math.min(bands.length - 1.001, bandF));
        const i0 = Math.floor(bandF), t = bandF - i0;
        const rgb = lerpRgb(bands[i0], bands[Math.min(i0 + 1, bands.length - 1)], t);
        const idx = (y * TEX_W + x) * 4;
        img.data[idx] = rgb[0]; img.data[idx + 1] = rgb[1]; img.data[idx + 2] = rgb[2]; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (spot) {
      const sx = TEX_W * 0.62, sy = TEX_H * 0.58, sr = TEX_W * 0.065;
      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      grad.addColorStop(0, spot);
      grad.addColorStop(0.7, spot);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(sx, sy, sr, sr * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Earth: oceans, continents, clouds
  function paintEarth(ctx, seed) {
    const oceanDeep = [10, 30, 68], ocean = [24, 60, 112];
    const land = [56, 90, 46], landHigh = [124, 110, 76];
    const ice = [232, 238, 244];
    const img = ctx.createImageData(TEX_W, TEX_H);
    for (let y = 0; y < TEX_H; y++) {
      for (let x = 0; x < TEX_W; x++) {
        const nx = x / TEX_W * 4, ny = y / TEX_H * 4;
        const elevation = fbm(nx, ny, seed, 4);
        const lat = Math.abs(y / TEX_H - 0.5) * 2;
        let rgb;
        if (lat > 0.85) {
          rgb = lerpRgb(land, ice, (lat - 0.85) / 0.15);
        } else if (elevation > 0.55) {
          rgb = lerpRgb(land, landHigh, Math.min(1, (elevation - 0.55) / 0.22));
        } else {
          rgb = lerpRgb(oceanDeep, ocean, Math.min(1, elevation / 0.55));
        }
        const cloud = fbm(nx * 1.8 + 50, ny * 1.8 + 50, seed + 99, 4);
        if (cloud > 0.56) {
          rgb = lerpRgb(rgb, [255, 255, 255], Math.min(1, (cloud - 0.56) / 0.24) * 0.85);
        }
        const idx = (y * TEX_W + x) * 4;
        img.data[idx] = rgb[0]; img.data[idx + 1] = rgb[1]; img.data[idx + 2] = rgb[2]; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // Mars: rust-red regions + polar caps
  function paintMars(ctx, seed) {
    const baseLight = [193, 96, 60], baseDark = [120, 55, 34], ice = [238, 232, 222];
    const img = ctx.createImageData(TEX_W, TEX_H);
    for (let y = 0; y < TEX_H; y++) {
      for (let x = 0; x < TEX_W; x++) {
        const n = fbm(x / TEX_W * 5, y / TEX_H * 5, seed, 4);
        const lat = Math.abs(y / TEX_H - 0.5) * 2;
        let rgb = lerpRgb(baseDark, baseLight, n);
        if (lat > 0.88) rgb = lerpRgb(rgb, ice, (lat - 0.88) / 0.12);
        const idx = (y * TEX_W + x) * 4;
        img.data[idx] = rgb[0]; img.data[idx + 1] = rgb[1]; img.data[idx + 2] = rgb[2]; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // Venus: dense swirling clouds
  function paintVenus(ctx, seed) {
    paintBands(ctx, [0xe8d9a8, 0xf2e6bd, 0xdfc98f, 0xf0e2ae, 0xe3d29c], seed, 0.55, null);
  }

  // Sun: granulated surface
  function paintSun(ctx, seed) {
    const c1 = [255, 236, 160], c2 = [255, 190, 90], c3 = [255, 250, 220];
    const img = ctx.createImageData(TEX_W, TEX_H);
    for (let y = 0; y < TEX_H; y++) {
      for (let x = 0; x < TEX_W; x++) {
        const n = fbm(x / TEX_W * 14, y / TEX_H * 14, seed, 4);
        const n2 = fbm(x / TEX_W * 3, y / TEX_H * 3, seed + 30, 3);
        let rgb = lerpRgb(c2, c1, n);
        rgb = lerpRgb(rgb, c3, Math.max(0, n2 - 0.6) * 1.5);
        const idx = (y * TEX_W + x) * 4;
        img.data[idx] = rgb[0]; img.data[idx + 1] = rgb[1]; img.data[idx + 2] = rgb[2]; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // Pseudo-shadow from ring on Saturn's disk (static artistic effect,
  // not dynamically tied to Sun direction — true shadow-mapping
  // would be overkill for this scale).
  function paintRingShadowBand(ctx) {
    const bandY = TEX_H * 0.35, bandH = TEX_H * 0.09;
    const grad = ctx.createLinearGradient(0, bandY - bandH, 0, bandY + bandH);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(20,15,5,0.38)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, bandY - bandH, TEX_W, bandH * 2);
  }

  // ======================================================================
  // 1b. Real photographic textures ("skins") for planets, moons & dwarf
  //     planets. The Sun intentionally keeps its original procedurally-
  //     painted texture (left untouched, per request). Each body starts
  //     with the procedural texture above, then swaps to the real photo
  //     once it finishes loading — so the scene never shows a blank/broken
  //     sphere while the image is in flight or if it fails.
  //
  //     Textures are embedded as base64 data URIs (see textures-data.js,
  //     loaded before this file) rather than fetched as plain image files.
  //     This is required because opening index.html directly as a local
  //     file (file://, i.e. just double-clicking it) makes browsers block
  //     WebGL from using plain <img>-fetched local files as textures
  //     (CORS "origin null" restriction) — data URIs aren't affected by
  //     that restriction, so the skins work with zero setup. If a local
  //     web server is used instead, the plain file name (same folder as
  //     index.html) also still works as a fallback.
  // ======================================================================
  const textureLoader = new THREE.TextureLoader();
  const textureFiles = {
    Mercury:  '2k_mercury.jpg',
    Venus:    '2k_venus_atmosphere.jpg',
    Earth:    '2k_earth_daymap.jpg',
    Mars:     '2k_mars.jpg',
    Jupiter:  '2k_jupiter.jpg',
    Saturn:   '2k_saturn.jpg',
    Uranus:   '2k_uranus.jpg',
    Neptune:  '2k_neptune.jpg',
    Moon:     '2k_moon.jpg',
    Ceres:    '2k_ceres_fictional.jpg',
    Eris:     '2k_eris_fictional.jpg',
    Makemake: '2k_makemake_fictional.jpg',
  };

  // Resolve a texture file name to whatever URL we can actually load it
  // from: an embedded base64 data URI if available, otherwise the plain
  // file path (works when served over http/https). The image files live
  // right next to index.html/script.js (no subfolder), so the fallback
  // path is just the bare file name.
  function textureUrl(fileName) {
    if (window.PLANET_TEXTURE_DATA && window.PLANET_TEXTURE_DATA[fileName]) {
      return window.PLANET_TEXTURE_DATA[fileName];
    }
    return fileName;
  }

  // Swap a material's map for the real texture once it loads. Silently
  // keeps the existing (procedural) map if the file is missing or fails.
  function applyRealTexture(material, fileName, anisotropy) {
    if (!fileName) return;
    textureLoader.load(
      textureUrl(fileName),
      function (tex) {
        if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = anisotropy || 4;
        const old = material.map;
        material.map = tex;
        material.needsUpdate = true;
        if (old && old !== tex) old.dispose();
      },
      undefined,
      function () { /* keep procedural fallback texture on error */ }
    );
  }

  function buildPlanetTexture(name) {
    const canvas = newTextureCanvas();
    const ctx = canvas.getContext('2d');
    const seed = [...name].reduce(function (s, ch) { return s + ch.charCodeAt(0); }, 0);
    switch (name) {
      case '__sun__': paintSun(ctx, seed); break;
      case 'Mercury': paintRocky(ctx, 0xb0a196, 0x6f6259, 0xd8cec4, 55, seed); break;
      case 'Venus': paintVenus(ctx, seed); break;
      case 'Earth': paintEarth(ctx, seed); break;
      case 'Mars': paintMars(ctx, seed); break;
      case 'Jupiter': paintBands(ctx, [0xd9c199, 0xb98a5e, 0xe8d9b8, 0xa9754c, 0xdcc49c, 0xc79a6b, 0xefe1c2], seed, 0.10, 'rgba(178,86,58,0.75)'); break;
      case 'Saturn': paintBands(ctx, [0xe6d5a3, 0xf1e6c2, 0xd8c48f, 0xefe0b3, 0xdccb9a], seed, 0.07, null); paintRingShadowBand(ctx); break;
      case 'Uranus': paintBands(ctx, [0xaee0e6, 0xc7ecef, 0xa3dbe2], seed, 0.03, null); break;
      case 'Neptune': paintBands(ctx, [0x3c5fc2, 0x4d72d6, 0x33509e, 0x5a7fd9], seed, 0.06, 'rgba(30,45,90,0.55)'); break;
      case 'Pluto': paintRocky(ctx, 0xcbb69e, 0x8f7a66, 0xe8dcc9, 18, seed); break;

      // ---- Moons ----
      case 'Moon': paintRocky(ctx, 0xb8b8b6, 0x6d6d6b, 0xdcdcda, 65, seed); break;
      case 'Io': paintMottled(ctx, [
        { t: 0.0, color: 0x5a2a1a }, { t: 0.3, color: 0xb35a1e },
        { t: 0.55, color: 0xe8a63c }, { t: 0.78, color: 0xf3d17a }, { t: 1.0, color: 0xfdf1c8 },
      ], seed, 7, 4); break;
      case 'Europa': paintMottled(ctx, [
        { t: 0.0, color: 0xa9793f }, { t: 0.35, color: 0xd8c9a8 },
        { t: 0.7, color: 0xeef2f0 }, { t: 1.0, color: 0xffffff },
      ], seed, 4, 3); paintCracks(ctx, 22, seed); break;
      case 'Ganymede': paintRocky(ctx, 0x8f8577, 0x59524a, 0xb3aa9c, 50, seed); break;
      case 'Callisto': paintRocky(ctx, 0x6b6259, 0x3c3733, 0x8c8175, 140, seed); break;
      case 'Titan': paintBands(ctx, [0xd68f4a, 0xe8b877, 0xd9a562, 0xf0c98d, 0xdba86a], seed, 0.16, null); break;

      // ---- Dwarf planets ----
      case 'Ceres': paintRocky(ctx, 0x9c9186, 0x5c554c, 0xc2b9ac, 55, seed); break;
      case 'Eris': paintRocky(ctx, 0xd8d2c8, 0x9d968c, 0xf3efe9, 20, seed); break;
      case 'Makemake': paintRocky(ctx, 0xb08765, 0x6c4c36, 0xdab494, 32, seed); break;

      // ---- Comet ----
      case "Halley's Comet": paintRocky(ctx, 0x4a4844, 0x201f1d, 0x6d6a64, 28, seed); break;

      default: paintRocky(ctx, 0xaaaaaa, 0x777777, 0xcccccc, 40, seed);
    }
    return toTexture(canvas);
  }

  // ======================================================================
  // 2. Start screen — date selection
  // ======================================================================
  const startOverlay = document.getElementById('start-overlay');
  const dateStartInput = document.getElementById('date-start');
  const dateEndInput = document.getElementById('date-end');
  const startError = document.getElementById('start-error');

  // On non-iOS: overlay div prevents segment selection and opens picker on click.
  // On iOS: showPicker() is not supported — overlay would block native tap, so skip it.
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Full-screen backdrop — shown when any date picker is open.
  // Clicking it blurs the input and closes the calendar.
  var dateBackdrop = document.createElement('div');
  dateBackdrop.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;cursor:default;';
  document.body.appendChild(dateBackdrop);

  function openDatePicker(inp) {
    dateBackdrop.style.display = 'block';
    inp.focus();
    try { inp.showPicker(); } catch(e) {}
  }

  dateBackdrop.addEventListener('mousedown', function(e) {
    e.preventDefault();
    dateBackdrop.style.display = 'none';
    document.activeElement && document.activeElement.blur();
  });

  if (!isIOS) {
    [dateStartInput, dateEndInput].forEach(function(inp) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:relative;';
      inp.parentNode.insertBefore(wrap, inp);
      wrap.appendChild(inp);

      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:absolute;inset:0;cursor:pointer;z-index:2;';
      wrap.appendChild(overlay);

      overlay.addEventListener('click', function() { openDatePicker(inp); });
    });
  }

  // Hide backdrop when picker closes (input loses focus)
  [dateStartInput, dateEndInput].forEach(function(inp) {
    inp.addEventListener('blur', function() {
      setTimeout(function() { dateBackdrop.style.display = 'none'; }, 150);
    });
    inp.addEventListener('focus', function() {
      dateBackdrop.style.display = 'block';
    });
  });

  // If we returned here via "← Change dates", use the dates
  // with which the simulation was last launched, instead of defaults.
  try {
    const savedStart = sessionStorage.getItem('solarSim_start');
    const savedEnd = sessionStorage.getItem('solarSim_end');
    if (savedStart) dateStartInput.value = savedStart;
    if (savedEnd) dateEndInput.value = savedEnd;
  } catch (e) { /* sessionStorage unavailable — just use default dates */ }

  // Link from "Copy link to this view" — URL parameters have priority
  // over sessionStorage and immediately launch simulation without manual click.
  let autoLaunchFromUrl = false;
  try {
    const params = new URLSearchParams(location.search);
    const urlStart = params.get('start'), urlEnd = params.get('end');
    if (urlStart && urlEnd && /^\d{4}-\d{2}-\d{2}$/.test(urlStart) && /^\d{4}-\d{2}-\d{2}$/.test(urlEnd)) {
      dateStartInput.value = urlStart;
      dateEndInput.value = urlEnd;
      autoLaunchFromUrl = true;
    }
  } catch (e) { /* URL API unavailable — ignore */ }

  document.querySelectorAll('.preset-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      dateStartInput.value = chip.dataset.start;
      dateEndInput.value = chip.dataset.end;
    });
  });

  // Guide modal
  var guideOverlay = document.getElementById('guide-overlay');
  document.getElementById('btn-guide').addEventListener('click', function () {
    guideOverlay.classList.add('open');
  });
  document.getElementById('guide-close').addEventListener('click', function () {
    guideOverlay.classList.remove('open');
  });
  guideOverlay.addEventListener('click', function (e) {
    if (e.target === guideOverlay) guideOverlay.classList.remove('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') guideOverlay.classList.remove('open');
  });

  document.getElementById('btn-launch').addEventListener('click', function () {
    const startVal = dateStartInput.value;
    const endVal = dateEndInput.value;
    if (!startVal || !endVal) {
      startError.textContent = 'Please enter both dates.';
      return;
    }
    const startD = new Date(startVal + 'T00:00:00Z');
    const endD = new Date(endVal + 'T00:00:00Z');
    if (endD <= startD) {
      startError.textContent = 'End date must be after the start date.';
      return;
    }
    startError.textContent = '';
    startOverlay.style.display = 'none';
    launchSimulation(startD, endD);
  });

  if (autoLaunchFromUrl) {
    document.getElementById('btn-launch').click();
  }

  // ======================================================================
  // 3. Scene initialization (runs after date selection)
  // ======================================================================
  function launchSimulation(startDate, endDate) {
    const totalDays = Math.round((endDate - startDate) / 86400000);
    const baseDate = Date.UTC(2000, 0, 1);
    const startOffsetDays = Math.round((startDate.getTime() - baseDate) / 86400000);

    ['hud', 'legend', 'dock', 'layers-toggle', 'tools-toggle', 'mode-toggle'].forEach(function (id) {
      document.getElementById(id).style.opacity = '1';
    });

    // ---- Mobile logic (drawers, backdrop, touch hints) ----
    (function initMobile() {
      var mq         = window.matchMedia('(max-width: 640px)');
      var backdrop   = document.getElementById('mobile-backdrop');
      var legendEl   = document.getElementById('legend');
      var detailEl   = document.getElementById('legend-detail');
      var btnLegMob  = document.getElementById('legend-mobile-wrap');
      var btnLegBtn  = document.getElementById('btn-legend-mobile');
      var infoPanelEl= document.getElementById('info-panel');
      var skyLocEl   = document.getElementById('sky-location');
      var btnLocBtn  = document.getElementById('btn-sky-location-mobile');
      var btnLocMob  = document.getElementById('sky-location-mobile-wrap');

      function isListOpen()     { return legendEl.classList.contains('drawer-open'); }
      function isDetailOpen()   { return detailEl.classList.contains('open'); }
      function isLocationOpen() { return skyLocEl.classList.contains('drawer-open'); }

      function syncBackdrop() {
        var anyOpen = isListOpen() || isDetailOpen() || isLocationOpen();
        backdrop.classList.toggle('active', anyOpen);
        document.body.style.overflow = anyOpen ? 'hidden' : '';
      }

      // ── "Observing from" drawer (Sky mode only) ─────────────────
      // Same open/close pattern as the planets list drawer below —
      // tapping the pin button slides the lat/lon form up from the
      // bottom instead of it sitting permanently open on top of the dock.
      function openLocationPanel() {
        closeLegend();
        closeDetail();
        skyLocEl.classList.add('drawer-open');
        // The pin button lives in that same bottom-left corner the drawer
        // slides up from — once open, the drawer would sit right on top of
        // it, so hide the button for as long as the drawer stays open.
        if (btnLocMob) btnLocMob.classList.add('hidden');
        syncBackdrop();
      }
      function closeLocationPanel() {
        skyLocEl.classList.remove('drawer-open');
        if (btnLocMob) btnLocMob.classList.remove('hidden');
        syncBackdrop();
      }

      // ── List drawer ───────────────────────────────────────────
      function openLegend() {
        detailEl.classList.remove('open');
        infoPanelEl.classList.remove('open');
        closeLocationPanel();
        legendEl.classList.add('drawer-open');
        btnLegMob.classList.add('legend-active');
        btnLegMob.classList.remove('hidden');
        syncBackdrop();
      }
      function closeLegend() {
        legendEl.classList.remove('drawer-open');
        btnLegMob.classList.remove('legend-active');
        syncBackdrop();
      }

      // ── Helper: dim overly bright colours for legibility on dark backgrounds ──
      function safeEyebrowColor(hex) {
        var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        var luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
        if (luminance > 0.72) {
          r = Math.round(r * 0.62); g = Math.round(g * 0.62); b = Math.round(b * 0.62);
          return '#' + [r,g,b].map(function(v){ return v.toString(16).padStart(2,'0'); }).join('');
        }
        return hex;
      }

      // ── Detail panel ──────────────────────────────────────────
      function openDetail(name) {
        // Gather body data (mirrors showInfoPanel logic)
        var facts, colorHex = '#aaaaaa', blurb = '', eyebrow = 'Planet';
        var factKeys = { mass:'MASS', distance:'DISTANCE FROM SUN', day:'DAY LENGTH',
                         year:'YEAR LENGTH', moons:'MOONS', temp:'AVG. TEMPERATURE' };
        if (name === 'Sun') {
          facts   = { mass:'1.989 × 10³⁰ kg', distance:'—', day:'~27 Earth days (equator)',
                      year:'—', moons:'8 planets orbit it', temp:'~5,500 °C surface' };
          blurb   = 'A G-type main-sequence star containing 99.8% of the Solar System\'s mass. Powers everything here through nuclear fusion.';
          colorHex = '#fff2b3'; eyebrow = 'Star';
        } else if (planetData[name]) {
          facts    = planetData[name].facts; blurb = facts.blurb || '';
          colorHex = '#' + planetData[name].color.toString(16).padStart(6, '0');
        } else if (typeof minorBodyData !== 'undefined' && minorBodyData[name]) {
          facts    = minorBodyData[name].facts; blurb = facts.blurb || '';
          colorHex = '#' + minorBodyData[name].color.toString(16).padStart(6, '0');
          eyebrow  = 'Dwarf planet';
        } else if (typeof moonData !== 'undefined' && moonData[name]) {
          facts    = moonData[name].facts; blurb = facts.blurb || '';
          colorHex = '#' + moonData[name].color.toString(16).padStart(6, '0');
          eyebrow  = 'Moon';
        } else if (name === "Halley's Comet" && typeof cometData !== 'undefined') {
          facts    = cometData.facts; blurb = facts.blurb || '';
          colorHex = '#' + cometData.color.toString(16).padStart(6, '0');
          eyebrow  = 'Comet';
        } else if (typeof missionPaths !== 'undefined' && missionPaths[name]) {
          facts    = missionPaths[name].facts; blurb = facts.blurb || '';
          colorHex = '#' + missionPaths[name].color.toString(16).padStart(6, '0');
          eyebrow  = 'Space mission';
          factKeys = { launch:'LAUNCH DATE', flybys:'KEY FLYBYS', status:'STATUS', speed:'SPEED' };
        } else if (typeof realAsteroidData !== 'undefined') {
          var ast = realAsteroidData.find(function(a) { return a.name === name; });
          if (ast) {
            facts = ast.facts; blurb = facts.blurb || '';
            colorHex = ast.hazardous ? '#e0554a' : '#9a9a9a';
            eyebrow  = 'Near-Earth object';
            factKeys = { diam:'EST. DIAMETER', hazard:'HAZARDOUS', approach:'CLOSE APPROACH',
                         miss:'MISS DISTANCE', speed:'REL. SPEED' };
          }
        }
        if (!facts) return; // unknown body — skip

        document.getElementById('ld-eyebrow').textContent  = eyebrow;
        document.getElementById('ld-eyebrow').style.color  = safeEyebrowColor(colorHex);
        document.getElementById('ld-name').textContent     = name;
        document.getElementById('ld-blurb').textContent    = blurb;

        var grid = document.getElementById('ld-grid');
        grid.innerHTML = '';
        Object.keys(factKeys).forEach(function(key) {
          if (!facts[key]) return;
          var lbl = document.createElement('div'); lbl.className = 'info-label'; lbl.textContent = factKeys[key];
          var val = document.createElement('div'); val.className = 'info-value'; val.textContent = facts[key];
          grid.appendChild(lbl); grid.appendChild(val);
        });

        var retBtn = document.getElementById('ld-return');
        if (retBtn) retBtn.style.display = state.prevCameraPos ? '' : 'none';

        legendEl.classList.remove('drawer-open');
        btnLegMob.classList.remove('legend-active');
        closeLocationPanel();
        detailEl.classList.add('open');
        syncBackdrop();
      }
      function closeDetail() {
        detailEl.classList.remove('open');
        syncBackdrop();
      }

      // ── Close everything ──────────────────────────────────────
      function closeAll() {
        closeLegend();
        closeDetail();
        closeLocationPanel();
        infoPanelEl.classList.remove('open');
        backdrop.classList.remove('active');
        var lp = document.getElementById('layers-panel');
        var tp = document.getElementById('tools-panel');
        if (lp) lp.classList.remove('open');
        if (tp) tp.classList.remove('open');
      }

      // Show ☰ button after sim starts
      if (mq.matches) { btnLegMob.style.opacity = '1'; }

      // ☰ button: toggle list / go back from detail
      btnLegBtn.addEventListener('click', function () {
        if (isDetailOpen()) { closeDetail(); openLegend(); return; }
        if (isListOpen())   { closeLegend(); } else { openLegend(); }
      });

      // 📍 button: toggle the "Observing from" lat/lon drawer (Sky mode only)
      if (btnLocBtn) {
        btnLocBtn.addEventListener('click', function () {
          if (isLocationOpen()) { closeLocationPanel(); } else { openLocationPanel(); }
        });
      }

      // Backdrop → close everything
      backdrop.addEventListener('click', closeAll);

      // ── Capture-phase: intercept ALL planet taps in legend list ──
      // This fires before the item's own bubble-phase listener,
      // letting us redirect planet taps to the in-drawer detail view.
      legendEl.addEventListener('click', function (e) {
        if (!mq.matches) return;
        var item = e.target.closest('.item');
        if (!item) return;
        var name = item.dataset.body;
        if (!name) return;
        if (state.viewMode === 'sky') {
          // Sky mode has no fact-sheet detail view — selecting a body just
          // swings the camera onto it and tracks it, so close the drawer
          // immediately so the result is visible.
          handleSkyBodySelect(name);
          closeLegend();
          e.stopPropagation();
          return;
        }
        selectFollow(name);  // still fly camera to the planet
        openDetail(name);
        e.stopPropagation(); // prevent item's bubble listener (showInfoPanel)
      }, true /* capture */);

      // Back button inside detail panel
      var ldBack = document.getElementById('ld-back');
      if (ldBack) ldBack.addEventListener('click', function () {
        closeDetail(); openLegend();
      });

      // "Return to previous view" inside detail panel
      var ldReturn = document.getElementById('ld-return');
      if (ldReturn) ldReturn.addEventListener('click', function () {
        returnToPreviousView();
        closeAll();
      });

      // Redirect 3D-scene planet taps to openDetail on mobile
      var _origShowInfoPanel = showInfoPanel;
      showInfoPanel = function (name) {
        if (mq.matches) { openDetail(name); return; }
        _origShowInfoPanel(name);
      };

      // Resize: clean up on desktop
      window.addEventListener('resize', function () {
        if (!window.matchMedia('(max-width: 640px)').matches) { closeAll(); }
        else { btnLegMob.style.opacity = '1'; }
      });
    }());

    // ---- Three.js base scene ----
    const canvas = document.getElementById('scene-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    const maxOrbitUnits = (planetData.Pluto.a * (1 + planetData.Pluto.e) / AU) * SCENE_SCALE;

    const camera = new THREE.PerspectiveCamera(
      50, window.innerWidth / window.innerHeight, 0.05, maxOrbitUnits * 20
    );
    camera.position.set(maxOrbitUnits * 0.22, maxOrbitUnits * 0.16, maxOrbitUnits * 0.22);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2;
    controls.maxDistance = maxOrbitUnits * 6;
    controls.target.set(0, 0, 0);

    // ---- Lighting ----
    scene.add(new THREE.AmbientLight(0x404050, 1.1));
    const sunLight = new THREE.PointLight(0xfff2cc, 2.4, maxOrbitUnits * 8, 1.4);
    scene.add(sunLight);

    // ---- Starfield ----
    const starGroup = new THREE.Group();
    function buildStars(starCount) {
      while (starGroup.children.length) {
        const obj = starGroup.children.pop();
        obj.geometry.dispose(); obj.material.dispose();
      }
      const positions = new Float32Array(starCount * 3);
      for (let idx = 0; idx < starCount; idx++) {
        const r = maxOrbitUnits * (1.15 + Math.random() * 4.2);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[idx * 3 + 1] = r * Math.cos(phi);
        positions[idx * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xffffff, size: maxOrbitUnits * 0.0016,
        sizeAttenuation: true, transparent: true, opacity: 0.85,
        depthWrite: false,
      });
      starGroup.add(new THREE.Points(geo, mat));
    }
    buildStars(6000);
    scene.add(starGroup);

    // ---- Sun (sphere + glow from sprites) ----
    const sunGroup = new THREE.Group();
    const sunRadius = 3.4;
    const sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(sunRadius, 48, 48),
      new THREE.MeshBasicMaterial({ map: buildPlanetTexture('__sun__') })
    );
    sunGroup.add(sunMesh);

    (function buildSunGlow() {
      const glowCanvas = document.createElement('canvas');
      glowCanvas.width = 256; glowCanvas.height = 256;
      const ctx = glowCanvas.getContext('2d');
      const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      grad.addColorStop(0, 'rgba(255, 235, 180, 0.55)');
      grad.addColorStop(0.35, 'rgba(255, 200, 120, 0.22)');
      grad.addColorStop(1, 'rgba(255, 200, 120, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(glowCanvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      sprite.scale.set(sunRadius * 14, sunRadius * 14, 1);
      sunGroup.add(sprite);
    })();
    scene.add(sunGroup);

    // ---- Asteroid belt ----
    const beltGroup = new THREE.Group();
    function buildBelt(beltCount) {
      while (beltGroup.children.length) {
        const obj = beltGroup.children.pop();
        obj.geometry.dispose(); obj.material.dispose();
      }
      const positions = new Float32Array(beltCount * 3);
      const innerAU = planetData.Mars.a / AU * 1.35;
      const outerAU = planetData.Jupiter.a / AU * 0.82;
      for (let idx = 0; idx < beltCount; idx++) {
        const rAU = innerAU + Math.random() * (outerAU - innerAU);
        const theta = Math.random() * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * 0.045;
        positions[idx * 3] = rAU * Math.cos(theta) * SCENE_SCALE;
        positions[idx * 3 + 1] = jitter * SCENE_SCALE;
        positions[idx * 3 + 2] = rAU * Math.sin(theta) * SCENE_SCALE;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: 0xb8b8b8, size: 0.38, transparent: true, opacity: 0.82, depthWrite: false,
      });
      beltGroup.add(new THREE.Points(geo, mat));
    }
    buildBelt(2200);
    scene.add(beltGroup);

    // Rebuild heavy layers for "low detail mode" (for weak/mobile devices)
    function rebuildDetailLayers() {
      buildStars(state.lowDetail ? 1200 : 6000);
      buildBelt(state.lowDetail ? 500 : 2200);
      starGroup.visible = state.showStars;
      beltGroup.visible = state.showBelt;
    }

    // ---- Static orbits (dashed ellipses) ----
    // "Static" is a bit of a misnomer now: a planet's a/e/i/Om/w aren't
    // really constant, they precess slowly over the centuries (see the
    // *Dot rates in planetData and orbitShapeAtDay above) — that's exactly
    // what keeps keplerPosition accurate across this app's multi-century
    // date ranges. These dashed reference ellipses used to be built once,
    // from the raw J2000-epoch elements only, and never touched again. For
    // dates near year 2000 that's invisible, but centuries away from it the
    // planet's real (precessed) path and this frozen-at-J2000 ellipse are
    // *different ellipses* — a few degrees of nodal/apsidal drift is enough
    // to visibly split the dashed line away from the solid trail when
    // viewed close to edge-on, looking like jagged double lines even though
    // nothing is actually z-fighting. So these now get rebuilt (cheaply —
    // ~720 points × a handful of planets) each time the simulated date
    // moves, using the same date-adjusted elements keplerPosition uses, so
    // the reference ellipse always matches the planet's actual current path.
    const orbitSegments = 720;
    const orbitsGroup = new THREE.Group();
    const orbitLines = {};
    const orbitPositionAttrs = {};
    function computeOrbitPoint(d, shape, s) {
      const E = (s / orbitSegments) * Math.PI * 2;
      const cosE = Math.cos(E);
      const sinE = Math.sin(E);
      const theta = Math.atan2(Math.sqrt(1 - shape.e * shape.e) * sinE, cosE - shape.e);
      const r = shape.a * (1 - shape.e * cosE);
      const xOrb = r * Math.cos(theta), yOrb = r * Math.sin(theta);
      const rotated = rotatePoint(xOrb, yOrb, 0, shape.Om, shape.i, shape.w);
      return toScene(rotated);
    }
    Object.keys(planetData).forEach(function (name) {
      const d = planetData[name];
      const shape = orbitShapeAtDay(d, startOffsetDays);
      const positions = new Float32Array((orbitSegments + 1) * 3);
      for (let s = 0; s <= orbitSegments; s++) {
        const scenePos = computeOrbitPoint(d, shape, s);
        positions[s * 3] = scenePos[0];
        positions[s * 3 + 1] = scenePos[1];
        positions[s * 3 + 2] = scenePos[2];
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineDashedMaterial({
        color: d.color, dashSize: 1.6, gapSize: 1.1, transparent: true, opacity: 0.72,
        // This dashed line and the live "traveled" trail (the solid line
        // built up behind each planet as it moves, see trailLines below)
        // trace the same ellipse — coincident geometry the GPU would
        // z-fight. Force a fixed draw order instead (orbit line first,
        // trail second — see renderOrder below) and stop this line from
        // writing to the depth buffer, so the trail drawn after it simply
        // paints over it wherever it covers it — no z-fighting possible,
        // regardless of camera distance/angle.
        depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      line.renderOrder = 1;
      orbitLines[name] = line;
      orbitPositionAttrs[name] = geo.attributes.position;
      orbitsGroup.add(line);
    });
    scene.add(orbitsGroup);

    let lastOrbitLinesDay = null;
    function updateOrbitLines(simDay) {
      if (simDay === lastOrbitLinesDay) return; // nothing changed, skip the work
      lastOrbitLinesDay = simDay;
      const absDay = startOffsetDays + simDay;
      Object.keys(planetData).forEach(function (name) {
        const d = planetData[name];
        const shape = orbitShapeAtDay(d, absDay);
        const attr = orbitPositionAttrs[name];
        const arr = attr.array;
        for (let s = 0; s <= orbitSegments; s++) {
          const scenePos = computeOrbitPoint(d, shape, s);
          arr[s * 3] = scenePos[0];
          arr[s * 3 + 1] = scenePos[1];
          arr[s * 3 + 2] = scenePos[2];
        }
        attr.needsUpdate = true;
        const line = orbitLines[name];
        line.geometry.computeBoundingSphere();
        line.computeLineDistances();
      });
    }
    // ---- Text sprite label ----
    function makeLabel(text, color) {
      const cnv = document.createElement('canvas');
      cnv.width = 384; cnv.height = 96;
      const ctx = cnv.getContext('2d');
      ctx.font = '600 44px Inter, sans-serif';
      ctx.fillStyle = 'rgba(228,228,231,0.92)';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 6, 50);
      const tex = new THREE.CanvasTexture(cnv);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(7.8, 1.95, 1);
      return sprite;
    }

    // ======================================================================
    // 1c. Sky mode — planetarium view of the real night sky from Earth.
    //     Separate scene + camera, sharing the same WebGLRenderer/canvas.
    //     Stars, constellations and named stars come from sky.json (real
    //     catalog data); the Sun, Moon and the 8 planets are placed live
    //     using this simulation's own Kepler positions (plus a dedicated
    //     low-precision lunar ephemeris for the Moon, whose orbit
    //     elsewhere in the app is an artistic approximation), converted to
    //     RA/Dec. Every frame, the whole star/planet dome is rotated to
    //     match the real local horizon at the observer's latitude and
    //     longitude and the simulation's current date/time (via Greenwich
    //     sidereal time), and the sky/ground are tinted for day or night
    //     from the Sun's altitude above/below that horizon.
    // ======================================================================
    const DOME_R = 400;
    const skyScene = new THREE.Scene();
    const skyCamera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, DOME_R * 2);
    skyCamera.position.set(0, 0, 0);

    const skyState = {
      ready: false,
      yaw: 0, pitch: 0, fov: 65,
      dragging: false, lastX: 0, lastY: 0,
      lat: 48.21, lon: 16.37, // default observer location (Vienna); overwritten by the UI / geolocation
      followName: null, // name of body the camera is continuously tracking (null = free look)
      prevYaw: 0, prevPitch: 0, prevFov: 65, // view saved before a follow began, restored by the "exit" button
    };

    // Everything with a fixed position on the celestial sphere — stars,
    // constellation figures, their labels, and the Sun/Moon/planet markers
    // — lives inside this group. It gets re-oriented every frame in
    // updateSkyHorizon() so the sky appears to rotate around the observer
    // over the course of a day, the way the real sky does. The ground,
    // the day/night dome gradient and the cardinal-direction labels are
    // NOT inside this group: they describe the observer's own horizon,
    // which stays fixed relative to the camera and never rotates.
    const skyEquatorialGroup = new THREE.Group();
    skyScene.add(skyEquatorialGroup);

    const skyLabelsGroup = new THREE.Group();
    skyEquatorialGroup.add(skyLabelsGroup);

    // Star-point and constellation-line materials, kept here so their
    // opacity can be dimmed for daytime in updateSkyHorizon().
    const skyStarMaterials = [];
    let skyFigureMat = null;

    const skyPlanetGroup = new THREE.Group();
    const skyPlanetMeshes = {};
    const skyPlanetLabels = {};
    (function buildSkyPlanetMarkers() {
      const markerNames = ['Sun', 'Moon'].concat(Object.keys(planetData));
      markerNames.forEach(function (name) {
        const color = name === 'Sun' ? 0xfff2b3 : name === 'Moon' ? 0xd7d7dc : planetData[name].color;
        // Markers sit ~388 units out on the dome (DOME_R*0.97), so at the
        // original radii (Sun 2.4 / Moon 2.1 / planets 1.5) they only
        // subtended a few pixels on screen at the default FOV — barely
        // visible, especially against a bright daytime sky. Bumped up
        // ~2x across the board for legibility while keeping the same
        // Sun > Moon > planet size hierarchy.
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(name === 'Sun' ? 4.8 : name === 'Moon' ? 4.2 : 3.2, 16, 16),
          new THREE.MeshBasicMaterial({ color: color })
        );
        skyPlanetGroup.add(mesh);
        skyPlanetMeshes[name] = mesh;
        const label = makeLabel(name, '#e4e4e7');
        // Labels sit on the dome ~390 units from the camera (DOME_R), so —
        // unlike every other label in this app, which lives a few scene
        // units away — they need a much larger world-space scale to read
        // as more than a couple of pixels; the pre-existing 14×3.5 here
        // was copied from the orrery's close-up label scale and rendered
        // completely illegibly small (confirmed empty/blank at this
        // distance; see the other sky-mode label scales below for the
        // same fix).
        label.scale.set(42, 10.5, 1);
        skyLabelsGroup.add(label);
        skyPlanetLabels[name] = label;
      });
    })();
    skyEquatorialGroup.add(skyPlanetGroup);

    // ---- Ground + day/night sky-gradient dome. Both are horizon-fixed —
    //      direct children of skyScene, not of skyEquatorialGroup — since
    //      "up" and "the ground" never move as the stars wheel overhead. ----
    const skyDomeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uDay: { value: 0 },
        uHorizon: { value: new THREE.Color(0x9eb5d6) },
        uZenith: { value: new THREE.Color(0x1f3370) },
      },
      vertexShader: `
        varying float vY;
        void main() {
          vY = position.y / ${DOME_R.toFixed(1)};
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform float uDay; uniform vec3 uHorizon; uniform vec3 uZenith;
        varying float vY;
        void main() {
          float t = smoothstep(-0.04, 0.6, vY);
          gl_FragColor = vec4(mix(uHorizon, uZenith, t), uDay);
        }`,
    });
    const skyDome = new THREE.Mesh(new THREE.SphereGeometry(DOME_R * 1.06, 40, 20), skyDomeMat);
    skyDome.renderOrder = -1;
    skyDome.frustumCulled = false;
    skyScene.add(skyDome);

    const skyHorizonRing = new THREE.Mesh(
      new THREE.RingGeometry(DOME_R * 0.985, DOME_R * 1.02, 128),
      new THREE.MeshBasicMaterial({ color: 0x8aa0c0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
    );
    skyHorizonRing.rotation.x = -Math.PI / 2;
    skyScene.add(skyHorizonRing);

    const skyGround = new THREE.Mesh(
      new THREE.CircleGeometry(DOME_R * 0.99, 96),
      new THREE.MeshBasicMaterial({ color: 0x05050a, transparent: true, opacity: 0.82, side: THREE.DoubleSide, depthWrite: false })
    );
    skyGround.rotation.x = Math.PI / 2;
    skyGround.position.y = -0.4;
    skyScene.add(skyGround);

    // ---- Cardinal-direction labels (N/E/S/W) — fixed to the horizon, so
    //      direct children of skyScene, as sprites (this app's label
    //      system is always canvas-texture sprites via makeLabel(), never
    //      DOM elements). North/East/South/West follow the same +X=East,
    //      -Z=North convention already used by the camera's yaw. ----
    const skyCardinalGroup = new THREE.Group();
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(function (pair) {
      const letter = pair[0], deg = pair[1];
      const label = makeLabel(letter, '#c8d2e0');
      label.scale.set(30, 7.5, 1); // see note on label scale in buildSkyPlanetMarkers above
      const a = deg * Math.PI / 180;
      label.position.set(Math.sin(a) * DOME_R * 0.98, 1.5, -Math.cos(a) * DOME_R * 0.98);
      skyCardinalGroup.add(label);
    });
    skyScene.add(skyCardinalGroup);

    // Build the dome from the real star/constellation catalog. Embedded as a
    // JS global (sky-data.js, loaded before this script) rather than fetched
    // as JSON, since plain fetch() of local files is blocked by CORS when
    // index.html is opened directly via file:// (same reason textures-data.js
    // embeds the planet textures as base64 instead of <img>/fetch).
    (function buildSkyDome() {
      const catalog = window.SKY_CATALOG;
      if (!catalog) { console.warn('Sky catalog (sky-data.js) not found.'); return; }
      const DEG = Math.PI / 180;

      // ---- Stars, bucketed by magnitude (vanilla PointsMaterial has one
      //      fixed size, so brightness tiers are approximated via buckets
      //      rather than a custom per-vertex-size shader). ----
      const buckets = [
        { max: 1.5, size: 2.6, positions: [], colors: [] },
        { max: 3.0, size: 1.9, positions: [], colors: [] },
        { max: 4.5, size: 1.3, positions: [], colors: [] },
        { max: 6.5, size: 0.85, positions: [], colors: [] },
      ];
      (catalog.stars || []).forEach(function (s) {
        const ra = s[0] * DEG, dec = s[1] * DEG, mag = s[2], bv = s[3];
        const bucket = buckets.find(function (b) { return mag <= b.max; }) || buckets[buckets.length - 1];
        const p = raDecToDome(ra, dec, DOME_R);
        bucket.positions.push(p.x, p.y, p.z);
        const c = bvToColor(bv);
        bucket.colors.push(c[0], c[1], c[2]);
      });
      buckets.forEach(function (b) {
        if (!b.positions.length) return;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b.positions), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(b.colors), 3));
        const mat = new THREE.PointsMaterial({
          size: b.size, sizeAttenuation: false, vertexColors: true,
          map: starSpriteTexture(), transparent: true, depthWrite: false,
          alphaTest: 0.02, opacity: 1,
        });
        skyStarMaterials.push(mat);
        skyEquatorialGroup.add(new THREE.Points(geo, mat));
      });

      // ---- Constellation stick figures ----
      const figureVerts = [];
      (catalog.constellations || []).forEach(function (c) {
        (c.segs || []).forEach(function (seg) {
          for (let k = 0; k < seg.length - 1; k++) {
            const p1 = raDecToDome(seg[k][0] * DEG, seg[k][1] * DEG, DOME_R);
            const p2 = raDecToDome(seg[k + 1][0] * DEG, seg[k + 1][1] * DEG, DOME_R);
            figureVerts.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          }
        });
      });
      if (figureVerts.length) {
        const figGeo = new THREE.BufferGeometry();
        figGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(figureVerts), 3));
        const figMat = new THREE.LineBasicMaterial({ color: 0x5b7fa8, transparent: true, opacity: 0.35 });
        skyFigureMat = figMat;
        skyEquatorialGroup.add(new THREE.LineSegments(figGeo, figMat));
      }

      // ---- Constellation name labels (placed at each figure's centroid) ----
      (catalog.constellations || []).forEach(function (c) {
        let sx = 0, sy = 0, sz = 0, n = 0;
        (c.segs || []).forEach(function (seg) {
          seg.forEach(function (pt) {
            const p = raDecToDome(pt[0] * DEG, pt[1] * DEG, 1);
            sx += p.x; sy += p.y; sz += p.z; n++;
          });
        });
        if (!n) return;
        const dir = new THREE.Vector3(sx / n, sy / n, sz / n).normalize();
        const label = makeLabel(c.name, '#8fa8c9');
        label.scale.set(33, 8.25, 1); // see note on label scale in buildSkyPlanetMarkers above
        label.material.opacity = 0.6;
        label.position.copy(dir.multiplyScalar(DOME_R * 0.985));
        skyLabelsGroup.add(label);
      });

      // ---- Named bright-star labels ----
      (catalog.named || []).forEach(function (st) {
        const p = raDecToDome(st.ra * DEG, st.dec * DEG, DOME_R * 0.99);
        const label = makeLabel(st.n, '#e4e4e7');
        label.scale.set(27, 6.75, 1); // see note on label scale in buildSkyPlanetMarkers above
        label.position.copy(p);
        skyLabelsGroup.add(label);
      });

      skyState.ready = true;
    })();

    // Julian Date of the simulation's current simulated instant — ties this
    // sim's internal day-counter (days since baseDate = 2000-01-01 UTC) to
    // the real-world JD needed for sidereal time and the lunar ephemeris.
    function currentSkyJD() {
      return 2451544.5 + startOffsetDays + state.currentDay;
    }

    function updateSkyPlanetPositions() {
      const jd = currentSkyJD();
      const earthPosM = keplerPosition(planetData.Earth, startOffsetDays + state.currentDay);
      let sunAltDeg = -90;
      Object.keys(skyPlanetMeshes).forEach(function (name) {
        let pos;
        if (name === 'Sun') {
          pos = [-earthPosM[0], -earthPosM[1], -earthPosM[2]]; // geocentric Sun = -Earth heliocentric pos
        } else if (name === 'Moon') {
          // The Moon's orbit elsewhere in the app (moonData) is an artistic
          // approximation, not to real scale — so its sky position instead
          // comes from a dedicated low-precision lunar ephemeris (geocentric
          // ecliptic coordinates, in AU; eclipticToRaDec only cares about
          // direction, so the different unit from the meters used above is fine).
          pos = moonEclipticPositionAU(jd);
        } else if (name === 'Earth') {
          skyPlanetMeshes[name].visible = false;
          skyPlanetLabels[name].visible = false;
          return;
        } else {
          const p = keplerPosition(planetData[name], startOffsetDays + state.currentDay);
          pos = [p[0] - earthPosM[0], p[1] - earthPosM[1], p[2] - earthPosM[2]];
        }
        const radec = eclipticToRaDec(pos[0], pos[1], pos[2]);
        const dome = raDecToDome(radec.ra, radec.dec, DOME_R * 0.97);
        skyPlanetMeshes[name].visible = true;
        skyPlanetLabels[name].visible = true;
        skyPlanetMeshes[name].position.copy(dome);
        // Offset the label's own RA/Dec slightly (rather than just nudging
        // it further along the same ray from the camera) so it sits beside
        // the marker on screen instead of centered on top of it — the old
        // "multiplyScalar(1.01)" offset was along the line of sight, which
        // is imperceptible from a camera parked at the origin and left the
        // label text visually overlapping/cut off by the marker circle.
        const labelDome = raDecToDome(radec.ra + 0.032, radec.dec + 0.016, DOME_R * 0.97);
        skyPlanetLabels[name].position.copy(labelDome);
        if (name === 'Sun') {
          sunAltDeg = raDecToAltAz(radec.ra * 180 / Math.PI, radec.dec * 180 / Math.PI, skyState.lat, skyState.lon, jd).alt;
        }
      });
      updateSkyHorizon(jd, sunAltDeg);
    }

    // Rotates the star/planet dome to match the observer's local horizon at
    // the current latitude/longitude and sidereal time, and tints the sky
    // dome/ground (and dims the stars and constellation lines) for day or
    // night based on how far the Sun sits above/below that horizon. Ported
    // from the reference app's Fs.update(), re-derived for this app's
    // y-axis-as-celestial-pole convention (raDecToDome) instead of the
    // reference's z-axis-as-pole convention — substituting the pole vector
    // (0,0,1) → (0,1,0) is a proper rotation of that algorithm, so the rest
    // of the basis-vector math carries over unchanged.
    function updateSkyHorizon(jd, sunAltDeg) {
      const lst = (greenwichSiderealTimeDeg(jd) + skyState.lon) * Math.PI / 180;
      const lat = skyState.lat * Math.PI / 180;
      // Zenith direction, in the same equatorial coordinate system as
      // raDecToDome (RA = lst, Dec = lat).
      const zenith = new THREE.Vector3(Math.cos(lat) * Math.cos(lst), Math.sin(lat), -Math.cos(lat) * Math.sin(lst));
      const pole = new THREE.Vector3(0, 1, 0);
      // "North" horizon direction: the pole vector's component tangent to
      // the celestial sphere at the zenith.
      const north = pole.clone().addScaledVector(zenith, -pole.dot(zenith)).normalize();
      const east = north.clone().cross(zenith).normalize();
      const basis = new THREE.Matrix4().makeBasis(east, zenith, north.clone().negate());
      basis.transpose(); // orthogonal matrix — transpose is the inverse
      skyEquatorialGroup.quaternion.setFromRotationMatrix(basis);

      // Day/night: ramp from night to day as the Sun rises from 18° below
      // the horizon to level with it, plus a warm horizon glow near dawn/dusk.
      const t = Math.max(0, Math.min(1, (sunAltDeg + 18) / 24));
      const day = t * t * (3 - 2 * t); // smoothstep
      const glow = Math.max(0, Math.min(1, 1 - Math.abs(sunAltDeg) / 9));
      skyDomeMat.uniforms.uDay.value = day * 0.97;
      skyDomeMat.uniforms.uHorizon.value.setRGB(0.62, 0.71, 0.84).lerp(new THREE.Color(0.96, 0.6, 0.36), glow * 0.85);
      skyDomeMat.uniforms.uZenith.value.setRGB(0.12, 0.2, 0.44).lerp(new THREE.Color(0.25, 0.48, 0.86), Math.max(0, Math.min(1, (sunAltDeg + 2) / 14)));
      skyGround.material.color.setRGB(0.02, 0.02, 0.04).lerp(new THREE.Color(0.11, 0.13, 0.17), day);
      skyStarMaterials.forEach(function (mat) { mat.opacity = 1 - day * 0.92; });
      if (skyFigureMat) skyFigureMat.opacity = 0.35 * (1 - day * 0.92);
    }

    function updateSkyCamera() {
      skyCamera.fov = skyState.fov;
      skyCamera.updateProjectionMatrix();
      skyCamera.rotation.order = 'YXZ';
      skyCamera.rotation.y = skyState.yaw;
      skyCamera.rotation.x = skyState.pitch;
    }

    // ---- Sky "look at body" camera tween ----
    // Driven by the #sky-body-list panel: clicking a body swings the camera
    // to face it (with a slight zoom in) over a short, eased transition,
    // rather than snapping instantly.
    const SKY_LOOKAT_FOV = 36; // zoomed-in FOV target; never zooms back OUT past whatever the user had set
    const skyLookTween = {
      active: false, elapsed: 0, duration: 0.7,
      startYaw: 0, startPitch: 0, startFov: 65,
      targetYaw: 0, targetPitch: 0, targetFov: 65,
    };
    function cancelSkyLookTween() { skyLookTween.active = false; }
    function updateSkyLookTween(dtSeconds) {
      if (!skyLookTween.active) return;
      skyLookTween.elapsed += dtSeconds;
      const t = Math.min(1, skyLookTween.elapsed / skyLookTween.duration);
      const ease = t * t * (3 - 2 * t); // smoothstep
      skyState.yaw = skyLookTween.startYaw + (skyLookTween.targetYaw - skyLookTween.startYaw) * ease;
      skyState.pitch = skyLookTween.startPitch + (skyLookTween.targetPitch - skyLookTween.startPitch) * ease;
      skyState.fov = skyLookTween.startFov + (skyLookTween.targetFov - skyLookTween.startFov) * ease;
      if (t >= 1) skyLookTween.active = false;
    }
    // Points the sky camera at a named body (Sun/Moon/planet) from the
    // #sky-body-list panel. Reads the marker's current world position (it
    // already accounts for the dome's horizon rotation from
    // updateSkyHorizon()) and converts that direction into the yaw/pitch
    // this camera uses, via the same lookAt→quaternion→Euler('YXZ') path
    // Three.js itself would use to face that direction — this sidesteps
    // having to hand-derive the sign conventions of the yaw/pitch formulas
    // used by the drag controls above.
    // Shared math: given a body name and the yaw to measure the short-way-
    // round wrap against, returns the {yaw, pitch} that would point the
    // camera straight at that body's current world position, or null if the
    // body has no usable position right now (e.g. below the horizon marker
    // not yet placed).
    function computeSkyYawPitchTo(name, fromYaw) {
      const mesh = skyPlanetMeshes[name];
      if (!mesh) return null;
      const worldPos = new THREE.Vector3();
      mesh.getWorldPosition(worldPos);
      if (worldPos.lengthSq() < 1e-8) return null;
      const dir = worldPos.normalize();
      const m = new THREE.Matrix4().lookAt(new THREE.Vector3(0, 0, 0), dir, new THREE.Vector3(0, 1, 0));
      const q = new THREE.Quaternion().setFromRotationMatrix(m);
      const e = new THREE.Euler().setFromQuaternion(q, 'YXZ');
      const pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, e.x));
      // Take the short way around for yaw, so spinning past the ±180°
      // wrap doesn't make the camera do a long way round.
      let yawDelta = e.y - fromYaw;
      yawDelta -= Math.round(yawDelta / (2 * Math.PI)) * (2 * Math.PI);
      const yaw = fromYaw + yawDelta;
      return { yaw: yaw, pitch: pitch };
    }
    function pointSkyCameraAt(name) {
      const yp = computeSkyYawPitchTo(name, skyState.yaw);
      if (!yp) return;
      skyLookTween.startYaw = skyState.yaw;
      skyLookTween.startPitch = skyState.pitch;
      skyLookTween.startFov = skyState.fov;
      skyLookTween.targetYaw = yp.yaw;
      skyLookTween.targetPitch = yp.pitch;
      skyLookTween.targetFov = Math.min(skyState.fov, SKY_LOOKAT_FOV);
      skyLookTween.elapsed = 0;
      skyLookTween.active = true;
    }

    // ---- Sky "follow body" mode: once the initial look-at tween above
    // finishes swinging onto a body, keep tracking it every frame so the
    // dome's ongoing horizon rotation (driven by the simulation clock)
    // doesn't let it drift back out of view. A dock button lets the user
    // leave the followed body and ease back to the view they had before.
    function updateSkyExitButton() {
      const btn = document.getElementById('btn-sky-exit-follow');
      if (btn) btn.style.display = skyState.followName ? '' : 'none';
    }
    function stopSkyFollow() {
      if (!skyState.followName) return;
      skyState.followName = null;
      document.querySelectorAll('#legend .item').forEach(function (el) { el.classList.remove('active'); });
      updateSkyExitButton();
    }
    // Called when a body row in the sky legend is clicked. First click on a
    // new body: remember the current view, swing to face it, then track it
    // continuously. Clicking the already-followed body again stops tracking
    // right where the view currently is (mirrors the orrery legend's toggle).
    function handleSkyBodySelect(name) {
      if (skyState.followName === name) {
        stopSkyFollow();
        return;
      }
      if (!skyState.followName) {
        skyState.prevYaw = skyState.yaw;
        skyState.prevPitch = skyState.pitch;
        skyState.prevFov = skyState.fov;
      }
      skyState.followName = name;
      document.querySelectorAll('#legend .item').forEach(function (el) {
        el.classList.toggle('active', el.dataset.body === name);
      });
      updateSkyExitButton();
      pointSkyCameraAt(name);
    }
    // Bound to the "Exit planet view" dock button: stop tracking and ease
    // back to whatever view was active right before the follow began.
    function exitSkyFollowToPreviousView() {
      if (!skyState.followName) return;
      stopSkyFollow();
      skyLookTween.startYaw = skyState.yaw;
      skyLookTween.startPitch = skyState.pitch;
      skyLookTween.startFov = skyState.fov;
      skyLookTween.targetYaw = skyState.prevYaw;
      skyLookTween.targetPitch = skyState.prevPitch;
      skyLookTween.targetFov = skyState.prevFov;
      skyLookTween.elapsed = 0;
      skyLookTween.active = true;
    }
    // Runs every frame while in sky mode: once the initial swing-to-target
    // tween has settled, rigidly re-aims yaw/pitch at the followed body each
    // frame so it stays centered even as the horizon keeps rotating.
    function updateSkyFollow() {
      if (!skyState.followName || skyLookTween.active) return;
      const yp = computeSkyYawPitchTo(skyState.followName, skyState.yaw);
      if (!yp) return;
      skyState.yaw = yp.yaw;
      skyState.pitch = yp.pitch;
    }

    // ---- Sky look controls: drag to look around, wheel to zoom (FOV) ----
    (function setupSkyLookControls() {
      let dragging = false, lastX = 0, lastY = 0;
      canvas.addEventListener('pointerdown', function (e) {
        if (state.viewMode !== 'sky') return;
        dragging = true; lastX = e.clientX; lastY = e.clientY;
        cancelSkyLookTween(); // manual control takes over immediately from any in-flight "look at body" animation
        stopSkyFollow();
      });
      window.addEventListener('pointermove', function (e) {
        if (!dragging || state.viewMode !== 'sky') return;
        const dx = e.clientX - lastX, dy = e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        skyState.yaw -= dx * 0.0035;
        skyState.pitch = Math.max(-Math.PI / 2 + 0.02, Math.min(Math.PI / 2 - 0.02, skyState.pitch - dy * 0.0035));
      });
      window.addEventListener('pointerup', function () { dragging = false; });
      canvas.addEventListener('wheel', function (e) {
        if (state.viewMode !== 'sky') return;
        e.preventDefault();
        cancelSkyLookTween();
        skyState.fov = Math.max(14, Math.min(95, skyState.fov + e.deltaY * 0.04));
      }, { passive: false });
    })();

    // ---- Planets, trails, labels ----
    const planetMeshes = {};
    const planetSpinMeshes = {};
    const atmoMeshes = {};
    const planetLabels = {};
    const trailLines = {};
    const trailBuffers = {};
    const TRAIL_MAX_POINTS = 4000;

    Object.keys(planetData).forEach(function (name) {
      const d = planetData[name];

      // Groups: orbitGroup (position on orbit) → tiltGroup (fixed axial
      // tilt) → sphere rotating around already tilted local axis.
      const orbitGroup = new THREE.Group();
      const tiltGroup = new THREE.Group();
      tiltGroup.rotation.z = THREE.MathUtils.degToRad(d.axialTilt || 0);
      orbitGroup.add(tiltGroup);
      scene.add(orbitGroup);

      const sphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(d.size, 32, 32),
        new THREE.MeshStandardMaterial({
          map: buildPlanetTexture(name),
          roughness: 0.75,
          metalness: 0.05,
          emissive: d.color,
          emissiveIntensity: 0.045,
        })
      );
      tiltGroup.add(sphereMesh);
      applyRealTexture(sphereMesh.material, textureFiles[name]);

      planetMeshes[name] = orbitGroup;      // position (orbit) — public interface stays the same
      planetSpinMeshes[name] = sphereMesh;  // own rotation

      if (d.ring) {
        const ringGeo = new THREE.RingGeometry(d.size * 1.5, d.size * 2.4, 64);
        // Remap UVs radially (default RingGeometry UVs aren't right for a
        // banded ring texture) so the real ring photo lines up correctly.
        const ringPos = ringGeo.getAttribute('position');
        const ringUv = ringGeo.getAttribute('uv');
        const v3 = new THREE.Vector3();
        for (let vi = 0; vi < ringPos.count; vi++) {
          v3.fromBufferAttribute(ringPos, vi);
          const rr = (v3.length() - d.size * 1.5) / (d.size * 2.4 - d.size * 1.5);
          ringUv.setXY(vi, rr, 0.5);
        }
        const ringMat = new THREE.MeshBasicMaterial({ color: d.color, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2.3;
        sphereMesh.add(ring);
        // Real Saturn ring photo (with alpha) — swap in once loaded, and
        // brighten/opacify it since the photo already carries its own shading.
        textureLoader.load(textureUrl('2k_saturn_ring_alpha.png'), function (tex) {
          if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
          ringMat.map = tex;
          ringMat.color.set(0xffffff);
          ringMat.opacity = 0.92;
          ringMat.needsUpdate = true;
        }, undefined, function () { /* keep flat-color ring on error */ });
      }

      // Atmospheric glow — transparent shell slightly larger than the planet,
      // rendered from inside (BackSide) with additive blending. Earth and Venus —
      // physically justified (thick atmosphere, real light scattering at
      // disk edge). Mars gets much fainter dust-orange glow —
      // that's already artistic license (Mars atmosphere very thin, effect
      // barely noticeable in reality, here slightly enhanced for clarity).
      if (name === 'Earth' || name === 'Venus' || name === 'Mars') {
        const atmoColor = name === 'Earth' ? 0x6fb7ff : (name === 'Venus' ? 0xf0dfa0 : 0xd98a4a);
        const atmoOpacity = name === 'Earth' ? 0.22 : (name === 'Venus' ? 0.16 : 0.07);
        const atmo = new THREE.Mesh(
          new THREE.SphereGeometry(d.size * 1.12, 32, 32),
          new THREE.MeshBasicMaterial({
            color: atmoColor, transparent: true, opacity: atmoOpacity,
            side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
          })
        );
        orbitGroup.add(atmo);
        atmoMeshes[name] = atmo;
      }

      // Earth cloud layer — thin, slightly larger sphere with the real
      // cloud photo, additively blended so it reads as a soft white veil.
      if (name === 'Earth') {
        textureLoader.load(textureUrl('2k_earth_clouds.jpg'), function (tex) {
          if (THREE.sRGBEncoding !== undefined) tex.encoding = THREE.sRGBEncoding;
          const clouds = new THREE.Mesh(
            new THREE.SphereGeometry(d.size * 1.02, 32, 32),
            new THREE.MeshStandardMaterial({
              map: tex, transparent: true, opacity: 0.5,
              blending: THREE.AdditiveBlending, depthWrite: false, roughness: 1,
            })
          );
          tiltGroup.add(clouds);
        }, undefined, function () { /* no clouds layer if it fails to load */ });
      }

      const label = makeLabel(name, d.color);
      const lw = Math.max(6.5, d.size * 2.6);
      label.scale.set(lw, lw / 4, 1);
      scene.add(label);
      planetLabels[name] = label;

      const trailGeo = new THREE.BufferGeometry();
      const trailPositions = new Float32Array(TRAIL_MAX_POINTS * 3);
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
      trailGeo.setDrawRange(0, 0);
      const trailMat = new THREE.LineBasicMaterial({ color: d.color, transparent: true, opacity: 0.88 });
      const trailLine = new THREE.Line(trailGeo, trailMat);
      // Must draw after (and on top of) the dashed orbit line — see the
      // renderOrder/depthWrite comment above orbitsGroup's line creation.
      trailLine.renderOrder = 2;
      scene.add(trailLine);
      trailLines[name] = trailLine;
      trailBuffers[name] = []; // { day, x, y, z }
    });

    // ---- Moons ----
    const moonMeshes = {};
    const moonLabels = {};
    Object.keys(moonData).forEach(function (name) {
      const m = moonData[name];
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(m.size, 24, 24),
        new THREE.MeshStandardMaterial({ map: buildPlanetTexture(name), roughness: 0.8, metalness: 0.04 })
      );
      applyRealTexture(mesh.material, textureFiles[name]);
      mesh.visible = false;
      scene.add(mesh);
      moonMeshes[name] = mesh;

      const label = makeLabel(name, m.color);
      const mlw = Math.max(4.5, m.size * 2.6);
      label.scale.set(mlw, mlw / 4, 1);
      label.visible = false;
      scene.add(label);
      moonLabels[name] = label;
    });

    // ---- Dwarf planets (decorative layer, disabled by default) ----
    const minorBodyMeshes = {};
    const minorBodyLabels = {};
    const minorBodyGroup = new THREE.Group();
    minorBodyGroup.visible = false;
    Object.keys(minorBodyData).forEach(function (name) {
      const d = minorBodyData[name];
      const segments = 900;
      const points = [];
      for (let s = 0; s <= segments; s++) {
        const E = (s / segments) * Math.PI * 2;
        const cosE = Math.cos(E);
        const sinE = Math.sin(E);
        const theta = Math.atan2(Math.sqrt(1 - d.e * d.e) * sinE, cosE - d.e);
        const r = d.a * (1 - d.e * cosE);
        const rotated = rotatePoint(r * Math.cos(theta), r * Math.sin(theta), 0, d.Om * Math.PI / 180, d.i * Math.PI / 180, d.w * Math.PI / 180);
        const sp = toScene(rotated);
        points.push(new THREE.Vector3(sp[0], sp[1], sp[2]));
      }
      const orbitLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineDashedMaterial({ color: d.color, dashSize: 1.2, gapSize: 1.4, transparent: true, opacity: 0.62 })
      );
      orbitLine.computeLineDistances();
      minorBodyGroup.add(orbitLine);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(d.size, 24, 24),
        new THREE.MeshStandardMaterial({ map: buildPlanetTexture(name), roughness: 0.85, metalness: 0.03, emissive: d.color, emissiveIntensity: 0.05 })
      );
      applyRealTexture(mesh.material, textureFiles[name]);
      minorBodyGroup.add(mesh);
      minorBodyMeshes[name] = mesh;

      const label = makeLabel(name, d.color);
      const dlw = Math.max(5.0, d.size * 2.6);
      label.scale.set(dlw, dlw / 4, 1);
      minorBodyGroup.add(label);
      minorBodyLabels[name] = label;
    });
    scene.add(minorBodyGroup);

    // ---- Halley's Comet (real orbital elements, with tail) ----
    const cometGroup = new THREE.Group();
    cometGroup.visible = false;
    const cometMesh = new THREE.Mesh(
      new THREE.SphereGeometry(cometData.size, 16, 16),
      new THREE.MeshStandardMaterial({ map: buildPlanetTexture("Halley's Comet"), roughness: 0.9, emissive: 0x2a2824, emissiveIntensity: 0.25 })
    );
    cometGroup.add(cometMesh);
    const cometTailTex = (function () {
      const cnv = document.createElement('canvas');
      cnv.width = 64; cnv.height = 256;
      const ctx = cnv.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, 'rgba(220,240,255,0.85)');
      grad.addColorStop(1, 'rgba(220,240,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 256);
      return new THREE.CanvasTexture(cnv);
    })();
    const cometTail = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1, 1, 1),
      new THREE.MeshBasicMaterial({ map: cometTailTex, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })
    );
    cometTail.geometry.translate(0, 0.5, 0); // anchor tail at comet head
    cometGroup.add(cometTail);
    const cometOrbitPts = [];
    const cometOrbitSegments = 2400;
    for (let s = 0; s <= cometOrbitSegments; s++) {
      // Use eccentric anomaly E (uniform) → true anomaly θ
      // This concentrates points near perihelion for high-eccentricity orbits
      const E = (s / cometOrbitSegments) * Math.PI * 2;
      const cosE = Math.cos(E);
      const sinE = Math.sin(E);
      const theta = Math.atan2(Math.sqrt(1 - cometData.e * cometData.e) * sinE, cosE - cometData.e);
      const r = cometData.a * (1 - cometData.e * cosE);
      const rotated = rotatePoint(r * Math.cos(theta), r * Math.sin(theta), 0, cometData.Om * Math.PI / 180, cometData.i * Math.PI / 180, cometData.w * Math.PI / 180);
      const sp = toScene(rotated);
      cometOrbitPts.push(new THREE.Vector3(sp[0], sp[1], sp[2]));
    }
    const cometOrbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(cometOrbitPts),
      new THREE.LineDashedMaterial({ color: cometData.color, dashSize: 2, gapSize: 2.4, transparent: true, opacity: 0.58 })
    );
    cometOrbitLine.computeLineDistances();
    cometGroup.add(cometOrbitLine);
    const cometLabel = makeLabel("Halley's Comet", cometData.color);
    cometGroup.add(cometLabel);
    scene.add(cometGroup);

    // ---- Real near-Earth asteroids (NASA NeoWs, live data) ----
    // We get a list of asteroids passing close to Earth during
    // THIS real week (not simulated — real, by browser clock). Precise orbits
    // of these bodies NeoWs doesn't provide without separate queries
    // for each one, so position around Earth is illustrative (random,
    // but fixed direction); distance, speed, size, and approach
    // date — real.
    const realAsteroidGroup = new THREE.Group();
    realAsteroidGroup.visible = false;
    scene.add(realAsteroidGroup);
    const realAsteroidMeshes = {};
    const realAsteroidLabels = {};
    let realAsteroidData = [];
    const realAsteroidFactLabels = { diam: 'Estimated diameter', hazard: 'Potentially hazardous', approach: 'Close approach date', miss: 'Miss distance', speed: 'Relative speed' };

    function buildRealAsteroidMeshes() {
      while (realAsteroidGroup.children.length) {
        const obj = realAsteroidGroup.children.pop();
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      }
      realAsteroidData.forEach(function (ast) {
        const angle = Math.random() * Math.PI * 2;
        const tilt = (Math.random() - 0.5) * 0.7;
        const dist = Math.max(3, Math.min(38, ast.missDistanceAU * SCENE_SCALE * 0.4));
        ast.offset = new THREE.Vector3(Math.cos(angle) * dist, Math.sin(tilt) * dist * 0.5, Math.sin(angle) * dist);

        const size = 0.22 + Math.min(1.1, ast.diameterKm / 2);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 8, 8),
          new THREE.MeshBasicMaterial({ color: ast.hazardous ? 0xe0554a : 0x9a9a9a })
        );
        realAsteroidGroup.add(mesh);
        realAsteroidMeshes[ast.name] = mesh;

        const label = makeLabel(ast.name, ast.hazardous ? 0xe0554a : 0x9a9a9a);
        label.scale.set(1.8, 0.45, 1);
        realAsteroidGroup.add(label);
        realAsteroidLabels[ast.name] = label;
      });
    }

    function fetchRealAsteroids() {
      const today = new Date();
      const startStr = today.toISOString().slice(0, 10);
      const endD = new Date(today.getTime() + 6 * 86400000);
      const endStr = endD.toISOString().slice(0, 10);
      fetch('https://api.nasa.gov/neo/rest/v1/feed?start_date=' + startStr + '&end_date=' + endStr + '&api_key=' + NASA_API_KEY)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          const list = [];
          Object.keys(data.near_earth_objects || {}).forEach(function (date) {
            data.near_earth_objects[date].forEach(function (neo) {
              const cad = neo.close_approach_data && neo.close_approach_data[0];
              if (!cad) return;
              const diameterKm = (neo.estimated_diameter.kilometers.estimated_diameter_min + neo.estimated_diameter.kilometers.estimated_diameter_max) / 2;
              const missAU = parseFloat(cad.miss_distance.astronomical);
              list.push({
                name: neo.name.replace(/[()]/g, ''),
                diameterKm: diameterKm,
                hazardous: neo.is_potentially_hazardous_asteroid,
                missDistanceAU: missAU,
                velocityKmS: parseFloat(cad.relative_velocity.kilometers_per_second),
                approachDate: cad.close_approach_date,
                facts: {
                  diam: Math.round(diameterKm * 1000) + ' m (avg. estimated)',
                  hazard: neo.is_potentially_hazardous_asteroid ? 'Yes — potentially hazardous' : 'No',
                  approach: cad.close_approach_date,
                  miss: missAU.toFixed(4) + ' AU (' + Math.round(missAU * 149597870.7).toLocaleString('en-US') + ' km)',
                  speed: parseFloat(cad.relative_velocity.kilometers_per_second).toFixed(1) + ' km/s',
                  blurb: 'Real near-Earth object — live data fetched from NASA\u2019s NeoWs API for the current week. Its direction around Earth here is illustrative; the distance, size, speed and date are real.',
                },
              });
            });
          });
          list.sort(function (a, b) { return a.missDistanceAU - b.missDistanceAU; });
          realAsteroidData = list.slice(0, 12);
          buildRealAsteroidMeshes();
          realAsteroidGroup.visible = state.showRealAsteroids;
          Object.keys(realAsteroidLabels).forEach(function (n) {
            realAsteroidLabels[n].visible = state.showRealAsteroids && state.showLabels;
          });
          if (typeof rebuildLegend === 'function' && state.showRealAsteroids) rebuildLegend();
        })
        .catch(function (err) { console.warn('NASA NeoWs fetch failed', err); });
    }
    fetchRealAsteroids();

    // ---- Mission trajectories (illustrative, NOT physically modeled —
    //      real gravitational maneuvers and precise ephemerides are beyond
    //      this simulator). Craft "doesn't exist" before launch date, then moves
    //      between real historical events (Jupiter flyby, Saturn, etc.),
    //      and after the last known point continues in same direction —
    //      any number of years ahead. ----
    const missionGroup = new THREE.Group();
    missionGroup.visible = false;
    const missionMeshes = {};
    const MISSION_LINE_MAX_PTS = 32;

    function parseUTCDate(dateStr) {
      const parts = dateStr.split('-').map(Number);
      return (Date.UTC(parts[0], parts[1] - 1, parts[2]) - Date.UTC(2000, 0, 1)) / 86400000;
    }

    const missionPaths = {
      'Voyager 1': {
        color: 0xd7a6ff,
        waypoints: [
          ['1977-09-05', 1, 0, 0],
          ['1979-03-05', 5.2, 1, -3],
          ['1980-11-12', 9.5, 2.5, -5],
          ['2012-08-25', 20, 15, -10],
          ['2050-01-01', 60, 55, -25],
          ['2120-01-01', 140, 140, -60],
        ],
        facts: { launch: 'September 5, 1977', flybys: 'Jupiter (1979), Saturn (1980)',
          status: 'In interstellar space since 2012 — the farthest human-made object from Earth.',
          speed: '≈17 km/s relative to the Sun',
          blurb: 'Carries the Golden Record — a phonograph disc with sounds, images and greetings from Earth, made for any spacefaring civilization that might one day find it.' } },
      'Voyager 2': {
        color: 0x9ad7ff,
        waypoints: [
          ['1977-08-20', 1, 0, 0.3],
          ['1979-07-09', 5.2, -1, 3],
          ['1981-08-25', 9.5, -2, 5.5],
          ['1986-01-24', 19.2, -4, 10],
          ['1989-08-25', 30, -6, 14],
          ['2018-11-05', 60, -14, 26],
          ['2100-01-01', 120, -30, 55],
        ],
        facts: { launch: 'August 20, 1977 (launched before Voyager 1)', flybys: 'Jupiter (1979), Saturn (1981), Uranus (1986), Neptune (1989)',
          status: 'In interstellar space since 2018 — the only spacecraft to have visited all four giant planets.',
          speed: '≈15 km/s relative to the Sun',
          blurb: "Its flybys of Uranus and Neptune remain the only close-up spacecraft data humanity has ever gathered from those two planets." } },
      'New Horizons': {
        color: 0xffcf8a,
        waypoints: [
          ['2006-01-19', 1, 0, -0.2],
          ['2007-02-28', 5.2, 0.4, -1],
          ['2012-01-01', 15, 1, -3],
          ['2015-07-14', 32, 1.6, -5],
          ['2019-01-01', 39, 1.8, -6],
          ['2035-01-01', 44, 2, -7],
          ['2060-01-01', 60, 2.5, -9],
        ],
        facts: { launch: 'January 19, 2006', flybys: 'Jupiter (2007, gravity assist), Pluto (2015), Arrokoth (2019)',
          status: 'Continuing outward through the Kuiper Belt.',
          speed: '≈14 km/s relative to the Sun',
          blurb: 'Gave humanity its first close-up images of Pluto and Charon in July 2015, then flew past the most distant object ever explored, Arrokoth, in 2019.' } },
    };

    Object.keys(missionPaths).forEach(function (name) {
      const mp = missionPaths[name];
      mp.wp = mp.waypoints.map(function (w) {
        return { days: parseUTCDate(w[0]), pos: new THREE.Vector3(w[1] * SCENE_SCALE, w[2] * SCENE_SCALE, w[3] * SCENE_SCALE) };
      });

      const lineGeo = new THREE.BufferGeometry();
      const linePositions = new Float32Array(MISSION_LINE_MAX_PTS * 3);
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      lineGeo.setDrawRange(0, 0);
      const lineMat = new THREE.LineDashedMaterial({ color: mp.color, dashSize: 3, gapSize: 2, transparent: true, opacity: 0.55 });
      const line = new THREE.Line(lineGeo, lineMat);
      line.visible = false;
      missionGroup.add(line);
      mp.line = line;

      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(1.1, 12, 12),
        new THREE.MeshBasicMaterial({ color: mp.color })
      );
      marker.visible = false;
      missionGroup.add(marker);
      missionMeshes[name] = marker;

      const label = makeLabel(name, mp.color);
      label.visible = false;
      missionGroup.add(label);
      mp.label = label;
    });
    scene.add(missionGroup);

    // Updates craft position for current simulated date: before launch — hidden,
    // between known points — uniform motion, after last — continues in
    // same direction with same speed.
    function updateMissionPosition(name, currentAbsDay) {
      const mp = missionPaths[name];
      const wp = mp.wp;
      const launched = currentAbsDay >= wp[0].days;
      mp.line.visible = launched && state.showMissions;
      mp.label.visible = launched && state.showMissions && state.showLabels;
      missionMeshes[name].visible = launched && state.showMissions;
      if (!launched) return;

      let pos;
      if (currentAbsDay >= wp[wp.length - 1].days) {
        const a = wp[wp.length - 2], b = wp[wp.length - 1];
        const segDays = b.days - a.days;
        const dir = b.pos.clone().sub(a.pos).divideScalar(segDays || 1);
        pos = b.pos.clone().add(dir.multiplyScalar(currentAbsDay - b.days));
      } else {
        let idx = 0;
        for (let i = 0; i < wp.length - 1; i++) {
          if (currentAbsDay >= wp[i].days && currentAbsDay <= wp[i + 1].days) { idx = i; break; }
        }
        const a = wp[idx], b = wp[idx + 1];
        const t = (currentAbsDay - a.days) / ((b.days - a.days) || 1);
        pos = a.pos.clone().lerp(b.pos, Math.max(0, Math.min(1, t)));
      }

      missionMeshes[name].position.copy(pos);
      mp.label.position.copy(pos).add(new THREE.Vector3(0, 2.4, 0));

      const traveled = [];
      for (let i = 0; i < wp.length; i++) {
        if (wp[i].days <= currentAbsDay) traveled.push(wp[i].pos); else break;
      }
      traveled.push(pos);
      const posAttr = mp.line.geometry.getAttribute('position');
      const n = Math.min(traveled.length, MISSION_LINE_MAX_PTS);
      for (let i = 0; i < n; i++) {
        posAttr.array[i * 3] = traveled[i].x;
        posAttr.array[i * 3 + 1] = traveled[i].y;
        posAttr.array[i * 3 + 2] = traveled[i].z;
      }
      posAttr.needsUpdate = true;
      mp.line.geometry.setDrawRange(0, n);
      mp.line.geometry.computeBoundingSphere();
      mp.line.computeLineDistances();
    }

    // ======================================================================
    // 4. Real-time simulation (no aliasing even over millennia —
    //    trail builds with sub-steps proportional to planet period)
    // ======================================================================
    const state = {
      viewMode: 'orrery', // 'orrery' | 'sky'
      currentDay: 0,
      paused: false,
      speedMultiplier: 1,
      topView: false,
      showTrails: true,
      showBelt: true,
      showMoons: false,
      showStars: true,
      showLabels: true,
      showMinor: false,
      showComet: false,
      showMissions: false,
      showRealAsteroids: false,
      lowDetail: false,
      followName: null,       // name of planet camera is following (null = free camera)
      followAnchor: null,     // THREE.Vector3 — position of tracked object on previous frame
      followOffsetDir: null,  // camera direction relative to planet at selection moment
      followDist: 0,          // desired camera distance from planet
      followFlyStart: null,   // camera position at start of "fly-to"
      followFlyStartTarget: null,
      followFlyElapsed: 0,
      followFlyDuration: 0.9, // sec
      prevCameraPos: null,    // camera view before last transition to body
      prevCameraTarget: null,
      returnFlying: false,
      returnFlyStart: null,
      returnFlyStartTarget: null,
      returnFlyEndPos: null,
      returnFlyEndTarget: null,
      returnFlyElapsed: 0,
    };

    const baseDaysPerSecond = totalDays / 120; // full range ≈ in 2 min at speed ×1

    function pushTrailPoint(name, pos, day) {
      const buf = trailBuffers[name];
      buf.push({ day: day, x: pos[0], y: pos[1], z: pos[2] });
      const windowDays = planetData[name].T * 1.0; // one orbit back
      while (buf.length > 2 && state.currentDay - buf[0].day > windowDays) buf.shift();
      if (buf.length > TRAIL_MAX_POINTS) buf.splice(0, buf.length - TRAIL_MAX_POINTS);
    }

    function updateTrailGeometry(name) {
      const line = trailLines[name];
      const buf = trailBuffers[name];
      const posAttr = line.geometry.getAttribute('position');
      const n = Math.min(buf.length, TRAIL_MAX_POINTS);
      for (let k = 0; k < n; k++) {
        posAttr.array[k * 3] = buf[k].x;
        posAttr.array[k * 3 + 1] = buf[k].y;
        posAttr.array[k * 3 + 2] = buf[k].z;
      }
      posAttr.needsUpdate = true;
      line.geometry.setDrawRange(0, n);
      line.geometry.computeBoundingSphere();
    }

    function advanceAndRender(deltaDays) {
      const prevDay = state.currentDay;
      state.currentDay = Math.min(state.currentDay + deltaDays, totalDays);
      const actualDelta = state.currentDay - prevDay;

      Object.keys(planetData).forEach(function (name) {
        const d = planetData[name];
        let lastPos = null;

        if (actualDelta > 0 && state.showTrails) {
          // pushTrailPoint() below immediately discards anything older than
          // one orbital period (see windowDays there), so whenever this
          // chunk's span is bigger than that period — which happens a lot
          // at very high playback speeds on long date ranges, where a
          // single chunk can cover many Mercury orbits — most of a flat
          // 50-sample budget spread across the *whole* span used to land on
          // days that got thrown away the instant they were pushed,
          // leaving only a literal handful of surviving points to
          // represent a full lap (a visibly jagged polygon instead of a
          // smooth ellipse). Concentrate the sample budget into just the
          // trailing slice that will actually survive the trim, so the
          // visible trail always gets full density regardless of how big
          // the underlying time step was. At normal speeds actualDelta is
          // already smaller than one orbit, so sampleSpan === actualDelta
          // and this behaves exactly as before.
          const windowDays = d.T * 1.0;
          const sampleSpan = Math.min(actualDelta, windowDays);
          const sampleStart = state.currentDay - sampleSpan;
          const subSteps = Math.min(50, Math.max(1, Math.ceil(sampleSpan / (d.T / 60))));
          for (let s = 1; s <= subSteps; s++) {
            const dayAbs = sampleStart + sampleSpan * (s / subSteps);
            const posM = keplerPosition(d, startOffsetDays + dayAbs);
            const scenePos = toScene(posM);
            pushTrailPoint(name, scenePos, dayAbs);
            lastPos = scenePos;
          }
        } else {
          const posM = keplerPosition(d, startOffsetDays + state.currentDay);
          lastPos = toScene(posM);
        }

        planetMeshes[name].position.set(lastPos[0], lastPos[1], lastPos[2]);
        // Light rotation around own axis — purely visual (not tied
        // to real day periods) so surface texture is visible in motion.
        planetSpinMeshes[name].rotation.y += actualDelta * (0.06 + (1 / d.size) * 0.02);
        planetLabels[name].position.set(lastPos[0] + d.size * 1.6, lastPos[1] + d.size * 1.6, lastPos[2]);
        planetLabels[name].visible = state.showLabels;

        if (state.showTrails) updateTrailGeometry(name);
        trailLines[name].visible = state.showTrails;
      });

      if (state.showMoons) {
        Object.keys(moonData).forEach(function (name) {
          const m = moonData[name];
          const parentPos = planetMeshes[m.parent].position;
          const phase = 2 * Math.PI * ((state.currentDay % m.T) / m.T);
          // Orbit — multiplier from artistic size of parent planet
          // (not real distance in AU), otherwise moon ends up
          // inside the "inflated" sphere and becomes invisible.
          const orbitR = planetData[m.parent].size * m.orbitMult;
          const mx = parentPos.x + orbitR * Math.cos(phase);
          const my = parentPos.y;
          const mz = parentPos.z + orbitR * Math.sin(phase);
          moonMeshes[name].position.set(mx, my, mz);
          moonLabels[name].position.set(mx + m.size * 1.8, my + m.size * 1.8, mz);
        });
      }

      if (state.showMinor) {
        Object.keys(minorBodyData).forEach(function (name) {
          const d = minorBodyData[name];
          const posM = keplerPosition(d, startOffsetDays + state.currentDay);
          const sp = toScene(posM);
          minorBodyMeshes[name].position.set(sp[0], sp[1], sp[2]);
          minorBodyLabels[name].position.set(sp[0] + d.size * 1.8, sp[1] + d.size * 1.8, sp[2]);
        });
      }

      if (state.showComet) {
        const posM = keplerPosition(cometData, startOffsetDays + state.currentDay);
        const sp = toScene(posM);
        cometMesh.position.set(sp[0], sp[1], sp[2]);
        cometLabel.position.set(sp[0] + 2.2, sp[1] + 2.2, sp[2]);
        // Tail always points away from Sun, longer and brighter near perihelion
        const dist = Math.sqrt(sp[0] * sp[0] + sp[1] * sp[1] + sp[2] * sp[2]);
        const dirAway = dist > 0.001 ? [sp[0] / dist, sp[1] / dist, sp[2] / dist] : [1, 0, 0];
        const closeness = Math.max(0, 1 - dist / (cometData.a / AU * SCENE_SCALE * 0.6));
        const tailLen = 4 + closeness * 46;
        cometTail.position.set(sp[0], sp[1], sp[2]);
        cometTail.scale.set(0.6 + closeness * 1.6, tailLen, 1);
        cometTail.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(dirAway[0], dirAway[1], dirAway[2])
        );
        cometTail.material.opacity = 0.25 + closeness * 0.6;
      }

      if (state.showMissions) {
        const currentAbsDay = startOffsetDays + state.currentDay;
        let anyLaunchStatusChanged = false;
        Object.keys(missionPaths).forEach(function (name) {
          const wasVisible = missionMeshes[name].visible;
          updateMissionPosition(name, currentAbsDay);
          if (missionMeshes[name].visible !== wasVisible) anyLaunchStatusChanged = true;
        });
        if (anyLaunchStatusChanged) rebuildLegend();
      }

      if (state.showRealAsteroids && realAsteroidData.length) {
        const earthPos = planetMeshes.Earth.position;
        realAsteroidData.forEach(function (ast) {
          const mesh = realAsteroidMeshes[ast.name];
          if (!mesh) return;
          mesh.position.copy(earthPos).add(ast.offset);
          realAsteroidLabels[ast.name].position.copy(mesh.position).add(new THREE.Vector3(0, 1.4, 0));
        });
      }

      sunLight.position.set(0, 0, 0);

      if (state.viewMode === 'sky') updateSkyPlanetPositions();

      // HUD
      const shownDate = new Date(startDate.getTime() + state.currentDay * 86400000);
      document.getElementById('hud-date').textContent = shownDate.toISOString().slice(0, 10);
      document.getElementById('hud-day').textContent =
        Math.round(state.currentDay).toLocaleString('en-US') + ' / ' + totalDays.toLocaleString('en-US');
    }

    // ---- Camera tracking of planet ----
    // Unified access to position/size of any object that can be
    // tracked or for which to show fact panel.
    function getFollowablePosition(name) {
      if (name === 'Sun') return new THREE.Vector3(0, 0, 0);
      if (planetMeshes[name]) return planetMeshes[name].position;
      if (minorBodyMeshes[name]) return minorBodyMeshes[name].position;
      if (moonMeshes[name]) return moonMeshes[name].position;
      if (name === "Halley's Comet") return cometMesh.position;
      if (missionMeshes[name]) return missionMeshes[name].position;
      if (realAsteroidMeshes[name]) return realAsteroidMeshes[name].position;
      return null;
    }
    function getFollowableSize(name) {
      if (name === 'Sun') return sunRadius;
      if (planetData[name]) return planetData[name].size;
      if (minorBodyData[name]) return minorBodyData[name].size;
      if (moonData[name]) return moonData[name].size;
      if (name === "Halley's Comet") return cometData.size;
      if (missionPaths[name]) return 1.1;
      if (realAsteroidMeshes[name]) return 1;
      return 1;
    }

    function selectFollow(name) {
      const legendItems = document.querySelectorAll('#legend .item');
      if (state.followName === name) {
        // second click — stop tracking, leave camera where it is
        state.followName = null;
        legendItems.forEach(function (el) { el.classList.remove('active'); });
        return;
      }
      const target = getFollowablePosition(name);
      if (!target) return;

      // Remember where camera was BEFORE this transition — so we can
      // go back with one button later.
      state.prevCameraPos = camera.position.clone();
      state.prevCameraTarget = controls.target.clone();

      state.followName = name;
      legendItems.forEach(function (el) {
        el.classList.toggle('active', el.dataset.body === name);
      });

      // If fact panel is open now — update it for just-selected
      // body, otherwise it stays showing previous object's data.
      if (infoPanel.classList.contains('open')) showInfoPanel(name);

      const size = getFollowableSize(name);
      const desiredDist = Math.max(6, size * 20);

      let dir = camera.position.clone().sub(controls.target);
      if (dir.lengthSq() < 1e-6) dir.set(0.6, 0.4, 0.6);
      dir.normalize();

      state.followOffsetDir = dir;
      state.followDist = desiredDist;
      state.followAnchor = target.clone();
      state.followFlyStart = camera.position.clone();
      state.followFlyStartTarget = controls.target.clone();
      state.followFlyElapsed = 0;
    }

    function updateCameraFollow(dtSeconds) {
      if (!state.followName) return;
      const target = getFollowablePosition(state.followName);
      if (!target) { state.followName = null; return; }

      if (state.followFlyElapsed < state.followFlyDuration) {
        state.followFlyElapsed += dtSeconds;
        const t = Math.min(1, state.followFlyElapsed / state.followFlyDuration);
        const ease = t * t * (3 - 2 * t); // smoothstep
        const desiredCamPos = target.clone().add(state.followOffsetDir.clone().multiplyScalar(state.followDist));
        camera.position.lerpVectors(state.followFlyStart, desiredCamPos, ease);
        controls.target.lerpVectors(state.followFlyStartTarget, target, ease);
      } else {
        // steady mode: move camera and target by same delta as planet,
        // so you can freely rotate mouse around it and it won't "escape"
        const delta = target.clone().sub(state.followAnchor);
        camera.position.add(delta);
        controls.target.add(delta);
      }
      state.followAnchor.copy(target);
    }

    // ---- Return to view that was before transition to body ----
    function returnToPreviousView() {
      if (!state.prevCameraPos) return;
      const legendItems = document.querySelectorAll('#legend .item');
      state.followName = null;
      legendItems.forEach(function (el) { el.classList.remove('active'); });

      state.returnFlying = true;
      state.returnFlyStart = camera.position.clone();
      state.returnFlyStartTarget = controls.target.clone();
      state.returnFlyEndPos = state.prevCameraPos.clone();
      state.returnFlyEndTarget = state.prevCameraTarget.clone();
      state.returnFlyElapsed = 0;
      state.prevCameraPos = null;
      state.prevCameraTarget = null;
    }

    function updateReturnFlight(dtSeconds) {
      if (!state.returnFlying) return;
      state.returnFlyElapsed += dtSeconds;
      const t = Math.min(1, state.returnFlyElapsed / 0.9);
      const ease = t * t * (3 - 2 * t); // smoothstep
      camera.position.lerpVectors(state.returnFlyStart, state.returnFlyEndPos, ease);
      controls.target.lerpVectors(state.returnFlyStartTarget, state.returnFlyEndTarget, ease);
      if (t >= 1) state.returnFlying = false;
    }

    // ---- Legend ----
    function makeLegendRow(legend, name, colorHex, small, onSelect) {
      const row = document.createElement('div');
      row.className = 'item' + (small ? ' item-sub' : '');
      row.dataset.body = name;
      row.innerHTML = '<span class="dot" style="background:' + colorHex + '"></span><span class="item-name">' + name + '</span><span class="info-icon" data-body="' + name + '">ⓘ</span>';
      row.addEventListener('click', function (e) {
        if (e.target.classList.contains('info-icon')) return;
        if (onSelect) onSelect(name); else { selectFollow(name); showInfoPanel(name); }
      });
      legend.appendChild(row);
    }
    function makeLegendHeader(legend, text) {
      const header = document.createElement('div');
      header.className = 'legend-section';
      header.textContent = text;
      legend.appendChild(header);
    }

    function rebuildLegend() {
      const legend = document.getElementById('legend');
      const previouslyActive = state.followName;
      legend.innerHTML = '';

      // Non-scrolling drag handle (outside scroll container)
      var handle = document.createElement('div');
      handle.className = 'legend-drag-handle';
      legend.appendChild(handle);

      // Scrollable content wrapper — all items go here
      var scroll = document.createElement('div');
      scroll.className = 'legend-scroll';
      legend.appendChild(scroll);

      makeLegendHeader(scroll, 'Planets');
      makeLegendRow(scroll, 'Sun', '#fff2b3', true);
      Object.keys(planetData).forEach(function (name) {
        makeLegendRow(scroll, name, '#' + planetData[name].color.toString(16).padStart(6, '0'), true);
      });

      if (state.showMoons) {
        makeLegendHeader(scroll, 'Moons');
        Object.keys(moonData).forEach(function (name) {
          makeLegendRow(scroll, name, '#' + moonData[name].color.toString(16).padStart(6, '0'), true);
        });
      }
      if (state.showMinor) {
        makeLegendHeader(scroll, 'Dwarf planets');
        Object.keys(minorBodyData).forEach(function (name) {
          makeLegendRow(scroll, name, '#' + minorBodyData[name].color.toString(16).padStart(6, '0'), true);
        });
      }
      if (state.showComet) {
        makeLegendHeader(scroll, 'Comets');
        makeLegendRow(scroll, "Halley's Comet", '#' + cometData.color.toString(16).padStart(6, '0'), true);
      }
      if (state.showMissions) {
        const launchedMissions = Object.keys(missionPaths).filter(function (name) {
          return missionMeshes[name] && missionMeshes[name].visible;
        });
        if (launchedMissions.length) {
          makeLegendHeader(scroll, 'Missions');
          launchedMissions.forEach(function (name) {
            makeLegendRow(scroll, name, '#' + missionPaths[name].color.toString(16).padStart(6, '0'), true);
          });
        }
      }
      if (state.showRealAsteroids && realAsteroidData.length) {
        makeLegendHeader(scroll, 'Live NASA Data');
        realAsteroidData.forEach(function (ast) {
          makeLegendRow(scroll, ast.name, ast.hazardous ? '#e0554a' : '#9a9a9a', true);
        });
      }

      legend.querySelectorAll('.info-icon').forEach(function (icon) {
        icon.addEventListener('click', function (e) {
          e.stopPropagation();
          showInfoPanel(icon.dataset.body);
        });
      });
      if (previouslyActive) {
        legend.querySelectorAll('.item').forEach(function (el) {
          el.classList.toggle('active', el.dataset.body === previouslyActive);
        });
      }
      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = 'click — track & explore';
      legend.appendChild(hint);
    }
    rebuildLegend();

    // Sky mode's body list reuses the very same #legend element/CSS as the
    // orrery legend above — just repopulated with the Sun/Moon/planets that
    // are actually plotted on the dome (no Earth, since you're standing on
    // it) and wired to handleSkyBodySelect() instead of selectFollow(), so
    // it looks pixel-identical to the orrery legend in both layout and the
    // mobile drawer variant, with no separate CSS to keep in sync.
    function rebuildSkyBodyLegend() {
      const legend = document.getElementById('legend');
      if (!legend) return;
      legend.innerHTML = '';

      var handle = document.createElement('div');
      handle.className = 'legend-drag-handle';
      legend.appendChild(handle);

      var scroll = document.createElement('div');
      scroll.className = 'legend-scroll';
      legend.appendChild(scroll);

      makeLegendHeader(scroll, 'Sky');
      makeLegendRow(scroll, 'Sun', '#fff2b3', true, handleSkyBodySelect);
      makeLegendRow(scroll, 'Moon', '#d7d7dc', true, handleSkyBodySelect);
      Object.keys(planetData).forEach(function (name) {
        if (name === 'Earth') return;
        makeLegendRow(scroll, name, '#' + planetData[name].color.toString(16).padStart(6, '0'), true, handleSkyBodySelect);
      });

      legend.querySelectorAll('.info-icon').forEach(function (icon) {
        icon.addEventListener('click', function (e) {
          e.stopPropagation();
          handleSkyBodySelect(icon.dataset.body);
        });
      });
      if (skyState.followName) {
        legend.querySelectorAll('.item').forEach(function (el) {
          el.classList.toggle('active', el.dataset.body === skyState.followName);
        });
      }
      const hint = document.createElement('div');
      hint.className = 'hint';
      hint.textContent = 'click — look & track';
      legend.appendChild(hint);
    }

    // ---- Legend fade hint (desktop) ----
    (function () {
      var legendEl = document.getElementById('legend');
      var fadeEl   = document.getElementById('legend-fade');
      if (!fadeEl) return;
      function updateFade() {
        if (window.matchMedia('(max-width: 640px)').matches) { fadeEl.classList.remove('visible'); return; }
        var atBottom = legendEl.scrollHeight - legendEl.scrollTop <= legendEl.clientHeight + 4;
        fadeEl.classList.toggle('visible', !atBottom && legendEl.scrollHeight > legendEl.clientHeight);
      }
      legendEl.addEventListener('scroll', updateFade);
      // re-check after rebuild
      var origRebuild = rebuildLegend;
      rebuildLegend = function () { origRebuild(); setTimeout(updateFade, 50); };
      var origRebuildSky = rebuildSkyBodyLegend;
      rebuildSkyBodyLegend = function () { origRebuildSky(); setTimeout(updateFade, 50); };
      updateFade();
      window.addEventListener('resize', updateFade);
    }());

    // ---- Celestial body fact panel ----
    const infoPanel = document.getElementById('info-panel');
    const infoFactLabels = { mass: 'Mass', distance: 'Distance from Sun', day: 'Day length', year: 'Year length', moons: 'Moons', temp: 'Avg. temperature' };
    const missionFactLabels = { launch: 'Launch date', flybys: 'Key flybys', status: 'Current status', speed: 'Speed' };
    let infoPanelBody = null;

    // ---- NASA DONKI: latest solar flare (lazy, with cache) ----
    let sunFlareCache = null;
    function fetchLatestFlare(callback) {
      if (sunFlareCache !== null) { callback(sunFlareCache); return; }
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 86400000);
      const fmt = function (d) { return d.toISOString().slice(0, 10); };
      fetch('https://api.nasa.gov/DONKI/FLR?startDate=' + fmt(start) + '&endDate=' + fmt(end) + '&api_key=' + NASA_API_KEY)
        .then(function (r) { return r.json(); })
        .then(function (list) {
          if (!Array.isArray(list) || !list.length) { sunFlareCache = false; callback(false); return; }
          const latest = list[list.length - 1];
          sunFlareCache = { classType: latest.classType, peakTime: latest.peakTime };
          callback(sunFlareCache);
        })
        .catch(function () { sunFlareCache = false; callback(false); });
    }

    // ---- NASA EPIC: latest Earth photo (lazy, with cache) ----
    let epicCache = null;
    function fetchLatestEpic(callback) {
      if (epicCache !== null) { callback(epicCache); return; }
      fetch('https://epic.gsfc.nasa.gov/api/natural')
        .then(function (r) { return r.json(); })
        .then(function (list) {
          if (!Array.isArray(list) || !list.length) { epicCache = false; callback(false); return; }
          const latest = list[list.length - 1];
          const parts = latest.date.slice(0, 10).split('-');
          const url = 'https://epic.gsfc.nasa.gov/archive/natural/' + parts[0] + '/' + parts[1] + '/' + parts[2] + '/jpg/' + latest.image + '.jpg';
          epicCache = { url: url, date: latest.date };
          callback(epicCache);
        })
        .catch(function () { epicCache = false; callback(false); });
    }

    function safeEyebrowColor(hex) {
      if (!hex || hex.length < 7) return hex;
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
      if (luminance > 0.72) {
        const dr = Math.round(r*0.62), dg = Math.round(g*0.62), db = Math.round(b*0.62);
        return '#' + [dr,dg,db].map(function(v){ return v.toString(16).padStart(2,'0'); }).join('');
      }
      return hex;
    }

    function showInfoPanel(name) {
      let facts, colorHex, blurb, factLabels = infoFactLabels;
      if (name === 'Sun') {
        facts = { mass: '1.989 × 10³⁰ kg', distance: '—', day: '~27 Earth days (equator)', year: '—', moons: '8 planets orbit it', temp: '~5,500 °C surface' };
        blurb = 'A G-type main-sequence star containing 99.8% of the Solar System\'s mass. Powers everything here through nuclear fusion.';
        colorHex = '#fff2b3';
      } else if (planetData[name]) {
        facts = planetData[name].facts;
        blurb = facts.blurb;
        colorHex = '#' + planetData[name].color.toString(16).padStart(6, '0');
      } else if (minorBodyData[name]) {
        facts = minorBodyData[name].facts;
        blurb = facts.blurb;
        colorHex = '#' + minorBodyData[name].color.toString(16).padStart(6, '0');
      } else if (moonData[name]) {
        facts = moonData[name].facts;
        blurb = facts.blurb;
        colorHex = '#' + moonData[name].color.toString(16).padStart(6, '0');
      } else if (name === "Halley's Comet") {
        facts = cometData.facts;
        blurb = facts.blurb;
        colorHex = '#' + cometData.color.toString(16).padStart(6, '0');
      } else if (missionPaths[name]) {
        facts = missionPaths[name].facts;
        blurb = facts.blurb;
        colorHex = '#' + missionPaths[name].color.toString(16).padStart(6, '0');
        factLabels = missionFactLabels;
      } else if (realAsteroidData.find(function (a) { return a.name === name; })) {
        const ast = realAsteroidData.find(function (a) { return a.name === name; });
        facts = ast.facts;
        blurb = facts.blurb;
        colorHex = ast.hazardous ? '#e0554a' : '#9a9a9a';
        factLabels = realAsteroidFactLabels;
      } else {
        return;
      }
      infoPanelBody = name;
      // remove dynamic photo block (EPIC) from previous panel opening —
      // info-grid itself gets cleaned below automatically, this only
      // concerns elements added OUTSIDE info-grid.
      const stalePhoto = document.getElementById('info-photo-wrap');
      if (stalePhoto) stalePhoto.remove();

      const eyebrowText = name === 'Sun' ? 'Star' : name === "Halley's Comet" ? 'Comet' : missionPaths[name] ? 'Space mission' : realAsteroidFactLabels && realAsteroidData.find(function (a) { return a.name === name; }) ? 'Near-Earth object (NASA live)' : minorBodyData[name] ? 'Dwarf planet' : moonData[name] ? 'Moon' : 'Planet';
      document.getElementById('info-eyebrow').textContent = eyebrowText;
      document.getElementById('info-eyebrow').style.color = safeEyebrowColor(colorHex);
      document.getElementById('info-name').textContent = name;
      document.getElementById('info-blurb').textContent = blurb;
      const grid = document.getElementById('info-grid');
      grid.innerHTML = '';
      Object.keys(factLabels).forEach(function (key) {
        if (!facts[key]) return;
        const label = document.createElement('div');
        label.className = 'info-label';
        label.textContent = factLabels[key];
        const value = document.createElement('div');
        value.className = 'info-value';
        value.textContent = facts[key];
        grid.appendChild(label);
        grid.appendChild(value);
      });

      // ---- Live NASA data: solar flares / Earth photo (loaded asynchronously) ----
      if (name === 'Sun') {
        const flareLabel = document.createElement('div');
        flareLabel.className = 'info-label';
        flareLabel.textContent = 'Latest solar flare (NASA, live)';
        const flareValue = document.createElement('div');
        flareValue.className = 'info-value';
        flareValue.id = 'info-flare-value';
        flareValue.textContent = 'Loading…';
        grid.appendChild(flareLabel);
        grid.appendChild(flareValue);
        fetchLatestFlare(function (flare) {
          const el = document.getElementById('info-flare-value');
          if (!el) return; // panel already closed or showing different body
          if (!flare) { el.textContent = 'No major flares in the last 30 days'; return; }
          const dateStr = flare.peakTime ? flare.peakTime.slice(0, 10) : '';
          el.textContent = 'Class ' + flare.classType + ' on ' + dateStr;
        });
      }
      if (name === 'Earth') {
        const photoWrap = document.createElement('div');
        photoWrap.id = 'info-photo-wrap';
        photoWrap.className = 'info-photo-wrap';
        photoWrap.textContent = 'Loading latest Earth photo (NASA EPIC)…';
        infoPanel.insertBefore(photoWrap, document.getElementById('info-return'));
        fetchLatestEpic(function (epic) {
          const wrap = document.getElementById('info-photo-wrap');
          if (!wrap) return;
          if (!epic) { wrap.textContent = ''; return; }
          wrap.innerHTML = '';
          const img = document.createElement('img');
          img.className = 'info-photo';
          img.src = epic.url;
          img.alt = 'Latest Earth photo from NASA EPIC';
          const cap = document.createElement('div');
          cap.className = 'info-photo-caption';
          cap.textContent = 'Earth, ' + epic.date.slice(0, 10) + ' — NASA EPIC / DSCOVR';
          wrap.appendChild(img);
          wrap.appendChild(cap);
        });
      }

      infoPanel.classList.add('open');
      document.getElementById('info-return').style.display = state.prevCameraPos ? '' : 'none';
    }
    document.getElementById('info-close').addEventListener('click', function () {
      infoPanel.classList.remove('open');
    });
    document.getElementById('info-return').addEventListener('click', function () {
      returnToPreviousView();
      infoPanel.classList.remove('open');
    });

    // ---- Click on object directly in 3D scene opens same fact panel ----
    // Distinguish click from camera drag by distance cursor moved
    // between button press and release.
    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    let pointerDownXY = null;

    function getClickableBodies() {
      const list = [{ mesh: sunMesh, name: 'Sun' }];
      Object.keys(planetSpinMeshes).forEach(function (name) {
        list.push({ mesh: planetSpinMeshes[name], name: name });
      });
      if (state.showMoons) {
        Object.keys(moonMeshes).forEach(function (name) {
          list.push({ mesh: moonMeshes[name], name: name });
        });
      }
      if (state.showMinor) {
        Object.keys(minorBodyMeshes).forEach(function (name) {
          list.push({ mesh: minorBodyMeshes[name], name: name });
        });
      }
      if (state.showComet) {
        list.push({ mesh: cometMesh, name: "Halley's Comet" });
      }
      if (state.showMissions) {
        Object.keys(missionMeshes).forEach(function (name) {
          if (missionMeshes[name].visible) list.push({ mesh: missionMeshes[name], name: name });
        });
      }
      if (state.showRealAsteroids) {
        Object.keys(realAsteroidMeshes).forEach(function (name) {
          list.push({ mesh: realAsteroidMeshes[name], name: name });
        });
      }
      return list;
    }

    renderer.domElement.addEventListener('pointerdown', function (e) {
      pointerDownXY = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('pointerup', function (e) {
      if (!pointerDownXY) return;
      const dx = e.clientX - pointerDownXY.x, dy = e.clientY - pointerDownXY.y;
      pointerDownXY = null;
      if (state.viewMode === 'sky') return; // sky mode has its own look controls, no body picking
      if (Math.sqrt(dx * dx + dy * dy) > 5) return; // that was camera rotation, not click

      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNDC, camera);

      const bodies = getClickableBodies();
      const intersects = raycaster.intersectObjects(bodies.map(function (b) { return b.mesh; }));
      if (intersects.length > 0) {
        const hit = bodies.find(function (b) { return b.mesh === intersects[0].object; });
        if (hit) {
          selectFollow(hit.name); // click on body immediately moves camera there
          showInfoPanel(hit.name);
        }
      }
    });

    // ======================================================================
    // 5. UI Control
    // ======================================================================
    const btnPlay = document.getElementById('btn-play');
    btnPlay.addEventListener('click', function () {
      state.paused = !state.paused;
      btnPlay.textContent = state.paused ? 'Play' : 'Pause';
    });

    document.getElementById('btn-change-dates').addEventListener('click', function () {
      try {
        sessionStorage.setItem('solarSim_start', startDate.toISOString().slice(0, 10));
        sessionStorage.setItem('solarSim_end', endDate.toISOString().slice(0, 10));
      } catch (e) { /* sessionStorage unavailable — just reload with default dates */ }
      location.reload();
    });

    document.getElementById('btn-reset').addEventListener('click', function () {
      state.currentDay = 0;
      Object.keys(trailBuffers).forEach(function (name) {
        trailBuffers[name] = [];
        trailLines[name].geometry.setDrawRange(0, 0);
      });
      state.paused = false;
      btnPlay.textContent = 'Pause';
      advanceAndRender(0);
    });

    const btnView = document.getElementById('btn-view');
    btnView.addEventListener('click', function () {
      state.topView = !state.topView;
      btnView.textContent = state.topView ? 'Side view' : 'Top view';
      // Calculate relative to current camera target (not world center), so
      // it works correctly when tracking individual planet.
      const dist = camera.position.distanceTo(controls.target);
      const t = controls.target;
      if (state.topView) {
        camera.position.set(t.x + 0.0001, t.y + dist, t.z + 0.0001);
      } else {
        camera.position.set(t.x + dist * 0.62, t.y + dist * 0.45, t.z + dist * 0.62);
      }
      controls.update();
    });

    // ---- View mode switch: Orrery (top-down orbital view) / Sky (planetarium) ----
    const modeButtons = Array.prototype.slice.call(document.querySelectorAll('#mode-toggle .mode-btn'));
    // Sky mode rotates the whole dome with sidereal time, so even a modest
    // speed multiplier makes the stars/sky spin dizzyingly fast. Whenever we
    // enter sky mode we force the speed slider down to a slow, comfortable
    // value; whenever we leave it we restore whatever speed was set before
    // (so orrery mode isn't left stuck at the slow sky-mode speed).
    const SKY_MODE_SPEED_EXP = '-2'; // slider value -> 10^-2 = 0.01x
    let speedBeforeSky = null;
    function setViewMode(mode) {
      if (state.viewMode === mode) return;
      state.viewMode = mode;
      const enteringSky = mode === 'sky';

      modeButtons.forEach(function (btn) {
        const active = btn.getAttribute('data-mode') === mode;
        btn.classList.toggle('active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      document.body.classList.toggle('mode-sky', enteringSky);

      // Close any orrery-only UI so it doesn't linger behind the sky view.
      closePanels();
      const infoPanelEl = document.getElementById('info-panel');
      if (infoPanelEl) infoPanelEl.classList.remove('open');
      selectFollow(null);

      controls.enabled = !enteringSky;
      if (enteringSky) {
        updateSkyPlanetPositions();
        updateSkyCamera();
        rebuildSkyBodyLegend();
        updateSkyExitButton();
        if (speedSlider) {
          speedBeforeSky = speedSlider.value;
          speedSlider.value = SKY_MODE_SPEED_EXP;
          updateSpeedLabel();
        }
      } else {
        stopSkyFollow();
        rebuildLegend();
        if (speedBeforeSky !== null) {
          if (speedSlider) {
            speedSlider.value = speedBeforeSky;
            updateSpeedLabel();
          }
          speedBeforeSky = null;
        }
      }
    }
    modeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () { setViewMode(btn.getAttribute('data-mode')); });
    });

    const btnSkyExitFollow = document.getElementById('btn-sky-exit-follow');
    if (btnSkyExitFollow) btnSkyExitFollow.addEventListener('click', exitSkyFollowToPreviousView);

    // ---- Sky mode: observer location (lat/lon) panel ----
    (function setupSkyLocationControls() {
      const latInput = document.getElementById('sky-lat');
      const lonInput = document.getElementById('sky-lon');
      const useLocationBtn = document.getElementById('sky-use-location');
      if (!latInput || !lonInput) return;
      latInput.value = skyState.lat;
      lonInput.value = skyState.lon;
      latInput.addEventListener('input', function () {
        const v = parseFloat(latInput.value);
        if (!Number.isNaN(v)) skyState.lat = Math.max(-90, Math.min(90, v));
      });
      lonInput.addEventListener('input', function () {
        const v = parseFloat(lonInput.value);
        if (!Number.isNaN(v)) skyState.lon = Math.max(-180, Math.min(180, v));
      });
      if (useLocationBtn) {
        useLocationBtn.addEventListener('click', function () {
          if (!navigator.geolocation) return;
          const originalText = useLocationBtn.textContent;
          useLocationBtn.textContent = 'Locating…';
          navigator.geolocation.getCurrentPosition(
            function (pos) {
              skyState.lat = pos.coords.latitude;
              skyState.lon = pos.coords.longitude;
              latInput.value = skyState.lat.toFixed(2);
              lonInput.value = skyState.lon.toFixed(2);
              useLocationBtn.textContent = originalText;
            },
            function () { useLocationBtn.textContent = originalText; },
            { timeout: 8000 }
          );
        });
      }
    })();

    // ---- Sky mode: clickable body list (Sun, Moon, planets) ----
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    function updateSpeedLabel() {
      const mult = Math.pow(10, parseFloat(speedSlider.value));
      state.speedMultiplier = mult;
      // Sky mode allows much slower speeds than before (slider now goes down
      // to 10^-5 so very large date ranges can be slowed to a crawl), so a
      // single decimal (which used to round everything below 0.05x down to
      // "0.0×") isn't enough precision anymore — show more decimals the
      // smaller it gets, all the way down to the slider's floor.
      let text;
      if (mult >= 10) text = String(Math.round(mult));
      else if (mult >= 1) text = mult.toFixed(1);
      else if (mult >= 0.1) text = mult.toFixed(2);
      else if (mult >= 0.01) text = mult.toFixed(3);
      else if (mult >= 0.001) text = mult.toFixed(4);
      else text = mult.toFixed(5);
      speedValue.textContent = text + '×';
    }
    speedSlider.addEventListener('input', updateSpeedLabel);
    updateSpeedLabel();

    const btnLayers = document.getElementById('btn-layers');
    const layersPanel = document.getElementById('layers-panel');
    btnLayers.addEventListener('click', function (e) {
      e.stopPropagation();
      layersPanel.classList.toggle('open');
    });
    layersPanel.addEventListener('click', function (e) { e.stopPropagation(); });

    // ---- Tools panel: jump to date / save frame / link ----
    const btnTools = document.getElementById('btn-tools');
    const toolsPanel = document.getElementById('tools-panel');
    const toolsMsg = document.getElementById('tools-msg');
    btnTools.addEventListener('click', function (e) {
      e.stopPropagation();
      toolsPanel.classList.toggle('open');
    });
    toolsPanel.addEventListener('click', function (e) { e.stopPropagation(); });

    // Close both panels with click/tap anywhere on screen
    // iOS Safari doesn't fire 'click' on non-interactive elements — use touchend too
    function closePanels() {
      layersPanel.classList.remove('open');
      toolsPanel.classList.remove('open');
    }
    document.addEventListener('click', closePanels);
    document.addEventListener('touchend', function(e) {
      // only close if the touch ended outside both panels and their buttons
      var target = e.target;
      if (!layersPanel.contains(target) && target !== btnLayers &&
          !toolsPanel.contains(target) && target !== btnTools) {
        closePanels();
      }
    }, { passive: true });

    // Fix date input in tools panel: open picker without segment selection (desktop only)
    var jumpDateInput = document.getElementById('jump-date');
    if (jumpDateInput && !isIOS) {
      var jumpWrap = document.createElement('div');
      jumpWrap.style.cssText = 'position:relative;flex:1;';
      jumpDateInput.parentNode.insertBefore(jumpWrap, jumpDateInput);
      jumpWrap.appendChild(jumpDateInput);
      var jumpOverlay = document.createElement('div');
      jumpOverlay.style.cssText = 'position:absolute;inset:0;cursor:pointer;z-index:2;';
      jumpWrap.appendChild(jumpOverlay);
      jumpOverlay.addEventListener('click', function (e) {
        e.stopPropagation();
        try { jumpDateInput.showPicker(); } catch(err) { jumpDateInput.focus(); }
      });
    }

    document.getElementById('btn-jump').addEventListener('click', function () {
      const val = document.getElementById('jump-date').value;
      if (!val) { toolsMsg.textContent = 'Pick a date first.'; return; }
      const target = new Date(val + 'T00:00:00Z');
      const days = (target.getTime() - startDate.getTime()) / 86400000;
      if (days < 0 || days > totalDays) {
        toolsMsg.textContent = 'Outside the current range (' + startDate.toISOString().slice(0, 10) + ' → ' + endDate.toISOString().slice(0, 10) + ').';
        return;
      }
      // Pause and freeze planets at the selected date
      state.paused = true;
      btnPlay.textContent = 'Play';
      state.currentDay = days;
      advanceAndRender(0);
      toolsMsg.textContent = 'Paused at ' + val + '. Press Reset to resume from the start.';
    });

    document.getElementById('btn-save-image').addEventListener('click', function () {
      try {
        renderer.render(scene, camera); // ensure fresh frame before saving
        const url = renderer.domElement.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = 'solar-system-' + Math.round(state.currentDay + startOffsetDays) + '.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toolsMsg.textContent = 'Image saved.';
      } catch (err) {
        toolsMsg.textContent = 'Could not save image.';
      }
    });

    document.getElementById('btn-copy-link').addEventListener('click', function () {
      const url = new URL(location.href);
      url.search = '';
      url.searchParams.set('start', startDate.toISOString().slice(0, 10));
      url.searchParams.set('end', endDate.toISOString().slice(0, 10));
      const link = url.toString();
      const done = function () { toolsMsg.textContent = 'Link copied — opens with these dates pre-filled.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(done).catch(function () { toolsMsg.textContent = link; });
      } else {
        toolsMsg.textContent = link;
      }
    });

    document.getElementById('chk-trails').addEventListener('change', function (e) {
      state.showTrails = e.target.checked;
      if (!state.showTrails) Object.keys(trailLines).forEach(function (n) { trailLines[n].visible = false; });
    });
    document.getElementById('chk-belt').addEventListener('change', function (e) {
      state.showBelt = e.target.checked;
      beltGroup.visible = state.showBelt;
    });
    document.getElementById('chk-moons').addEventListener('change', function (e) {
      state.showMoons = e.target.checked;
      Object.keys(moonMeshes).forEach(function (n) {
        moonMeshes[n].visible = e.target.checked;
        moonLabels[n].visible = e.target.checked && state.showLabels;
      });
      rebuildLegend();
      advanceAndRender(0); // calculate position immediately even if simulation is paused
    });
    document.getElementById('chk-stars').addEventListener('change', function (e) {
      state.showStars = e.target.checked;
      starGroup.visible = state.showStars;
    });
    document.getElementById('chk-labels').addEventListener('change', function (e) {
      state.showLabels = e.target.checked;
      Object.keys(moonLabels).forEach(function (n) {
        moonLabels[n].visible = e.target.checked && state.showMoons;
      });
      Object.keys(realAsteroidLabels).forEach(function (n) {
        realAsteroidLabels[n].visible = e.target.checked && state.showRealAsteroids;
      });
      advanceAndRender(0); // also updates visibility of mission labels
    });
    document.getElementById('chk-minor').addEventListener('change', function (e) {
      state.showMinor = e.target.checked;
      minorBodyGroup.visible = e.target.checked;
      rebuildLegend();
      advanceAndRender(0); // calculate position immediately even if simulation is paused
    });
    document.getElementById('chk-comet').addEventListener('change', function (e) {
      state.showComet = e.target.checked;
      cometGroup.visible = e.target.checked;
      rebuildLegend();
      advanceAndRender(0); // calculate position immediately even if simulation is paused
    });
    document.getElementById('chk-missions').addEventListener('change', function (e) {
      state.showMissions = e.target.checked;
      missionGroup.visible = e.target.checked;
      advanceAndRender(0); // calculate position immediately even if simulation is paused
      rebuildLegend();
    });
    document.getElementById('chk-neows').addEventListener('change', function (e) {
      state.showRealAsteroids = e.target.checked;
      realAsteroidGroup.visible = e.target.checked;
      Object.keys(realAsteroidLabels).forEach(function (n) {
        realAsteroidLabels[n].visible = e.target.checked && state.showLabels;
      });
      advanceAndRender(0); // calculate position immediately even if simulation is paused
      rebuildLegend();
    });
    document.getElementById('chk-lowdetail').addEventListener('change', function (e) {
      state.lowDetail = e.target.checked;
      rebuildDetailLayers();
    });

    window.addEventListener('resize', function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      skyCamera.aspect = window.innerWidth / window.innerHeight;
      skyCamera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ======================================================================
    // 6. Main animation loop
    // ======================================================================
    let lastTime = performance.now();
    advanceAndRender(0); // initial frame

    function tick(now) {
      requestAnimationFrame(tick);
      const dtSeconds = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      sunMesh.rotation.y += dtSeconds * 0.03;

      if (!state.paused && state.currentDay < totalDays) {
        const deltaDays = baseDaysPerSecond * state.speedMultiplier * dtSeconds;
        // At very high speed (fast-forwarding millennia) one frame step
        // may exceed entire orbital periods — divide it into tiny
        // sub-steps so trail stays smooth at any speed.
        const maxChunkDays = Math.max(1, planetData.Mercury.T / 8);
        const chunks = Math.min(60, Math.max(1, Math.ceil(deltaDays / maxChunkDays)));
        const chunkSize = deltaDays / chunks;
        for (let c = 0; c < chunks && state.currentDay < totalDays; c++) {
          advanceAndRender(chunkSize);
        }
      }

      updateOrbitLines(state.currentDay);

      if (state.viewMode === 'sky') {
        updateSkyLookTween(dtSeconds);
        updateSkyFollow();
        updateSkyCamera();
        renderer.render(skyScene, skyCamera);
      } else {
        updateCameraFollow(dtSeconds);
        updateReturnFlight(dtSeconds);
        controls.update();
        renderer.render(scene, camera);
      }
    }
    requestAnimationFrame(tick);
  }
})();
