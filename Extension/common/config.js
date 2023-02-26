/** Default state of custom scripts allowed for the app */
const scriptDefaults = {
  hq: true,
  league: true,
  market: true,
  overview: true,
  reports: true,
  research: true,
  setup: true,
  staff: true,
  strategy: true,
  review: true,
  refresh: true,
  marketDriver: true,
  train: true,
  edit: false,
  slider: true,
  editS: false,
  sliderS: true
};

/**
 * The link between app pages and related extension scripts
 *
 * @type {{ [pathname: string]: { key?: string, scripts: string[], styles?: string[] } }}
 */
const tabScripts = {
  '/app/p=training': {
    key: 'train',
    scripts: ['training.js'],
    styles: ['common.css']
  },
  '/app/d=research': {
    key: 'research',
    scripts: ['research.js'], // TODO dynamically import localization!
    styles: ['researchStyle.css']
  },
  '/app/p=cars': {
    key: 'research',
    scripts: ['overview.js']
  },
  '/app/p=home': {
    key: 'review',
    scripts: ['home.js']
  },
  '/app/&tab=news': {
    key: 'review',
    scripts: ['home.js']
  },
  '/app/p=login&tab=news': {
    key: 'review',
    scripts: ['home.js']
  },
  '/app/p=race&tab=setup': {
    key: 'setup',
    scripts: ['setups.js'],
    styles: ['style.css']
  },
  '/app/p=transfers&tab=drivers': {
    key: 'marketDriver',
    scripts: ['driverMarket.js']
  },
  '/app/p=race&tab=race': {
    key: 'overview',
    scripts: ['highcharts.js', 'race.js']
  },
  '/app/p=transfers&tab=staff': {
    key: 'market',
    scripts: ['staffMarket.js']
  },
  '/app/p=headquarters': {
    key: 'hq',
    scripts: ['headquarters.js']
  },
  '/app/p=race&tab=strategy': {
    key: 'strategy',
    scripts: ['strategy.js'],
    styles: ['style.css']
  },
  '/app/p=league&id=': {
    key: 'league',
    scripts: ['league.js']
  },
  '/app/d=result&id=': {
    key: 'reports',
    scripts: ['reports.js', 'purify.js'] // TODO dynamically import localization!
  },
  // main Staff page
  '/app/p=staff&tab=staff': {
    key: 'staff',
    scripts: ['staff/staff.js'],
    styles: ['common.css']
  },
  // dialog to change active Chief Designer
  '/app/d=change&eType=2&sType=design': {
    key: 'staff',
    scripts: ['staff/changeDesigner.js']
  },
  '/app/d=teamSettings': {
    scripts: ['team_settings.js']
  },
  '/app/d=resultDetail&id=': {
    scripts: ['raceResult.js']
  },
  '/app/': {
    key: 'refresh',
    scripts: ['timerAlert.js']
  }
};

