async function seedProcessingBasis(prisma) {
    const piData = [
        {
            basisNum: "1",
            keyword: "Consent",
            description: "The data subject has given his or her consent.",
        },
        {
            basisNum: "2",
            keyword: "Contractual Fulfillment",
            description: "The processing of PI is necessary and is related to the fulfillment of a contract with the data subject or in order to take the steps at the request of the data subject prior to entering into a contract.",
        },
        {
            basisNum: "3",
            keyword: "Legal Obligation",
            description: "The processing is necessary for compliance with a legal obligation to which the personal controller is subject.",
        },
        {
            basisNum: "4",
            keyword: "Vital Interests",
            description: "The processing is necessary to protect vitally important interests of the data subject including life and health.",
        },
        {
            basisNum: "5",
            keyword: "National Emergency / Public Authority",
            description: "The processing is necessary to respond to national emergency to comply with the requirements of public order and safety or to fulfill the functions of public authority which necessarily includes the processing of personal data for the fulfillment of its mandate.",
        },
        {
            basisNum: "6",
            keyword: "Legitimate Interests",
            description: "The processing is necessary for the purposes of legitimate interests pursued by SLU or by a 3rd party or parties to whom the data is disclosed except where such interests are overridden by fundamental rights and freedoms of the data subject which require protection under the Philippine constitution.",
        },
    ];

    const spiData = [
        {
            basisNum: "1",
            keyword: "Specific Consent / Privileged Info",
            description: "The data subject has given his or her consent specific to the purpose prior to the processing or in the case of privileged information, all parties to the exchange have given their consent prior to processing.",
        },
        {
            basisNum: "2",
            keyword: "Existing Laws and Regulations",
            description: "The processing of the same is provided for by existing laws and regulations: provided, that such regulatory enactments guarantee the protection of the SPI and the privileged information provided, further, that the consent of the data subjects are not required by law or regulation permitting the processing of the SPI or the privileged information.",
        },
        {
            basisNum: "3",
            keyword: "Life and Health (Incapacity)",
            description: "Processing is necessary to protect the life and health of the data subject or another person and the data subject is not legally or physically able to express his or her consent prior to the processing.",
        },
        {
            basisNum: "4",
            keyword: "Non-Commercial Public Orgs",
            description: "The processing is necessary to achieve the lawful non-commercial objectives of public organizations and their associations provided that such processing is only confined and related to the bonafide members of these organizations or their associations provided further that the SPI are not transferred to 3rd parties provided finally that the consent of the data subject was obtained prior to processing.",
        },
        {
            basisNum: "5",
            keyword: "Medical Treatment",
            description: "The processing is necessary for purposes of medical treatment is carried out by a medical practitioner or a medical treatment institution and an adequate level of protection of personal information is ensured.",
        },
        {
            basisNum: "6",
            keyword: "Legal Claims / Court Proceedings",
            description: "The processing concerns such personal information as is necessary for the protection of lawful rights and interests of natural or legal persons in court proceedings or the establishment, exercise, or defense of legal claims or when provided to government or public authority.",
        },
        {
            basisNum: "7",
            keyword: "Not Applicable",
            description: "Not applicable.",
        },
    ];

    // Combine both arrays and append the appropriate processingType
    const data = [
        ...piData.map(item => ({ ...item, processingType: "PI" })),
        ...spiData.map(item => ({ ...item, processingType: "SPI" }))
    ];

    await prisma.processingBasis.createMany({
        data,
        skipDuplicates: true,
    });

    console.log("Successfully seeded ProcessingBasis");
}

module.exports = seedProcessingBasis;