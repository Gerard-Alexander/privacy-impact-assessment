async function seedQuestions(prisma) {
    await prisma.questions.createMany({
        data: [
            {
                question: "Is personal data transferred outside of the Philippines?"
            },
            {
                question: "Is there any Data Sharing Agreements with other parties?"
            },
            {
                question: "What is the name of the PIP?"
            },
            {
                question: "Is the system a publicly facing online website or web-based application?"
            },
            {
                question: "Is there any notification regardingany automated decision-making operation and/or profiling?"
            },
            {
                question: "What is the legal basis of processing personal data?"
            },
            {
                question: "What are the other relevant information pertaining to the specified lawful basis?"
            },
            {
                question: "Is consent used as the basis for processing?"
            },
            {
                question: "Is consent form used and/or other proof for obtaining consent?"
            },
        ],
        skipDuplicates: true
    });
    console.log('Successfully seeded Questions');
}

module.exports = seedQuestions;