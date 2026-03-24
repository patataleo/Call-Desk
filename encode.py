import base64, json

d = {
  'AILEEN':   {'p': 'rv@aileen2026!',   's': 'AILEEN'},
  'ANGELA':   {'p': 'rv@angela2026!',   's': 'ANGELA'},
  'ARABELLE': {'p': 'rv@arabelle2026!', 's': 'ARABELLE'},
  'ARIANNA':  {'p': 'rv@arianna2026!',  's': 'ARIANNA'},
  'ELAIZA':   {'p': 'rv@elaiza2026!',   's': 'ELAIZA'},
  'FRISCA':   {'p': 'rv@frisca2026!',   's': 'FRISCA'},
  'JELLYN':   {'p': 'rv@jellyn2026!',   's': 'JELLYN'},
  'LUISA':    {'p': 'rv@luisa2026!',    's': 'LUISA'},
  'REGINA':   {'p': 'rv@regina2026!',   's': 'REGINA'},
  'ROSELYN':  {'p': 'rv@roselyn2026!',  's': 'ROSELYN'},
  'SHANEL':   {'p': 'rv@shanel2026!',   's': 'SHANEL'},
  'SHERILYN': {'p': 'rv@sherilyn2026!', 's': 'SHERILYN'},
  'NERIZ': {'p': 'rv@neriz2026!', 's': 'NERIZ'},
}

print(base64.b64encode(json.dumps(d).encode()).decode())