export const scale = {
  190: { 3: -10, 2: -5, 1: -2 },
  185: { 3: -8, 2: -4, 1: -1 },
  180: { 3: -6, 2: -3, 1: -1 },
  175: { 3: -4, 2: -2, 1: 0 },
  170: { 3: -2, 2: -1, 1: 0 },
  165: { 3: 0, 2: 0, 1: 0 },
};

// [soft, neutral, firm] - index in array
export const circuits = {
  // rookie
  1: {
    ae: { ride: 5, wing: 2, suspension: 1, pit: 21 }, // AbuDhabi
    at: { ride: 4, wing: 1, suspension: 2, pit: 26 }, // Austria
    au: { ride: 8, wing: 4, suspension: 1, pit: 24 }, // Australia
    az: { ride: 7, wing: 2, suspension: 1, pit: 17 }, // Azerbaijan
    be: { ride: 5, wing: 4, suspension: 1, pit: 14 }, // Belgium
    bh: { ride: 3, wing: 1, suspension: 2, pit: 23 }, // Bahrain
    br: { ride: 3, wing: 3, suspension: 1, pit: 19 }, // Brazil
    ca: { ride: 4, wing: 1, suspension: 2, pit: 16 }, // Canada
    cn: { ride: 2, wing: 3, suspension: 1, pit: 27 }, // China
    de: { ride: 3, wing: 3, suspension: 1, pit: 18 }, // Germany
    es: { ride: 2, wing: 5, suspension: 0, pit: 25 }, // Spain
    eu: { ride: 5, wing: 5, suspension: 0, pit: 17 }, // Europe
    fr: { ride: 7, wing: 3, suspension: 1, pit: 21 }, // France
    gb: { ride: 4, wing: 2, suspension: 2, pit: 23 }, // Great Britain
    hu: { ride: 4, wing: 6, suspension: 0, pit: 16 }, // Hungary
    it: { ride: 5, wing: 1, suspension: 2, pit: 23 }, // Italy
    jp: { ride: 5, wing: 5, suspension: 0, pit: 21 }, // Japan
    mc: { ride: 9, wing: 8, suspension: 0, pit: 16 }, // Monaco
    mx: { ride: 3, wing: 3, suspension: 1, pit: 22 }, // Mexico
    my: { ride: 5, wing: 2, suspension: 1, pit: 18 }, // Malaysia
    ru: { ride: 2, wing: 3, suspension: 1, pit: 21 }, // Russia
    sg: { ride: 7, wing: 7, suspension: 0, pit: 18 }, // Singapore
    tr: { ride: 5, wing: 3, suspension: 1, pit: 18 }, // Turkey
    us: { ride: 1, wing: 2, suspension: 1, pit: 17 }, // USA
  },
  // pro
  2: {
    ae: { ride: 14, wing: 5, suspension: 1, pit: 21 }, // AbuDhabi
    at: { ride: 10, wing: 3, suspension: 2, pit: 26 }, // Austria
    au: { ride: 20, wing: 10, suspension: 1, pit: 24 }, // Australia
    az: { ride: 18, wing: 5, suspension: 1, pit: 17 }, // Azerbaijan
    be: { ride: 13, wing: 9, suspension: 1, pit: 14 }, // Belgium
    bh: { ride: 9, wing: 3, suspension: 2, pit: 23 }, // Bahrain
    br: { ride: 9, wing: 8, suspension: 1, pit: 19 }, // Brazil
    ca: { ride: 10, wing: 1, suspension: 2, pit: 16 }, // Canada
    cn: { ride: 6, wing: 8, suspension: 1, pit: 27 }, // China
    de: { ride: 9, wing: 8, suspension: 1, pit: 18 }, // Germany
    es: { ride: 6, wing: 13, suspension: 0, pit: 25 }, // Spain
    eu: { ride: 13, wing: 13, suspension: 0, pit: 17 }, // Europe
    fr: { ride: 18, wing: 8, suspension: 1, pit: 21 }, // France
    gb: { ride: 10, wing: 3, suspension: 2, pit: 23 }, // Great Britain
    hu: { ride: 11, wing: 15, suspension: 0, pit: 16 }, // Hungary
    it: { ride: 13, wing: 1, suspension: 2, pit: 23 }, // Italy
    jp: { ride: 13, wing: 13, suspension: 0, pit: 21 }, // Japan
    mc: { ride: 23, wing: 20, suspension: 0, pit: 16 }, // Monaco
    mx: { ride: 8, wing: 8, suspension: 1, pit: 22 }, // Mexico
    my: { ride: 13, wing: 5, suspension: 1, pit: 18 }, // Malaysia
    ru: { ride: 5, wing: 8, suspension: 1, pit: 21 }, // Russia
    sg: { ride: 18, wing: 16, suspension: 0, pit: 18 }, // Singapore
    tr: { ride: 14, wing: 8, suspension: 1, pit: 18 }, // Turkey
    us: { ride: 5, wing: 6, suspension: 1, pit: 17 }, // USA
  },
  // elite
  3: {
    ae: { ride: 27, wing: 10, suspension: 1, pit: 21 }, // AbuDhabi
    at: { ride: 20, wing: 5, suspension: 2, pit: 26 }, // Austria
    au: { ride: 40, wing: 20, suspension: 1, pit: 24 }, // Australia
    az: { ride: 35, wing: 10, suspension: 1, pit: 17 }, // Azerbaijan
    be: { ride: 25, wing: 17, suspension: 1, pit: 14 }, // Belgium
    bh: { ride: 17, wing: 5, suspension: 2, pit: 23 }, // Bahrain
    br: { ride: 17, wing: 15, suspension: 1, pit: 19 }, // Brazil
    ca: { ride: 20, wing: 1, suspension: 2, pit: 16 }, // Canada
    cn: { ride: 12, wing: 15, suspension: 1, pit: 27 }, // China
    de: { ride: 17, wing: 15, suspension: 1, pit: 18 }, // Germany
    es: { ride: 12, wing: 25, suspension: 0, pit: 25 }, // Spain
    eu: { ride: 25, wing: 25, suspension: 0, pit: 17 }, // Europe
    fr: { ride: 35, wing: 15, suspension: 1, pit: 21 }, // France
    gb: { ride: 20, wing: 5, suspension: 2, pit: 23 }, // Great Britain
    hu: { ride: 22, wing: 30, suspension: 0, pit: 16 }, // Hungary
    it: { ride: 25, wing: 1, suspension: 2, pit: 23 }, // Italy
    jp: { ride: 25, wing: 25, suspension: 0, pit: 21 }, // Japan
    mc: { ride: 45, wing: 40, suspension: 0, pit: 16 }, // Monaco
    mx: { ride: 15, wing: 15, suspension: 1, pit: 22 }, // Mexico
    my: { ride: 25, wing: 10, suspension: 1, pit: 18 }, // Malaysia
    ru: { ride: 10, wing: 15, suspension: 1, pit: 21 }, // Russia
    sg: { ride: 35, wing: 32, suspension: 0, pit: 18 }, // Singapore
    tr: { ride: 27, wing: 15, suspension: 1, pit: 18 }, // Turkey
    us: { ride: 10, wing: 12, suspension: 1, pit: 17 }, // USA
  }
};
