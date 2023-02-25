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
  '/app/p=staff&tab=staff': {
    key: 'staff',
    scripts: ['staff.js']
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

export {
  scriptDefaults,
  tabScripts
};
