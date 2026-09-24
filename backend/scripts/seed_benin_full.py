"""Seed complet : 77 communes du Bénin + hôpitaux publics & privés.

Lance ce script après `alembic upgrade head` pour remplir la table hospitals
avec les établissements de santé du Bénin (publics et privés).

Usage:
    python scripts/seed_benin_full.py
"""

from __future__ import annotations

import sys
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select  # noqa: E402

from app.db import get_session_factory  # noqa: E402
from app.models import Hospital  # noqa: E402

# ---------------------------------------------------------------------------
# 77 communes du Bénin par département
# ---------------------------------------------------------------------------
COMMUNES: list[tuple[str, str]] = [
    # Alibori
    ("Banikoara", "Alibori"),
    ("Gogounou", "Alibori"),
    ("Kandi", "Alibori"),
    ("Karimama", "Alibori"),
    ("Malanville", "Alibori"),
    ("Ségbana", "Alibori"),
    # Atacora
    ("Boukoumbé", "Atacora"),
    ("Cobly", "Atacora"),
    ("Kérou", "Atacora"),
    ("Kouandé", "Atacora"),
    ("Matéri", "Atacora"),
    ("Natitingou", "Atacora"),
    ("Pehunco", "Atacora"),
    ("Tanguiéta", "Atacora"),
    ("Toucountouna", "Atacora"),
    # Atlantique
    ("Abomey-Calavi", "Atlantique"),
    ("Allada", "Atlantique"),
    ("Kpomassè", "Atlantique"),
    ("Ouidah", "Atlantique"),
    ("Sô-Ava", "Atlantique"),
    ("Toffo", "Atlantique"),
    ("Tori-Bossito", "Atlantique"),
    ("Zè", "Atlantique"),
    # Borgou
    ("Bembèrèkè", "Borgou"),
    ("Kalalé", "Borgou"),
    ("N'Dali", "Borgou"),
    ("Nikki", "Borgou"),
    ("Parakou", "Borgou"),
    ("Pèrèrè", "Borgou"),
    ("Sinendé", "Borgou"),
    ("Tchaourou", "Borgou"),
    # Collines
    ("Bantè", "Collines"),
    ("Dassa-Zoumè", "Collines"),
    ("Glazoué", "Collines"),
    ("Ouèssè", "Collines"),
    ("Savalou", "Collines"),
    ("Savè", "Collines"),
    # Couffo
    ("Aplahoué", "Couffo"),
    ("Djakotomey", "Couffo"),
    ("Dogbo", "Couffo"),
    ("Klouékanmè", "Couffo"),
    ("Lalo", "Couffo"),
    ("Toviklin", "Couffo"),
    # Donga
    ("Bassila", "Donga"),
    ("Copargo", "Donga"),
    ("Djougou", "Donga"),
    ("Ouaké", "Donga"),
    # Littoral
    ("Cotonou", "Littoral"),
    # Mono
    ("Athiémé", "Mono"),
    ("Bopa", "Mono"),
    ("Comè", "Mono"),
    ("Grand-Popo", "Mono"),
    ("Houéyogbé", "Mono"),
    ("Lokossa", "Mono"),
    # Ouémé
    ("Adjarra", "Ouémé"),
    ("Adjohoun", "Ouémé"),
    ("Aguégués", "Ouémé"),
    ("Akpro-Missérété", "Ouémé"),
    ("Avrankou", "Ouémé"),
    ("Bonou", "Ouémé"),
    ("Dangbo", "Ouémé"),
    ("Porto-Novo", "Ouémé"),
    ("Sèmè-Podji", "Ouémé"),
    # Plateau
    ("Adja-Ouèrè", "Plateau"),
    ("Ifangni", "Plateau"),
    ("Kétou", "Plateau"),
    ("Pobè", "Plateau"),
    ("Sakété", "Plateau"),
    # Zou
    ("Abomey", "Zou"),
    ("Agbangnizoun", "Zou"),
    ("Bohicon", "Zou"),
    ("Covè", "Zou"),
    ("Djidja", "Zou"),
    ("Ouinhi", "Zou"),
    ("Za-Kpota", "Zou"),
    ("Zagnanado", "Zou"),
    ("Zogbodomey", "Zou"),
]

