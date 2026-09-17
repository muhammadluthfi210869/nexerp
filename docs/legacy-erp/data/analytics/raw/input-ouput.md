# SCM 
kategori supplier
nama dan deskripsi

supplier
tabel output : supplier, pic, telepon, kategori, kota, pajak
input : nama supplier, kategori, telepon kontak person, pajak, deskripsi, provinsi, kota, alamat

buat pembelian
output : kode tanggal supplier, gudang, pembuat, nominal, status
input : (informasi pembelian) gudang, supplier, tanggal, jatuh tempo, catatan ( tambah barang ke keranjang) barag, qty,harga, total

faktur pembelian 
tabel output : kode GR, tanggal, supplier, gudang, total, pembuat, status

retur pembelian
tabel output : tanggal, kode retur, pembelian masuk, supplier, total, status
input : inputnya milih dari pembelian masuk dan cuma input catatan, qty retur dimana di dalamnya langsung ada kode GR, kode PO, supplier, gudang, dan ada tabel barang, satuan nya apa, qty, sudah di retur, qty tersedia

dp pembelian
tabel output : kode dp, tanggal, no pembelian, supplier, kas/bank, jumlah dp, terpakai, sisa, status
inputnya pilih pembelian yang masuk dari no po, aku ga tau no po apa apakah pre order yang sudah di berikan oleh gudang/produksi atau gimana, atau setelah dari sales order dilihat barangnya dan kurang lebih sama dengan retur pembelian

bayar pembelian 
tabel output : kode faktur, kode gr, kode po, tanggal, supplier, grand total, dibayar, sisa, status

terkait persetujuan ada dua yaitu pembelian dan retur pembelian 

pembelian ada tabel outputnya kode, tanggal, supplier, gudang, pembuat, nominal, status dan untuk retur pembelian ada tanggal, kode retur, pembelian masuk, supplier, total, pembuat, status


# Gudang

gudang 
tabel output : gudang, lokasi, telepon 
tabel input : gudang, provinsi, kota, alamt lengkap, telepon

kebutuhan barang
tabel output : kode, tanggal, SO, costumer, produk, brand, pembuat kebutuhan barnag, process dan bisa di lihat, edit dan lain lain
input : input langsung dari pencarian so, pilih produk, costumer nya siapa dan ini semua dropdown, tambang barang nya pilih barang apa dan qty nya apa pada tanggal berapa dan catatan berapa

permintaan barang 
tabel output : kode, tanggal, peminta, penyedia, pembuat, catatan, status
input : peminta dari so yang sudah di proses, penyedia, tanggal permintaan, catataan dimana tambang barang keranjang nya ada pilih barang, info stok peminta dan penyedia, jumlah qty dan catatan item dan untuk tambang barnag formula ke keranjan angsung milih batch record yang mana 

pembelian masuk : 
tabel output : kode, tanggal, no PO, supplier, gudang, total, pembuat, status

retur penjualan 
tabel output : kode retur, tanggal, so, customer, pembuat, status

trasnfer barang 
tabel output : kode transfer, tanggal, pengirim, penerima, pembuat, status
tabel input : pengirim gudang, penerima gudang, tanggal, tambah barang ke keranjang bisa milih barng, stok tersedia di gudang berapa, jumlah nya berapa dan catatan item nya berapa

pengiriman barng 
tabel output : kode, tanggal, no sales, tanggal sales, costumer, pembuat, status
input : no sales langsung pilih dari sales order, kode sales, tanggal sales, costumer nya siapa, ada tabel barang, satuan qty sales, qty tersedia, qty kirim dengan informasi pengiriman catatan dan foto opsional 

retur pembelian keluar
tabel output : kode retur, tanggal retur, supllier, gudang , pembuat status

stok opname 
tabel output : kode, tanggal, gudang, pembuat, catata
input : gudang, tanggal stok opname, catatan, barang, stok sistem, stok aktual

# Produksi 

Batch Record
tabel output : kode, anggal, sales order, pelanggan, kategori produsk, status
input : input so yang sudah ada, dan batch record nya inputnya dari pdf 

jadwal mixing 
tabel output : kode sm, tanggal, batch record, pelanggan, produk, target pcs, hasil upscale, status 

input : pilih dari batch record yang ada dan langsung keluar kode batch, kode sales, pelanggan, kategori, produk, qty, netto per pcs, dengan jadwal dan targt produksi breapa dan perhitungan upscale nya dari base result, upscale berapa persen danhasil upscale nya berapa dengan ditambah catatan 

jadwal filing 
tabel output : kode sf, tanggal, batch record, pelanggan, produk, target, hasil, status
input : pilih batch recrod, jadwal, target, kemasan primer nya apa dari dopdown, qty dan catatan 

jadwal packaging 
tabel output : kode, tanggal, batch record, pelanggan, produk, target, pcs, status
input : pilih batch recrod, jadwal tanggal berapa, target erapa pcs, kemasan nya sekunder apa, qty apa catatan apa 

produksi mixing 
tabel output :kode, tanggal, batch record, sm, pelanggan, produk, status, tanget pcs, status
input : perubahan progress meggunakan mesin apa, qty di produksi, catatan berapa, forula mixing nya kode bahan, nama bahan, konsentrasi, qty teoritis, stok tersedia, qty nyata, dan hasil produksi nya hasil ruahan berapa 

produksi filing
tabel output : kode, tanggal, sf, batch record, pelanggan, produk, status, target
input perubahan progress: udah tersedia kode jadwal, batch record, barang hasil hadi, target qty dan catatan dengan data porduski di isi mesin, qty produksi dan catatan nya apa, terus ada input bahan ruahan stok tersedia berapa, tqy dipakai berapa dan ada bahan kemasan primer penyusun ang di ambill barang nya apa dan stok tersedia qty dipakai nya berapa dna masing masing ada kode barang 

packaging 
output : kode, tanggal, batch record, pelanggan, produk, status, target 
input : perubahan progress, inputnya pilih jadwal packaging,  kode jadwal, tanggal jadwal berapa, target berapa, hasil berapa, catatan berapa 



