
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const defaultDefinitions = {
    CONTRACT_CATEGORY: [
        { name: 'Tedarikçi', code: 'SUPPLIER' },
        { name: 'Müşteri', code: 'CUSTOMER' },
        { name: 'İş Ortaklığı', code: 'PARTNERSHIP' },
        { name: 'Diğer', code: 'OTHER' },
    ],
    CONTRACT_TYPE: [
        { name: 'Satın Alma', code: 'PURCHASING' },
        { name: 'Hizmet Alım', code: 'SERVICE_PROCUREMENT' },
        { name: 'Danışmanlık', code: 'CONSULTANCY' },
        { name: 'Teknik Destek/SLA', code: 'TECH_SUPPORT_SLA' },
        { name: 'Araç Kiralama', code: 'CAR_RENTAL' },
        { name: 'Hizmet Sözleşmesi', code: 'SERVICE' },
        { name: 'Rem Insert', code: 'REM_INSERT' },
        { name: 'Rem E-Store', code: 'REM_ESTORE' },
        { name: 'Instore', code: 'INSTORE' },
        { name: 'Bağımsız Denetim', code: 'INDEPENDENT_AUDIT' },
        { name: 'SaaS', code: 'SAAS' },
        { name: 'Shopier', code: 'SHOPIER' },
        { name: 'KVKK', code: 'KVKK' },
        { name: 'NDA', code: 'NDA' },
        { name: 'Diğer', code: 'OTHER' },
    ],
    CURRENCY: [
        { name: 'Türk Lirası', code: 'TRY' },
        { name: 'Amerikan Doları', code: 'USD' },
        { name: 'Euro', code: 'EUR' },
        { name: 'İngiliz Sterlini', code: 'GBP' },
    ],
    PAYMENT_FREQUENCY: [
        { name: 'Tek Seferlik', code: 'ONE_TIME' },
        { name: 'Aylık', code: 'MONTHLY' },
        { name: 'Yıllık', code: 'YEARLY' },
    ]
}

async function main() {
    console.log('Seeding Contract Definitions...')

    const companies = await prisma.company.findMany()

    if (companies.length === 0) {
        console.log('No companies found. Skipping seeding.')
        return
    }

    for (const company of companies) {
        console.log(`Seeding for company: ${company.name}`)

        for (const [type, defs] of Object.entries(defaultDefinitions)) {
            for (const def of defs) {
                await prisma.contractDefinition.upsert({
                    where: {
                        companyId_type_name: {
                            companyId: company.id,
                            type: type,
                            name: def.name
                        }
                    },
                    update: {},
                    create: {
                        companyId: company.id,
                        type: type,
                        name: def.name,
                        code: def.code,
                        isActive: true
                    }
                })
            }
        }
    }

    console.log('Seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
