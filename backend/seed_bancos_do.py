"""
Seed script for Dominican Republic banks.
Run: python seed_bancos_do.py

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
"""
import os
import sys

from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.", file=sys.stderr)
    sys.exit(1)

BANCOS_DO = [
    {"nombre": "Banco de Reservas (BanReservas)", "nombre_corto": "BanReservas", "codigo": "BANRESERVAS", "pais_codigo": "DO", "logo_url": "/banks/banreservas.svg", "activo": True},
    {"nombre": "Banco Popular Dominicano",        "nombre_corto": "Popular",     "codigo": "POPULAR",     "pais_codigo": "DO", "logo_url": "/banks/popular.svg",     "activo": True},
    {"nombre": "BHD León",                        "nombre_corto": "BHD León",    "codigo": "BHDLEON",     "pais_codigo": "DO", "logo_url": "/banks/bhdleon.svg",     "activo": True},
    {"nombre": "Scotiabank República Dominicana", "nombre_corto": "Scotiabank",  "codigo": "SCOTIABANK",  "pais_codigo": "DO", "logo_url": "/banks/scotiabank.svg",  "activo": True},
    {"nombre": "Banco Santa Cruz",                "nombre_corto": "Santa Cruz",  "codigo": "BSANTACRUZ",  "pais_codigo": "DO", "logo_url": "/banks/bsantacruz.svg",  "activo": True},
    {"nombre": "Banco BDI",                       "nombre_corto": "BDI",         "codigo": "BDI",         "pais_codigo": "DO", "logo_url": "/banks/bdi.svg",         "activo": True},
    {"nombre": "Banco Caribe",                    "nombre_corto": "Caribe",      "codigo": "BCARIBE",     "pais_codigo": "DO", "logo_url": "/banks/bcaribe.svg",     "activo": True},
    {"nombre": "Banco Vimenca",                   "nombre_corto": "Vimenca",     "codigo": "VIMENCA",     "pais_codigo": "DO", "logo_url": "/banks/vimenca.svg",     "activo": True},
    {"nombre": "Banco Ademi",                     "nombre_corto": "Ademi",       "codigo": "ADEMI",       "pais_codigo": "DO", "logo_url": "/banks/ademi.svg",       "activo": True},
    {"nombre": "Banco López de Haro",             "nombre_corto": "López de Haro","codigo": "LOPEZDEHARO","pais_codigo": "DO", "logo_url": "/banks/lopezdeharo.svg", "activo": True},
    {"nombre": "Asociación Popular de Ahorros y Préstamos", "nombre_corto": "Asoc. Popular", "codigo": "ASOCIPOPULAR", "pais_codigo": "DO", "logo_url": "/banks/asocipopular.svg", "activo": True},
    {"nombre": "Asociación La Nacional",          "nombre_corto": "La Nacional", "codigo": "LANACIONAL",  "pais_codigo": "DO", "logo_url": "/banks/lanacional.svg",  "activo": True},
]

def main() -> None:
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    existing = (
        client.table("bancos")
        .select("codigo")
        .eq("pais_codigo", "DO")
        .execute()
    )
    existing_codigos = {row["codigo"] for row in (existing.data or []) if row.get("codigo")}

    to_insert = [b for b in BANCOS_DO if b["codigo"] not in existing_codigos]
    if not to_insert:
        print("All Dominican banks already seeded.")
        return

    result = client.table("bancos").insert(to_insert).execute()
    print(f"Inserted {len(result.data)} banks.")
    for row in result.data:
        print(f"  + {row['nombre']} ({row['codigo']})")


if __name__ == "__main__":
    main()
