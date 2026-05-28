export interface AddressItem {
  code: string;
  name: string;
  parentCode?: string;
}

export const PROVINCES: AddressItem[] = [
  { code: "11", name: "Aceh" },
  { code: "12", name: "Sumatera Utara" },
  { code: "13", name: "Sumatera Barat" },
  { code: "14", name: "Riau" },
  { code: "15", name: "Jambi" },
  { code: "16", name: "Sumatera Selatan" },
  { code: "17", name: "Bengkulu" },
  { code: "18", name: "Lampung" },
  { code: "19", name: "Kepulauan Bangka Belitung" },
  { code: "21", name: "Kepulauan Riau" },
  { code: "31", name: "DKI Jakarta" },
  { code: "32", name: "Jawa Barat" },
  { code: "33", name: "Jawa Tengah" },
  { code: "34", name: "DI Yogyakarta" },
  { code: "35", name: "Jawa Timur" },
  { code: "36", name: "Banten" },
  { code: "51", name: "Bali" },
  { code: "52", name: "Nusa Tenggara Barat" },
  { code: "53", name: "Nusa Tenggara Timur" },
  { code: "61", name: "Kalimantan Barat" },
  { code: "62", name: "Kalimantan Tengah" },
  { code: "63", name: "Kalimantan Selatan" },
  { code: "64", name: "Kalimantan Timur" },
  { code: "65", name: "Kalimantan Utara" },
  { code: "71", name: "Sulawesi Utara" },
  { code: "72", name: "Sulawesi Tengah" },
  { code: "73", name: "Sulawesi Selatan" },
  { code: "74", name: "Sulawesi Tenggara" },
  { code: "75", name: "Gorontalo" },
  { code: "76", name: "Sulawesi Barat" },
  { code: "81", name: "Maluku" },
  { code: "82", name: "Maluku Utara" },
  { code: "91", name: "Papua" },
  { code: "92", name: "Papua Barat" },
  { code: "93", name: "Papua Selatan" },
  { code: "94", name: "Papua Tengah" },
  { code: "95", name: "Papua Pegunungan" },
  { code: "96", name: "Papua Barat Daya" },
];

