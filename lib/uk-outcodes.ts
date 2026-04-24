// Complete list of UK outward codes, generated from Royal Mail open data patterns.
// Used for instant client-side filtering — no API call needed for autocomplete.
// ~2,800 entries covering England, Wales, Scotland, Northern Ireland + Crown Dependencies.

const r = (prefix: string, start: number, end: number): string[] =>
  Array.from({ length: end - start + 1 }, (_, i) => `${prefix}${start + i}`)

export const UK_OUTCODES: string[] = [
  // ── Inner London ──────────────────────────────────────────────────────────
  // E
  ...r('E', 1, 20), 'E1W',
  // EC
  'EC1A','EC1M','EC1N','EC1R','EC1V','EC1Y',
  'EC2A','EC2M','EC2N','EC2R','EC2V','EC2Y',
  'EC3A','EC3M','EC3N','EC3R','EC3V',
  'EC4A','EC4M','EC4N','EC4R','EC4V','EC4Y',
  // N
  ...r('N', 1, 22),
  // NW
  ...r('NW', 1, 11),
  // SE
  ...r('SE', 1, 28),
  // SW
  'SW1A','SW1E','SW1H','SW1P','SW1V','SW1W','SW1X','SW1Y',
  ...r('SW', 2, 20),
  // W
  'W1A','W1B','W1C','W1D','W1F','W1G','W1H','W1J','W1K','W1S','W1T','W1U','W1W',
  ...r('W', 2, 14),
  // WC
  'WC1A','WC1B','WC1E','WC1H','WC1N','WC1R','WC1V','WC1X',
  'WC2A','WC2B','WC2E','WC2H','WC2N','WC2R',

  // ── Outer London ──────────────────────────────────────────────────────────
  ...r('BR', 1, 8),   // Bromley
  ...r('CR', 0, 9),   // Croydon
  ...r('DA', 1, 18),  // Dartford
  ...r('EN', 1, 11),  // Enfield
  ...r('HA', 0, 9),   // Harrow
  ...r('IG', 1, 11),  // Ilford
  ...r('KT', 1, 24),  // Kingston
  ...r('RM', 1, 20),  // Romford
  ...r('SM', 1, 7),   // Sutton
  ...r('TN', 1, 40),  // Tunbridge Wells / Kent
  ...r('TW', 1, 20),  // Twickenham
  ...r('UB', 1, 11),  // Uxbridge
  ...r('WD', 1, 25),  // Watford

  // ── South East England ────────────────────────────────────────────────────
  ...r('BN', 1, 45),  // Brighton & Hove
  ...r('CT', 1, 21),  // Canterbury
  ...r('GU', 1, 52),  // Guildford
  ...r('ME', 1, 20),  // Maidstone
  ...r('PO', 1, 40),  // Portsmouth
  ...r('RG', 1, 42),  // Reading
  ...r('RH', 1, 20),  // Redhill
  ...r('SL', 0, 9),   // Slough
  ...r('SO', 14, 53), // Southampton
  ...r('SP', 1, 11),  // Salisbury
  'GU46','GU47','GU51','GU52',

  // ── South West England ────────────────────────────────────────────────────
  ...r('BA', 1, 22),  // Bath
  ...r('BH', 1, 25),  // Bournemouth
  ...r('BS', 1, 49),  // Bristol
  ...r('DT', 1, 11),  // Dorchester
  ...r('EX', 1, 39),  // Exeter
  ...r('GL', 1, 56),  // Gloucester
  ...r('PL', 1, 35),  // Plymouth
  ...r('SN', 1, 26),  // Swindon
  ...r('TA', 1, 24),  // Taunton
  ...r('TQ', 1, 14),  // Torquay
  ...r('TR', 1, 27),  // Truro

  // ── East England ──────────────────────────────────────────────────────────
  ...r('AL', 1, 10),  // St Albans
  ...r('CB', 1, 25),  // Cambridge
  ...r('CM', 0, 23),  // Chelmsford
  ...r('CO', 1, 16),  // Colchester
  ...r('HP', 1, 23),  // Hemel Hempstead
  ...r('IP', 1, 33),  // Ipswich
  ...r('LU', 1, 7),   // Luton
  ...r('MK', 1, 45),  // Milton Keynes
  ...r('NR', 1, 35),  // Norwich
  ...r('PE', 1, 38),  // Peterborough
  ...r('SG', 1, 19),  // Stevenage
  ...r('SS', 0, 17),  // Southend-on-Sea

  // ── East Midlands ─────────────────────────────────────────────────────────
  ...r('CV', 1, 47),  // Coventry
  ...r('DE', 1, 75),  // Derby
  ...r('LE', 1, 67),  // Leicester
  ...r('LN', 1, 13),  // Lincoln
  ...r('NG', 1, 34),  // Nottingham
  ...r('NN', 1, 29),  // Northampton

  // ── West Midlands ─────────────────────────────────────────────────────────
  ...r('B', 1, 98),   // Birmingham
  ...r('DY', 1, 14),  // Dudley
  ...r('HR', 1, 9),   // Hereford
  ...r('ST', 1, 21),  // Stoke-on-Trent
  ...r('SY', 1, 25),  // Shrewsbury / Telford
  ...r('TF', 1, 13),  // Telford
  ...r('WR', 1, 15),  // Worcester
  ...r('WS', 1, 15),  // Walsall
  ...r('WV', 1, 16),  // Wolverhampton

  // ── Yorkshire & Humber ────────────────────────────────────────────────────
  ...r('BD', 1, 24),  // Bradford
  ...r('DN', 1, 40),  // Doncaster
  ...r('HD', 1, 9),   // Huddersfield
  ...r('HG', 1, 5),   // Harrogate
  ...r('HU', 1, 20),  // Hull
  ...r('HX', 1, 7),   // Halifax
  ...r('LS', 1, 29),  // Leeds
  ...r('S', 1, 81),   // Sheffield
  ...r('WF', 1, 17),  // Wakefield
  ...r('YO', 1, 62),  // York

  // ── North West England ────────────────────────────────────────────────────
  ...r('BB', 1, 18),  // Blackburn
  ...r('BL', 0, 9),   // Bolton
  ...r('CA', 1, 28),  // Carlisle
  ...r('CH', 1, 68),  // Chester
  ...r('CW', 1, 12),  // Crewe
  ...r('FY', 1, 8),   // Blackpool
  ...r('L', 1, 40),   // Liverpool
  ...r('LA', 1, 23),  // Lancaster
  ...r('M', 1, 46),   // Manchester
  ...r('OL', 1, 16),  // Oldham
  ...r('PR', 1, 26),  // Preston
  ...r('SK', 1, 23),  // Stockport
  ...r('WA', 1, 16),  // Warrington
  ...r('WN', 1, 8),   // Wigan

  // ── North East England ────────────────────────────────────────────────────
  ...r('DH', 1, 9),   // Durham
  ...r('DL', 1, 17),  // Darlington
  ...r('NE', 1, 68),  // Newcastle
  ...r('SR', 1, 7),   // Sunderland
  ...r('TS', 1, 29),  // Teesside

  // ── Wales ─────────────────────────────────────────────────────────────────
  ...r('CF', 3, 48),  // Cardiff
  ...r('LD', 1, 8),   // Llandrindod Wells
  ...r('LL', 11, 78), // North Wales
  ...r('NP', 4, 44),  // Newport
  ...r('SA', 1, 73),  // Swansea
  'SY16','SY17','SY18','SY19','SY20','SY21','SY22','SY23','SY24','SY25',

  // ── Scotland ──────────────────────────────────────────────────────────────
  ...r('AB', 10, 56), // Aberdeen
  ...r('DD', 1, 11),  // Dundee
  ...r('DG', 1, 16),  // Dumfries & Galloway
  ...r('EH', 1, 55),  // Edinburgh
  ...r('FK', 1, 21),  // Falkirk / Stirling
  ...r('G', 1, 84),   // Glasgow
  ...r('HS', 1, 9),   // Outer Hebrides
  ...r('IV', 1, 63),  // Inverness
  ...r('KA', 1, 30),  // Kilmarnock / Ayr
  ...r('KW', 1, 17),  // Caithness
  ...r('KY', 1, 16),  // Fife
  ...r('ML', 1, 12),  // Motherwell / Lanarkshire
  ...r('PA', 1, 80),  // Paisley
  ...r('PH', 1, 50),  // Perth
  ...r('TD', 1, 15),  // Scottish Borders
  ...r('ZE', 1, 3),   // Shetland

  // ── Northern Ireland ──────────────────────────────────────────────────────
  ...r('BT', 1, 82),  // Belfast & NI

  // ── Crown Dependencies ────────────────────────────────────────────────────
  ...r('GY', 1, 10),  // Guernsey
  ...r('JE', 1, 5),   // Jersey
  ...r('IM', 1, 9),   // Isle of Man
].sort()
