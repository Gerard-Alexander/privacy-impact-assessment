async function seedProcessingBasis(prisma) {
    const processingTypes = ["SPI", "PI", "BOTH"];

    const basisData = [
        {
            basisNum: "1",
            keyword: "first",
            description: "this is the number one.",
        },
        {
            basisNum: "2",
            keyword: "second",
            description: "this is the number two.",
        },
        {
            basisNum: "3",
            keyword: "third",
            description: "this is the number three.",
        },
        {
            basisNum: "4",
            keyword: "fourth",
            description: "this is the number four.",
        },
        {
            basisNum: "5",
            keyword: "fifth",
            description: "this is the number five.",
        },
        {
            basisNum: "6",
            keyword: "sixth",
            description: "this is the number six.",
        },
    ];

    const data = [];

    for (const processingType of processingTypes) {
        for (const basis of basisData) {
            data.push({
                processingType,
                basisNum: basis.basisNum,
                keyword: basis.keyword,
                description: basis.description,
            });
        }
    }

    await prisma.processingBasis.createMany({
        data,
        skipDuplicates: true,
    });

    console.log("Successfully seeded ProcessingBasis");
}

module.exports = seedProcessingBasis;