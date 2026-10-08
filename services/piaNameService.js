const normalizeUnitCode = (unitName) => {
  const value = String(unitName || 'n/a').trim();
  if (value.toLowerCase() === 'n/a') return 'NA';
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'UNIT';
};

const assignPiaName = async (transaction, assessmentId, unitName) => {
  const normalizedUnitName = String(unitName || 'n/a').trim() || 'n/a';
  const unit = await transaction.unit.findUnique({
    where: { name: normalizedUnitName },
    select: { id: true }
  });

  if (!unit) {
    throw new Error(`Unit is not in the unit catalog: ${normalizedUnitName}`);
  }

  await transaction.$queryRaw`SELECT id FROM Unit WHERE id = ${unit.id} FOR UPDATE`;

  const prefix = `PIA-${normalizeUnitCode(normalizedUnitName)}-`;
  const existingNames = await transaction.$queryRaw`
    SELECT piaName
    FROM PiaAssessment
    WHERE piaName LIKE ${`${prefix}%`}
    FOR UPDATE
  `;
  const highestNumber = existingNames.reduce((highest, assessment) => {
    const number = Number(assessment.piaName.slice(prefix.length));
    return Number.isSafeInteger(number) ? Math.max(highest, number) : highest;
  }, 0);
  const nextNumber = highestNumber + 1;
  const sequence = nextNumber < 1000 ? String(nextNumber).padStart(3, '0') : String(nextNumber);

  return transaction.piaAssessment.update({
    where: { id: assessmentId },
    data: { piaName: `${prefix}${sequence}` }
  });
};

module.exports = { assignPiaName, normalizeUnitCode };