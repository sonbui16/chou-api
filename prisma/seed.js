import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

const IMG = (id) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`
const PHOTOS = [
  'photo-1566174053879-31528523f8ae', 'photo-1595777457583-95e059d581b8',
  'photo-1539008835657-9e8e9680c956', 'photo-1572804013309-59a88b7e92f1',
  'photo-1583744946564-b52ac1c389c8', 'photo-1490481651871-ab68de25d43d',
  'photo-1515372039744-b8f02a3ae446', 'photo-1502716119720-b23a93e5fe1b',
  'photo-1485968579580-b6d095142e6e', 'photo-1496747611176-843222e1e57c',
  'photo-1469398715555-76331a6c7c9b', 'photo-1483985988355-763728e1935b',
]

const addDays = (d, n) => {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + n)
  return x
}
const D = (s) => new Date(`${s}T00:00:00.000Z`)

async function reset() {
  // Xoá theo thứ tự phụ thuộc
  await prisma.payment.deleteMany()
  await prisma.review.deleteMany()
  await prisma.rentalItem.deleteMany()
  await prisma.rental.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.productImage.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  await prisma.address.deleteMany()
  await prisma.user.deleteMany()
  await prisma.coupon.deleteMany()
  await prisma.category.deleteMany()
  await prisma.color.deleteMany()
  await prisma.size.deleteMany()
  await prisma.setting.deleteMany()
}

async function main() {
  await reset()

  /* settings */
  await prisma.setting.createMany({
    data: [
      { key: 'cleaning_buffer_days', value: 1, description: 'Ngày đệm giặt ủi' },
      { key: 'min_rental_days', value: 1, description: 'Số ngày thuê tối thiểu' },
      { key: 'default_deposit_rate', value: 0.5, description: 'Tỷ lệ cọc mặc định' },
      { key: 'free_shipping_min', value: 500000, description: 'Ngưỡng miễn ship' },
    ],
  })

  /* sizes + colors */
  const sizeDefs = [
    { code: 'S', label: 'Nhỏ (S)' }, { code: 'M', label: 'Vừa (M)' },
    { code: 'L', label: 'Lớn (L)' }, { code: 'XL', label: 'Rất lớn (XL)' },
  ]
  const colorDefs = [
    { name: 'Trắng ngà', hex: '#F1E9DC' }, { name: 'Đỏ rượu', hex: '#5A1F2B' },
    { name: 'Đen tuyền', hex: '#1A1413' }, { name: 'Xanh navy', hex: '#26334D' },
    { name: 'Hồng pastel', hex: '#E8C4C0' }, { name: 'Vàng champagne', hex: '#D9C18E' },
    { name: 'Xanh ngọc', hex: '#2E6F6A' }, { name: 'Bạc ánh kim', hex: '#C9CBD1' },
  ]
  const sizes = {}
  for (const s of sizeDefs) sizes[s.code] = (await prisma.size.create({ data: s })).id
  const colors = {}
  for (const c of colorDefs) colors[c.name] = (await prisma.color.create({ data: c })).id

  /* categories */
  const catDefs = [
    { name: 'Váy cưới', slug: 'vay-cuoi', position: 1 },
    { name: 'Đầm dạ hội', slug: 'dam-da-hoi', position: 2 },
    { name: 'Đầm dự tiệc', slug: 'dam-du-tiec', position: 3 },
    { name: 'Áo dài', slug: 'ao-dai', position: 4 },
  ]
  const cats = {}
  for (const c of catDefs) cats[c.slug] = (await prisma.category.create({ data: c })).id

  /* products */
  const specs = [
    { slug: 'aurora-tung-lua', name: 'Aurora — Váy cưới tùng lụa', cat: 'vay-cuoi', brand: 'Chou Atelier', price: 1800000, deposit: 3000000, colors: ['Trắng ngà', 'Vàng champagne'], sizes: ['S', 'M', 'L'], photos: [0, 2, 5], stock: 2, desc: 'Đuôi cá xòe nhẹ, ren thủ công, tùng organza ba lớp.' },
    { slug: 'celeste-ren-co-vai', name: 'Celeste — Váy cưới ren cổ vai', cat: 'vay-cuoi', brand: 'Chou Atelier', price: 2200000, deposit: 3500000, colors: ['Trắng ngà'], sizes: ['S', 'M', 'L', 'XL'], photos: [2, 7, 11], stock: 2, desc: 'Cổ thuyền hở vai, ren Pháp phủ toàn thân, chân váy chữ A.' },
    { slug: 'minuit-da-hoi-do', name: 'Minuit — Đầm dạ hội đỏ', cat: 'dam-da-hoi', brand: 'Maison Rouge', price: 950000, deposit: 1500000, colors: ['Đỏ rượu', 'Đen tuyền'], sizes: ['S', 'M', 'L'], photos: [1, 4, 8], stock: 3, desc: 'Đỏ rượu vang sâu, xẻ tà cao, chất nhung lì.' },
    { slug: 'noir-da-hoi-co-yem', name: 'Noir — Đầm dạ hội cổ yếm', cat: 'dam-da-hoi', brand: 'Maison Rouge', price: 880000, deposit: 1400000, colors: ['Đen tuyền', 'Xanh navy'], sizes: ['S', 'M', 'L'], photos: [4, 8, 1], stock: 2, desc: 'Đen tuyền, cổ yếm buộc gáy, lưng trần.' },
    { slug: 'serein-da-hoi-xanh', name: 'Serein — Đầm dạ hội xanh ngọc', cat: 'dam-da-hoi', brand: 'Chou Atelier', price: 1050000, deposit: 1600000, colors: ['Xanh ngọc', 'Xanh navy'], sizes: ['M', 'L', 'XL'], photos: [5, 11, 7], stock: 2, desc: 'Voan lụa xanh ngọc đổ tầng, vai bồng nhẹ.' },
    { slug: 'lumiere-da-hoi-champagne', name: 'Lumière — Đầm dạ hội champagne', cat: 'dam-da-hoi', brand: 'Atelier Lyon', price: 1200000, deposit: 1800000, colors: ['Vàng champagne', 'Bạc ánh kim'], sizes: ['S', 'M', 'L'], photos: [7, 5, 2], stock: 2, desc: 'Sequin champagne lấp lánh, ôm body, đuôi cá.' },
    { slug: 'rosee-du-tiec-hong', name: 'Rosée — Đầm dự tiệc hồng', cat: 'dam-du-tiec', brand: 'Chou Petite', price: 520000, deposit: 800000, colors: ['Hồng pastel', 'Trắng ngà'], sizes: ['S', 'M', 'L'], photos: [9, 3, 10], stock: 3, desc: 'Hồng pastel, phom babydoll, tay phồng.' },
    { slug: 'velours-du-tiec-navy', name: 'Velours — Đầm dự tiệc navy', cat: 'dam-du-tiec', brand: 'Chou Petite', price: 480000, deposit: 700000, colors: ['Xanh navy', 'Đen tuyền'], sizes: ['S', 'M', 'L', 'XL'], photos: [3, 9, 4], stock: 3, desc: 'Navy nhung, dáng chữ A ngang gối, tay lỡ.' },
    { slug: 'etoile-du-tiec-bac', name: 'Étoile — Đầm dự tiệc bạc', cat: 'dam-du-tiec', brand: 'Atelier Lyon', price: 560000, deposit: 850000, colors: ['Bạc ánh kim', 'Trắng ngà'], sizes: ['S', 'M', 'L'], photos: [10, 9, 3], stock: 2, desc: 'Ánh bạc kim tuyến, dáng suông ngắn.' },
    { slug: 'hoa-niem-ao-dai-do', name: 'Hoài Niệm — Áo dài đỏ', cat: 'ao-dai', brand: 'Chou Việt', price: 650000, deposit: 1000000, colors: ['Đỏ rượu', 'Vàng champagne'], sizes: ['S', 'M', 'L'], photos: [6, 11, 1], stock: 3, desc: 'Áo dài gấm đỏ thêu sen vàng, dáng truyền thống.' },
    { slug: 'thanh-xuan-ao-dai-trang', name: 'Thanh Xuân — Áo dài trắng', cat: 'ao-dai', brand: 'Chou Việt', price: 580000, deposit: 900000, colors: ['Trắng ngà', 'Hồng pastel'], sizes: ['S', 'M', 'L', 'XL'], photos: [11, 6, 2], stock: 3, desc: 'Áo dài lụa trắng thêu nhành mai, tay raglan.' },
    { slug: 'opera-cuoi-cong-chua', name: 'Opéra — Váy cưới công chúa', cat: 'vay-cuoi', brand: 'Chou Atelier', price: 2600000, deposit: 4000000, colors: ['Trắng ngà', 'Vàng champagne'], sizes: ['M', 'L'], photos: [0, 11, 2], stock: 2, desc: 'Ballgown bồng bềnh, tùng phồng đính đá, corset ôm eo.' },
  ]

  let assetSeq = 1
  const productMap = {} // slug -> { id, firstVariantId, firstItemId }
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i]
    const product = await prisma.product.create({
      data: {
        category_id: cats[s.cat], name: s.name, slug: s.slug, description: s.desc,
        brand: s.brand, rental_price: s.price, deposit: s.deposit, status: 'active',
        images: {
          create: s.photos.map((p, idx) => ({
            url: IMG(PHOTOS[p]), alt: s.name, position: idx, is_primary: idx === 0,
          })),
        },
      },
    })
    let firstVariantId = null
    let firstItemId = null
    for (const colorName of s.colors) {
      for (const sizeCode of s.sizes) {
        const variant = await prisma.productVariant.create({
          data: {
            product_id: product.id, size_id: sizes[sizeCode], color_id: colors[colorName],
            sku: `${s.slug.slice(0, 6).toUpperCase()}-${sizeCode}-${colors[colorName]}`,
          },
        })
        if (!firstVariantId) firstVariantId = variant.id
        for (let n = 0; n < s.stock; n++) {
          const item = await prisma.inventoryItem.create({
            data: {
              variant_id: variant.id,
              asset_code: `CD-${String(assetSeq++).padStart(4, '0')}`,
              condition: ['new', 'good', 'good', 'fair'][assetSeq % 4],
              acquired_at: D('2024-12-01'),
            },
          })
          if (!firstItemId) firstItemId = item.id
        }
      }
    }
    productMap[s.slug] = { id: product.id, firstVariantId, firstItemId }
  }

  /* users */
  const adminPass = await bcrypt.hash('admin123', 10)
  const custPass = await bcrypt.hash('test123', 10)
  const admin = await prisma.user.create({
    data: { role: 'admin', full_name: 'Quản trị Chou', email: 'admin@chou.vn', phone: '0900000000', password_hash: adminPass },
  })
  const mai = await prisma.user.create({
    data: { role: 'customer', full_name: 'Nguyễn Mai Anh', email: 'mai.anh@example.com', phone: '0901234567', password_hash: custPass,
      addresses: { create: [{ recipient: 'Nguyễn Mai Anh', phone: '0901234567', line1: '128 Nguyễn Huệ', ward: 'Bến Nghé', district: 'Quận 1', province: 'TP. Hồ Chí Minh', is_default: true }] } },
  })
  const lan = await prisma.user.create({
    data: { role: 'customer', full_name: 'Trần Thị Lan', email: 'lan.tran@example.com', phone: '0912000111', password_hash: custPass },
  })
  const maiAddress = await prisma.address.findFirst({ where: { user_id: mai.id } })

  /* coupons */
  await prisma.coupon.createMany({
    data: [
      { code: 'CHAOMUNG', type: 'percent', value: 10, min_total: 0, max_discount: 300000, valid_from: D('2026-01-01'), valid_to: D('2026-12-31'), used_count: 42 },
      { code: 'HE2026', type: 'fixed', value: 200000, min_total: 1000000, valid_from: D('2026-05-01'), valid_to: D('2026-08-31'), usage_limit: 100, used_count: 17 },
      { code: 'VIPCHOU', type: 'percent', value: 15, min_total: 2000000, max_discount: 600000, used_count: 5 },
    ],
  })

  /* rentals + payments + reviews */
  const buffer = 1
  const seeds = [
    { no: 'R-2026-000118', user: mai, slug: 'minuit-da-hoi-do', start: '2026-03-12', end: '2026-03-14', ful: 'delivery', ship: 40000, status: 'completed' },
    { no: 'R-2026-000131', user: lan, slug: 'rosee-du-tiec-hong', start: '2026-04-02', end: '2026-04-03', ful: 'pickup', ship: 0, status: 'completed' },
    { no: 'R-2026-000159', user: mai, slug: 'lumiere-da-hoi-champagne', start: '2026-06-12', end: '2026-06-16', ful: 'pickup', ship: 0, status: 'in_use' },
    { no: 'R-2026-000168', user: lan, slug: 'opera-cuoi-cong-chua', start: '2026-07-04', end: '2026-07-06', ful: 'pickup', ship: 0, status: 'pending' },
  ]

  for (const s of seeds) {
    const prod = await prisma.product.findUnique({ where: { slug: s.slug } })
    const pm = productMap[s.slug]
    const days = Math.round((D(s.end) - D(s.start)) / 86400000) + 1
    const subtotal = Number(prod.rental_price) * days
    const grand = subtotal + s.ship
    const paid = s.status !== 'pending'

    const rental = await prisma.rental.create({
      data: {
        rental_no: s.no, customer_id: s.user.id, status: s.status, fulfillment: s.ful,
        address_id: s.ful === 'delivery' ? maiAddress?.id ?? null : null,
        start_date: D(s.start), end_date: D(s.end),
        subtotal, discount_total: 0, deposit_total: Number(prod.deposit), shipping_fee: s.ship, grand_total: grand,
        picked_up_at: ['in_use', 'completed'].includes(s.status) ? D(s.start) : null,
        returned_at: s.status === 'completed' ? D(s.end) : null,
        items: {
          create: {
            item_id: pm.firstItemId, variant_id: pm.firstVariantId, product_id: prod.id,
            rental_start: D(s.start), rental_end: D(s.end), hold_until: addDays(D(s.end), 1 + buffer),
            product_name: prod.name, unit_price: prod.rental_price, deposit_amount: prod.deposit,
            condition_out: s.status === 'pending' ? null : 'good',
            condition_in: s.status === 'completed' ? 'good' : null,
          },
        },
      },
    })
    if (s.status === 'in_use') {
      await prisma.inventoryItem.update({ where: { id: pm.firstItemId }, data: { status: 'rented' } })
    }
    if (paid) {
      await prisma.payment.createMany({
        data: [
          { rental_id: rental.id, kind: 'rental_fee', method: s.ful === 'pickup' ? 'cash' : 'vnpay', amount: grand, status: 'paid', paid_at: D(s.start) },
          { rental_id: rental.id, kind: 'deposit', method: 'cash', amount: Number(prod.deposit), status: s.status === 'completed' ? 'refunded' : 'paid', paid_at: D(s.start) },
        ],
      })
      if (s.status === 'completed') {
        await prisma.payment.create({
          data: { rental_id: rental.id, kind: 'deposit_refund', method: 'bank_transfer', amount: Number(prod.deposit) * -1, status: 'paid', paid_at: D(s.end) },
        })
      }
    }
  }

  /* reviews */
  await prisma.review.create({ data: { product_id: productMap['minuit-da-hoi-do'].id, customer_id: mai.id, rating: 5, comment: 'Váy lên dáng cực đẹp, tư vấn nhiệt tình!' } })
  await prisma.review.create({ data: { product_id: productMap['rosee-du-tiec-hong'].id, customer_id: lan.id, rating: 4, comment: 'Màu hồng ngọt ngào, vải mát, giá hợp lý.' } })
  await prisma.review.create({ data: { product_id: productMap['hoa-niem-ao-dai-do'].id, customer_id: mai.id, rating: 5, comment: 'Áo dài thêu tinh xảo, ai cũng khen.' } })

  console.log('✅ Seed xong:', { products: specs.length, admin: admin.email })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