export const CITIES: AddressItem[] = [
  // Aceh
  { code: "1101", name: "Kota Banda Aceh", parentCode: "11" },
  { code: "1102", name: "Kota Sabang", parentCode: "11" },
  { code: "1103", name: "Kota Lhokseumawe", parentCode: "11" },
  { code: "1104", name: "Kota Langsa", parentCode: "11" },
  // Sumatera Utara
  { code: "1201", name: "Kota Medan", parentCode: "12" },
  { code: "1202", name: "Kota Binjai", parentCode: "12" },
  { code: "1203", name: "Kota Deli Serdang", parentCode: "12" },
  { code: "1204", name: "Kota Tanjung Balai", parentCode: "12" },
  { code: "1205", name: "Kota Tebing Tinggi", parentCode: "12" },
  // Sumatera Barat
  { code: "1301", name: "Kota Padang", parentCode: "13" },
  { code: "1302", name: "Kota Bukittinggi", parentCode: "13" },
  { code: "1303", name: "Kota Payakumbuh", parentCode: "13" },
  { code: "1304", name: "Kota Solok", parentCode: "13" },
  // Riau
  { code: "1401", name: "Kota Pekanbaru", parentCode: "14" },
  { code: "1402", name: "Kota Dumai", parentCode: "14" },
  { code: "1403", name: "Kab. Siak", parentCode: "14" },
  { code: "1404", name: "Kab. Kampar", parentCode: "14" },
  // Jambi
  { code: "1501", name: "Kota Jambi", parentCode: "15" },
  { code: "1502", name: "Kota Sungai Penuh", parentCode: "15" },
  { code: "1503", name: "Kab. Muaro Jambi", parentCode: "15" },
  // Sumatera Selatan
  { code: "1601", name: "Kota Palembang", parentCode: "16" },
  { code: "1602", name: "Kota Prabumulih", parentCode: "16" },
  { code: "1603", name: "Kota Lubuklinggau", parentCode: "16" },
  { code: "1604", name: "Kab. Musi Banyuasin", parentCode: "16" },
  // Bengkulu
  { code: "1701", name: "Kota Bengkulu", parentCode: "17" },
  { code: "1702", name: "Kab. Seluma", parentCode: "17" },
  { code: "1703", name: "Kab. Rejang Lebong", parentCode: "17" },
  // Lampung
  { code: "1801", name: "Kota Bandar Lampung", parentCode: "18" },
  { code: "1802", name: "Kota Metro", parentCode: "18" },
  { code: "1803", name: "Kab. Lampung Selatan", parentCode: "18" },
  { code: "1804", name: "Kab. Lampung Timur", parentCode: "18" },
  // Bangka Belitung
  { code: "1901", name: "Kota Pangkal Pinang", parentCode: "19" },
  { code: "1902", name: "Kab. Bangka", parentCode: "19" },
  { code: "1903", name: "Kab. Belitung", parentCode: "19" },
  // Kepulauan Riau
  { code: "2101", name: "Kota Batam", parentCode: "21" },
  { code: "2102", name: "Kota Tanjung Pinang", parentCode: "21" },
  { code: "2103", name: "Kab. Bintan", parentCode: "21" },
  // DKI Jakarta
  { code: "3101", name: "Kota Jakarta Pusat", parentCode: "31" },
  { code: "3102", name: "Kota Jakarta Utara", parentCode: "31" },
  { code: "3103", name: "Kota Jakarta Barat", parentCode: "31" },
  { code: "3104", name: "Kota Jakarta Selatan", parentCode: "31" },
  { code: "3105", name: "Kota Jakarta Timur", parentCode: "31" },
  // Jawa Barat
  { code: "3201", name: "Kota Bandung", parentCode: "32" },
  { code: "3202", name: "Kota Bekasi", parentCode: "32" },
  { code: "3203", name: "Kota Bogor", parentCode: "32" },
  { code: "3204", name: "Kota Depok", parentCode: "32" },
  { code: "3205", name: "Kota Cimahi", parentCode: "32" },
  { code: "3206", name: "Kota Cirebon", parentCode: "32" },
  { code: "3207", name: "Kota Sukabumi", parentCode: "32" },
  { code: "3208", name: "Kab. Karawang", parentCode: "32" },
  { code: "3209", name: "Kab. Subang", parentCode: "32" },
  { code: "3210", name: "Kab. Garut", parentCode: "32" },
  // Jawa Tengah
  { code: "3301", name: "Kota Semarang", parentCode: "33" },
  { code: "3302", name: "Kota Solo", parentCode: "33" },
  { code: "3303", name: "Kota Pekalongan", parentCode: "33" },
  { code: "3304", name: "Kota Tegal", parentCode: "33" },
  { code: "3305", name: "Kab. Demak", parentCode: "33" },
  { code: "3306", name: "Kab. Kudus", parentCode: "33" },
  { code: "3307", name: "Kab. Boyolali", parentCode: "33" },
  // DI Yogyakarta
  { code: "3401", name: "Kota Yogyakarta", parentCode: "34" },
  { code: "3402", name: "Kab. Sleman", parentCode: "34" },
  { code: "3403", name: "Kab. Bantul", parentCode: "34" },
  { code: "3404", name: "Kab. Gunung Kidul", parentCode: "34" },
  { code: "3405", name: "Kab. Kulon Progo", parentCode: "34" },
  // Jawa Timur
  { code: "3501", name: "Kota Surabaya", parentCode: "35" },
  { code: "3502", name: "Kota Malang", parentCode: "35" },
  { code: "3503", name: "Kota Batu", parentCode: "35" },
  { code: "3504", name: "Kota Kediri", parentCode: "35" },
  { code: "3505", name: "Kota Blitar", parentCode: "35" },
  { code: "3506", name: "Kota Madiun", parentCode: "35" },
  { code: "3507", name: "Kab. Sidoarjo", parentCode: "35" },
  { code: "3508", name: "Kab. Gresik", parentCode: "35" },
  { code: "3509", name: "Kab. Mojokerto", parentCode: "35" },
  // Banten
  { code: "3601", name: "Kota Tangerang", parentCode: "36" },
  { code: "3602", name: "Kota Tangerang Selatan", parentCode: "36" },
  { code: "3603", name: "Kota Serang", parentCode: "36" },
  { code: "3604", name: "Kota Cilegon", parentCode: "36" },
  { code: "3605", name: "Kab. Pandeglang", parentCode: "36" },
  { code: "3606", name: "Kab. Lebak", parentCode: "36" },
  // Bali
  { code: "5101", name: "Kota Denpasar", parentCode: "51" },
  { code: "5102", name: "Kab. Badung", parentCode: "51" },
  { code: "5103", name: "Kab. Gianyar", parentCode: "51" },
  { code: "5104", name: "Kab. Tabanan", parentCode: "51" },
  // NTB
  { code: "5201", name: "Kota Mataram", parentCode: "52" },
  { code: "5202", name: "Kota Bima", parentCode: "52" },
  { code: "5203", name: "Kab. Lombok Utara", parentCode: "52" },
  { code: "5204", name: "Kab. Lombok Tengah", parentCode: "52" },
  // NTT
  { code: "5301", name: "Kota Kupang", parentCode: "53" },
  { code: "5302", name: "Kab. Timor Tengah Selatan", parentCode: "53" },
  { code: "5303", name: "Kab. Flores Timur", parentCode: "53" },
  // Kalimantan Barat
  { code: "6101", name: "Kota Pontianak", parentCode: "61" },
  { code: "6102", name: "Kota Singkawang", parentCode: "61" },
  { code: "6103", name: "Kab. Kubu Raya", parentCode: "61" },
  // Kalimantan Tengah
  { code: "6201", name: "Kota Palangka Raya", parentCode: "62" },
  { code: "6202", name: "Kab. Kotawaringin Barat", parentCode: "62" },
  { code: "6203", name: "Kab. Kapuas", parentCode: "62" },
  // Kalimantan Selatan
  { code: "6301", name: "Kota Banjarmasin", parentCode: "63" },
  { code: "6302", name: "Kota Banjarbaru", parentCode: "63" },
  { code: "6303", name: "Kab. Banjar", parentCode: "63" },
  { code: "6304", name: "Kab. Tapin", parentCode: "63" },
  // Kalimantan Timur
  { code: "6401", name: "Kota Samarinda", parentCode: "64" },
  { code: "6402", name: "Kota Balikpapan", parentCode: "64" },
  { code: "6403", name: "Kota Bontang", parentCode: "64" },
  { code: "6404", name: "Kab. Kutai Kartanegara", parentCode: "64" },
  // Kalimantan Utara
  { code: "6501", name: "Kota Tarakan", parentCode: "65" },
  { code: "6502", name: "Kab. Bulungan", parentCode: "65" },
  { code: "6503", name: "Kab. Nunukan", parentCode: "65" },
  // Sulawesi Utara
  { code: "7101", name: "Kota Manado", parentCode: "71" },
  { code: "7102", name: "Kota Bitung", parentCode: "71" },
  { code: "7103", name: "Kota Tomohon", parentCode: "71" },
  { code: "7104", name: "Kota Kotamobagu", parentCode: "71" },
  // Sulawesi Tengah
  { code: "7201", name: "Kota Palu", parentCode: "72" },
  { code: "7202", name: "Kab. Donggala", parentCode: "72" },
  { code: "7203", name: "Kab. Parigi Moutong", parentCode: "72" },
  // Sulawesi Selatan
  { code: "7301", name: "Kota Makassar", parentCode: "73" },
  { code: "7302", name: "Kota Parepare", parentCode: "73" },
  { code: "7303", name: "Kota Palopo", parentCode: "73" },
  { code: "7304", name: "Kab. Gowa", parentCode: "73" },
  { code: "7305", name: "Kab. Maros", parentCode: "73" },
  // Sulawesi Tenggara
  { code: "7401", name: "Kota Kendari", parentCode: "74" },
  { code: "7402", name: "Kota Baubau", parentCode: "74" },
  { code: "7403", name: "Kab. Konawe", parentCode: "74" },
  // Gorontalo
  { code: "7501", name: "Kota Gorontalo", parentCode: "75" },
  { code: "7502", name: "Kab. Gorontalo Utara", parentCode: "75" },
  { code: "7503", name: "Kab. Boalemo", parentCode: "75" },
  // Sulawesi Barat
  { code: "7601", name: "Kota Mamuju", parentCode: "76" },
  { code: "7602", name: "Kab. Majene", parentCode: "76" },
  // Maluku
  { code: "8101", name: "Kota Ambon", parentCode: "81" },
  { code: "8102", name: "Kota Tual", parentCode: "81" },
  { code: "8103", name: "Kab. Maluku Tengah", parentCode: "81" },
  // Maluku Utara
  { code: "8201", name: "Kota Ternate", parentCode: "82" },
  { code: "8202", name: "Kota Tidore Kepulauan", parentCode: "82" },
  { code: "8203", name: "Kab. Halmahera Timur", parentCode: "82" },
  // Papua
  { code: "9101", name: "Kota Jayapura", parentCode: "91" },
  { code: "9102", name: "Kab. Jayapura", parentCode: "91" },
  { code: "9103", name: "Kab. Keerom", parentCode: "91" },
  // Papua Barat
  { code: "9201", name: "Kota Manokwari", parentCode: "92" },
  { code: "9202", name: "Kota Sorong", parentCode: "92" },
  { code: "9203", name: "Kab. Fakfak", parentCode: "92" },
  // Papua Selatan
  { code: "9301", name: "Kota Merauke", parentCode: "93" },
  { code: "9302", name: "Kab. Boven Digoel", parentCode: "93" },
  // Papua Tengah
  { code: "9401", name: "Kota Nabire", parentCode: "94" },
  { code: "9402", name: "Kab. Puncak Jaya", parentCode: "94" },
  // Papua Pegunungan
  { code: "9501", name: "Kota Jayawijaya", parentCode: "95" },
  { code: "9502", name: "Kab. Pegunungan Bintang", parentCode: "95" },
  // Papua Barat Daya
  { code: "9601", name: "Kota Sorong", parentCode: "96" },
  { code: "9602", name: "Kab. Raja Ampat", parentCode: "96" },
  { code: "9603", name: "Kab. Tambrauw", parentCode: "96" },
];

