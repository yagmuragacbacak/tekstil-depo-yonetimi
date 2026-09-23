import express from 'express';
import { PrismaClient } from '@prisma/client';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Veritabanı bağlantısını ve web sunucusunu başlatma 
const prisma = new PrismaClient();
const app = express();
const port = 3000;

// Swagger Konfigürasyonu
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Tekstil Depo Yönetim Sistemi API',
      version: '1.0.0',
      description: 'Node.js, Express, TypeScript ve Prisma ile geliştirilmiş depo otomasyonu',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./index.ts'], // Rotaları bu dosyadan okuyacak
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Gelen JSON formatındaki verileri okuyacak
app.use(express.json());

// FRONTEND DOSYALARINI SUNMAK İÇİN
app.use(express.static('public'));

// 1. TEST : Sunucunun çalışıp çalışmadığını kontrol etmek için 
app.get('/api/test', (req, res) => {
  res.send('Tekstil Depo Backend Sistemi Başarıyla Çalışıyor!');
});

// KULLANICI GİRİŞİ (Login) API'si
app.post('/api/login', async (req, res) => {
  try {
    const { kullanici_adi, sifre_hash, rol } = req.body;
    let user = await prisma.user.findFirst({
      where: { kullanici_adi }
    });
    
    // Test : Eğer kullanıcı yoksa hemen oluştur
    if (!user) {
      user = await prisma.user.create({
        data: { kullanici_adi, sifre_hash, rol }
      });
    }

    if (user.sifre_hash === sifre_hash && user.rol === rol) {
      res.json({ mesaj: "Giriş başarılı", user });
    } else {
      res.status(401).json({ hata: "Şifre veya rol hatalı!" });
    }
  } catch (error) {
    res.status(500).json({ hata: "Giriş yapılırken hata oluştu." });
  }
});

// ÜRÜN ARAMA (GET) - model_kodu'na göre ürün ve stokları getirir
app.get('/api/urunler/ara/:kodu', async (req, res) => {
  try {
    const { kodu } = req.params;
    const urun = await prisma.product.findUnique({
      where: { model_kodu: kodu },
      include: { stocks: true }
    });
    if (urun) res.json(urun);
    else res.status(404).json({ hata: "Ürün bulunamadı" });
  } catch (error) {
    res.status(500).json({ hata: "Arama hatası" });
  }
});

// YENİ ÜRÜN EKLEME API'Sİ
app.post('/api/urunler', async (req, res) => {
  try {
    // Frontend'den gelen verileri alır
    const { model_kodu, isim, kumas_turu } = req.body;

    // Prisma ile veritabanına yeni ürünü kaydediyor
    const yeniUrun = await prisma.product.create({
      data: {
        model_kodu: model_kodu,
        isim: isim,
        kumas_turu: kumas_turu
      }
    });

    // Başarıyla eklendi mesajı
    res.status(201).json(yeniUrun);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ hata: "Ürün eklenirken bir hata oluştu. Model kodu benzersiz olmalı!" });
  }
});

//Swagger denemesi için endpoint denemesi
/**
 * @swagger
 * /api/urunler:
 *   get:
 *     summary: Tüm ürünleri listeler
 *     description: Depodaki kayıtlı tüm tekstil ürünlerini getirir.
 *     responses:
 *       200:
 *         description: Başarılı ürün listesi.
 */

// TÜM ÜRÜNLERİ GETİRME API'Sİ (GET)
app.get('/api/urunler', async (req, res) => {
  try {
    // Prisma ile Product tablosundaki tüm kayıtları çekiyoruz
    const urunler = await prisma.product.findMany();
    
    // Bulunan ürünleri JSON formatında frontend'e yolluyoruz
    res.json(urunler);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ hata: "Ürünler getirilirken bir hata oluştu." });
  }
});

// ÜRÜN GÜNCELLEME API'Sİ (PUT)
app.put('/api/urunler/:id', async (req, res) => {
  try {
    const { id } = req.params; // URL'den ürünün id'sini alır
    const { isim, kumas_turu } = req.body; // Değişecek yeni bilgiler

    const guncelUrun = await prisma.product.update({
      where: { id: parseInt(id) },
      data: { isim, kumas_turu }
    });
    
    res.json(guncelUrun);
  } catch (error) {
    res.status(500).json({ hata: "Ürün güncellenirken bir hata oluştu." });
  }
});

