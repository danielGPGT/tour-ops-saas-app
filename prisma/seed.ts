import { prisma } from '../lib/db'

async function main() {
  // Create a demo organization if none exists
  const org = await prisma.organizations.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      name: 'Demo Tours',
      settings: {}
    }
  })

  // Create a demo supplier
  const supplier = await prisma.suppliers.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      org_id: org.id,
      name: 'DirectEvents',
      terms: {},
      channels: ['b2c', 'b2b'],
      status: 'active'
    }
  })

  // Create a demo product and variant
  const product = await prisma.products.create({
    data: {
      org_id: org.id,
      name: 'F1 Grand Prix',
      type: 'event',
      status: 'active'
    }
  })

  const variant = await prisma.product_variants.create({
    data: {
      org_id: org.id,
      product_id: product.id,
      name: 'VIP Seats',
      subtype: 'seat_tier',
      attributes: {},
      status: 'active'
    }
  })

  // Create a minimal contract + version
  const contract = await prisma.contracts.create({
    data: {
      org_id: org.id,
      supplier_id: supplier.id,
      reference: 'DE-2025-F1',
      status: 'active'
    }
  })

  const contractVersion = await prisma.contract_versions.create({
    data: {
      org_id: org.id,
      contract_id: contract.id,
      valid_from: new Date('2025-01-01'),
      valid_to: new Date('2026-01-01'),
      cancellation_policy: {},
      payment_policy: {},
      terms: {}
    }
  })

  // Create a minimal rate plan with rate_doc
  await prisma.rate_plans.create({
    data: {
      org_id: org.id,
      product_variant_id: variant.id,
      supplier_id: supplier.id,
      contract_version_id: contractVersion.id,
      inventory_model: 'committed',
      currency: 'USD',
      markets: ['default'],
      channels: ['b2c'],
      preferred: true,
      valid_from: new Date('2025-01-01'),
      valid_to: new Date('2026-01-01'),
      rate_doc: {
        base: 1100,
        notes: 'Seed demo rate'
      }
    }
  })

  console.log('Seed complete:', {
    org: org.id.toString(),
    supplier: supplier.id.toString(),
    product: product.id.toString(),
    variant: variant.id.toString()
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