# ---------------------------------------------------------------------------
# Hôpitaux & cliniques du Bénin (publics + privés)
# (nom, commune, is_recognized)
#   is_recognized=True  → établissement public / reconnu par l'État
#   is_recognized=False → clinique / hôpital privé
# ---------------------------------------------------------------------------
HOSPITALS: list[tuple[str, str, bool]] = [
    # =========================================================================
    # HÔPITAUX PUBLICS — Centres Nationaux & Universitaires
    # =========================================================================
    ("Centre National Hospitalier Universitaire Hubert Koutoukou Maga (CNHU-HKM)", "Cotonou", True),
    ("Centre Hospitalier Universitaire de la Mère et de l'Enfant Lagune (CHU-MEL)", "Cotonou", True),
    ("Hôpital d'Instruction des Armées (HIA-CHU)", "Cotonou", True),
    ("Centre National de Psychiatrie de Jacquot (CNPJ)", "Cotonou", True),
    ("Centre National Hospitalier de Pneumo-Phtisiologie (CNHPP)", "Cotonou", True),

    # =========================================================================
    # HÔPITAUX PUBLICS — Centres Hospitaliers Départementaux (CHD)
    # =========================================================================
    ("Centre Hospitalier Départemental de l'Ouémé-Plateau (CHD-OP)", "Porto-Novo", True),
    ("Centre Hospitalier Départemental du Borgou-Alibori (CHD-BA)", "Parakou", True),
    ("Centre Hospitalier Départemental du Zou-Collines (CHD-ZC)", "Abomey", True),
    ("Centre Hospitalier Départemental du Mono-Couffo (CHD-MC)", "Lokossa", True),
    ("Centre Hospitalier Départemental de l'Atacora-Donga (CHD-AD)", "Natitingou", True),
    ("Centre Hospitalier International de Calavi (CHIC)", "Abomey-Calavi", True),

    # =========================================================================
    # HÔPITAUX PUBLICS — Hôpitaux de Zone (HZ)
    # =========================================================================
    # Alibori
    ("Hôpital de Zone de Kandi", "Kandi", True),
    ("Hôpital de Zone de Malanville", "Malanville", True),
    ("Hôpital de Zone de Banikoara", "Banikoara", True),
    ("Hôpital de Zone de Ségbana", "Ségbana", True),
    # Atacora
    ("Hôpital de Zone de Natitingou", "Natitingou", True),
    ("Hôpital de Zone de Tanguiéta (Hôpital Saint-Jean-de-Dieu)", "Tanguiéta", True),
    ("Hôpital de Zone de Kouandé", "Kouandé", True),
    # Atlantique
    ("Hôpital de Zone d'Abomey-Calavi / Sô-Ava", "Abomey-Calavi", True),
    ("Hôpital de Zone de Ouidah / Kpomassè / Tori-Bossito", "Ouidah", True),
    ("Hôpital de Zone d'Allada / Toffo / Zè", "Allada", True),
    # Borgou
    ("Hôpital de Zone de Parakou (CHU Borgou)", "Parakou", True),
    ("Hôpital de Zone de Nikki / Kalalé / Pèrèrè", "Nikki", True),
    ("Hôpital de Zone de Bembèrèkè / Sinendé", "Bembèrèkè", True),
    ("Hôpital de Zone de Tchaourou", "Tchaourou", True),
    # Collines
    ("Hôpital de Zone de Savalou / Bantè", "Savalou", True),
    ("Hôpital de Zone de Dassa-Zoumè / Glazoué", "Dassa-Zoumè", True),
    ("Hôpital de Zone de Savè / Ouèssè", "Savè", True),
    # Couffo
    ("Hôpital de Zone d'Aplahoué", "Aplahoué", True),
    ("Hôpital de Zone de Dogbo", "Dogbo", True),
    # Donga
    ("Hôpital de Zone de Djougou", "Djougou", True),
    ("Hôpital de Zone de Bassila", "Bassila", True),
    # Littoral
    ("Hôpital de Zone de Menontin", "Cotonou", True),
    ("Hôpital de Zone de Suru-Léré", "Cotonou", True),
    # Mono
    ("Hôpital de Zone de Lokossa", "Lokossa", True),
    ("Hôpital de Zone de Comè", "Comè", True),
    ("Hôpital de Zone de Bopa", "Bopa", True),
    # Ouémé
    ("Hôpital de Zone de Porto-Novo", "Porto-Novo", True),
    ("Hôpital de Zone d'Adjohoun / Bonou / Dangbo", "Adjohoun", True),
    ("Hôpital de Zone de Sèmè-Podji", "Sèmè-Podji", True),
    ("Hôpital de Zone d'Akpro-Missérété / Avrankou", "Akpro-Missérété", True),
    # Plateau
    ("Hôpital de Zone de Pobè / Adja-Ouèrè / Kétou", "Pobè", True),
    ("Hôpital de Zone de Sakété / Ifangni", "Sakété", True),
    # Zou
    ("Hôpital de Zone d'Abomey", "Abomey", True),
    ("Hôpital de Zone de Bohicon", "Bohicon", True),
    ("Hôpital de Zone de Covè / Zagnanado / Ouinhi", "Covè", True),
    ("Hôpital de Zone de Djidja", "Djidja", True),

    # =========================================================================
    # CLINIQUES ET HÔPITAUX PRIVÉS
    # =========================================================================
    # Cotonou
    ("Clinique Atinkanmey", "Cotonou", False),
    ("Clinique du Bénin (ex-Clinique de la Mère)", "Cotonou", False),
    ("Polyclinique Atinkanmey", "Cotonou", False),
    ("Clinique Louis Pasteur", "Cotonou", False),
    ("Clinique Mahouna", "Cotonou", False),
    ("Clinique Biasa", "Cotonou", False),
    ("Clinique de la Corniche", "Cotonou", False),
    ("Clinique Saint-Luc", "Cotonou", False),
    ("Clinique Universitaire d'Akpakpa", "Cotonou", False),
    ("Polyclinique les Cocotiers", "Cotonou", False),
    ("Clinique ORL Cotonou", "Cotonou", False),
    ("Clinique d'Ahouansori", "Cotonou", False),
    ("Centre Hospitalier Privé Saint-Joseph", "Cotonou", False),
    ("Clinique Finangnon", "Cotonou", False),
    ("Clinique Saint-Michel", "Cotonou", False),
    ("Hôpital El-Fateh", "Cotonou", False),
    ("Clinique La Providence", "Cotonou", False),
    ("Clinique Le Phare", "Cotonou", False),
    ("Clinique Gbèto", "Cotonou", False),
    ("Clinique Soglo", "Cotonou", False),
    # Abomey-Calavi
    ("Clinique Agbodjan", "Abomey-Calavi", False),
    ("Polyclinique de Godomey", "Abomey-Calavi", False),
    ("Clinique Bethesda", "Abomey-Calavi", False),
    ("Clinique CDTUB Gbégamey", "Abomey-Calavi", False),
    # Porto-Novo
    ("Clinique Centrale de Porto-Novo", "Porto-Novo", False),
    ("Clinique La Grâce", "Porto-Novo", False),
    ("Clinique Adjangba", "Porto-Novo", False),
    ("Clinique Sacré-Cœur", "Porto-Novo", False),
    # Parakou
    ("Clinique Privée de Parakou", "Parakou", False),
    ("Clinique Boni", "Parakou", False),
    ("Clinique El Nasr", "Parakou", False),
    # Bohicon
    ("Clinique Bohicon Centre", "Bohicon", False),
    ("Clinique Sainte-Anne de Bohicon", "Bohicon", False),
    # Ouidah
    ("Clinique Privée de Ouidah", "Ouidah", False),
    # Djougou
    ("Clinique Privée de Djougou", "Djougou", False),
    # Lokossa
    ("Clinique Saint-Charles de Lokossa", "Lokossa", False),
    # Sèmè-Podji
    ("Clinique Privée de Sèmè-Podji", "Sèmè-Podji", False),
    # Natitingou
    ("Clinique Privée de Natitingou", "Natitingou", False),
    # Kandi
    ("Clinique Privée de Kandi", "Kandi", False),
    # Savè
    ("Hôpital Protestant de Boko (Savè)", "Savè", False),
    # Dassa-Zoumè
    ("Clinique Privée de Dassa", "Dassa-Zoumè", False),
    # Malanville
    ("Centre Médical Privé de Malanville", "Malanville", False),
    # Abomey
    ("Clinique Privée d'Abomey", "Abomey", False),
    # Comè
    ("Clinique Privée de Comè", "Comè", False),
    # Pobè
    ("Clinique Privée de Pobè", "Pobè", False),
    # Savalou
    ("Clinique Privée de Savalou", "Savalou", False),
]


def _hospital_id(name: str):
    """Stable UUID derived from the hospital name (idempotent re-runs)."""
    return uuid5(NAMESPACE_URL, f"sosang:hospital:{name}")


def main() -> None:
    session = get_session_factory()()
    inserted = 0
    updated = 0
    try:
        for name, city, is_recognized in HOSPITALS:
            h_id = _hospital_id(name)
            existing = session.get(Hospital, h_id)
            if existing is None:
                session.add(
                    Hospital(
                        id=h_id,
                        name=name,
                        city=city,
                        location=None,
                        is_recognized=is_recognized,
                    )
                )
                inserted += 1
            else:
                existing.name = name
                existing.city = city
                existing.is_recognized = is_recognized
                updated += 1

        session.commit()
        print(
            f"Done! {inserted} hospitals inserted, {updated} updated. "
            f"Total: {len(HOSPITALS)} hospitals across {len(COMMUNES)} communes."
        )
        print(
            f"  - Public (is_recognized=True): "
            f"{sum(1 for _, _, r in HOSPITALS if r)}"
        )
        print(
            f"  - Private (is_recognized=False): "
            f"{sum(1 for _, _, r in HOSPITALS if not r)}"
        )
    finally:
        session.close()


if __name__ == "__main__":
    main()
