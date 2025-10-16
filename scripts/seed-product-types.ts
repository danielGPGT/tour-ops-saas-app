import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProductTypes() {
  console.log('🌱 Seeding product types and subtypes...');

  try {
    // Get all organizations
    const organizations = await prisma.organizations.findMany();
    
    if (organizations.length === 0) {
      console.log('No organizations found. Creating a default organization...');
      const defaultOrg = await prisma.organizations.create({
        data: {
          name: 'Default Organization',
          settings: {}
        }
      });
      organizations.push(defaultOrg);
    }

    for (const org of organizations) {
      console.log(`Seeding for organization: ${org.name} (ID: ${org.id})`);

      // Define default product types
      const defaultProductTypes = [
        {
          name: 'accommodation',
          description: 'Hotels, resorts, hostels, and other lodging options',
          icon: 'Building2',
          color: 'bg-blue-100 text-blue-800',
          subtypes: [
            {
              name: 'room_category',
              description: 'Different room types and categories',
              icon: 'Bed'
            },
            {
              name: 'none',
              description: 'Single variant accommodation without variations',
              icon: 'Package'
            }
          ]
        },
        {
          name: 'activity',
          description: 'Tours, excursions, and experiential activities',
          icon: 'Activity',
          color: 'bg-green-100 text-green-800',
          subtypes: [
            {
              name: 'time_slot',
              description: 'Different time periods or sessions',
              icon: 'Clock'
            },
            {
              name: 'none',
              description: 'Single variant activity without variations',
              icon: 'Package'
            }
          ]
        },
        {
          name: 'event',
          description: 'Concerts, festivals, shows, and special events',
          icon: 'Calendar',
          color: 'bg-purple-100 text-purple-800',
          subtypes: [
            {
              name: 'time_slot',
              description: 'Different time periods or sessions',
              icon: 'Clock'
            },
            {
              name: 'none',
              description: 'Single variant event without variations',
              icon: 'Package'
            }
          ]
        },
        {
          name: 'transfer',
          description: 'Transportation services between locations',
          icon: 'Car',
          color: 'bg-orange-100 text-orange-800',
          subtypes: [
            {
              name: 'seat_tier',
              description: 'Different seat classes and tiers',
              icon: 'Users'
            },
            {
              name: 'none',
              description: 'Single variant transfer without variations',
              icon: 'Package'
            }
          ]
        },
        {
          name: 'package',
          description: 'Multi-component packages combining multiple services',
          icon: 'Gift',
          color: 'bg-pink-100 text-pink-800',
          subtypes: [
            {
              name: 'none',
              description: 'Single variant package without variations',
              icon: 'Package'
            }
          ]
        }
      ];

      // Create product types and subtypes
      for (const productTypeData of defaultProductTypes) {
        // Check if product type already exists
        const existingProductType = await prisma.product_types.findFirst({
          where: {
            org_id: org.id,
            name: productTypeData.name
          }
        });

        let productType;
        if (existingProductType) {
          console.log(`  ✓ Product type '${productTypeData.name}' already exists`);
          productType = existingProductType;
        } else {
          productType = await prisma.product_types.create({
            data: {
              org_id: org.id,
              name: productTypeData.name,
              description: productTypeData.description,
              icon: productTypeData.icon,
              color: productTypeData.color,
              is_default: true
            }
          });
          console.log(`  ✓ Created product type: ${productTypeData.name}`);
        }

        // Create subtypes for this product type
        for (const subtypeData of productTypeData.subtypes) {
          const existingSubtype = await prisma.product_subtypes.findFirst({
            where: {
              org_id: org.id,
              product_type_id: productType.id,
              name: subtypeData.name
            }
          });

          if (!existingSubtype) {
            await prisma.product_subtypes.create({
              data: {
                org_id: org.id,
                product_type_id: productType.id,
                name: subtypeData.name,
                description: subtypeData.description,
                icon: subtypeData.icon,
                is_default: true
              }
            });
            console.log(`    ✓ Created subtype: ${subtypeData.name}`);
          } else {
            console.log(`    ✓ Subtype '${subtypeData.name}' already exists`);
          }
        }
      }
    }

    console.log('✅ Product types and subtypes seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding product types:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedProductTypes()
  .then(() => {
    console.log('🎉 Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });
