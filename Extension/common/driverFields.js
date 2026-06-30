/**
 * common/driverFields.js
 *
 * Named constants for the positional indices of the comma-separated driver
 * data string that the game returns in `node.dataset.driver`.
 *
 * WHY THIS EXISTS
 * ───────────────
 * The game encodes driver attributes as a raw CSV string. Several scripts
 * (raceSetup/setups.js, driver/driverMarket.js, driver/driverHelpers.js)
 * parse it by numeric index. Magic numbers scattered across files made it
 * impossible to know which index mapped to which attribute, and a single
 * game-side format change would silently break multiple scripts with no
 * indication of where to fix them.
 *
 * HOW TO UPDATE
 * ─────────────
 * If the game changes its driver data format, update the values here.
 * Every consumer automatically picks up the change.
 *
 * CURRENT FORMAT (verified against game output)
 * ─────────────────────────────────────────────
 * Index  Attribute
 *   0    driver id
 *   1    talent
 *   2    fast_corners
 *   3    slow_corners
 *   4    defending
 *   5    attacking
 *   6    composure
 *   7    experience
 *   8    focus
 *   9    morale
 *  10    knowledge
 *  11    stamina
 *  12    health
 *  13    height
 */
export const DRIVER_FIELD = Object.freeze({
  id:           0,
  talent:       1,
  fast_corners: 2,
  slow_corners: 3,
  defending:    4,
  attacking:    5,
  composure:    6,
  experience:   7,
  focus:        8,
  morale:       9,
  knowledge:    10,
  stamina:      11,
  health:       12,
  height:       13,
});

/**
 * The subset of skill fields used to calculate the wing modifier.
 * Order matters — it mirrors the original targetIndices array so the
 * weighted average is unchanged.
 */
export const WING_MODIFIER_FIELDS = [
  DRIVER_FIELD.composure,
  DRIVER_FIELD.stamina,
  DRIVER_FIELD.fast_corners,
  DRIVER_FIELD.slow_corners,
  DRIVER_FIELD.focus,
  DRIVER_FIELD.defending,
  DRIVER_FIELD.morale,
  DRIVER_FIELD.attacking,
  DRIVER_FIELD.knowledge,
];