# Tekstil Depo Yönetim Sistemi (Warehouse Management System)

Tekstil işletmelerinde ürün modellerini, beden/adet bazlı stok hareketlerini ve kritik envanter seviyelerini yönetmek amacıyla geliştirilmiş full-stack depo otomasyonu.

---

## Teknolojiler

- **Backend:** Node.js, Express.js, TypeScript
- **Veritabanı & ORM:** SQLite, Prisma ORM
- **Frontend:** Vue.js 3 (Composition API), Tailwind CSS, FontAwesome
- **API Dokümantasyonu:** Swagger (OpenAPI 3.0)

---

## Özellikler

- **Ürün Yönetimi (CRUD):** Model kodu, ürün adı ve kumaş türüne göre ürün ekleme, listeleme ve silme.
- **Dinamik Stok Takibi:** Ürüne bağlı beden (S, M, L vb.), adet, depo lokasyonu ve parti numarası takibi.
- **Kritik Stok Uyarısı:** Depoda 10 adet ve altına düşen ürünleri filtreleyip görsel uyarı sunan akıllı mekanizma.
- **Rol Tabanlı Arayüz:** Yönetici ve Çalışan rolleri; yetkiye göre buton gizleme/gösterme (RBAC).
- **Hızlı Arama:** Ürün model koduna göre anlık stok durumu ve beden dağılımı sorgulama.
- **İnteraktif Dokümantasyon:** Swagger UI üzerinden tüm endpoint'leri test edebilme.

---

## 🛠 Kurulum ve Çalıştırma

### 1. Projeyi Klonlayın
\`\`\`bash
git clone (https://github.com/yagmuragacbacak/tekstil-depo-yonetimi.git)
cd depoapp-backend
\`\`\`

### 2. Bağımlılıkları Yükleyin
\`\`\`bash
npm install
\`\`\`

### 3. Veritabanını Senkronize Edin
\`\`\`bash
npx prisma db push
npx prisma generate
\`\`\`

### 4. Sunucuyu Başlatın
\`\`\`bash
npx tsx index.ts
\`\`\`

---

## Erişim Noktaları

- **Web Arayüzü:** [http://localhost:3000](http://localhost:3000)
- **Swagger API Dokümantasyonu:** [http://localhost:3000/docs](http://localhost:3000/docs)
