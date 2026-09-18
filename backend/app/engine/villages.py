from dataclasses import dataclass


@dataclass(frozen=True)
class SourceProfile:
    rain_k: float
    upstream_k: float
    decay: float
    background: float
    exposure: float
    turbidity_base: float
    turbidity_k: float
    turbidity_memory: float


SOURCES: dict[str, SourceProfile] = {
    "river": SourceProfile(rain_k=1.0, upstream_k=0.3, decay=0.45, background=0.03, exposure=0.6, turbidity_base=3.5, turbidity_k=0.18, turbidity_memory=0.5),
    "pond": SourceProfile(rain_k=0.9, upstream_k=0.0, decay=0.62, background=0.04, exposure=0.5, turbidity_base=7.0, turbidity_k=0.12, turbidity_memory=0.65),
    "spring": SourceProfile(rain_k=0.6, upstream_k=0.0, decay=0.4, background=0.01, exposure=0.7, turbidity_base=1.5, turbidity_k=0.05, turbidity_memory=0.4),
    "tubewell": SourceProfile(rain_k=0.55, upstream_k=0.0, decay=0.55, background=0.01, exposure=0.8, turbidity_base=1.0, turbidity_k=0.03, turbidity_memory=0.5),
    "piped": SourceProfile(rain_k=0.15, upstream_k=0.0, decay=0.4, background=0.005, exposure=0.9, turbidity_base=0.8, turbidity_k=0.02, turbidity_memory=0.4),
}

SOURCE_LABELS = {
    "river": "River (surface water)",
    "pond": "Community pond",
    "spring": "Hill spring",
    "tubewell": "Shallow tubewells",
    "piped": "Piped supply (treated)",
}


@dataclass(frozen=True)
class Village:
    id: str
    name: str
    district: str
    state: str
    lat: float
    lon: float
    population: int
    language: str
    water_source: str
    catchment: str | None
    upstream_id: str | None
    has_sensor: bool
    sanitation: float
    report_rate: float
    test_weekday: int
    asha: str
    phc: str
    medical_officer: str

    @property
    def source(self) -> SourceProfile:
        return SOURCES[self.water_source]

    @property
    def outbreak_cases_3d(self) -> int:
        return max(8, round(1.6 * self.population / 1000))

    @property
    def true_outbreak_onsets_3d(self) -> int:
        return max(12, round(3.2 * self.population / 1000))


VILLAGES: list[Village] = [
    Village("KMR01", "Ukiam", "Kamrup", "Assam", 25.915, 91.296, 2850, "as", "river", "Kulsi", None, False, 0.36, 0.42, 0,
       "Rina Das", "Ukiam SHC", "Dr. Pranjal Kalita"),
    Village("KMR02", "Kukurmara", "Kamrup", "Assam", 25.985, 91.360, 4120, "as", "river", "Kulsi", "KMR01", True, 0.44, 0.5, 1,
       "Mamoni Kalita", "Kukurmara PHC", "Dr. Pranjal Kalita"),
    Village("KMR03", "Chaygaon", "Kamrup", "Assam", 26.045, 91.387, 6380, "as", "river", "Kulsi", "KMR02", False, 0.52, 0.55, 2,
       "Pranita Boro", "Chaygaon CHC", "Dr. Bhaskar Sarma"),
    Village("KMR04", "Chamaria", "Kamrup", "Assam", 26.137, 91.300, 5240, "as", "river", "Kulsi", "KMR03", True, 0.4, 0.48, 3,
       "Jonali Rabha", "Chamaria PHC", "Dr. Bhaskar Sarma"),
    Village("KMR05", "Nagarbera", "Kamrup", "Assam", 26.108, 90.985, 3960, "as", "river", "Kulsi", "KMR04", False, 0.34, 0.4, 4,
       "Bina Deka", "Nagarbera PHC", "Dr. Nurul Islam"),
    Village("RBH01", "Nongpoh", "Ri-Bhoi", "Meghalaya", 25.905, 91.877, 4600, "en", "river", "Digaru", None, True, 0.48, 0.52, 5,
       "Iohbha Syiem", "Nongpoh CHC", "Dr. Wanphrang Lyngdoh"),
    Village("KMR06", "Digaru", "Kamrup Metropolitan", "Assam", 26.080, 91.945, 3150, "as", "river", "Digaru", "RBH01", False, 0.39, 0.45, 6,
       "Anjali Bora", "Digaru SHC", "Dr. Prabal Das"),
    Village("KMR07", "Sonapur", "Kamrup Metropolitan", "Assam", 26.118, 91.978, 7450, "as", "river", "Digaru", "KMR06", True, 0.55, 0.58, 0,
       "Rumi Nath", "Sonapur CHC", "Dr. Prabal Das"),
    Village("KMR08", "Hajo", "Kamrup", "Assam", 26.245, 91.527, 5680, "as", "tubewell", None, None, False, 0.58, 0.5, 1,
       "Nirmali Talukdar", "Hajo CHC", "Dr. Ritu Barman"),
    Village("KMR09", "Rangia", "Kamrup", "Assam", 26.448, 91.617, 8900, "as", "piped", None, None, True, 0.66, 0.6, 2,
       "Dipali Baishya", "Rangia SDCH", "Dr. Ritu Barman"),
    Village("KMR10", "Boko", "Kamrup", "Assam", 25.974, 91.232, 4350, "as", "pond", None, None, False, 0.33, 0.44, 3,
       "Kabita Medhi", "Boko CHC", "Dr. Nurul Islam"),
    Village("RBH02", "Umiam", "Ri-Bhoi", "Meghalaya", 25.655, 91.905, 2700, "en", "spring", None, None, False, 0.55, 0.47, 4,
       "Daphisha Lyngdoh", "Umsning CHC", "Dr. Wanphrang Lyngdoh"),
]

BY_ID: dict[str, Village] = {v.id: v for v in VILLAGES}
INDEX: dict[str, int] = {v.id: i for i, v in enumerate(VILLAGES)}
DOWNSTREAM: dict[str, list[str]] = {v.id: [w.id for w in VILLAGES if w.upstream_id == v.id] for v in VILLAGES}

DHO: dict[str, str] = {
    "Kamrup": "Dr. Hemanta Gogoi, DHO Kamrup",
    "Kamrup Metropolitan": "Dr. Mridul Saikia, DHO Kamrup Metro",
    "Ri-Bhoi": "Dr. Iaishah Rymbai, DMHO Ri-Bhoi",
}