export const DISTRICTS: AddressItem[] = [
  // DKI Jakarta - Jakarta Pusat
  { code: "3101001", name: "Menteng", parentCode: "3101" },
  { code: "3101002", name: "Senen", parentCode: "3101" },
  { code: "3101003", name: "Tanah Abang", parentCode: "3101" },
  { code: "3101004", name: "Kemayoran", parentCode: "3101" },
  { code: "3101005", name: "Sawah Besar", parentCode: "3101" },
  // DKI Jakarta - Jakarta Selatan
  { code: "3104001", name: "Kebayoran Baru", parentCode: "3104" },
  { code: "3104002", name: "Kebayoran Lama", parentCode: "3104" },
  { code: "3104003", name: "Pancoran", parentCode: "3104" },
  { code: "3104004", name: "Tebet", parentCode: "3104" },
  { code: "3104005", name: "Jagakarsa", parentCode: "3104" },
  // DKI Jakarta - Jakarta Barat
  { code: "3103001", name: "Grogol Petamburan", parentCode: "3103" },
  { code: "3103002", name: "Tambora", parentCode: "3103" },
  { code: "3103003", name: "Kembangan", parentCode: "3103" },
  { code: "3103004", name: "Palmerah", parentCode: "3103" },
  // DKI Jakarta - Jakarta Utara
  { code: "3102001", name: "Penjaringan", parentCode: "3102" },
  { code: "3102002", name: "Tanjung Priok", parentCode: "3102" },
  { code: "3102003", name: "Koja", parentCode: "3102" },
  { code: "3102004", name: "Kelapa Gading", parentCode: "3102" },
  // DKI Jakarta - Jakarta Timur
  { code: "3105001", name: "Matraman", parentCode: "3105" },
  { code: "3105002", name: "Pisangan Baru", parentCode: "3105" },
  { code: "3105003", name: "Jatinegara", parentCode: "3105" },
  { code: "3105004", name: "Kramat Jati", parentCode: "3105" },
  { code: "3105005", name: "Cakung", parentCode: "3105" },
  // Jawa Barat - Kota Bandung
  { code: "3201001", name: "Coblong", parentCode: "3201" },
  { code: "3201002", name: "Bandung Wetan", parentCode: "3201" },
  { code: "3201003", name: "Cibeunying Kaler", parentCode: "3201" },
  { code: "3201004", name: "Sumedang", parentCode: "3201" },
  { code: "3201005", name: "Batununggal", parentCode: "3201" },
  // Jawa Barat - Kota Bekasi
  { code: "3202001", name: "Bekasi Timur", parentCode: "3202" },
  { code: "3202002", name: "Bekasi Barat", parentCode: "3202" },
  { code: "3202003", name: "Bekasi Utara", parentCode: "3202" },
  { code: "3202004", name: "Bekasi Selatan", parentCode: "3202" },
  // Jawa Barat - Kota Bogor
  { code: "3203001", name: "Bogor Tengah", parentCode: "3203" },
  { code: "3203002", name: "Bogor Utara", parentCode: "3203" },
  { code: "3203003", name: "Bogor Selatan", parentCode: "3203" },
  // Jawa Barat - Kota Depok
  { code: "3204001", name: "Pancoran Mas", parentCode: "3204" },
  { code: "3204002", name: "Sawangan", parentCode: "3204" },
  { code: "3204003", name: "Cimanggis", parentCode: "3204" },
  { code: "3204004", name: "Beji", parentCode: "3204" },
  // Jawa Tengah - Kota Semarang
  { code: "3301001", name: "Semarang Tengah", parentCode: "3301" },
  { code: "3301002", name: "Semarang Utara", parentCode: "3301" },
  { code: "3301003", name: "Semarang Timur", parentCode: "3301" },
  { code: "3301004", name: "Semarang Selatan", parentCode: "3301" },
  { code: "3301005", name: "Genuk", parentCode: "3301" },
  // Jawa Tengah - Kota Solo
  { code: "3302001", name: "Laweyan", parentCode: "3302" },
  { code: "3302002", name: "Serengan", parentCode: "3302" },
  { code: "3302003", name: "Pasar Kliwon", parentCode: "3302" },
  { code: "3302004", name: "Jebres", parentCode: "3302" },
  { code: "3302005", name: "Banjarsari", parentCode: "3302" },
  // Jawa Timur - Kota Surabaya
  { code: "3501001", name: "Wonokromo", parentCode: "3501" },
  { code: "3501002", name: "Wonocolo", parentCode: "3501" },
  { code: "3501003", name: "Gubeng", parentCode: "3501" },
  { code: "3501004", name: "Tandes", parentCode: "3501" },
  { code: "3501005", name: "Kenjeran", parentCode: "3501" },
  { code: "3501006", name: "Benowo", parentCode: "3501" },
  // Jawa Timur - Kota Malang
  { code: "3502001", name: "Klojen", parentCode: "3502" },
  { code: "3502002", name: "Blimbing", parentCode: "3502" },
  { code: "3502003", name: "Kedungkandang", parentCode: "3502" },
  { code: "3502004", name: "Sukun", parentCode: "3502" },
  // Jawa Timur - Kab. Sidoarjo
  { code: "3507001", name: "Sidoarjo", parentCode: "3507" },
  { code: "3507002", name: "Taman", parentCode: "3507" },
  { code: "3507003", name: "Waru", parentCode: "3507" },
  // Banten - Kota Tangerang
  { code: "3601001", name: "Tangerang", parentCode: "3601" },
  { code: "3601002", name: "Karawaci", parentCode: "3601" },
  { code: "3601003", name: "Cipondoh", parentCode: "3601" },
  { code: "3601004", name: "Batuceper", parentCode: "3601" },
  // Banten - Kota Tangerang Selatan
  { code: "3602001", name: "Serpong", parentCode: "3602" },
  { code: "3602002", name: "Pondok Aren", parentCode: "3602" },
  { code: "3602003", name: "Ciputat", parentCode: "3602" },
  { code: "3602004", name: "Pamulang", parentCode: "3602" },
  // Bali - Kota Denpasar
  { code: "5101001", name: "Denpasar Selatan", parentCode: "5101" },
  { code: "5101002", name: "Denpasar Barat", parentCode: "5101" },
  { code: "5101003", name: "Denpasar Utara", parentCode: "5101" },
  { code: "5101004", name: "Denpasar Timur", parentCode: "5101" },
  // Sulawesi Selatan - Kota Makassar
  { code: "7301001", name: "Panakkukang", parentCode: "7301" },
  { code: "7301002", name: "Makassar", parentCode: "7301" },
  { code: "7301003", name: "Ujung Pandang", parentCode: "7301" },
  { code: "7301004", name: "Biringkanaya", parentCode: "7301" },
  { code: "7301005", name: "Tamalanrea", parentCode: "7301" },
  // Kalimantan Timur - Kota Samarinda
  { code: "6401001", name: "Sungai Kunjang", parentCode: "6401" },
  { code: "6401002", name: "Sungai Pinang", parentCode: "6401" },
  { code: "6401003", name: "Samarinda Ulu", parentCode: "6401" },
  { code: "6401004", name: "Samarinda Ilir", parentCode: "6401" },
  // Kalimantan Selatan - Kota Banjarmasin
  { code: "6301001", name: "Banjarmasin Tengah", parentCode: "6301" },
  { code: "6301002", name: "Banjarmasin Utara", parentCode: "6301" },
  { code: "6301003", name: "Banjarmasin Selatan", parentCode: "6301" },
  { code: "6301004", name: "Banjarmasin Timur", parentCode: "6301" },
  // Sumatera Utara - Kota Medan
  { code: "1201001", name: "Medan Baru", parentCode: "1201" },
  { code: "1201002", name: "Medan Sunggal", parentCode: "1201" },
  { code: "1201003", name: "Medan Petisah", parentCode: "1201" },
  { code: "1201004", name: "Medan Deli", parentCode: "1201" },
  { code: "1201005", name: "Medan Johor", parentCode: "1201" },
  // Riau - Kota Pekanbaru
  { code: "1401001", name: "Sukajadi", parentCode: "1401" },
  { code: "1401002", name: "Pekanbaru Kota", parentCode: "1401" },
  { code: "1401003", name: "Sail", parentCode: "1401" },
  { code: "1401004", name: "Lima Puluh", parentCode: "1401" },
  // Sumatera Selatan - Kota Palembang
  { code: "1601001", name: "Ilir Timur I", parentCode: "1601" },
  { code: "1601002", name: "Ilir Timur II", parentCode: "1601" },
  { code: "1601003", name: "Seberang Ulu I", parentCode: "1601" },
  { code: "1601004", name: "Seberang Ulu II", parentCode: "1601" },
  // Lampung - Kota Bandar Lampung
  { code: "1801001", name: "Tanjung Karang Pusat", parentCode: "1801" },
  { code: "1801002", name: "Tanjung Karang Timur", parentCode: "1801" },
  { code: "1801003", name: "Panjang", parentCode: "1801" },
  { code: "1801004", name: "Kedaton", parentCode: "1801" },
  // Kalimantan Barat - Kota Pontianak
  { code: "6101001", name: "Pontianak Kota", parentCode: "6101" },
  { code: "6101002", name: "Pontianak Selatan", parentCode: "6101" },
  { code: "6101003", name: "Pontianak Timur", parentCode: "6101" },
  // Sulawesi Utara - Kota Manado
  { code: "7101001", name: "Tikala", parentCode: "7101" },
  { code: "7101002", name: "Wanea", parentCode: "7101" },
  { code: "7101003", name: "Mapanget", parentCode: "7101" },
  { code: "7101004", name: "Malalayang", parentCode: "7101" },
  // Papua - Kota Jayapura
  { code: "9101001", name: "Jayapura Utara", parentCode: "9101" },
  { code: "9101002", name: "Jayapura Selatan", parentCode: "9101" },
  { code: "9101003", name: "Abepura", parentCode: "9101" },
  // NTT - Kota Kupang
  { code: "5301001", name: "Kota Lama", parentCode: "5301" },
  { code: "5301002", name: "Oebobo", parentCode: "5301" },
  { code: "5301003", name: "Maulafa", parentCode: "5301" },
  // Sulawesi Tenggara - Kota Kendari
  { code: "7401001", name: "Kendari", parentCode: "7401" },
  { code: "7401002", name: "Kadia", parentCode: "7401" },
  { code: "7401003", name: "Wua-Wua", parentCode: "7401" },
  // Maluku - Kota Ambon
  { code: "8101001", name: "Sirimau", parentCode: "8101" },
  { code: "8101002", name: "Leitimur Selatan", parentCode: "8101" },
  { code: "8101003", name: "Nusaniwe", parentCode: "8101" },
];

export function getFilteredCities(provinsiCode: string): AddressItem[] {
  return CITIES.filter((c) => c.parentCode === provinsiCode);
}

export function getFilteredDistricts(kotaCode: string): AddressItem[] {
  return DISTRICTS.filter((d) => d.parentCode === kotaCode);
}
