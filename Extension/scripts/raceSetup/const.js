export const scale = {
  190: { 3: -8, 2: -4, 1: -2 },
  185: { 3: -6, 2: -3, 1: -1 },
  180: { 3: -4, 2: -2, 1: -1 },
  175: { 3: -2, 2: -1, 1: 0 },
  170: { 3: 0, 2: 0, 1: 0 },
  165: { 3: 2, 2: 1, 1: 0 },
};

// [soft, neutral, firm] - index in array
export const circuits = {
  // rookie
  1: {
    ae: { ride: 6, wing: 1, suspension: 12, pit: 23 }, // AbuDhabi
    at: { ride: 4, wing: 0, suspension: 14, pit: 27 }, // Austria
    au: { ride: 9, wing: 4, suspension: 8, pit: 24 }, // Australia
    az: { ride: 8, wing: 1, suspension: 12, pit: 17 }, // Azerbaijan
    be: { ride: 6, wing: 3, suspension: 9, pit: 15 }, // Belgium
    bh: { ride: 4, wing: 0, suspension: 14, pit: 23 }, // Bahrain
    br: { ride: 4, wing: 2, suspension: 10, pit: 21 }, // Brazil
    ca: { ride: 4, wing: -1, suspension: 16, pit: 17 }, // Canada
    cn: { ride: 2, wing: 2, suspension: 10, pit: 26 }, // China
    de: { ride: 4, wing: 2, suspension: 10, pit: 17 }, // Germany
    es: { ride: 2, wing: 5, suspension: -1, pit: 25 }, // Spain
    eu: { ride: 6, wing: 5, suspension: 6, pit: 17 }, // Europe
    fr: { ride: 8, wing: 2, suspension: -1, pit: 20 }, // France
    gb: { ride: 4, wing: 0, suspension: -1, pit: 23 }, // Great Britain
    hu: { ride: 5, wing: 6, suspension: 4, pit: 17 }, // Hungary
    it: { ride: 6, wing: -2, suspension: 18, pit: 24 }, // Italy
    jp: { ride: 6, wing: 5, suspension: 6, pit: 20 }, // Japan
    mc: { ride: 11, wing: 9, suspension: -1, pit: 16 }, // Monaco
    mx: { ride: 3, wing: 2, suspension: 10, pit: 19 }, // Mexico
    my: { ride: 6, wing: 1, suspension: -1, pit: 22 }, // Malaysia
    ru: { ride: 2, wing: 2, suspension: 10, pit: 21 }, // Russia
    sg: { ride: 8, wing: 7, suspension: 3, pit: 20 }, // Singapore
    tr: { ride: 6, wing: 2, suspension: 10, pit: 18 }, // Turkey
    us: { ride: 2, wing: 2, suspension: 11, pit: 16 }, // USA
     nl: { ride: -1, wing: -1, suspension: -1, pit: -1 }, // Netherlands
  },
  // pro
  2: {
    ae: { ride: 13, wing: 3, suspension: 30, pit: 23 }, // AbuDhabi
    at: { ride: 9, wing: 0, suspension: 35, pit: 27 }, // Austria
    au: { ride: 19, wing: 8, suspension: 20, pit: 24 }, // Australia
    az: { ride: 17, wing: 3, suspension: 30, pit: 17 }, // Azerbaijan
    be: { ride: 12, wing: 6, suspension: 23, pit: 15 }, // Belgium
    bh: { ride: 8, wing: 0, suspension: 35, pit: 23 }, // Bahrain
    br: { ride: 8, wing: 5, suspension: 25, pit: 21 }, // Brazil
    ca: { ride: 9, wing: -3, suspension: 40, pit: 17 }, // Canada
    cn: { ride: 5, wing: 5, suspension: 25, pit: 26 }, // China
    de: { ride: 8, wing: 5, suspension: 25, pit: 17 }, // Germany
    es: { ride: 5, wing: 10, suspension: 15, pit: 25 }, // Spain
    eu: { ride: 12, wing: 10, suspension: 15, pit: 17 }, // Europe
    fr: { ride: 17, wing: 5, suspension: 25, pit: 20 }, // France
    gb: { ride: 9, wing: 0, suspension: 35, pit: 23 }, // Great Britain
    hu: { ride: 10, wing: 13, suspension: 10, pit: 17 }, // Hungary
    it: { ride: 12, wing: -5, suspension: 45, pit: 24 }, // Italy
    jp: { ride: 12, wing: 10, suspension: 15, pit: 20 }, // Japan
    mc: { ride: 22, wing: 18, suspension: 1, pit: 16 }, // Monaco
    mx: { ride: 7, wing: 5, suspension: 25, pit: 19 }, // Mexico
    my: { ride: 12, wing: 3, suspension: 30, pit: 22 }, // Malaysia
    ru: { ride: 4, wing: 5, suspension: 25, pit: 21 }, // Russia
    sg: { ride: 17, wing: 14, suspension: 8, pit: 20 }, // Singapore
    tr: { ride: 13, wing: 5, suspension: 25, pit: 18 }, // Turkey
    us: { ride: 4, wing: 4, suspension: 28, pit: 16 }, // USA
     nl: { ride: -1, wing: -1, suspension: -1, pit: -1 } // Netherlands
  },
  // elite
  3: {
    ae: { ride: 25, wing: 5, suspension: 60, pit: 23 }, // AbuDhabi
    at: { ride: 18, wing: 0, suspension: 70, pit: 27 }, // Austria
    au: { ride: 38, wing: 15, suspension: 40, pit: 24 }, // Australia
    az: { ride: 33, wing: 5, suspension: 60, pit: 17 }, // Azerbaijan
    be: { ride: 23, wing: 12, suspension: 45, pit: 15 }, // Belgium
    bh: { ride: 15, wing: 0, suspension: 70, pit: 23 }, // Bahrain
    br: { ride: 15, wing: 10, suspension: 50, pit: 21 }, // Brazil
    ca: { ride: 18, wing: -5, suspension: 80, pit: 17 }, // Canada
    cn: { ride: 10, wing: 10, suspension: 50, pit: 26 }, // China
    de: { ride: 15, wing: 10, suspension: 50, pit: 17 }, // Germany
    es: { ride: 10, wing: 20, suspension: 30, pit: 25 }, // Spain
    eu: { ride: 23, wing: 20, suspension: 30, pit: 17 }, // Europe
    fr: { ride: 33, wing: 10, suspension: 50, pit: 20 }, // France
    gb: { ride: 18, wing: 0, suspension: 70, pit: 23 }, // Great Britain
    hu: { ride: 20, wing: 25, suspension: 20, pit: 17 }, // Hungary
    it: { ride: 23, wing: -10, suspension: 90, pit: 24 }, // Italy
    jp: { ride: 23, wing: 20, suspension: 30, pit: 20 }, // Japan
    mc: { ride: 43, wing: 35, suspension: 1, pit: 16 }, // Monaco
    mx: { ride: 13, wing: 10, suspension: 50, pit: 19 }, // Mexico
    my: { ride: 23, wing: 5, suspension: 60, pit: 22 }, // Malaysia
    ru: { ride: 8, wing: 10, suspension: 50, pit: 21 }, // Russia
    sg: { ride: 33, wing: 27, suspension: 15, pit: 20 }, // Singapore
    tr: { ride: 25, wing: 10, suspension: 50, pit: 18 }, // Turkey
    us: { ride: 8, wing: 7, suspension: 55, pit: 16 }, // USA
    nl: { ride: -1, wing: -1, suspension: -1, pit: -1 } // Netherlands
  }
};