// ÜRÜN SİLME API'Sİ (DELETE)
app.delete('/api/urunler/:id', async (req, res) => {
  try {
    const { id } = req.params; // Silinecek ürünün ID'si

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ mesaj: "Ürün depodan başarıyla silindi!" });
  } catch (error) {
    res.status(500).json({ hata: "Ürün silinirken bir hata oluştu." });
  }
});

// YENİ STOK EKLEME VEYA GÜNCELLEME (POST)
app.post('/api/stok', async (req, res) => {
  try {
    const { urun_id, beden, adet, lokasyon } = req.body;

    // Önce bu ürünün bu bedeninde daha önce stok açılmış mı bakar
    const mevcutStok = await prisma.stock.findFirst({
      where: {
        urun_id: urun_id ,
        beden: beden
      }
    });

    let sonucStok;

    if (mevcutStok) {
      // Varsa miktar üzerine eklenir (lokasyon da güncellenir)
      sonucStok = await prisma.stock.update({
        where: { id: mevcutStok.id },
        data: { 
          adet: mevcutStok.adet + adet,
          lokasyon: lokasyon || mevcutStok.lokasyon
        }
      });
    } else {
      // Yoksa yeni stok kaydı açar
      sonucStok = await prisma.stock.create({
        data: {
          urun_id : urun_id ,
          beden: beden,
          adet: adet,
          lokasyon: lokasyon
        }
      });
    }

    res.status(201).json(sonucStok);
  } catch (error: any) {
    console.error("YAKALANAN HATA DETAYI:", error.message || error);
    res.status(500).json({ hata: "Stok güncellenirken bir hata oluştu.", ayrinti: error.message });
  }
});

// TÜM STOKLARI LİSTELEME (GET)
app.get('/api/stok', async (req, res) => {
  try {
    const stoklar = await prisma.stock.findMany({
      include: { product: true } // Hangi ürünün stoğu olduğunu da getirir
    });
    res.json(stoklar);
  } catch (error) {
    res.status(500).json({ hata: "Stoklar getirilemedi." });
  }
});

// STOK GÜNCELLEME (PUT) 
app.put('/api/stok/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { adet } = req.body;

    const guncelStok = await prisma.stock.update({
      where: { id: parseInt(id) },
      data: { adet: adet }
    });

    res.json(guncelStok);
  } catch (error) {
    res.status(500).json({ hata: "Stok güncellenirken bir hata oluştu." });
  }
});

// STOK SİLME (DELETE) 
app.delete('/api/stok/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.stock.delete({
      where: { id: parseInt(id) }
    });

    res.json({ mesaj: "Stok kaydı başarıyla silindi!" });
  } catch (error) {
    res.status(500).json({ hata: "Stok silinirken bir hata oluştu." });
  }
});


// BELİRLİ BİR ÜRÜNÜN DETAYI VE STOKLARI (GET)
app.get('/api/urunler/:id/stoklar', async (req, res) => {
  try {
    const { id } = req.params;

    const urunVeStoklari = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { stocks: true } // Ürüne bağlı stokları da getirir
    });

    if (!urunVeStoklari) {
      return res.status(404).json({ hata: "Böyle bir ürün bulunamadı." });
    }

    res.json(urunVeStoklari);
  } catch (error) {
    res.status(500).json({ hata: "Ürün stok detayları getirilemedi." });
  }
});

// KRİTİK STOK LİSTESİ - 10 adedin altına düşenleri göstericem
app.get('/api/stok/kritik', async (req, res) => {
  try {
    const kritikStoklar = await prisma.stock.findMany({
      where: {
        adet: {
          lte: 10 // Miktarı 10 veya daha az olanlar
        }
      },
      include: { product: true } // Hangi ürüne ait olduğunu da gösterir
    })

    res.json({
      uyari: "Dikkat! Aşağıdaki ürünlerin stoğu kritik seviyededir.",
      kritikUrunSayisi: kritikStoklar.length,
      kritikStoklar
    });
  } catch (error) {
    res.status(500).json({ hata: "Kritik stoklar listelenirken bir hata oluştu." });
  }
});

// Sunucuyu başlatıyorum.
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde ayağa kalktı.`);
});