const icons = {
  'ios-timer':
    'data:image/png;base64,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',
  'igp-brake':
    'data:image/png;base64,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',
  'igp-thermometer':
    'data:image/png;base64,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',
  'md-arrow-down':
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAAA6lBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////GXwpbAAAATHRSTlMABQcICQwNDhESExQYGRobHB4gITo9QUJDREdIS0xNTk9QUVJYZWtuc3t/j7S2t7nBwsPExcvMzc7P0NbX2Nna3d/g4fX29/j5+vz+zHWGowAAAAFiS0dETYBoIGUAAAHlSURBVHja7djXVsJAFIXhKIoCKopiRSzYe8XeCxM97/88YoHAmdRJZrJw7X2Vu/9bXLCSY1kYhmEYhmEY1rsr19srpwKoUntVAAAAAAAAAAAAAAAAAAAAAAAAAID/CpjqSwJQ2lHt1+y9/viAiUfaVe0T7WfiApp9om3Vvq8gFOCnT7Sl2ic6yMQB/PXpc121T3Q4oA5o9Yk+1lT73oJggNMnsquqfaKjQTVAZ59IzEcAVBoULAgCdPfpddpSFxxnowNi9SXBSTYqIGZfEpxmowF4fyb6HwETnA1FASTQlwTnw+EBifQlQT0XFpBQXxJc5MIBEutLgst8GADvz8Z5JWGCq3wwING+LCgEAVj/LWZfElwX/AG8Pxf/xZAJbkb8ABr6kuB21Bugpe8pkAGa+pLgbswdwPqNSnIfCExwX3QDaOxLgoeiDNDalwXjHKC5LwmeSt0A3l9M/kORCZ4nOwGsLzT0JcHLpvO8YaLPX9bJdn1s7n1B10WA/QYeExrPFWEEQuu5JFggNJ9rggRC+7nIXyAMnKv8BGLJxHXMW2Cm7y0w1fcSmOu7C0z23QRi2eydlgtM97nAfL9bIFbSuJY7AjuVviNIq98SpNf/FaTZ/xbYq1aqq9UsDMMwDMMwDOvxfQHEPjpcMsqquQAAAABJRU5ErkJggg==',
  'igp-fuel':
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAABj1BMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/////JqWyAAAAg3RSTlMAAQIDBQYHCAkKDQ8QExQWFxkaHR4iIyQlJigqLC03ODo7PD4/QEJGSEtMTVJVV1hZXF1fYGFjbXFyeIGEhYaHiImLjI2PkJKTlJWXmJmdnqGsra6vsLGytLe4vsLExcbHyMrMz9XW19jZ2tzd3uDh4uTs7e7w8vP09fb3+Pn6+/z9/h6CTusAAAABYktHRIRi0FpxAAACWklEQVR42u3ZSVNTQRSG4RPEkYCCEyrihKJgBBHHCMZZFDGAGgecZ0QEVCJqIsn7x12YBBxKb7q76iw43+4u+n5Puqs7XYmIxWKxWCz/zZ7B15+JntzUaE9twPqmu1Sf8b3B+rdN45L8kUD99RO4JV+agxWr/QADuGa8VkTk6Nx8yqd/Xd4ZwGERWTkHJD0Ax9z7GRWRNfMApzVWACZFRFIAnHEGDFde9/FZtLxdOA9ERCQJwFlXQKb8tvTyqEMOFctjfj73AXDeF9AYfcyTXwGlVbgY8wP4jOkHYDCmBijNwfUaNUDsMgCX1AASuwpQ3KoGkLYCQIcaYPcsAJ1agFK/GqDcrwWo9CsBFvp1AIv6VQAti+/TGoAbKAMyBjDAkgcMawOuaAN6tQH135QBckEbUPdKGSCb3wUBbIw+5vlv6IaREIAHGyKOWHaCP2atdeBF1hdAcXIiUrLw12XzBjjEAAYwgAEMYAADGMAABjCAAdQB8PXluUZVAJA9qAzge7sygKlVWoBEovcpQJfiLqibAa5pbsN7wE1NQAbIGEAbcEdEanz/O3YFpIFPTSLdADsVACcBplNDOSAfVwCsX/Rj9YhofB0nK4+zW1QANely/34RnQtJzxsgP+Ly+UPdiJr37YqLKAI8stQBDa2PfQBtzV7tsa6HBd/b2Pu+uHP/2jFCZKbdtX+CMJlPuM3/GKHyZbsLoJtwue8CeBQQQIvD/iuEBJyqHrAjZD9D1QMOBAXcrh7QGRSQMYABqgd0aO+CTUEPon6Ho/j4h2D1uVt1YrFYLBbLv/IDGZamfbAGWYsAAAAASUVORK5CYII=',
  'steering-wheel':
    'data:image/png;base64,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',
  'ios-build':
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAABmJLR0QA/wD/AP+gvaeTAAAGaUlEQVR4nO3daYhVZRzH8e8dzdHUcInRJigstMV2U6JFLWkTQaleVFRChAlRpJWlRUTRizIqWhAJwqIExSSKijTbyEqzMslEzci0zUxDHXNGnenFX1GnmTvnnvOc/zl3zu8Dzxu9c57lf/bzLCAiIiIiIiIiIiIiIjGUgIFA96wL0pFS1gXoJPoDVwOjgBHAEA4FfzuwEvgImA+szaKAEl4NMAF4D2gCWiKkZuB9YHgG5ZVASsANwHqiBb2ttB94DujqXHZJ6AxgGfED3zpN8S2+xFUC7gH2EC74LdhZQHKuBzCXsIFvAXZhZxTJsaOBxYQPfgNwqWM9JIZuwBLSOfJHOdZDYpqNjvzCmoaO/MI6B2hER34h1QKrUPALazrhT/sjXWsgsfUFtqEjv7CeRMEvrJ7ADhT8wppImODvRtf8qvQxYXaA15zLLQEMwDpqhNgBPnQue2I1WRcgBy4kXNe4swNtx412ALgg4Lb6AccH3F45dwPfAy9hXy0lpk8I+/JnrEOZJ3PkZesZhzw7rV8JuwM8kHJ5J/H/e5a9VOHlJy+i9uiNmuamWNY7af+GdUGK+XZaNYQNfgt2XU5D69N+69QI1KWUd6dVQ7hHwMNPx7WByzklYjlvD5xvIWwn/Fng3IDlm1pBvi8HzLcw1hB+B5gYqGz3VZjvikoz0HsA2wFCOyvANu7FvlBW4phKM9EOYAM3QxtJsradAcyM8XcaahbDRYS/BLRgZ5Y52JF8BdHfED6UIM+q+xaRB12BraSzE7RO27A3jy9ij3UXA30OK8vDCbc/K1irFMzz+OwA7aVfgB8CbGdi6IYpivPJdgcIlQaFbpgi2Uj2AUySvo1TaT0FHLIu6wIkNC/rAlS7H8n+KI6b9mA9mySmUWQfxCRpdvgmKY6Tgc1kH8S4aRdQH7xVCmIo8BvZBzFJmhG8VQpiGPAX2QcwSfoaOCp0wxTBaMKNBMoqbQMGB26XQhiHjeDJOoBJUhMwJnTDFMH1hO8DmEXwrwndMEUwCZuhM+sAJkn/AuNDN0wRlOtNWy1pJ3B56IYpgvvJPnhJ02o0qWTFSmT/mTdpagKeogrWHcibrsArZB/AJOld4PTQDVMEtcBC0g/QGuAJbBLpeYR5umjEFpUYFrxVCqInsIj0gz8T6NIq73rgMSr/rtCALSIxGRtd7KozLRnTB3gHG++fpqexo749JeBM4BLgNOAkbPh2L2wQyk5gE3YGWQ0sx458SaAO6xGT9pE/h8510HQKx2EDMtMO/kLU7z53BgEbSD/4iwg/4FMSGkr4yR3aSkuxm0vJkeH4DOZYyZEDNyQHRuPzLX8t6miZO+OwL2JpB38jcIJTnSSiG/H5lv8ncIpTnSSiyfh8y9+K3VxKjnh9zt2B1vTNnUfwCf5u7OZScqIEPItP8Juwm0vJiS7YO3eP4O/HOopKTtQCb+AT/GY0r16ueH3LP5im+VRLougLfI5f8B/1qZZEMQB75+4V/Bd8qiVRnIjNzOEV/FfRrCi5cSo2O5ZX8N9EHTpy4zxgC37B/wD1rc+NEcDf+AX/C6xDpuTAZVivWK/gf0cGXa2lbePx+ZZ/MK0DBrrUTDp0E7aShlfwN2FPGJIDd+A7Ln8L9oQhOeA9NPsfwi7XIjGVsGHNnsFvwKZfl4x1wZYz9Qx+I3CVR+WkvG7YUGnP4O8DrvOonJRXi71u9Qx+M3CrR+WkvF7Y61bP4LdgCypKxvoBX+If/OkelZPyBgKr8A++lkvPgXrgJ/yDPwtN0pC53vjMyNE6vY46dOTCLPyD/xaaGj0XBuM/4fIS1KEjFXG6SN1Cx0fiYmABtpjRGOBm4l+3lwETDmxLcuAbyh+tbXW5nkC8yZpXoQ4duVOuU8cG2j+rVPqWcD3q0JG6Su+oe1P+Wrwcezffls8qyGczNjX6HxX8jcRQ6Q5wsFdPe/qW+b/+EfPYClwJ/Bzx9+Ks3OxcDbS9gHEPog0AUYeOKrCY8kFcAQw57PfHYk8EHQVfHTqqxF10HMy92Jp2S7GVLTv6fSN22pcqUEfYvv37gGtdayCJPU6Y4DcDtzmXXQLogV3rk+4A5ebdl5wbBPxO/OA/6F9kCa2eymf2aAamZlFYSUc3bPRPlKnbv0KPerkSsmdNd+zL31hskcO6A/++BbtfeBv4FDsDiIiIiIiIiIiIiIiIiIP/AGk3z8BmBB7cAAAAAElFTkSuQmCC',
  'igp-tyre':
    'data:image/png;base64,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'
};

export {
  icons,
  scriptDefaults,
  tabScripts
};
